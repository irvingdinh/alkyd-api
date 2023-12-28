import { Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import Joi from 'joi';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';

import { WallpaperEntity } from '../../wallpapers/wallpapers.entity';
import { NovaService } from '../nova.service';

@Controller('/api/v1/nova/wallpapers')
export class WallpapersController {
  constructor(
    @InjectPinoLogger(WallpapersController.name)
    private readonly log: PinoLogger,
    @InjectRepository(WallpaperEntity)
    private readonly wallpaperRepository: Repository<WallpaperEntity>,
    private readonly novaService: NovaService,
  ) {}

  @Post()
  async store(@Req() req: Request, @Res() res: Response): Promise<void> {
    const wallpaper = await this.novaService.handleStoreEndpoint({
      req,
      res,
      repository: this.wallpaperRepository,
      schema: Joi.object({
        collectionId: Joi.string().required(),
        objectKey: Joi.string().required(),
        imageKey: Joi.string().required(),
      }),
    });
    if (wallpaper === null) {
      return;
    }

    res.status(HttpStatus.OK).json(wallpaper);
  }

  @Post('/find')
  async find(@Req() req: Request, @Res() res: Response): Promise<void> {
    const records = await this.novaService.handleFindEndpoint({
      req,
      res,
      repository: this.wallpaperRepository,
    });
    if (records === null) {
      return;
    }

    res.status(HttpStatus.OK).json(records);
  }
}
