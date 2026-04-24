import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Types } from 'mongoose';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { CreateLikeDto } from './dto/create-like.dto';
import { LikesService } from './likes.service';

@Controller('works/:workId/likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  /** Rate-limited to 60 requests per hour per IP. */
  @Throttle({ likes: { limit: 60, ttl: 3_600_000 } })
  @Post()
  @HttpCode(HttpStatus.OK)
  like(
    @Param('workId', ParseObjectIdPipe) workId: Types.ObjectId,
    @Body() dto: CreateLikeDto,
  ) {
    return this.likesService.like(String(workId), dto.anonymousId);
  }

  @Delete(':anonymousId')
  @HttpCode(HttpStatus.NO_CONTENT)
  unlike(
    @Param('workId', ParseObjectIdPipe) workId: Types.ObjectId,
    @Param('anonymousId') anonymousId: string,
  ) {
    return this.likesService.unlike(String(workId), anonymousId);
  }

  @Get('count')
  getCount(@Param('workId', ParseObjectIdPipe) workId: Types.ObjectId) {
    return this.likesService.getCount(String(workId));
  }
}
