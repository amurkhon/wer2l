import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsMongoId, Min, ValidateNested } from 'class-validator';

class AuthorOrderItem {
  @IsMongoId()
  authorshipId: string;

  @IsInt()
  @Min(1)
  order: number;
}

export class ReorderAuthorsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AuthorOrderItem)
  items: AuthorOrderItem[];
}
