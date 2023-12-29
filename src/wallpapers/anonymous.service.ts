import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Request, Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { AuthService } from '../core/auth.service';

export enum Action {
  DOWNLOAD_WALLPAPER = 'DOWNLOAD_WALLPAPER',
}

@Injectable()
export class AnonymousService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @InjectPinoLogger(AnonymousService.name)
    private readonly log: PinoLogger,
    private readonly authService: AuthService,
  ) {}

  async authorize(
    req: Request,
    res: Response,
    action?: Action,
  ): Promise<string> {
    const token = req.header('Authorization');

    const decodedIdToken = await this.authService.verifyIdToken(token);
    if (decodedIdToken === null) {
      res.status(HttpStatus.UNAUTHORIZED).end();
      return null;
    }

    if (action !== undefined) {
      if (await this.isThrottled(decodedIdToken.uid, action)) {
        res.status(HttpStatus.TOO_MANY_REQUESTS).end();
        return null;
      }
    }

    return decodedIdToken.uid;
  }

  async setThrottle(
    userId: string,
    action: Action,
    ttl: number = 30 * 1000,
  ): Promise<void> {
    try {
      await this.cacheManager.set(this.throttleKey(userId, action), true, ttl);
    } catch (error) {
      this.log.error(
        { error: error.stack },
        `CacheManager.set returns error: ${error.message}`,
      );
      throw error;
    }
  }

  async deleteThrottle(userId: string, action: Action): Promise<void> {
    try {
      await this.cacheManager.del(this.throttleKey(userId, action));
    } catch (error) {
      this.log.error(
        { error: error.stack },
        `CacheManager.del returns error: ${error.message}`,
      );
    }
  }

  private throttleKey(userId: string, action: Action): string {
    return `throttle:anonymous:${action.toString()}:${userId}`;
  }

  private async isThrottled(userId: string, action: Action): Promise<boolean> {
    try {
      const value = await this.cacheManager.get(
        this.throttleKey(userId, action),
      );
      return value !== undefined;
    } catch (error) {
      this.log.error(
        { error: error.stack },
        `CacheManager.get returns error: ${error.message}`,
      );
      return false;
    }
  }
}
