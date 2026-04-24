import { Controller, Get } from '@nestjs/common';
import { Wer2lService } from './wer2l.service';

@Controller()
export class Wer2lController {
  constructor(private readonly wer2lService: Wer2lService) {}

  @Get()
  getHello(): string {
    return this.wer2lService.getHello();
  }
}
