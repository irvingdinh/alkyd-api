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

const configModuleOptions: ConfigModuleOptions = {
  isGlobal: true,
  validationSchema: Joi.object({
    PORT: Joi.number().required(),
    DATABASE_URL: Joi.string().required(),
  }),
};

const typeOrmModuleOptions: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
    return {
      type: 'mongodb',
      url: configService.get<string>('DATABASE_URL'),
      entities: [],
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
