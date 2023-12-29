import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CoreModule } from '../core/core.module';
import { AnonymousService } from './anonymous.service';
import { CollectionsController } from './collections.controller';
import { WallpapersController } from './wallpapers.controller';
import { CollectionEntity, WallpaperEntity } from './wallpapers.entity';
import { WallpapersService } from './wallpapers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CollectionEntity, WallpaperEntity]),
    CoreModule,
  ],
  controllers: [CollectionsController, WallpapersController],
  providers: [AnonymousService, WallpapersService],
})
export class WallpapersModule {}
