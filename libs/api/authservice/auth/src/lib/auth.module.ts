import { Module } from '@nestjs/common';
import { AuthServiceImplProvider } from './auth.service';
import { User } from './auth.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { EmailServiceImplProvider } from './email.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User]), JwtModule.register({})],
  providers: [AuthServiceImplProvider, EmailServiceImplProvider],
  controllers: [AuthController],
})
export class AuthModule {}