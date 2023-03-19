import { Module } from '@nestjs/common';
import { AuthServiceImplProvider } from './auth.service';

@Module({
  providers: [AuthServiceImplProvider],
})
export class AuthModule {}
