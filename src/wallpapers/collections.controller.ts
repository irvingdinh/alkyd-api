import { Controller, Get, HttpStatus, Req, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import Joi from 'joi';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';

import { ImagesService } from '../core/external/images.service';
import { CollectionEntity, WallpaperEntity } from './wallpapers.entity';
import { WallpapersService } from './wallpapers.service';

@Controller('/api/v1/collections')
export class CollectionsController {
  constructor(
    @InjectPinoLogger(CollectionsController.name)
    private readonly log: PinoLogger,
    @InjectRepository(CollectionEntity)
    private readonly collectionRepository: Repository<CollectionEntity>,
    @InjectRepository(WallpaperEntity)
    private readonly wallpapersRepository: Repository<WallpaperEntity>,
    private readonly imagesService: ImagesService,
    private readonly wallpapersService: WallpapersService,
  ) {}

  @Get()
  async index(@Req() req: Request, @Res() res: Response): Promise<void> {
    const schema = Joi.object({
      take: Joi.number().max(100).default(25),
      skip: Joi.number().default(0),
    });

    const { value, error } = schema.validate(req.query);
    if (error) {
      res
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .json({ message: error.message });
      return null;
    }

    const entities = await this.collectionRepository.find({
      where: {
        isPublished: true,
      },
      order: {
        createdAt: 'DESC',
      },
      take: value.take,
      skip: value.skip,
    });

    const records: CollectionJson[] = [];
    for (const entity of entities) {
      // TODO: Get the fuck of this one!
      const numberOfWallpapers = await this.wallpapersRepository.countBy({
        collectionId: entity.id.toHexString(),
      });

      records.push({
        id: entity.id.toHexString(),
        name: entity.name,
        description: entity.description,
        coverImage: this.imagesService.getUrl(entity.coverImageKey, 'public'),
        numberOfWallpapers: numberOfWallpapers,
      });
    }

    res.status(HttpStatus.OK).json({
      data: records,
    });
  }

  @Get('/:id')
  async detail(@Req() req: Request, @Res() res: Response): Promise<void> {
    const collection = await this.wallpapersService.firstOrFail({
      req,
      res,
      repository: this.collectionRepository,
    });
    if (collection === null) {
      return;
    }

    if (collection.isPublished === false) {
      res.status(HttpStatus.NOT_FOUND).end();
      return;
    }

    const wallpapers = await this.wallpapersRepository.find({
      where: {
        collectionId: collection.id.toHexString(),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    const wallpaperRecords: WallpaperJson[] = [];
    for (const wallpaper of wallpapers) {
      wallpaperRecords.push({
        id: wallpaper.id.toHexString(),
        image: this.imagesService.getUrl(wallpaper.imageKey, 'public'),
      });
    }

    res.status(HttpStatus.OK).json({
      data: {
        id: collection.id.toHexString(),
        name: collection.name,
        description: collection.description,
        coverImage: this.imagesService.getUrl(
          collection.coverImageKey,
          'public',
        ),
        numberOfWallpapers: wallpaperRecords.length,
        wallpapers: wallpaperRecords,
      },
    });
  }
}

interface CollectionJson {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  numberOfWallpapers: number;
  wallpapers?: WallpaperJson[];
}

interface WallpaperJson {
  id: string;
  image: string;
}
