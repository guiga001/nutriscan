import { calculateTMB, calculateDailyState, suggestNextMeal } from '../domain/dietEngine';

describe('Diet Engine - Mifflin-St Jeor Calculations', () => {
  describe('calculateTMB', () => {
    it('should calculate TMB correctly for male user (deficit)', () => {
      const result = calculateTMB({
        gender: 'male',
        weight_kg: 80,
        height_cm: 175,
        age_years: 28,
        activity_factor: 1.55,
        goal: 'deficit',
      });

      expect(result.tmb).toBeGreaterThan(0);
      expect(result.tdee).toBeLessThan(result.tmb * 1.55); // deficit applied
      expect(result.protein_g).toBeGreaterThan(0);
      expect(result.carbs_g).toBeGreaterThan(0);
      expect(result.fat_g).toBeGreaterThan(0);
    });

    it('should calculate TMB correctly for female user (maintenance)', () => {
      const result = calculateTMB({
        gender: 'female',
        weight_kg: 65,
        height_cm: 165,
        age_years: 25,
        activity_factor: 1.4,
        goal: 'maintenance',
      });

      expect(result.tmb).toBeGreaterThan(0);
      expect(result.protein_g).toBeGreaterThan(0);
    });

    it('should apply surplus multiplier (1.1x) correctly', () => {
      const deficitResult = calculateTMB({
        gender: 'male',
        weight_kg: 80,
        height_cm: 175,
        age_years: 28,
        activity_factor: 1.55,
        goal: 'deficit',
      });

      const surplusResult = calculateTMB({
        gender: 'male',
        weight_kg: 80,
        height_cm: 175,
        age_years: 28,
        activity_factor: 1.55,
        goal: 'surplus',
      });

      // Surplus should have higher TDEE than deficit
      expect(surplusResult.tdee).toBeGreaterThan(deficitResult.tdee);
    });
  });

  describe('calculateDailyState', () => {
    it('should track consumed vs remaining macros', () => {
      const targetMacros = {
        tdee: 2500,
        protein_g: 200,
        carbs_g: 250,
        fat_g: 83,
        tmb: 1750,
      };

      const consumedMeals = [
        { kcal: 500, protein_g: 50, carbs_g: 60, fat_g: 15 },
        { kcal: 300, protein_g: 30, carbs_g: 30, fat_g: 10 },
      ];

      const dailyState = calculateDailyState(
        'user-1',
        new Date(),
        targetMacros,
        consumedMeals,
      );

      expect(dailyState.consumed_tdee).toBe(800);
      expect(dailyState.consumed_protein).toBe(80);
      expect(dailyState.remaining_tdee).toBe(1700);
      expect(dailyState.remaining_protein).toBe(120);
    });

    it('should handle exceeded daily calories', () => {
      const targetMacros = {
        tdee: 2500,
        protein_g: 200,
        carbs_g: 250,
        fat_g: 83,
        tmb: 1750,
      };

      const consumedMeals = [
        { kcal: 2600, protein_g: 200, carbs_g: 250, fat_g: 90 },
      ];

      const dailyState = calculateDailyState(
        'user-1',
        new Date(),
        targetMacros,
        consumedMeals,
      );

      expect(dailyState.remaining_tdee).toBeLessThan(0);
    });
  });

  describe('suggestNextMeal', () => {
    it('should suggest meals within ±5% macro tolerance', () => {
      const dailyState = {
        user_id: 'user-1',
        date: new Date(),
        target_tdee: 2500,
        target_protein: 200,
        target_carbs: 250,
        target_fat: 83,
        consumed_tdee: 1000,
        consumed_protein: 80,
        consumed_carbs: 100,
        consumed_fat: 30,
        remaining_tdee: 1500,
        remaining_protein: 120,
        remaining_carbs: 150,
        remaining_fat: 53,
      };

      const recipes = [
        {
          id: 'recipe-1',
          name: 'Salada com Frango',
          kcal: 1500,
          protein_g: 120,
          carbs_g: 150,
          fat_g: 53,
        },
        {
          id: 'recipe-2',
          name: 'Arroz com Feijão',
          kcal: 500,
          protein_g: 20,
          carbs_g: 80,
          fat_g: 5,
        },
        {
          id: 'recipe-3',
          name: 'Peixe Grelhado',
          kcal: 600,
          protein_g: 80,
          carbs_g: 20,
          fat_g: 25,
        },
      ];

      const suggestions = suggestNextMeal(dailyState, recipes);

      // Should suggest recipe-1 (close match)
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].recipe_id).toBe('recipe-1');
      expect(suggestions[0].fit_score).toBeGreaterThan(50);
    });

    it('should return empty array if no recipes fit', () => {
      const dailyState = {
        user_id: 'user-1',
        date: new Date(),
        target_tdee: 2500,
        target_protein: 200,
        target_carbs: 250,
        target_fat: 83,
        consumed_tdee: 2400,
        consumed_protein: 190,
        consumed_carbs: 240,
        consumed_fat: 80,
        remaining_tdee: 100,        // Very little left
        remaining_protein: 10,
        remaining_carbs: 10,
        remaining_fat: 3,
      };

      const recipes = [
        {
          id: 'recipe-1',
          name: 'Salada com Frango',
          kcal: 500,  // Too much
          protein_g: 50,
          carbs_g: 60,
          fat_g: 15,
        },
      ];

      const suggestions = suggestNextMeal(dailyState, recipes);
      expect(suggestions.length).toBe(0);
    });

    it('should sort suggestions by fit score (highest first)', () => {
      const dailyState = {
        user_id: 'user-1',
        date: new Date(),
        target_tdee: 2500,
        target_protein: 200,
        target_carbs: 250,
        target_fat: 83,
        consumed_tdee: 0,
        consumed_protein: 0,
        consumed_carbs: 0,
        consumed_fat: 0,
        remaining_tdee: 2500,
        remaining_protein: 200,
        remaining_carbs: 250,
        remaining_fat: 83,
      };

      const recipes = [
        {
          id: 'recipe-1',
          name: 'Recipe 1',
          kcal: 2500,
          protein_g: 200,
          carbs_g: 250,
          fat_g: 83,
        },
        {
          id: 'recipe-2',
          name: 'Recipe 2',
          kcal: 2400,  // 4% lower
          protein_g: 200,
          carbs_g: 250,
          fat_g: 83,
        },
      ];

      const suggestions = suggestNextMeal(dailyState, recipes);

      // recipe-1 should be first (perfect match)
      expect(suggestions[0].recipe_id).toBe('recipe-1');
      expect(suggestions[0].fit_score).toBeGreaterThan(suggestions[1].fit_score);
    });
  });
});
