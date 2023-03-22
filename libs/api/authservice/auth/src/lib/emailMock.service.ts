import { EmailServiceInterface } from './email.interface';
import { Provider } from '@nestjs/common/interfaces/modules';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

@Injectable()
class EmailMockServiceImpl implements EmailServiceInterface {
  constructor(private readonly jwtService: JwtService) {}
  async sendVerificationToken(userId: string, email: string): Promise<string> {
    const payload = { userId: userId };
    const token = this.jwtService.sign(payload, {
      algorithm: 'HS256',
      secret: process.env.VERIFICATION_SECRET,
      expiresIn: process.env.VERIFICATION_DURATION,
    });
    return token;
  }
}

export const EmailMockServiceImplProvider: Provider = {
  provide: EmailServiceInterface,
  useClass: EmailMockServiceImpl,
};
