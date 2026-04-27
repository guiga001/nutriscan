import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  password_hash: string;

  @Column('float')
  weight_kg: number;

  @Column('float')
  height_cm: number;

  @Column('integer')
  age_years: number;

  @Column('float')
  activity_factor: number; // 1.2 to 1.9

  @Column('float')
  tmb_base: number; // Taxa Metabólica Basal calculated

  @Column('varchar', { default: 'maintenance' })
  goal: 'deficit' | 'maintenance' | 'surplus';

  @Column('varchar', { default: 'free' })
  subscription_tier: 'free' | 'pro' | 'premium';

  @Column('boolean', { default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('daily_targets')
@Index(['user_id', 'date'])
export class DailyTarget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column('date')
  date: Date;

  @Column('float')
  tdee: number; // Total Daily Energy Expenditure

  @Column('float')
  protein_g: number;

  @Column('float')
  carbs_g: number;

  @Column('float')
  fat_g: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('meal_logs')
@Index(['user_id', 'date'])
export class MealLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column('varchar')
  food_id: string; // Can be barcode or recipe ID

  @Column('varchar')
  food_name: string;

  @Column('date')
  date: Date;

  @Column('float')
  quantity: number; // Multiplier (e.g., 1.5 portions)

  @Column('float')
  kcal: number;

  @Column('float')
  protein_g: number;

  @Column('float')
  carbs_g: number;

  @Column('float')
  fat_g: number;

  @Column('varchar', { nullable: true })
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>; // OCR source, barcode, etc

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('scanned_foods_cache')
@Index(['barcode'], { unique: true })
@Index(['ttl_expires'])
export class ScannedFoodCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  barcode: string;

  @Column('varchar')
  food_name: string;

  @Column('varchar', { nullable: true })
  brand: string;

  @Column('varchar')
  portion_size: string; // e.g., "100g"

  @Column('float')
  kcal: number;

  @Column('float')
  protein_g: number;

  @Column('float')
  carbs_g: number;

  @Column('float')
  fat_g: number;

  @Column('float', { nullable: true })
  fiber_g: number;

  @Column('float', { nullable: true })
  sodium_mg: number;

  @Column('varchar', { default: 'openfoodfacts' })
  source: 'openfoodfacts' | 'fatsecret' | 'manual';

  @Column('jsonb', { nullable: true })
  raw_data: Record<string, any>; // Store raw API response

  @Column('timestamp')
  ttl_expires: Date; // When cache expires

  @CreateDateColumn()
  created_at: Date;
}

@Entity('app_curated_recipes')
@Index(['name'])
export class AppCuratedRecipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('jsonb')
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;

  @Column('jsonb', { nullable: true })
  instructions: string[];

  @Column('float')
  kcal: number;

  @Column('float')
  protein_g: number;

  @Column('float')
  carbs_g: number;

  @Column('float')
  fat_g: number;

  @Column('jsonb', { nullable: true })
  tags: string[]; // ['quick', 'vegan', 'high-protein', etc]

  @Column('integer', { nullable: true })
  preparation_time_min: number; // Minutes

  @Column('integer', { nullable: true })
  servings: number;

  @Column('boolean', { default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('subscription_logs')
@Index(['user_id', 'started_at'])
export class SubscriptionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column('varchar')
  tier: 'free' | 'pro' | 'premium';

  @Column('varchar', { default: 'active' })
  status: 'active' | 'cancelled' | 'expired';

  @Column('varchar', { nullable: true })
  provider: 'stripe' | 'revenucat' | 'manual';

  @Column('varchar', { nullable: true })
  external_transaction_id: string;

  @Column('timestamp')
  started_at: Date;

  @Column('timestamp')
  expires_at: Date;

  @Column('float', { nullable: true })
  price: number;

  @Column('varchar', { nullable: true })
  currency: string;

  @CreateDateColumn()
  created_at: Date;
}
