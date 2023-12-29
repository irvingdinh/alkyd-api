import { Controller, Get, HttpStatus, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { NovaService } from './nova.service';

@Controller('/api/v1/nova')
export class NovaController {
  constructor(
    @InjectPinoLogger(NovaController.name)
    private readonly log: PinoLogger,
    private readonly novaService: NovaService,
  ) {}

  @Get()
  async index(@Req() req: Request, @Res() res: Response): Promise<void> {
    const userId = await this.novaService.authorize(req, res);
    if (typeof userId !== 'string') {
      return;
    }

    res.status(HttpStatus.OK).end();
  }
}
