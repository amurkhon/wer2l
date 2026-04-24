import { Type } from 'class-transformer';
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
  email?: string;

  @IsUrl()
  @IsOptional()
  linkedin?: string;

  @IsUrl()
  @IsOptional()
  googleScholar?: string;

  @IsUrl()
  @IsOptional()
  orcid?: string;

  @IsUrl()
  @IsOptional()
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
