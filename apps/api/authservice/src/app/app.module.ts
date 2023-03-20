import { Module } from '@nestjs/common';

import { AuthModule } from '@urlshortmono/api/authservice/auth';
import { AppConfig } from '@urlshortmono/api/shared';
import { GrpcModule } from '@urlshortmono/api/shared';
import { EmailModule } from '@urlshortmono/api/shared';
import { MongoDbModule } from '@urlshortmono/api/shared';
import { User } from '@urlshortmono/api/authservice/auth';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    AppConfig,
    AuthModule,
    GrpcModule.forRoot({
      name: 'AUTH_PACKAGE',
      package: 'auth',
      path: join(
        __dirname + '../../../../../libs/data-access/grpc/src/lib/auth.proto'
      ),
      port: process.env.AUTH_SERVIC_GRPC_PORT,
    }),
    EmailModule.forRoot({ transportUrl: 'asdfasdf' }),
    MongoDbModule.forRoot({
      entities: [User],
      url: process.env.AUTH_SERVICE_MONGO_URI,
    }),
  ],
})
export class AppModule {}
