import { IsEnum, IsInt, IsMongoId, IsOptional, IsString, Min } from 'class-validator';

export class CreateAuthorshipDto {
  @IsMongoId()
  memberId: string;

  @IsInt()
  @Min(1)
  order: number;

  @IsEnum(['first', 'corresponding', 'co_author', 'advisor', 'contributor'])
  role: 'first' | 'corresponding' | 'co_author' | 'advisor' | 'contributor';

  @IsString()
  @IsOptional()
  contribution?: string;
}
