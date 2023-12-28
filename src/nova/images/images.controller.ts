import { Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import Joi from 'joi';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';

import { ImagesService } from '../../core/external/images.service';
import { StorageService } from '../../core/external/storage.service';
import { CollectionEntity } from '../../wallpapers/wallpapers.entity';
import { NovaService } from '../nova.service';

@Controller('/api/v1/nova/images')
export class ImagesController {
  constructor(
    @InjectPinoLogger(ImagesController.name)
    private readonly log: PinoLogger,
    private readonly imagesService: ImagesService,
    private readonly novaService: NovaService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  async store(@Req() req: Request, @Res() res: Response): Promise<void> {
    const userId = await this.novaService.authorize(req, res);
    if (typeof userId !== 'string') {
      return null;
    }

    const schema = Joi.object({
      fileName: Joi.string().required(),
    });

    const { value, error } = schema.validate(req.body);
    if (error) {
      res
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .json({ message: error.message });
      return null;
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
    const userId = await this.novaService.authorize(req, res);
    if (typeof userId !== 'string') {
      return null;
    }

    const schema = Joi.object({
      key: Joi.string().required(),
    });

    const { value, error } = schema.validate(req.body);
    if (error) {
      res
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .json({ message: error.message });
      return null;
    }

    const signedUrl = await this.storageService.getSignedUrl(value.key);

    let imageKey: string;
    try {
      const result = await this.imagesService.put(signedUrl);

      imageKey = result.id;
    } catch (error) {
      this.log.error(
        { error: error.stack },
        `ImagesService.put returns error: ${error.message}`,
      );

      res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
      return;
    }

    res.status(HttpStatus.OK).json({
      imageKey: imageKey,
      imageUrl: this.imagesService.getUrl(imageKey, 'public'),
      objectKey: value.key,
      objectSignedUrl: signedUrl,
    });
  }
}
