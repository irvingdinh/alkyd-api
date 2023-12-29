import {
  Controller,
  Get,
  HttpStatus,
  Post,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import Joi from 'joi';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';

import { CollectionEntity } from '../../wallpapers/wallpapers.entity';
import { NovaService } from '../nova.service';

@Controller('/api/v1/nova/collections')
export class CollectionsController {
  constructor(
    @InjectPinoLogger(CollectionsController.name)
    private readonly log: PinoLogger,
    @InjectRepository(CollectionEntity)
    private readonly collectionRepository: Repository<CollectionEntity>,
    private readonly novaService: NovaService,
  ) {}

  @Post()
  async store(@Req() req: Request, @Res() res: Response): Promise<void> {
    const collection = await this.novaService.handleStoreEndpoint({
      req,
      res,
      repository: this.collectionRepository,
      schema: Joi.object({
        name: Joi.string().required().max(90),
        description: Joi.string().required().max(254),
        coverImageKey: Joi.string().required(),
        isPublished: Joi.boolean().default(false),
      }),
    });
    if (collection === null) {
      return;
    }

    res
      .status(HttpStatus.OK)
      .json(this.novaService.serializeCollectionEntity(collection));
  }

  @Get('/:id')
  async detail(@Req() req: Request, @Res() res: Response): Promise<void> {
    const userId = await this.novaService.authorize(req, res);
    if (typeof userId !== 'string') {
      return null;
    }

    const collection = await this.novaService.firstOrFail({
      req,
      res,
      repository: this.collectionRepository,
    });
    if (collection === null) {
      return null;
    }

    res
      .status(HttpStatus.OK)
      .json(this.novaService.serializeCollectionEntity(collection));
  }

  @Put('/:id')
  async update(@Req() req: Request, @Res() res: Response): Promise<void> {
    const collection = await this.novaService.handleUpdateEndpoint({
      req,
      res,
      repository: this.collectionRepository,
      schema: Joi.object({
        name: Joi.string().max(90),
        description: Joi.string().max(254),
        coverImageKey: Joi.string(),
        isPublished: Joi.boolean().default(false),
      }),
    });
    if (collection === null) {
      return;
    }

    res
      .status(HttpStatus.OK)
      .json(this.novaService.serializeCollectionEntity(collection));
  }

  @Post('/find')
  async find(@Req() req: Request, @Res() res: Response): Promise<void> {
    const entities = await this.novaService.handleFindEndpoint({
      req,
      res,
      repository: this.collectionRepository,
    });
    if (entities === null) {
      return;
    }

    const records: any[] = [];
    for (const entity of entities) {
      records.push(this.novaService.serializeCollectionEntity(entity));
    }

    res.status(HttpStatus.OK).json(records);
  }
}
