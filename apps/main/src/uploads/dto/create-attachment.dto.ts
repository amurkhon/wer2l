import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateAttachmentDto {
  @IsMongoId()
  workId: string;

  @IsEnum(['pdf', 'image', 'dataset', 'video'])
  kind: 'pdf' | 'image' | 'dataset' | 'video';

  @IsString()
  @IsOptional()
  caption?: string;
}
