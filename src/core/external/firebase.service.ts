import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, initializeApp } from 'firebase-admin/app';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class FirebaseService implements OnModuleInit {
  constructor(
    @InjectPinoLogger(FirebaseService.name)
    private readonly log: PinoLogger,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const serviceAccountAsBase64 = this.configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT',
    );
    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountAsBase64, 'base64').toString(),
    );

    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  async verifyIdToken(token: string): Promise<DecodedIdToken> {
    try {
      return await getAuth().verifyIdToken(token);
    } catch (error) {
      return null;
    }
  }
}
