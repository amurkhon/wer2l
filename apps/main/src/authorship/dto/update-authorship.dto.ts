import { PartialType } from '@nestjs/mapped-types';
import { CreateAuthorshipDto } from './create-authorship.dto';

export class UpdateAuthorshipDto extends PartialType(CreateAuthorshipDto) {}
