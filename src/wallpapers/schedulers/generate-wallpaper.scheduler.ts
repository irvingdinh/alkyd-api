import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import OpenAI from 'openai';
import { Repository } from 'typeorm';
import { v4 } from 'uuid';

import { ImagesService } from '../../core/external/images.service';
import { OpenAIService } from '../../core/external/openai.service';
import { ReplicateService } from '../../core/external/replicate.service';
import { StorageService } from '../../core/external/storage.service';
import { WallpaperEntity } from '../wallpapers.entity';
import Image = OpenAI.Image;
import Joi from 'joi';
import * as RunsAPI from 'openai/src/resources/beta/threads/runs/runs';

@Injectable()
export class GenerateWallpaperScheduler {
  private readonly schedulerEnabled: boolean = false;
  private readonly schedulerGenerateWallpaperEnabled: boolean = false;

  private assistantId: string = 'asst_yNCS9n0KClW3uNhxNvYUuD14';

  constructor(
    @InjectPinoLogger(GenerateWallpaperScheduler.name)
    private readonly log: PinoLogger,
    @InjectRepository(WallpaperEntity)
    private readonly wallpapersRepository: Repository<WallpaperEntity>,
    private readonly configService: ConfigService,
    private readonly imagesService: ImagesService,
    private readonly openAIService: OpenAIService,
    private readonly replicateService: ReplicateService,
    private readonly storageService: StorageService,
  ) {
    this.schedulerEnabled = this.configService.get<boolean>(
      'SCHEDULER_ENABLED',
      false,
    );
    this.schedulerGenerateWallpaperEnabled = this.configService.get<boolean>(
      'SCHEDULER_GENERATE_WALLPAPER_ENABLED',
      false,
    );
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async generateWallpaperCron(): Promise<void> {
    if (!this.schedulerEnabled || !this.schedulerGenerateWallpaperEnabled) {
      this.log.info(
        'GenerateWallpaperScheduler is ignored due to feature flag',
      );
      return;
    }

    await this.process();
  }

  async process(): Promise<void> {
    const promptDetails = await this.generatePrompt();

    const image = await this.generateImageWithPrompt(promptDetails.prompt);

    const upscaleUrl = await this.upscaleImage(image.url);

    const objectKey = await this.uploadImageToCloudflareR2(upscaleUrl);

    const imageKey = await this.syncImageToCloudflareImages(objectKey);

    const wallpaper = this.wallpapersRepository.create({
      input: {
        engine: 'dall-e',
        prompt: image.revised_prompt,
        styles: promptDetails.styles,
        tags: promptDetails.tags,
        colors: promptDetails.colors,
      },
      objectKey,
      imageKey,
    });

    await this.insertWallpaperIntoDatabase(wallpaper);

    this.log.info({ wallpaper }, 'generateWallpaper completed');
  }

  async generatePrompt(): Promise<ContentJson> {
    console.debug('⚪️', 'generatePrompt', 'starting');

    let run: RunsAPI.Run;
    try {
      run = await this.openAIService.createAndRunThread({
        assistant_id: this.assistantId,
        thread: {
          messages: [
            {
              role: 'user',
              content: 'Suggest a prompt for a 9:16 wallpaper.',
            },
          ],
        },
      });
    } catch (error) {
      this.log.error(
        { error: error.stack },
        `OpenAIServices.createAndRunThread returns error: ${error.message}`,
      );
      throw error;
    }

    console.debug(
      '⚪️',
      'generatePrompt',
      'OpenAIServices.createAndRunThread',
      run,
    );

    try {
      await this.openAIService.waitForRun(run.thread_id, run.id);
    } catch (error) {
      this.log.error(
        { error: error.stack, payload: { run } },
        `OpenAIServices.waitForRun returns error: ${error.message}`,
      );
      throw error;
    }

    console.debug('⚪️', 'generatePrompt', 'OpenAIServices.waitForRun');

    let contentAsString: string;
    try {
      contentAsString =
        await this.openAIService.retrieveLatestAssistantThreadMessageContent(
          run.thread_id,
        );
    } catch (error) {
      this.log.error(
        { error: error.stack, payload: { run } },
        `OpenAIServices.retrieveLatestAssistantThreadMessageContent returns error: ${error.message}`,
      );
      throw error;
    }

    console.debug(
      '⚪️',
      'generatePrompt',
      'OpenAIServices.retrieveLatestAssistantThreadMessageContent',
      contentAsString,
    );

    let contentAsJson: ContentJson;
    try {
      contentAsJson = this.parseContent(contentAsString);
    } catch (error) {
      throw error;
    }

    console.debug('⚪️', 'generatePrompt', 'this.parseContent', contentAsJson);

    console.debug('🟣️', 'generatePrompt', 'completed');

    return contentAsJson;
  }

  async generateImageWithPrompt(prompt: string): Promise<Image> {
    console.debug('⚪️', 'generateImageWithPrompt', 'starting');

    let images: Image[];
    try {
      images = await this.openAIService.generateImages({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        quality: 'hd',
        response_format: 'url',
        size: '1024x1792',
      });
    } catch (error) {
      this.log.error(
        { error: error.stack, payload: { prompt } },
        `OpenAIService.generateImages returns error: ${error.message}`,
      );
      throw error;
    }

    if (images.length < 1) {
      const error = new Error('OpenAIService.generateImages returns nothing');

      this.log.error(
        { error: error.stack, payload: { prompt, images } },
        error.message,
      );
      throw error;
    }

    console.debug(
      '⚪️',
      'generateImageWithPrompt',
      'OpenAIService.generateImages',
      images,
    );

    console.debug('🟣', 'generateImageWithPrompt', 'completed');

    return images[0];
  }

  async upscaleImage(url: string): Promise<string> {
    console.debug('⚪️', 'upscaleImage', 'starting');

    let result: string;
    try {
      result = await this.replicateService.upscale(url);
    } catch (error) {
      this.log.error(
        { error: error.stack, payload: { url } },
        `ReplicateService.upscale returns error: ${error.message}`,
      );
      throw error;
    }

    console.debug('⚪️', 'upscaleImage', 'ReplicateService.upscale', result);

    console.debug('🟣️', 'upscaleImage', 'completed');

    return result;
  }

  async uploadImageToCloudflareR2(url: string): Promise<string> {
    console.debug('⚪️', 'uploadImageToCloudflareR2', 'starting');

    let buffer: Buffer;
    try {
      const { data } = await axios.get(url, {
        responseType: 'arraybuffer',
      });

      buffer = data;
    } catch (error) {
      this.log.error(
        { error: error.stack, payload: { url } },
        `axios.get returns error: ${error.message}`,
      );
      throw error;
    }

    console.debug(
      '⚪️',
      'uploadImageToCloudflareR2',
      'axios.get',
      buffer.length,
    );

    let objectKey: string;
    try {
      objectKey = await this.storageService.putObject(buffer, v4() + '.png');
    } catch (error) {
      this.log.error(
        { error: error.stack, payload: { url } },
        `StorageService.put return error: ${error.message}`,
      );
      throw error;
    }

    console.debug(
      '⚪️',
      'uploadImageToCloudflareR2',
      'StorageService.put',
      objectKey,
    );

    console.debug('🟣️', 'uploadImageToCloudflareR2', 'completed');

    return objectKey;
  }

  async syncImageToCloudflareImages(objectKey: string): Promise<string> {
    console.debug('⚪️', 'syncImageToCloudflareImages', 'starting');

    let signedUrl: string;
    try {
      signedUrl = await this.storageService.getSignedUrl(objectKey);
    } catch (error) {
      this.log.error(
        { error: error.stack, payload: { objectKey } },
        `StorageService.getSignedUrl returns error: ${error.message}`,
      );
      throw error;
    }

    console.debug(
      '⚪️',
      'syncImageToCloudflareImages',
      'StorageService.getSignedUrl',
      signedUrl,
    );

    let imageKey: string;
    try {
      const { id } = await this.imagesService.put(signedUrl);
      imageKey = id;
    } catch (error) {
      this.log.error(
        { error: error.stack, payload: { objectKey, signedUrl } },
        `ImageServices.put returns error: ${error.message}`,
      );
      throw error;
    }

    console.debug(
      '⚪️',
      'syncImageToCloudflareImages',
      'ImageServices.put',
      imageKey,
    );

    console.debug('🟣️', 'syncImageToCloudflareImages', 'completed');

    return imageKey;
  }

  async insertWallpaperIntoDatabase(
    wallpaper: WallpaperEntity,
  ): Promise<WallpaperEntity> {
    console.debug('⚪️', 'insertWallpaperIntoDatabase', 'starting');

    try {
      await this.wallpapersRepository.save(wallpaper);
    } catch (error) {
      this.log.error(
        { error: error.stack, payload: { wallpaper } },
        `WallpapersRepository.save returns error: ${error.message}`,
      );
      throw error;
    }

    console.debug('🟣️', 'insertWallpaperIntoDatabase', 'completed');

    return wallpaper;
  }

  private parseContent(asString: string): ContentJson {
    const contentAsString = asString.replace(/```json\n|\n```/g, '');

    let content: any;
    try {
      content = JSON.parse(contentAsString);
    } catch (error) {
      this.log.error(
        {
          error: error.stack,
          payload: { asString, contentAsString },
        },
        `JSON.parse returns error: ${error.message}`,
      );
      throw error;
    }

    const schema = Joi.object({
      prompt: Joi.string().required(),
      styles: Joi.array().items(Joi.string()).optional(),
      tags: Joi.array().items(Joi.string()).optional(),
      colors: Joi.array().items(Joi.string()).optional(),
    });

    const { value, error } = schema.validate(content);
    if (error !== undefined) {
      this.log.error(
        {
          error: error.stack,
          payload: { asString, contentAsString, content },
        },
        `schema.validate returns error: ${error.message}`,
      );
      throw error;
    }

    return value;
  }
}

interface ContentJson {
  prompt: string;
  styles?: string[];
  tags?: string[];
  colors?: string[];
}
