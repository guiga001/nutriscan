import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, DailyTarget } from '../../infrastructure/entities';
import { MacrosController } from './macros.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, DailyTarget])],
  controllers: [MacrosController],
  exports: [],
})
export class MacrosModule {}
