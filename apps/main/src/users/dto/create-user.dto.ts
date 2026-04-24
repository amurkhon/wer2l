import { IsEmail, IsEnum, IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(['admin', 'editor'])
  accessLevel: 'admin' | 'editor';

  @IsMongoId()
  @IsOptional()
  memberId?: string;
}
