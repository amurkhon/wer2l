export interface StoredFile {
  fileUrl: string;
  sizeBytes: number;
}

/** Abstraction over file storage. Swap LocalStorageService for S3StorageService without changing callers. */
export interface StorageService {
  store(file: Express.Multer.File): Promise<StoredFile>;
  delete(fileUrl: string): Promise<void>;
}

export const STORAGE_SERVICE = Symbol('StorageService');
