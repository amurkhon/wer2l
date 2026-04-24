import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Authorship, AuthorshipSchema } from '../authorship/schemas/authorship.schema';
import { Work, WorkSchema } from '../works/schemas/work.schema';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { Member, MemberSchema } from './schemas/member.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema },
      { name: Authorship.name, schema: AuthorshipSchema },
      { name: Work.name, schema: WorkSchema },
    ]),
  ],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
