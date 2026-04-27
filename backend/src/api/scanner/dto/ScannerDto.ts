import { IsString, IsBase64 } from 'class-validator';

export class MenuScannerRequestDto {
  @IsBase64()
  image_base64: string;

  @IsString()
  restaurant_name?: string;
}
