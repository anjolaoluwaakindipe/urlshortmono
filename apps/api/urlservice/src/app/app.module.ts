import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongoDbModule, AppConfig } from '@urlshortmono/api/shared';
import { Url, UrlModule } from '@urlshortmono/api/urlservice/url';
import { GrpcModule } from '@urlshortmono/api/shared';
import { join } from 'path';

const AllAppModule = [UrlModule];

@Module({
  imports: [
    AppConfig,
    MongoDbModule.forRoot({
      entities: [Url],
      url: process.env.URL_SERV_MONGOURI,
    }),
    GrpcModule.forRoot({ name: 'AUTH_PACKAGE', package: 'auth', path: join(__dirname, "../../../../libs/data-access/grpc/src/lib/auth.proto"), port: "5001" }),
    ...AllAppModule,
  ],
})
export class AppModule {}
