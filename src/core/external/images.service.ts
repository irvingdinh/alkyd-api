import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class ImagesService {
  private readonly IMAGES_ACCOUNT_ID: string;
  private readonly IMAGES_ACCOUNT_HASH: string;
  private readonly IMAGES_API_TOKEN: string;

  constructor(
    @InjectPinoLogger(ImagesService.name)
    private readonly log: PinoLogger,
    private readonly configService: ConfigService,
  ) {
    this.IMAGES_ACCOUNT_ID = configService.get('IMAGES_ACCOUNT_ID');
    this.IMAGES_ACCOUNT_HASH = configService.get('IMAGES_ACCOUNT_HASH');
    this.IMAGES_API_TOKEN = configService.get('IMAGES_API_TOKEN');
  }

  async put(
    url: string,
    metadata: object = {},
    id?: string,
  ): Promise<PutResult> {
    const formData = new FormData();
    formData.append('url', url);
    formData.append('metadata', JSON.stringify(metadata));

    if (id !== undefined) {
      formData.append('id', id);
    }

    let response: AxiosResponse;
    try {
      response = await axios.post<CloudflareImagesUploadResponse>(
        this.requestUrl('/images/v1'),
        formData,
        this.requestConfig(),
      );
    } catch (error) {
      this.log.error(
        { error: error.stack, url, metadata },
        `axios.post returns error: ${error.message}`,
      );
      throw error;
    }

    return {
      id: response.data.result.id,
    };
  }

  async delete(id: string): Promise<void> {
    try {
      await axios.delete(
        this.requestUrl(`/images/v1/${id}`),
        this.requestConfig(),
      );
    } catch (error) {
      this.log.error(
        { error: error.stack },
        `axios.delete returns error: ${error.message}`,
      );
    }
  }

  getUrl(id: string, variant?: string): string {
    return variant === undefined
      ? `https://imagedelivery.net/${this.IMAGES_ACCOUNT_HASH}/${id}`
      : `https://imagedelivery.net/${this.IMAGES_ACCOUNT_HASH}/${id}/${variant}`;
  }

  async getUploadUrl(metadata: any = {}, id?: string): Promise<string> {
    const formData = new FormData();
    formData.append('metadata', JSON.stringify(metadata));

    if (id !== undefined) {
      formData.append('id', id);
    }

    let response: AxiosResponse<CloudflareImagesDirectUploadResponse>;
    try {
      response = await axios.post<CloudflareImagesDirectUploadResponse>(
        this.requestUrl('/images/v2/direct_upload'),
        formData,
        this.requestConfig(),
      );
    } catch (error) {
      this.log.error(
        { error: error.stack, metadata },
        `axios.post returns error: ${error.message}`,
      );
      throw error;
    }

    return response.data.result.uploadURL;
  }

  private requestUrl(path: string): string {
    return `https://api.cloudflare.com/client/v4/accounts/${this.IMAGES_ACCOUNT_ID}${path}`;
  }

  private requestConfig(): AxiosRequestConfig {
    return {
      headers: {
        Authorization: `Bearer ${this.IMAGES_API_TOKEN}`,
      },
    };
  }
}

export interface PutResult {
  id: string;
}

interface CloudflareImagesUploadResponse {
  success: boolean;
  errors: string[];
  messages: string[];
  result: {
    id: string;
    filename: string;
    metadata: any;
    uploaded: string;
    requireSignedURLs: boolean;
    variants: string[];
  };
}

interface CloudflareImagesDirectUploadResponse {
  result: {
    id: string;
    uploadURL: string;
  };
}
