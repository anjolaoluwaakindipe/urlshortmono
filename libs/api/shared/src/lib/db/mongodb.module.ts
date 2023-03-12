import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntitySchema, MixedList } from 'typeorm';


type MongoDbModuleOptions = {
  url:string,
  entities: MixedList<string | {new():unknown} | EntitySchema<unknown>> | undefined
}

@Module({})
export class MongoDbModule {
  static forRoot(options: MongoDbModuleOptions): DynamicModule {
    return {
      global:true,
      module: MongoDbModule,
      imports: [
        TypeOrmModule.forRoot({
          type: 'mongodb',
          url: options.url,
          synchronize:
            (process.env.NODE_ENV || 'development') == 'development'
              ? true
              : false,
          entities: options.entities,
          
        }),
      ],
      exports: [TypeOrmModule],

    };
  }
}
