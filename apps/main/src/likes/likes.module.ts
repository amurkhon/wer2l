import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Work, WorkSchema } from '../works/schemas/work.schema';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';
import { Like, LikeSchema } from './schemas/like.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Like.name, schema: LikeSchema },
      { name: Work.name, schema: WorkSchema },
    ]),
  ],
  controllers: [LikesController],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule {}
