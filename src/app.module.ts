import { Module } from '@nestjs/common';
import {
  ConfigModule,
  ConfigModuleOptions,
  ConfigService,
} from '@nestjs/config';
import {
  TypeOrmModule,
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import Joi from 'joi';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { NovaModule } from './nova/nova.module';
import {
  CollectionEntity,
  WallpaperEntity,
} from './wallpapers/wallpapers.entity';

const configModuleOptions: ConfigModuleOptions = {
  isGlobal: true,
  validationSchema: Joi.object({
    PORT: Joi.number().required(),
    DATABASE_URL: Joi.string().required(),
    FIREBASE_SERVICE_ACCOUNT: Joi.string().required(),
    IMAGES_ACCOUNT_ID: Joi.string().required(),
    IMAGES_ACCOUNT_HASH: Joi.string().required(),
    IMAGES_API_TOKEN: Joi.string().required(),
    R2_ACCESS_KEY_ID: Joi.string().required(),
    R2_SECRET_ACCESS_KEY: Joi.string().required(),
    R2_ENDPOINT: Joi.string().required(),
    R2_BUCKET: Joi.string().required(),
  }),
};

const typeOrmModuleOptions: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
    return {
      type: 'mongodb',
      url: configService.get<string>('DATABASE_URL'),
      entities: [CollectionEntity, WallpaperEntity],
      synchronize: true,
    };
  },
  inject: [ConfigService],
};

@Module({
  imports: [
    ConfigModule.forRoot(configModuleOptions),
    LoggerModule.forRoot({}),
    TypeOrmModule.forRootAsync(typeOrmModuleOptions),
    CoreModule,
    NovaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
