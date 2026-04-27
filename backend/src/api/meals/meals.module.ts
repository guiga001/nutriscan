import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, MealLog, DailyTarget, AppCuratedRecipe } from '../../infrastructure/entities';
import { MealsController } from './meals.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, MealLog, DailyTarget, AppCuratedRecipe])],
  controllers: [MealsController],
  exports: [],
})
export class MealsModule {}
