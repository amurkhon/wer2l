import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Attachment, AttachmentSchema } from './schemas/attachment.schema';
import { LocalStorageService } from './storage/local-storage.service';
import { STORAGE_SERVICE } from './storage/storage.interface';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Attachment.name, schema: AttachmentSchema }]),
    MulterModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        storage: memoryStorage(),
        limits: {
          fileSize: configService.get<number>('UPLOAD_MAX_BYTES', 10_485_760),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UploadsController],
  providers: [
    UploadsService,
    LocalStorageService,
    { provide: STORAGE_SERVICE, useExisting: LocalStorageService },
  ],
  exports: [UploadsService],
})
export class UploadsModule {}
