import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateWorkDto {
  @IsString()
  title: string;

  @IsEnum(['paper', 'project', 'patent', 'thesis'])
  type: 'paper' | 'project' | 'patent' | 'thesis';

  @IsMongoId()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  paperUrl?: string;

  /** Path returned by POST /uploads/pdf, or '' to remove the PDF. */
  @Matches(/^(\/uploads\/[\w/-]+\.pdf)?$/i, {
    message: 'pdfFile must be a PDF path returned by /uploads/pdf',
  })
  @IsOptional()
  pdfFile?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsEnum(['in_progress', 'published', 'archived'])
  @IsOptional()
  status?: 'in_progress' | 'published' | 'archived';

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  completionDate?: Date;

  @IsBoolean()
  @IsOptional()
  featured?: boolean;
}
