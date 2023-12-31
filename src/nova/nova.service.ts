import { HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import Joi, { ObjectSchema } from 'joi';
import { ObjectId } from 'mongodb';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';

import { AuthService } from '../core/auth.service';
import { ImagesService } from '../core/external/images.service';
import { StorageService } from '../core/external/storage.service';
import {
  CollectionEntity,
  WallpaperEntity,
} from '../wallpapers/wallpapers.entity';

@Injectable()
export class NovaService {
  private whitelistIds: string[] = ['RQZAbikfD2bmvhhRvKh5wlwk9z32'];

  constructor(
    @InjectPinoLogger(NovaService.name)
    private readonly log: PinoLogger,
    private readonly authService: AuthService,
    private readonly imagesService: ImagesService,
    private readonly storageService: StorageService,
  ) {}

  async authorize(req: Request, res: Response): Promise<string> {
    const token = req.header('Authorization');

    const decodedIdToken = await this.authService.verifyIdToken(token);
    if (decodedIdToken === null) {
      res.status(HttpStatus.UNAUTHORIZED).end();
      return null;
    }

    if (!this.whitelistIds.includes(decodedIdToken.uid)) {
      res.status(HttpStatus.FORBIDDEN).end();
      return null;
    }

    return decodedIdToken.uid;
  }

  async handleStoreEndpoint<T>({
    req,
    res,
    schema,
    repository,
  }: {
    req: Request;
    res: Response;
    repository: Repository<T>;
    schema: ObjectSchema;
  }): Promise<T | null> {
    const userId = await this.authorize(req, res);
    if (typeof userId !== 'string') {
      return null;
    }

    const { value, error } = schema.validate(req.body);
    if (error) {
      res
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .json({ message: error.message });
      return null;
    }

    const entity = value;
    try {
      await repository.save(entity);
    } catch (error) {
      this.log.error(
        { error: error.stack },
        `Repository.save returns error: ${error.message}`,
      );

      res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
      return null;
    }

    return entity;
  }

  async handleUpdateEndpoint<T>({
    req,
    res,
    schema,
    repository,
  }: {
    req: Request;
    res: Response;
    repository: Repository<T>;
    schema: ObjectSchema;
  }): Promise<T | null> {
    const userId = await this.authorize(req, res);
    if (typeof userId !== 'string') {
      return null;
    }

    const { value, error } = schema.validate(req.body);
    if (error) {
      res
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .json({ message: error.message });
      return null;
    }

    const entity = await this.firstOrFail({
      req,
      res,
      repository,
    });
    if (entity === null) {
      return null;
    }

    const updatedEntity = Object.assign(entity, value);

    try {
      await repository.save(updatedEntity);
    } catch (error) {
      this.log.error(
        { error: error.stack },
        `Repository.save returns error: ${error.message}`,
      );

      res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
      return null;
    }

    return updatedEntity;
  }

  async handleFindEndpoint<T>({
    req,
    res,
    repository,
  }: {
    req: Request;
    res: Response;
    repository: Repository<T>;
  }): Promise<T[] | null> {
    const userId = await this.authorize(req, res);
    if (typeof userId !== 'string') {
      return null;
    }

    const schema = Joi.object({
      where: Joi.object().default({}),
      order: Joi.object().default({ createdAt: 'DESC' }),
      take: Joi.number().min(1).max(100).default(25),
      skip: Joi.number().min(0).default(0),
    });

    const { value, error } = schema.validate(req.body);
    if (error) {
      res
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .json({ message: error.message });
      return null;
    }

    return await repository.find({
      where: value.where,
      order: value.order,
      take: value.take,
      skip: value.skip,
    });
  }

  async firstOrFail<T>({
    req,
    res,
    repository,
    key,
  }: {
    req: Request;
    res: Response;
    repository: Repository<T>;
    key?: string;
  }): Promise<T | null> {
    if (key === undefined) {
      key = 'id';
    }

    const id = req.params[key];
    if (typeof id !== 'string') {
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(`'${key}' is required`);
      return null;
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(`'${key}' is invalid`);
      return null;
    }

    let record: T;
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      record = await repository.findOne(objectId);
    } catch (error) {
      this.log.error(
        { error: error.stack },
        `Repository.findOne returns error: ${error.message}`,
      );
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
      return null;
    }

    if (record === null) {
      res.status(HttpStatus.NOT_FOUND).end();
      return null;
    }

    return record;
  }

  serializeCollectionEntity(collection: CollectionEntity): any {
    return {
      id: collection.id.toHexString(),
      name: collection.name,
      description: collection.description,
      coverImageKey: collection.coverImageKey,
      coverImageUrl: this.imagesService.getUrl(collection.coverImageKey),
      isPublished: collection.isPublished,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    };
  }

  async serializeWallpaperEntity(wallpaper: WallpaperEntity): Promise<any> {
    return {
      id: wallpaper.id.toHexString(),
      // collectionId: wallpaper.collectionId,
      objectKey: wallpaper.objectKey,
      objectUrl: await this.storageService.getSignedUrl(wallpaper.objectKey),
      imageKey: wallpaper.imageKey,
      imageUrl: this.imagesService.getUrl(wallpaper.imageKey, 'public'),
      createdAt: wallpaper.createdAt,
      updatedAt: wallpaper.updatedAt,
    };
  }
}
