import { Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import Joi from 'joi';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';

import { ImagesService } from '../../core/external/images.service';
import { StorageService } from '../../core/external/storage.service';
import { NovaService } from '../nova.service';
import { ImageEntity } from './nova-images.entity';
import { NovaImagesService } from './nova-images.service';

@Controller('/api/v1/nova/images')
export class NovaImagesController {
  constructor(
    @InjectPinoLogger(NovaImagesController.name)
    private readonly log: PinoLogger,
    @InjectRepository(ImageEntity)
    private readonly imagesRepository: Repository<ImageEntity>,
    private readonly imagesService: ImagesService,
    private readonly novaService: NovaService,
    private readonly novaImagesService: NovaImagesService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  async store(@Req() req: Request, @Res() res: Response): Promise<void> {
    const { userId, value } = await this.novaService.authorizeThenValidate({
      req,
      res,
      schema: Joi.object({
        fileName: Joi.string().required(),
      }),
    });
    if (!userId || !value) {
      return;
    }

    const { key, putSignedUrl } = await this.storageService.putSignedUrl(
      value.fileName,
    );

    res.status(HttpStatus.OK).json({
      key,
      putSignedUrl,
    });
  }

  @Post('/activate')
  async activate(@Req() req: Request, @Res() res: Response) {
    const { userId, value } = await this.novaService.authorizeThenValidate({
      req,
      res,
      schema: Joi.object({
        key: Joi.string().required(),
      }),
    });
    if (!userId || !value) {
      return;
    }

    const imageKey = await this.novaImagesService.syncImage(value.key);

    const { width, height } =
      await this.novaImagesService.upscaleImageThenOverwrite(value.key);

    await this.imagesRepository.save({
      objectKey: value.key,
      imageKey: imageKey,
      width: width,
      height: height,
    });

    res.status(HttpStatus.OK).json({
      imageKey: imageKey,
      imageUrl: this.imagesService.getUrl(imageKey, 'public'),
      objectKey: value.key,
      objectSignedUrl: await this.storageService.getSignedUrl(value.key),
    });
  }

  @Post('/find')
  async find(@Req() req: Request, @Res() res: Response): Promise<void> {
    const entities = await this.novaService.handleFindEndpoint({
      req,
      res,
      repository: this.imagesRepository,
    });
    if (entities === null) {
      return;
    }

    res.status(HttpStatus.OK).json(entities);
  }
}
