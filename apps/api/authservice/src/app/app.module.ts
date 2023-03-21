import { Module } from '@nestjs/common';

import { PassportModule } from '@nestjs/passport';
import { AuthModule, User } from '@urlshortmono/api/authservice/auth';
import { AppConfig, EmailModule, GrpcModule, MongoDbModule } from '@urlshortmono/api/shared';
import { join } from 'path';

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
    PassportModule,
    EmailModule.forRoot({ transportUrl: 'asdfasdf' }),
    MongoDbModule.forRoot({
      entities: [User],
      url: process.env.AUTH_SERVICE_MONGO_URI,
    }),
  ],
})
export class AppModule {}
