import { Controller, Post, Body, HttpStatus, HttpCode, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { analyzeMenuText } from '../../domain/menuScanner';

// Note: In production, integrate Google Cloud Vision API
// For now, this is a simplified mock implementation

@Controller('api/v1/scanner')
export class ScannerController {
  /**
   * POST /api/v1/scanner/menu
   * Envia imagem de cardápio → OCR → Análise com regras de negócio
   */
  @Post('menu')
  @HttpCode(HttpStatus.OK)
  async scanMenu(@Body() body: any): Promise<any> {
    try {
      // Step 1: Get image base64 and decode
      const imageBase64 = body.image_base64;
      const restaurantName = body.restaurant_name || 'Unknown Restaurant';

      if (!imageBase64) {
        throw new BadRequestException('image_base64 is required');
      }

      // Step 2: In production: Send to Google Cloud Vision API
      // For now, use mock OCR result
      const extractedText = `CARDÁPIO
ENTRADAS
Entrada Frita Crocante - R$ 15
Pastel Empanado - R$ 12

PRINCIPAIS
Frango Grelhado com Brócolis - R$ 35
Salada de Alface e Tomate - R$ 18
Atum Assado com Batata Doce - R$ 40

SOBREMESAS
Brigadeiro Frito - R$ 8
Fruta Natural - R$ 6`;

      // Step 3: Analyze menu text using business rules
      const analysis = analyzeMenuText(extractedText);

      // Step 4: Format response
      const greenDishes = analysis.dishes.filter((d) => d.recommendation === 'GREEN');
      const redDishes = analysis.dishes.filter((d) => d.recommendation === 'RED');
      const yellowDishes = analysis.dishes.filter((d) => d.recommendation === 'YELLOW');

      return {
        scan_id: `scan-${uuidv4()}`,
        restaurant_name: restaurantName,
        extracted_text: extractedText,
        analysis: {
          dishes_found: analysis.dishes.length,
          green_healthy: greenDishes,
          red_avoid: redDishes,
          yellow_unknown: yellowDishes,
        },
        processed_at: new Date(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
