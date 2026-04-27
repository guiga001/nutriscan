/**
 * Módulo: Diet Engine
 * Responsável por cálculos matemáticos de nutrição
 * Pseudocódigo convertido para TypeScript funcional
 */

export interface UserBiometrics {
  gender: 'male' | 'female';
  weight_kg: number;
  height_cm: number;
  age_years: number;
  activity_factor: number; // 1.2 to 1.9
  goal: 'deficit' | 'maintenance' | 'surplus';
}

export interface MacroTargets {
  tdee: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  tmb: number;
}

/**
 * FUNÇÃO: calculateTMB (Taxa Metabólica Basal)
 * Implementação: Equação de Mifflin-St Jeor
 */
export function calculateTMB(biometrics: UserBiometrics): MacroTargets {
  const { gender, weight_kg, height_cm, age_years, activity_factor, goal } = biometrics;

  // Step 1: Calculate Basal Metabolic Rate (BMR/TMB)
  let tmb: number;
  if (gender === 'male') {
    tmb = (10 * weight_kg) + (6.25 * height_cm) - (5 * age_years) + 5;
  } else {
    tmb = (10 * weight_kg) + (6.25 * height_cm) - (5 * age_years) - 161;
  }

  // Step 2: Calculate TDEE (Total Daily Energy Expenditure)
  let tdee = tmb * activity_factor;

  // Step 3: Apply goal multiplier
  let final_tdee: number;
  if (goal === 'deficit') {
    final_tdee = tdee * 0.85; // -15% for ~1.3kg/week loss
  } else if (goal === 'maintenance') {
    final_tdee = tdee * 1.0;
  } else {
    // surplus
    final_tdee = tdee * 1.1; // +10% for ~0.5kg/week muscle gain
  }

  // Step 4: Calculate macro distribution
  // Standard: 30% protein, 45% carbs, 25% fat
  const protein_kcal = final_tdee * 0.3;
  const carbs_kcal = final_tdee * 0.45;
  const fat_kcal = final_tdee * 0.25;

  // Convert to grams (protein & carbs: 4 kcal/g, fat: 9 kcal/g)
  const protein_g = Math.round(protein_kcal / 4);
  const carbs_g = Math.round(carbs_kcal / 4);
  const fat_g = Math.round(fat_kcal / 9);

  return {
    tdee: Math.round(final_tdee),
    protein_g,
    carbs_g,
    fat_g,
    tmb: Math.round(tmb),
  };
}

/**
 * INTERFACE: Daily Macro State
 * Represent a user's daily nutrition standing
 */
export interface DailyMacroState {
  date: Date;
  user_id: string;
  target_tdee: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  
  consumed_tdee: number;
  consumed_protein: number;
  consumed_carbs: number;
  consumed_fat: number;
  
  remaining_tdee: number;
  remaining_protein: number;
  remaining_carbs: number;
  remaining_fat: number;
}

export interface MealSuggestion {
  recipe_id: string;
  recipe_name: string;
  estimated_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fit_score: number; // 0-100
}

/**
 * FUNÇÃO: calculateDailyState
 * Real-time recálculo de macros consumidos vs alvo
 */
export function calculateDailyState(
  userId: string,
  currentDate: Date,
  targetMacros: MacroTargets,
  consumedMeals: Array<{ kcal: number; protein_g: number; carbs_g: number; fat_g: number }>,
): DailyMacroState {
  // Calculate total consumed
  const consumed_tdee = consumedMeals.reduce((sum, meal) => sum + meal.kcal, 0);
  const consumed_protein = consumedMeals.reduce((sum, meal) => sum + meal.protein_g, 0);
  const consumed_carbs = consumedMeals.reduce((sum, meal) => sum + meal.carbs_g, 0);
  const consumed_fat = consumedMeals.reduce((sum, meal) => sum + meal.fat_g, 0);

  // Calculate remaining
  const remaining_tdee = targetMacros.tdee - consumed_tdee;
  const remaining_protein = targetMacros.protein_g - consumed_protein;
  const remaining_carbs = targetMacros.carbs_g - consumed_carbs;
  const remaining_fat = targetMacros.fat_g - consumed_fat;

  return {
    date: currentDate,
    user_id: userId,
    target_tdee: targetMacros.tdee,
    target_protein: targetMacros.protein_g,
    target_carbs: targetMacros.carbs_g,
    target_fat: targetMacros.fat_g,
    consumed_tdee,
    consumed_protein,
    consumed_carbs,
    consumed_fat,
    remaining_tdee,
    remaining_protein,
    remaining_carbs,
    remaining_fat,
  };
}

/**
 * FUNÇÃO: suggestNextMeal
 * Filtra receitas que cabem nos macros restantes com margem de ±5%
 */
export function suggestNextMeal(
  dailyState: DailyMacroState,
  recipes: Array<{ id: string; name: string; kcal: number; protein_g: number; carbs_g: number; fat_g: number }>,
): MealSuggestion[] {
  const suggestions: MealSuggestion[] = [];

  // Define acceptable margin: ±5% of remaining macros
  const protein_margin = dailyState.remaining_protein * 0.05;
  const carbs_margin = dailyState.remaining_carbs * 0.05;
  const fat_margin = dailyState.remaining_fat * 0.05;
  const kcal_margin = dailyState.remaining_tdee * 0.05;

  for (const recipe of recipes) {
    // Check if recipe fits within remaining macros (±5% tolerance)
    const kcal_fits = recipe.kcal >= dailyState.remaining_tdee * 0.95 && 
                      recipe.kcal <= dailyState.remaining_tdee * 1.05;
    const protein_fits = recipe.protein_g >= dailyState.remaining_protein - protein_margin && 
                        recipe.protein_g <= dailyState.remaining_protein + protein_margin;
    const carbs_fits = recipe.carbs_g >= dailyState.remaining_carbs - carbs_margin && 
                      recipe.carbs_g <= dailyState.remaining_carbs + carbs_margin;
    const fat_fits = recipe.fat_g >= dailyState.remaining_fat - fat_margin && 
                    recipe.fat_g <= dailyState.remaining_fat + fat_margin;

    if (kcal_fits && protein_fits && carbs_fits && fat_fits) {
      // Calculate fit score (0-100)
      const kcal_diff = Math.abs(recipe.kcal - dailyState.remaining_tdee);
      const fit_score = Math.max(0, 100 - (kcal_diff / dailyState.remaining_tdee) * 100);

      suggestions.push({
        recipe_id: recipe.id,
        recipe_name: recipe.name,
        estimated_kcal: recipe.kcal,
        protein_g: recipe.protein_g,
        carbs_g: recipe.carbs_g,
        fat_g: recipe.fat_g,
        fit_score: Math.round(fit_score),
      });
    }
  }

  // Sort by fit score (descending) and return top 5
  return suggestions.sort((a, b) => b.fit_score - a.fit_score).slice(0, 5);
}

/**
 * FUNÇÃO: isExceededDaily
 * Verifica se o usuário ultrapassou a meta diária
 */
export function isExceededDaily(dailyState: DailyMacroState): boolean {
  return dailyState.remaining_tdee < 0;
}

/**
 * FUNÇÃO: isAlmostFull
 * Verifica se há espaço (< 100 kcal) para próxima refeição
 */
export function isAlmostFull(dailyState: DailyMacroState): boolean {
  return dailyState.remaining_tdee < 100 && dailyState.remaining_tdee > 0;
}
