import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CoreModule } from '../core/core.module';
import {
  CollectionEntity,
  WallpaperEntity,
} from '../wallpapers/wallpapers.entity';
import { NovaImagesController } from './images/nova-images.controller';
import { ImageEntity } from './images/nova-images.entity';
import { NovaImagesService } from './images/nova-images.service';
import { NovaService } from './nova.service';
import { WallpapersController } from './wallpapers/wallpapers.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ImageEntity, CollectionEntity, WallpaperEntity]),
    CoreModule,
  ],
  controllers: [NovaImagesController, WallpapersController],
  providers: [NovaService, NovaImagesService],
})
export class NovaModule {}
