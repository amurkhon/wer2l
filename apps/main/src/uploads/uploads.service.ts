import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attachment, AttachmentDocument } from './schemas/attachment.schema';
import { STORAGE_SERVICE, StorageService } from './storage/storage.interface';
import { CreateAttachmentDto } from './dto/create-attachment.dto';

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  pdf: ['application/pdf'],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  dataset: [
    'text/csv',
    'application/json',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-zip-compressed',
  ],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
};

@Injectable()
export class UploadsService {
  constructor(
    @InjectModel(Attachment.name) private readonly attachmentModel: Model<AttachmentDocument>,
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
  ) {}

  /**
   * Validates MIME type against the declared kind, stores the file,
   * and persists an Attachment document.
   */
  async upload(
    file: Express.Multer.File,
    dto: CreateAttachmentDto,
    uploadedBy: string,
  ): Promise<{ fileUrl: string; sizeBytes: number; kind: string }> {
    const allowed = ALLOWED_MIME_TYPES[dto.kind];
    if (!allowed || !allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        `MIME type '${file.mimetype}' is not allowed for kind '${dto.kind}'. Allowed: ${allowed?.join(', ')}`,
      );
    }

    const { fileUrl, sizeBytes } = await this.storageService.store(file);

    await this.attachmentModel.create({
      workId: new Types.ObjectId(dto.workId),
      kind: dto.kind,
      fileUrl,
      caption: dto.caption,
      sizeBytes,
      uploadedBy: new Types.ObjectId(uploadedBy),
    });

    return { fileUrl, sizeBytes, kind: dto.kind };
  }

  /**
   * Stores a raw image file and returns its URL.
   * Used for profile photos and cover images — no Attachment record is created.
   */
  async storeImage(file: Express.Multer.File): Promise<{ fileUrl: string }> {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        `Only image files are allowed. Received: ${file.mimetype}`,
      );
    }
    const { fileUrl } = await this.storageService.store(file);
    return { fileUrl };
  }

  /** Lists all attachments for a given work. */
  async findByWork(workId: string): Promise<AttachmentDocument[]> {
    return this.attachmentModel
      .find({ workId: new Types.ObjectId(workId) })
      .lean<AttachmentDocument[]>();
  }

  /** Deletes an attachment and removes its file from storage. */
  async remove(id: string): Promise<void> {
    const attachment = await this.attachmentModel.findByIdAndDelete(id).lean<AttachmentDocument>();
    if (!attachment) throw new NotFoundException(`Attachment ${id} not found`);
    await this.storageService.delete(attachment.fileUrl);
  }
}
