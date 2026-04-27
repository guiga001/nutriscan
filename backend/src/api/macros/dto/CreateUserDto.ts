import { IsString, IsEmail, IsNumber, Min, Max, IsEnum } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(['male', 'female'])
  gender: 'male' | 'female';

  @IsNumber()
  @Min(30)
  @Max(200)
  weight_kg: number;

  @IsNumber()
  @Min(100)
  @Max(250)
  height_cm: number;

  @IsNumber()
  @Min(13)
  @Max(120)
  age_years: number;

  @IsNumber()
  @Min(1.2)
  @Max(1.9)
  activity_factor: number;

  @IsEnum(['deficit', 'maintenance', 'surplus'])
  goal: 'deficit' | 'maintenance' | 'surplus';
}

export class MacroSetupResponseDto {
  user_id: string;
  tmb: number;
  tdee: number;
  daily_targets: {
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  recommendation: string;
}
