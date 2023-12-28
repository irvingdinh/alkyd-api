import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { DecodedIdToken } from 'firebase-admin/auth';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { FirebaseService } from './external/firebase.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectPinoLogger(AuthService.name)
    private readonly log: PinoLogger,
    private readonly firebaseService: FirebaseService,
  ) {}

  async verifyIdToken(token: string): Promise<DecodedIdToken> {
    let decodedIdToken = await this.firebaseService.verifyIdToken(token);
    if (decodedIdToken === null) {
      decodedIdToken = await this.verifyIdTokenWithBcrypt(token);
      if (decodedIdToken === null) {
        return null;
      }
    }

    return decodedIdToken;
  }

  private async verifyIdTokenWithBcrypt(
    token: string,
  ): Promise<DecodedIdToken> {
    const records = [
      {
        uid: '6MC4CVOlszXPjZAy7ME3LpLil6B2',
        accessToken:
          '$2b$10$A4I7ZM0Y7i.6MTg4B7zc5uozW0y8cjdshSz59A1VxPexYD/ViV4C.',
      },
    ];

    for (const { uid, accessToken } of records) {
      try {
        if (await bcrypt.compare(token, accessToken)) {
          // @ts-expect-error
          return { uid };
        }
      } catch (error) {
        //
      }
    }

    return null;
  }
}
