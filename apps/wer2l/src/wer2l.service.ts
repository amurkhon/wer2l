import { Injectable } from '@nestjs/common';

@Injectable()
export class Wer2lService {
  getHello(): string {
    return 'Hello World!';
  }
}
