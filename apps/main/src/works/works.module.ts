import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Attachment, AttachmentSchema } from '../uploads/schemas/attachment.schema';
import { Authorship, AuthorshipSchema } from '../authorship/schemas/authorship.schema';
import { Work, WorkSchema } from './schemas/work.schema';
import { WorksController } from './works.controller';
import { WorksService } from './works.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Work.name, schema: WorkSchema },
      { name: Authorship.name, schema: AuthorshipSchema },
      { name: Attachment.name, schema: AttachmentSchema },
    ]),
  ],
  controllers: [WorksController],
  providers: [WorksService],
  exports: [WorksService],
})
export class WorksModule {}
