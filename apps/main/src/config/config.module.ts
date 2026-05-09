import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(4005),
        MONGO_URI: Joi.string().required(),
        JWT_ACCESS_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
        COOKIE_SECRET: Joi.string().min(16).required(),
        ADMIN_EMAIL: Joi.string().email().required(),
        ADMIN_PASSWORD: Joi.string().min(8).required(),
        UPLOAD_MAX_BYTES: Joi.number().default(10485760),
        UPLOAD_DIR: Joi.string().default('./uploads'),
        CORS_ORIGIN: Joi.string().default('http://localhost:4006'),
      }),
    }),
  ],
})
export class ConfigModule {}
