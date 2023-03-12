import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UrlController } from './url.controller';
import { Url } from './url.entity';
import { UrlServiceImplProvider } from './url.service';

@Module({
  imports: [TypeOrmModule.forFeature([Url])],
  providers: [UrlServiceImplProvider],
  controllers: [UrlController],
})
export class UrlModule {}
