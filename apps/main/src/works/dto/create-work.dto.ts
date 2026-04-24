import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateWorkDto {
  @IsString()
  title: string;

  @IsEnum(['paper', 'project', 'patent', 'thesis'])
  type: 'paper' | 'project' | 'patent' | 'thesis';

  @IsMongoId()
  categoryId: string;

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
