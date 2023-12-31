import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mime from 'mime-types';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import * as path from 'path';

import { randomString } from '../../utils/utils';

@Injectable()
export class StorageService {
  private readonly R2_ACCESS_KEY_ID: string;
  private readonly R2_SECRET_ACCESS_KEY: string;
  private readonly R2_ENDPOINT: string;
  private readonly R2_BUCKET: string;

  private readonly client: S3Client;

  constructor(
    @InjectPinoLogger(StorageService.name)
    private readonly log: PinoLogger,
    private readonly configService: ConfigService,
  ) {
    this.R2_ACCESS_KEY_ID = this.configService.get('R2_ACCESS_KEY_ID');
    this.R2_SECRET_ACCESS_KEY = this.configService.get('R2_SECRET_ACCESS_KEY');
    this.R2_ENDPOINT = this.configService.get('R2_ENDPOINT');
    this.R2_BUCKET = this.configService.get('R2_BUCKET');

    this.client = new S3Client({
      region: 'auto',
      endpoint: this.R2_ENDPOINT,
      credentials: {
        accessKeyId: this.R2_ACCESS_KEY_ID,
        secretAccessKey: this.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.R2_BUCKET,
          Key: key,
        }),
      );
    } catch (error) {
      this.log.error(
        { error: error.stack, payload: { key } },
        `DeleteObjectCommand returns error: ${error.message}`,
      );
      throw error;
    }
  }

  async putObject(
    body: any,
    fileName: string = 'image.png',
    prevKey?: string,
  ): Promise<string> {
    const key = prevKey ? prevKey : randomString(36) + path.extname(fileName);

    const putObjectCommand = new PutObjectCommand({
      ACL: 'private',
      Body: body,
      Bucket: this.R2_BUCKET,
      ContentType: mime.contentType(fileName) || 'application/octet-stream',
      Key: key,
    });

    try {
      await this.client.send(putObjectCommand);
    } catch (error) {
      this.log.error(
        { error: error.stack, payload: { key } },
        `PutObjectCommand returns error: ${error.message}`,
      );
      throw error;
    }

    return key;
  }

  async getSignedUrl(key: string, expiresIn: number = 300): Promise<string> {
    const getObjectCommand = new GetObjectCommand({
      Bucket: this.R2_BUCKET,
      Key: key,
    });

    try {
      return await getSignedUrl(this.client, getObjectCommand, { expiresIn });
    } catch (error) {
      this.log.error(
        { error: error.stack, payload: { key } },
        `getSignedUrl returns error: ${error.message}`,
      );
      throw error;
    }
  }

  async putSignedUrl(
    fileName: string = 'image.png',
    expiresIn: number = 300,
    prevKey?: string,
  ): Promise<{
    key: string;
    putSignedUrl: string;
  }> {
    const key = prevKey ? prevKey : randomString(36) + path.extname(fileName);

    const putObjectCommand = new PutObjectCommand({
      ACL: 'private',
      Bucket: this.R2_BUCKET,
      ContentType: mime.contentType(fileName) || 'application/octet-stream',
      Key: key,
    });

    let putSignedUrl: string;
    try {
      putSignedUrl = await getSignedUrl(this.client, putObjectCommand, {
        expiresIn,
      });
    } catch (error) {
      this.log.error(
        { error: error.stack, payload: { key } },
        `getSignedUrl returns error: ${error.message}`,
      );
      throw error;
    }

    return {
      key,
      putSignedUrl,
    };
  }
}
