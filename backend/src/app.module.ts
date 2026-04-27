import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

// Entities
import { User } from './infrastructure/entities/User';
import { DailyTarget } from './infrastructure/entities/DailyTarget';
import { MealLog } from './infrastructure/entities/MealLog';
import { ScannedFoodCache } from './infrastructure/entities/ScannedFoodCache';
import { AppCuratedRecipe } from './infrastructure/entities/AppCuratedRecipe';
import { SubscriptionLog } from './infrastructure/entities/SubscriptionLog';

// Modules
import { MacrosModule } from './api/macros/macros.module';
import { FoodsModule } from './api/foods/foods.module';
import { MealsModule } from './api/meals/meals.module';
import { ScannerModule } from './api/scanner/scanner.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [User, DailyTarget, MealLog, ScannedFoodCache, AppCuratedRecipe, SubscriptionLog],
        synchronize: process.env.NODE_ENV === 'development',
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
    MacrosModule,
    FoodsModule,
    MealsModule,
    ScannerModule,
  ],
})
export class AppModule {}
