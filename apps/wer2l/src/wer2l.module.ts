import { Module } from '@nestjs/common';
import { Wer2lController } from './wer2l.controller';
import { Wer2lService } from './wer2l.service';

@Module({
  imports: [],
  controllers: [Wer2lController],
  providers: [Wer2lService],
})
export class Wer2lModule {}
