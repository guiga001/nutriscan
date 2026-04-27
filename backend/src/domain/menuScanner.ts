/**
 * Módulo: Menu Scanner
 * Responsável por análise de cardápios via OCR + Business Rules
 */

export interface MenuScannerResult {
  raw_text: string;
  dishes: DishAnalysis[];
}

export interface DishAnalysis {
  name: string;
  recommendation: 'GREEN' | 'RED' | 'YELLOW';
  reason: string;
}

/**
 * Define padrões de comida a evitar (frito, empanado, etc)
 */
const BLACKLIST_PATTERNS = [
  /frito/gi,          // fried
  /empanado/gi,       // breaded
  /crocante/gi,       // crispy
  /molho.*cream/gi,   // cream sauce
  /carbonara/gi,      // carbonara (high fat)
  /refogado/gi,       // sautéed in oil
  /fritada/gi,        // fried
  /salgado/gi,        // salty fried
  /pastel/gi,         // pastry fried
  /coxinha/gi,        // fried snack
];

/**
 * Define padrões de comida saudável (grelhado, salada, etc)
 */
const WHITELIST_PATTERNS = [
  /grelhado/gi,       // grilled
  /salada/gi,         // salad
  /vapor/gi,          // steamed
  /assado/gi,         // roasted
  /cozido/gi,         // boiled
  /puro/gi,           // plain
  /natural/gi,        // natural
  /brócolis/gi,       // broccoli
  /cenoura/gi,        // carrot
  /sopa/gi,           // soup
  /fruta/gi,          // fruit
];

/**
 * Verifica se texto combina com qualquer padrão regex
 */
function matchesPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

/**
 * Função principal: Analisa texto de cardápio
 * Retorna pratos classificados como GREEN/RED/YELLOW
 */
export function analyzeMenuText(raw_text: string): MenuScannerResult {
  // Split by newlines or patterns que indicam novo prato
  const lines = raw_text.split('\n').filter((line) => line.trim().length > 0);

  const dishes: DishAnalysis[] = [];

  for (const line of lines) {
    const recommendation = classifyDish(line);
    dishes.push(recommendation);
  }

  return {
    raw_text,
    dishes,
  };
}

/**
 * Classifica um único prato como GREEN/RED/YELLOW
 */
function classifyDish(dish_text: string): DishAnalysis {
  const name = dish_text.trim();
  let recommendation: 'GREEN' | 'RED' | 'YELLOW' = 'YELLOW';
  let reason = '';

  // Check blacklist first (higher priority)
  if (matchesPattern(name, BLACKLIST_PATTERNS)) {
    recommendation = 'RED';
    reason = 'Contém método de cozimento de alto risco (frito, empanado)';
  }
  // Then check whitelist
  else if (matchesPattern(name, WHITELIST_PATTERNS)) {
    recommendation = 'GREEN';
    reason = 'Método de cozimento saudável detectado';
  } else {
    reason = 'Método de cozimento não identificado';
  }

  return {
    name,
    recommendation,
    reason,
  };
}

/**
 * Função alternativa: Análise baseada em scores (mais sofisticada)
 * Pontos: +5 para cada padrão branco, -10 para cada padrão preto
 */
export function analyzeMenuTextWithScores(raw_text: string): MenuScannerResult {
  const lines = raw_text.split('\n').filter((line) => line.trim().length > 0);
  const dishes: DishAnalysis[] = [];

  for (const line of lines) {
    let score = 0;
    const name = line.trim();

    // Count blacklist hits
    for (const pattern of BLACKLIST_PATTERNS) {
      if (pattern.test(name)) {
        score -= 10;
      }
    }

    // Count whitelist hits
    for (const pattern of WHITELIST_PATTERNS) {
      if (pattern.test(name)) {
        score += 5;
      }
    }

    let recommendation: 'GREEN' | 'RED' | 'YELLOW' = 'YELLOW';
    let reason = '';

    if (score <= -10) {
      recommendation = 'RED';
      reason = `Score negativo (${score}): Evite este prato`;
    } else if (score >= 5) {
      recommendation = 'GREEN';
      reason = `Score positivo (${score}): Excelente escolha`;
    } else {
      reason = `Score neutro (${score}): Verifique ingredientes`;
    }

    dishes.push({
      name,
      recommendation,
      reason,
    });
  }

  return {
    raw_text,
    dishes,
  };
}

/**
 * Função: Extrac informação nutricional de OCR text
 * (Simples: busca padrões como "100g", "kcal", etc)
 */
export function extractNutritionFromOCR(text: string): {
  weight?: string;
  mentions: string[];
} {
  const kcalMatch = text.match(/(\d+)\s*kcal/i);
  const gramMatch = text.match(/(\d+)g/i);
  
  const mentions = [];
  if (kcalMatch) mentions.push(`${kcalMatch[1]} kcal`);
  if (gramMatch) mentions.push(`${gramMatch[1]}g`);

  return {
    weight: gramMatch ? gramMatch[0] : undefined,
    mentions,
  };
}
