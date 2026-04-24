import { IsString, IsUUID } from 'class-validator';

export class CreateLikeDto {
  @IsString()
  @IsUUID('4')
  anonymousId: string;
}
