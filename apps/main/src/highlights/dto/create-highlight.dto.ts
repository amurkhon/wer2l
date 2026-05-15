import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateHighlightDto {
  @IsString()
  title: string;

  @IsString()
  summary: string;

  @IsString()
  content: string;

  @IsEnum(['news', 'award', 'publication', 'event'])
  type: 'news' | 'award' | 'publication' | 'event';

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsEnum(['draft', 'published'])
  @IsOptional()
  status?: 'draft' | 'published';

  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  publishedAt?: Date;
}
