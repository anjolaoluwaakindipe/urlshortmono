import { Module, DynamicModule } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';

type EmailModuleOptions = {
  transportUrl: string;
};

@Module({})
export class EmailModule {
  static forRoot(options: EmailModuleOptions): DynamicModule {
    return {
      global: true,
      module: EmailModule,
      imports: [
        MailerModule.forRoot({
          defaults: 'anjyakindipe@gmail.com',
          transport:
            'smtps://anjyakindipe@gmail.com:yjwdgivhyqmztbkx@smtp.gmail.com',
        }),
      ],
    };
  }
}
