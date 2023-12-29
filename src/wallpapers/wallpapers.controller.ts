import { Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';

import { ImagesService } from '../core/external/images.service';
import { StorageService } from '../core/external/storage.service';
import { Action, AnonymousService } from './anonymous.service';
import { WallpaperEntity } from './wallpapers.entity';
import { WallpapersService } from './wallpapers.service';

@Controller('/api/v1/wallpapers')
export class WallpapersController {
  constructor(
    @InjectPinoLogger(WallpapersController.name)
    private readonly log: PinoLogger,
    @InjectRepository(WallpaperEntity)
    private readonly wallpapersRepository: Repository<WallpaperEntity>,
    private readonly anonymousService: AnonymousService,
    private readonly imagesService: ImagesService,
    private readonly storageService: StorageService,
    private readonly wallpaperService: WallpapersService,
  ) {}

  @Post('/:id/download')
  async download(@Req() req: Request, @Res() res: Response): Promise<void> {
    const userId = await this.anonymousService.authorize(
      req,
      res,
      Action.DOWNLOAD_WALLPAPER,
    );
    if (typeof userId !== 'string') {
      return;
    }

    try {
      await this.anonymousService.setThrottle(
        userId,
        Action.DOWNLOAD_WALLPAPER,
      );
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
      return;
    }

    const wallpaper = await this.wallpaperService.firstOrFail({
      req,
      res,
      repository: this.wallpapersRepository,
    });
    if (wallpaper === null) {
      return;
    }

    const signedUrl = await this.storageService.getSignedUrl(
      wallpaper.objectKey,
    );

    res.status(HttpStatus.OK).json({
      data: signedUrl,
    });
  }
}
