import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Attachment } from './schemas/attachment.schema';
import { STORAGE_SERVICE } from './storage/storage.interface';
import { UploadsService } from './uploads.service';

const buildFile = (originalname: string, content: string, mimetype = 'application/pdf') =>
  ({
    originalname,
    mimetype,
    buffer: Buffer.from(content, 'latin1'),
    size: content.length,
  }) as Express.Multer.File;

describe('UploadsService', () => {
  let service: UploadsService;
  let storageMock: { store: jest.Mock; delete: jest.Mock };

  beforeEach(async () => {
    storageMock = {
      store: jest.fn().mockResolvedValue({ fileUrl: '/uploads/2026/10/x-paper.pdf', sizeBytes: 12 }),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        { provide: getModelToken(Attachment.name), useValue: {} },
        { provide: STORAGE_SERVICE, useValue: storageMock },
      ],
    }).compile();

    service = module.get(UploadsService);
  });

  describe('storePdf', () => {
    it('stores a PDF and returns its URL', async () => {
      const result = await service.storePdf(buildFile('paper.PDF', '%PDF-1.7\n...'));

      expect(storageMock.store).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ fileUrl: '/uploads/2026/10/x-paper.pdf', sizeBytes: 12 });
    });

    it('rejects a .pdf file whose content is not a PDF', async () => {
      await expect(
        service.storePdf(buildFile('paper.pdf', '<html><script>alert(1)</script>')),
      ).rejects.toThrow(BadRequestException);
      expect(storageMock.store).not.toHaveBeenCalled();
    });

    it('rejects PDF content under a non-.pdf extension, since it would be served by extension', async () => {
      await expect(service.storePdf(buildFile('paper.html', '%PDF-1.7\n...'))).rejects.toThrow(
        BadRequestException,
      );
      expect(storageMock.store).not.toHaveBeenCalled();
    });

    it('rejects a request with no file', async () => {
      await expect(
        service.storePdf(undefined as unknown as Express.Multer.File),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
