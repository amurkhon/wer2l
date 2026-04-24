import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorshipController } from './authorship.controller';
import { AuthorshipService } from './authorship.service';
import { Authorship, AuthorshipSchema } from './schemas/authorship.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Authorship.name, schema: AuthorshipSchema }])],
  controllers: [AuthorshipController],
  providers: [AuthorshipService],
  exports: [AuthorshipService],
})
export class AuthorshipModule {}
