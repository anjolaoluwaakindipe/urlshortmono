import { Module } from '@nestjs/common';

import { AuthModule } from '@urlshortmono/api/authservice/auth';
import { AppConfig } from '@urlshortmono/api/shared';

@Module({
  imports: [AppConfig,AuthModule],
})
export class AppModule {}
