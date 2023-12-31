import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import Replicate from 'replicate';

@Injectable()
export class ReplicateService {
  private replicate: Replicate;

  constructor(
    @InjectPinoLogger(ReplicateService.name)
    private readonly log: PinoLogger,
    private readonly configService: ConfigService,
  ) {
    this.replicate = new Replicate({
      auth: this.configService.get<string>('REPLICATE_API_TOKEN'),
    });
  }

  async upscale(
    url: string,
    scale: number = 2,
    faceEnhance: boolean = false,
  ): Promise<string> {
    const identifier =
      'daanelson/real-esrgan-a100:499940604f95b416c3939423df5c64a5c95cfd32b464d755dacfe2192a2de7ef';
    const options = {
      input: {
        image: url,
        scale: scale,
        face_enhance: faceEnhance,
      },
    };

    let reply: any;
    try {
      reply = await this.replicate.run(identifier, options);
    } catch (error) {
      this.log.error(
        { error: error.stack, payload: { identifier, options } },
        `replicate.run returns error: ${error.message}`,
      );
      throw error;
    }

    if (typeof reply !== 'string') {
      const error = new Error(
        `replicate.run returns unsupported reply: ${typeof reply}`,
      );

      this.log.error(
        { error: error.stack, payload: { identifier, options } },
        error.message,
      );
      throw error;
    }

    return reply;
  }
}
