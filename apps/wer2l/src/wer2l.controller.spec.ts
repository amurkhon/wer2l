import { Test, TestingModule } from '@nestjs/testing';
import { Wer2lController } from './wer2l.controller';
import { Wer2lService } from './wer2l.service';

describe('Wer2lController', () => {
  let wer2lController: Wer2lController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [Wer2lController],
      providers: [Wer2lService],
    }).compile();

    wer2lController = app.get<Wer2lController>(Wer2lController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(wer2lController.getHello()).toBe('Hello World!');
    });
  });
});
