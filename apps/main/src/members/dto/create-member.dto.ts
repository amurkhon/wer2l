import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';

class SocialLinksDto {
  @IsEmail()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  email?: string;

  @IsUrl()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  linkedin?: string;

  @IsUrl()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  googleScholar?: string;

  @IsUrl()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  orcid?: string;

  @IsUrl()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  personalSite?: string;
}

export class CreateMemberDto {
  @IsString()
  fullName: string;

  @IsEnum(['professor', 'researcher', 'student', 'alumni'])
  role: 'professor' | 'researcher' | 'student' | 'alumni';

  @IsEnum(['active', 'alumni', 'emeritus'])
  @IsOptional()
  status?: 'active' | 'alumni' | 'emeritus';

  @IsString()
  @IsOptional()
  biography?: string;

  @IsString()
  @IsOptional()
  profileImage?: string;

  @ValidateNested()
  @Type(() => SocialLinksDto)
  @IsOptional()
  socialLinks?: SocialLinksDto;

  @IsDate()
  @Type(() => Date)
  joinedDate: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  leftDate?: Date;
}
