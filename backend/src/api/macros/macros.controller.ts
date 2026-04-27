import { Controller, Post, Body, BadRequestException, HttpStatus, HttpCode } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User, DailyTarget } from '../../infrastructure/entities';
import { calculateTMB } from '../../domain/dietEngine';
import { CreateUserDto, MacroSetupResponseDto } from './dto/CreateUserDto';

@Controller('api/v1/macros')
export class MacrosController {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(DailyTarget)
    private dailyTargetsRepository: Repository<DailyTarget>,
  ) {}

  /**
   * POST /api/v1/macros/setup
   * Client envia biometria → Backend calcula TMB + metas diárias
   */
  @Post('setup')
  @HttpCode(HttpStatus.CREATED)
  async setupMacros(@Body() createUserDto: CreateUserDto): Promise<MacroSetupResponseDto> {
    try {
      // Check if user already exists
      const existingUser = await this.usersRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new BadRequestException('User already exists');
      }

      // Calculate macros using dietEngine
      const macroTargets = calculateTMB({
        gender: createUserDto.gender,
        weight_kg: createUserDto.weight_kg,
        height_cm: createUserDto.height_cm,
        age_years: createUserDto.age_years,
        activity_factor: createUserDto.activity_factor,
        goal: createUserDto.goal,
      });

      // Create user in database
      const user = this.usersRepository.create({
        email: createUserDto.email,
        password_hash: 'hashed_password_here', // TODO: Implement bcrypt
        weight_kg: createUserDto.weight_kg,
        height_cm: createUserDto.height_cm,
        age_years: createUserDto.age_years,
        activity_factor: createUserDto.activity_factor,
        goal: createUserDto.goal,
        tmb_base: macroTargets.tmb,
      });

      const savedUser = await this.usersRepository.save(user);

      // Create daily target for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dailyTarget = this.dailyTargetsRepository.create({
        user_id: savedUser.id,
        date: today,
        tdee: macroTargets.tdee,
        protein_g: macroTargets.protein_g,
        carbs_g: macroTargets.carbs_g,
        fat_g: macroTargets.fat_g,
      });

      await this.dailyTargetsRepository.save(dailyTarget);

      // Prepare response
      const goalRecommendation =
        createUserDto.goal === 'deficit'
          ? `Déficit calórico: perder ~1.3kg por semana`
          : createUserDto.goal === 'maintenance'
            ? `Manutenção de peso`
            : `Superávit calórico: ganhar ~0.5kg de músculo por semana`;

      return {
        user_id: savedUser.id,
        tmb: macroTargets.tmb,
        tdee: macroTargets.tdee,
        daily_targets: {
          kcal: macroTargets.tdee,
          protein_g: macroTargets.protein_g,
          carbs_g: macroTargets.carbs_g,
          fat_g: macroTargets.fat_g,
        },
        recommendation: goalRecommendation,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
