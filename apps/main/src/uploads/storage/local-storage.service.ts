import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { StorageService, StoredFile } from './storage.interface';

@Injectable()
export class LocalStorageService implements StorageService {
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
  }

  /**
   * Saves an uploaded file to UPLOAD_DIR/<year>/<month>/<uuid>-<original>.
   * Returns a URL path that can be served statically.
   */
  async store(file: Express.Multer.File): Promise<StoredFile> {
    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `${uuidv4()}-${baseName}${ext}`;

    const destDir = path.join(this.uploadDir, year, month);
    fs.mkdirSync(destDir, { recursive: true });

    const destPath = path.join(destDir, fileName);

    try {
      fs.writeFileSync(destPath, file.buffer);
    } catch (err) {
      throw new InternalServerErrorException('Failed to write uploaded file to disk');
    }

    const fileUrl = `/uploads/${year}/${month}/${fileName}`;
    return { fileUrl, sizeBytes: file.size };
  }

  /** Removes a file from local disk given its URL path. */
  async delete(fileUrl: string): Promise<void> {
    const relativePath = fileUrl.replace(/^\/uploads\//, '');
    const fullPath = path.join(this.uploadDir, relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}
