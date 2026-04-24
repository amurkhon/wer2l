import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { AuthorshipService } from './authorship.service';
import { CreateAuthorshipDto } from './dto/create-authorship.dto';
import { ReorderAuthorsDto } from './dto/reorder-authors.dto';
import { UpdateAuthorshipDto } from './dto/update-authorship.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor')
@Controller('works/:workId/authors')
export class AuthorshipController {
  constructor(private readonly authorshipService: AuthorshipService) {}

  @Post()
  addAuthor(
    @Param('workId', ParseObjectIdPipe) workId: Types.ObjectId,
    @Body() dto: CreateAuthorshipDto,
  ) {
    return this.authorshipService.addAuthor(String(workId), dto);
  }

  /** Must be declared before /:authorshipId to avoid route shadowing. */
  @Put('order')
  @HttpCode(HttpStatus.NO_CONTENT)
  reorder(
    @Param('workId', ParseObjectIdPipe) workId: Types.ObjectId,
    @Body() dto: ReorderAuthorsDto,
  ) {
    return this.authorshipService.reorder(String(workId), dto);
  }

  @Patch(':authorshipId')
  update(
    @Param('workId', ParseObjectIdPipe) workId: Types.ObjectId,
    @Param('authorshipId', ParseObjectIdPipe) authorshipId: Types.ObjectId,
    @Body() dto: UpdateAuthorshipDto,
  ) {
    return this.authorshipService.update(String(workId), String(authorshipId), dto);
  }

  @Delete(':authorshipId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('workId', ParseObjectIdPipe) workId: Types.ObjectId,
    @Param('authorshipId', ParseObjectIdPipe) authorshipId: Types.ObjectId,
  ) {
    return this.authorshipService.remove(String(workId), String(authorshipId));
  }
}
