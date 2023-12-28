import { Module } from '@nestjs/common';

import { AuthService } from './auth.service';
import { FirebaseService } from './external/firebase.service';
import { ImagesService } from './external/images.service';
import { StorageService } from './external/storage.service';

const externalProviders = [FirebaseService, ImagesService, StorageService];

@Module({
  imports: [],
  providers: [AuthService, ...externalProviders],
  exports: [AuthService, ...externalProviders],
})
export class CoreModule {}
