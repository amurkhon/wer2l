import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsEnum(['structural', 'geotechnical', 'transportation', 'hydraulic', 'materials', 'other'])
  domain: 'structural' | 'geotechnical' | 'transportation' | 'hydraulic' | 'materials' | 'other';

  @IsString()
  @IsOptional()
  description?: string;
}
