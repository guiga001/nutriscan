import { Module } from '@nestjs/common';
import { ScannerController } from './scanner.controller';

@Module({
  controllers: [ScannerController],
  exports: [],
})
export class ScannerModule {}
