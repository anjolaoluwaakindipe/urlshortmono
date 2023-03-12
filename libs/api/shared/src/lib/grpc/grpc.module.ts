import { Module, Global, DynamicModule } from '@nestjs/common';
import { join } from 'path';
import { ClientsModule } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices/enums';

type GrpcModuleOptions = {
  name: string;
  url: string;
  package: string;
  path: string;
};

@Global()
@Module({})
export class GrpcModule {
  static forRoot(options: GrpcModuleOptions): DynamicModule {
    return {
      global:true,
      module: GrpcModule,
      imports: [
        ClientsModule.register([
          {
            name: 'AUTH_PACKAGE',
            transport: Transport.GRPC,
            options: {
              url: '0.0.0.0:5000',
              package: 'auth',
              protoPath: join(__dirname, '../../../../libs/data-access/grpc/src/lib/auth.proto'),
            },
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }
}
