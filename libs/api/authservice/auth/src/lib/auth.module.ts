import { Module } from '@nestjs/common';
import { AuthServiceImplProvider } from './auth.service';
import { User } from './auth.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { EmailServiceImplProvider } from './email.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from '@urlshortmono/api/shared';

@Module({
  imports: [TypeOrmModule.forFeature([User]), JwtModule.register({})],
  providers: [AuthServiceImplProvider, EmailServiceImplProvider, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
