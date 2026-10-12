import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { memoryStorage } from 'multer';
import request from 'supertest';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Attachment } from './schemas/attachment.schema';
import { STORAGE_SERVICE } from './storage/storage.interface';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

// Stand-in for UPLOAD_MAX_BYTES, kept tiny so the test doesn't need multi-MB buffers.
const MODULE_LIMIT = 1024;

const pdfOfSize = (bytes: number) => Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(bytes)]);

describe('UploadsController file size limits', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        MulterModule.register({ storage: memoryStorage(), limits: { fileSize: MODULE_LIMIT } }),
      ],
      controllers: [UploadsController],
      providers: [
        UploadsService,
        { provide: getModelToken(Attachment.name), useValue: {} },
        {
          provide: STORAGE_SERVICE,
          useValue: {
            store: jest.fn(async (file: Express.Multer.File) => ({
              fileUrl: `/uploads/2026/10/x-${file.originalname}`,
              sizeBytes: file.size,
            })),
            delete: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('accepts a PDF larger than the module-wide upload limit', async () => {
    const res = await request(app.getHttpServer())
      .post('/uploads/pdf')
      .attach('file', pdfOfSize(MODULE_LIMIT * 2), 'paper.pdf');

    expect(res.status).toBe(201);
    expect(res.body.fileUrl).toBe('/uploads/2026/10/x-paper.pdf');
  });

  it('keeps the module-wide limit for images', async () => {
    const res = await request(app.getHttpServer())
      .post('/uploads/image')
      .attach('file', Buffer.alloc(MODULE_LIMIT * 2), { filename: 'cover.png', contentType: 'image/png' });

    expect(res.status).toBe(413);
  });
});
