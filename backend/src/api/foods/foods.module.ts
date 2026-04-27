import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScannedFoodCache } from '../../infrastructure/entities';
import { FoodsController } from './foods.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ScannedFoodCache])],
  controllers: [FoodsController],
  exports: [],
})
export class FoodsModule {}
