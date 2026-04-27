import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class FoodBarcodeResponseDto {
  barcode: string;
  food_name: string;
  brand?: string;
  portion_size: string;
  nutrition: {
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number;
    sodium_mg?: number;
  };
  source: 'openfoodfacts' | 'fatsecret' | 'manual';
  cached_at: Date;
}

export class LogMealRequestDto {
  @IsString()
  food_id: string;

  @IsNumber()
  @Min(0.1)
  @Max(10)
  quantity: number; // Portion multiplier

  @IsOptional()
  @IsString()
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}
