import { Controller, Get, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import Joi from 'joi';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { FindManyOptions, MongoRepository, Repository } from 'typeorm';

import { ImagesService } from '../core/external/images.service';
import { StorageService } from '../core/external/storage.service';
import { Action, AnonymousService } from './anonymous.service';
import { WallpaperJson } from './collections.controller';
import { WallpaperEntity } from './wallpapers.entity';
import { WallpapersService } from './wallpapers.service';

@Controller('/api/v1/wallpapers')
export class WallpapersController {
  constructor(
    @InjectPinoLogger(WallpapersController.name)
    private readonly log: PinoLogger,
    @InjectRepository(WallpaperEntity)
    private readonly wallpapersRepository: Repository<WallpaperEntity>,
    @InjectRepository(WallpaperEntity)
    private readonly wallpapersMongoRepository: MongoRepository<WallpaperEntity>,
    private readonly anonymousService: AnonymousService,
    private readonly imagesService: ImagesService,
    private readonly storageService: StorageService,
    private readonly wallpaperService: WallpapersService,
  ) {}

  @Get('/')
  async index(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.handleListingEndpoint(req, res, {
      where: {},
      order: {
        createdAt: 'DESC',
      },
    });
  }

  @Get('/random')
  async random(@Req() req: Request, @Res() res: Response): Promise<void> {
    const schema = Joi.object({
      take: Joi.number().max(100).default(50),
    });

    const { value, error } = schema.validate(req.query);
    if (error) {
      res
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .json({ message: error.message });
      return;
    }

    const aggregation = [{ $sample: { size: value.take } }];

    const entities: WallpaperEntity[] = await this.wallpapersMongoRepository
      .aggregate(aggregation)
      .toArray();

    const records: WallpaperJson[] = [];
    for (const entity of entities) {
      records.push({
        id: entity._id.toHexString(),
        image: this.imagesService.getUrl(entity.imageKey, 'public'),
      });
    }

    res.status(HttpStatus.OK).json({
      data: records,
    });
  }

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

  private async handleListingEndpoint(
    @Req() req: Request,
    @Res() res: Response,
    options: FindManyOptions<WallpaperEntity>,
  ): Promise<void> {
    const schema = Joi.object({
      take: Joi.number().max(100).default(50),
      skip: Joi.number().default(0),
    });

    const { value, error } = schema.validate(req.query);
    if (error) {
      res
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .json({ message: error.message });
      return;
    }

    const entities = await this.wallpapersRepository.find(
      Object.assign(options, {
        take: value.take,
        skip: value.skip,
      }),
    );

    const records: WallpaperJson[] = [];
    for (const entity of entities) {
      records.push({
        id: entity.id.toHexString(),
        image: this.imagesService.getUrl(entity.imageKey, 'public'),
      });
    }

    res.status(HttpStatus.OK).json({
      data: records,
    });
  }
}
