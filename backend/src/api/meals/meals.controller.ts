import { Controller, Post, Body, Param, HttpStatus, HttpCode, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User, MealLog, DailyTarget, AppCuratedRecipe } from '../../infrastructure/entities';
import { calculateDailyState, suggestNextMeal } from '../../domain/dietEngine';
import { LogMealRequestDto } from '../foods/dto/FoodsDto';

@Controller('api/v1/meals')
export class MealsController {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(MealLog)
    private mealLogRepository: Repository<MealLog>,
    @InjectRepository(DailyTarget)
    private dailyTargetsRepository: Repository<DailyTarget>,
    @InjectRepository(AppCuratedRecipe)
    private recipesRepository: Repository<AppCuratedRecipe>,
  ) {}

  /**
   * POST /api/v1/meals/log
   * Registra uma refeição e retorna sugestões de próximas refeições
   */
  @Post('log/:userId')
  @HttpCode(HttpStatus.CREATED)
  async logMeal(
    @Param('userId') userId: string,
    @Body() logMealDto: LogMealRequestDto,
  ): Promise<any> {
    try {
      // Step 1: Verify user exists
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // TODO: Fetch food data from cache/external API
      // For now, mock data
      const foodData = {
        kcal: 165,
        protein_g: 31,
        carbs_g: 0,
        fat_g: 3.6,
      };

      // Step 2: Create meal log entry
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mealLog = this.mealLogRepository.create({
        user_id: userId,
        food_id: logMealDto.food_id,
        food_name: 'Frango Grelhado', // From cache
        date: today,
        quantity: logMealDto.quantity,
        kcal: foodData.kcal * logMealDto.quantity,
        protein_g: foodData.protein_g * logMealDto.quantity,
        carbs_g: foodData.carbs_g * logMealDto.quantity,
        fat_g: foodData.fat_g * logMealDto.quantity,
        meal_type: logMealDto.meal_type,
        metadata: { source: 'barcode_scan' },
      });

      const savedMealLog = await this.mealLogRepository.save(mealLog);

      // Step 3: Fetch daily target
      const dailyTarget = await this.dailyTargetsRepository.findOne({
        where: { user_id: userId, date: today },
      });

      if (!dailyTarget) {
        throw new BadRequestException('Daily target not found');
      }

      // Step 4: Get all meals logged today
      const mealsToday = await this.mealLogRepository.find({
        where: { user_id: userId, date: today },
      });

      // Step 5: Calculate daily state
      const dailyState = calculateDailyState(
        userId,
        today,
        {
          tdee: dailyTarget.tdee,
          protein_g: dailyTarget.protein_g,
          carbs_g: dailyTarget.carbs_g,
          fat_g: dailyTarget.fat_g,
          tmb: user.tmb_base,
        },
        mealsToday.map((meal) => ({
          kcal: meal.kcal,
          protein_g: meal.protein_g,
          carbs_g: meal.carbs_g,
          fat_g: meal.fat_g,
        })),
      );

      // Step 6: Get recipe suggestions
      const allRecipes = await this.recipesRepository.find({
        where: { is_active: true },
      });

      const recipes = allRecipes.map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        kcal: recipe.kcal,
        protein_g: recipe.protein_g,
        carbs_g: recipe.carbs_g,
        fat_g: recipe.fat_g,
      }));

      const mealSuggestions = suggestNextMeal(dailyState, recipes);

      // Step 7: Return response
      return {
        meal_log_id: savedMealLog.id,
        logged_at: new Date(),
        daily_state: {
          consumed_kcal: dailyState.consumed_tdee,
          remaining_kcal: dailyState.remaining_tdee,
          macros_consumed: {
            protein_g: dailyState.consumed_protein,
            carbs_g: dailyState.consumed_carbs,
            fat_g: dailyState.consumed_fat,
          },
          macros_remaining: {
            protein_g: dailyState.remaining_protein,
            carbs_g: dailyState.remaining_carbs,
            fat_g: dailyState.remaining_fat,
          },
        },
        meal_suggestions: mealSuggestions,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
