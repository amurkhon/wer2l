import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { AuthorshipModule } from './authorship/authorship.module';
import { CategoriesModule } from './categories/categories.module';
import { ConfigModule } from './config/config.module';
import { LikesModule } from './likes/likes.module';
import { MembersModule } from './members/members.module';
import { SeedService } from './seeds/seed.service';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';
import { WorksModule } from './works/works.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 120 },
      { name: 'login', ttl: 900_000, limit: 5 },
      { name: 'likes', ttl: 3_600_000, limit: 60 },
    ]),
    AuthModule,
    UsersModule,
    MembersModule,
    CategoriesModule,
    WorksModule,
    AuthorshipModule,
    UploadsModule,
    LikesModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
