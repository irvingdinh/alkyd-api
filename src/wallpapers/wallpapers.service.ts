import { HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';

import { ImagesService } from '../core/external/images.service';
import { StorageService } from '../core/external/storage.service';

@Injectable()
export class WallpapersService {
  constructor(
    @InjectPinoLogger(WallpapersService.name)
    private readonly log: PinoLogger,
    private readonly imagesService: ImagesService,
    private readonly storageService: StorageService,
  ) {}

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
}
