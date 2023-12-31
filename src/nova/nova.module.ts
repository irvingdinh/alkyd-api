import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CoreModule } from '../core/core.module';
import {
  CollectionEntity,
  WallpaperEntity,
} from '../wallpapers/wallpapers.entity';
import { ImagesController } from './images/images.controller';
import { ImageEntity } from './images/images.entity';
import { NovaImagesService } from './images/nova-images.service';
import { NovaService } from './nova.service';
import { CollectionsController } from './wallpapers/collections.controller';
import { WallpapersController } from './wallpapers/wallpapers.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ImageEntity, CollectionEntity, WallpaperEntity]),
    CoreModule,
  ],
  controllers: [ImagesController, CollectionsController, WallpapersController],
  providers: [NovaService, NovaImagesService],
})
export class NovaModule {}
