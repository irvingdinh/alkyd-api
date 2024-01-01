import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import sharp from 'sharp';

import { ImagesService } from '../../core/external/images.service';
import { ReplicateService } from '../../core/external/replicate.service';
import { StorageService } from '../../core/external/storage.service';
import { randomString } from '../../utils/utils';

@Injectable()
export class NovaImagesService {
  constructor(
    @InjectPinoLogger(NovaImagesService.name)
    private readonly log: PinoLogger,
    private readonly imagesService: ImagesService,
    private readonly replicateService: ReplicateService,
    private readonly storageService: StorageService,
  ) {}

  async syncImage(objectKey: string): Promise<string> {
    let signedUrl: string;
    try {
      signedUrl = await this.storageService.getSignedUrl(objectKey);
    } catch (error) {
      this.log.error(
        { error: error.stack },
        `StorageService.getSignedUrl returns error: ${error.message}`,
      );
      throw error;
    }

    let imageKey: string;
    try {
      const id = this.idFromObjectKey(objectKey);
      const result = await this.imagesService.put(signedUrl, {}, id);

      imageKey = result.id;
    } catch (error) {
      this.log.error(
        { error: error.stack },
        `ImagesService.put returns error: ${error.message}`,
      );
      throw error;
    }

    return imageKey;
  }

  async upscaleImageThenOverwrite(
    objectKey: string,
  ): Promise<UpscaleImageThenOverwriteResult> {
    let signedUrl: string;
    try {
      signedUrl = await this.storageService.getSignedUrl(objectKey);
    } catch (error) {
      this.log.error(
        { error: error.stack },
        `StorageService.getSignedUrl returns error: ${error.message}`,
      );
      throw error;
    }

    let buffer: Buffer;
    try {
      const { data } = await axios.get(signedUrl, {
        responseType: 'arraybuffer',
      });

      buffer = data;
    } catch (error) {
      this.log.error(
        { error: error.stack, payload: { signedUrl } },
        `axios.get returns error: ${error.message}`,
      );
      throw error;
    }

    let width, height: number;
    try {
      const metadata = await sharp(buffer).metadata();
      width = metadata.width;
      height = metadata.height;
    } catch (error) {
      this.log.error(
        { error: error.stack },
        `sharp.metadata returns error: ${error.message}`,
      );
      throw error;
    }

    const maxSize = Math.max(width, height);

    let scaleFactor = 1;
    if (maxSize < 1920) {
      scaleFactor = 3;
    } else if (maxSize < 3840) {
      scaleFactor = 2;
    }

    if (scaleFactor === 1) {
      return { width, height };
    }

    let upscaleResult: string;
    try {
      upscaleResult = await this.replicateService.upscale(
        signedUrl,
        scaleFactor,
      );
    } catch (error) {
      this.log.error(
        { error: error.stack, payload: { scaleFactor, signedUrl } },
        `ReplicateService.upscale returns error: ${error.message}`,
      );
      throw error;
    }

    try {
      const { data } = await axios.get(upscaleResult, {
        responseType: 'arraybuffer',
      });

      buffer = data;
    } catch (error) {
      this.log.error(
        { error: error.stack, payload: { signedUrl } },
        `axios.get returns error: ${error.message}`,
      );
      throw error;
    }

    try {
      const metadata = await sharp(buffer).metadata();
      width = metadata.width;
      height = metadata.height;
    } catch (error) {
      this.log.error(
        { error: error.stack },
        `sharp.metadata returns error: ${error.message}`,
      );
      throw error;
    }

    try {
      await this.storageService.putObject(buffer, objectKey, objectKey);
    } catch (error) {
      this.log.error(
        { error: error.stack, payload: { scaleFactor, signedUrl } },
        `StorageService.put returns error: ${error.message}`,
      );
      throw error;
    }

    return { width, height };
  }

  private idFromObjectKey(objectKey: string): string {
    let fragments = objectKey.split('/');
    if (fragments.length < 1) {
      return randomString(36);
    }

    fragments = fragments.pop().split('.');
    if (fragments.length < 1) {
      return randomString(36);
    }

    return fragments[0];
  }
}

export interface UpscaleImageThenOverwriteResult {
  width: number;
  height: number;
}
