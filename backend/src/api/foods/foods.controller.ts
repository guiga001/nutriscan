import { Controller, Get, Param, HttpStatus, HttpCode, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ScannedFoodCache } from '../../infrastructure/entities';
import { FoodBarcodeResponseDto } from './dto/FoodsDto';
import axios from 'axios';

@Controller('api/v1/foods')
export class FoodsController {
  constructor(
    @InjectRepository(ScannedFoodCache)
    private foodCacheRepository: Repository<ScannedFoodCache>,
  ) {}

  /**
   * GET /api/v1/foods/barcode/{code}
   * Busca informação nutricional pelo código de barras
   * Primeiro tenta cache local, depois OpenFoodFacts
   */
  @Get('barcode/:code')
  @HttpCode(HttpStatus.OK)
  async getFoodByBarcode(@Param('code') barcode: string): Promise<FoodBarcodeResponseDto> {
    // Step 1: Try to find in local cache
    let cached = await this.foodCacheRepository.findOne({
      where: { barcode },
    });

    if (cached && cached.ttl_expires > new Date()) {
      // Cache is valid, return it
      return {
        barcode: cached.barcode,
        food_name: cached.food_name,
        brand: cached.brand,
        portion_size: cached.portion_size,
        nutrition: {
          kcal: cached.kcal,
          protein_g: cached.protein_g,
          carbs_g: cached.carbs_g,
          fat_g: cached.fat_g,
          fiber_g: cached.fiber_g,
          sodium_mg: cached.sodium_mg,
        },
        source: cached.source,
        cached_at: cached.created_at,
      };
    }

    // Step 2: Fetch from external API (OpenFoodFacts)
    try {
      const response = await axios.get(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      );

      const product = response.data.product;

      if (!product) {
        throw new NotFoundException('Food not found in OpenFoodFacts');
      }

      // Extract nutrition data
      const nutrition = product.nutriments || {};
      const kcal = nutrition['energy-kcal'] || 0;
      const protein_g = nutrition.proteins || 0;
      const carbs_g = nutrition.carbohydrates || 0;
      const fat_g = nutrition.fat || 0;
      const fiber_g = nutrition.fiber || 0;
      const sodium_mg = nutrition.sodium || 0;

      // Save to cache (30 days TTL)
      const ttl = new Date();
      ttl.setDate(ttl.getDate() + 30);

      if (cached) {
        // Update existing cache
        cached.food_name = product.product_name || 'Unknown';
        cached.brand = product.brands || null;
        cached.portion_size = '100g'; // Default
        cached.kcal = kcal;
        cached.protein_g = protein_g;
        cached.carbs_g = carbs_g;
        cached.fat_g = fat_g;
        cached.fiber_g = fiber_g;
        cached.sodium_mg = sodium_mg;
        cached.source = 'openfoodfacts';
        cached.ttl_expires = ttl;
        cached.raw_data = product;

        await this.foodCacheRepository.save(cached);
      } else {
        // Create new cache entry
        const newCache = this.foodCacheRepository.create({
          barcode,
          food_name: product.product_name || 'Unknown',
          brand: product.brands || null,
          portion_size: '100g',
          kcal,
          protein_g,
          carbs_g,
          fat_g,
          fiber_g,
          sodium_mg,
          source: 'openfoodfacts',
          ttl_expires: ttl,
          raw_data: product,
        });

        await this.foodCacheRepository.save(newCache);
      }

      return {
        barcode,
        food_name: product.product_name || 'Unknown',
        brand: product.brands || undefined,
        portion_size: '100g',
        nutrition: {
          kcal,
          protein_g,
          carbs_g,
          fat_g,
          fiber_g,
          sodium_mg,
        },
        source: 'openfoodfacts',
        cached_at: new Date(),
      };
    } catch (error) {
      throw new NotFoundException(`Barcode ${barcode} not found in food database`);
    }
  }
}
