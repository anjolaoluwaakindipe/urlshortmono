import { EmailServiceInterface } from './email.interface';
import { Provider } from '@nestjs/common/interfaces/modules';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

@Injectable()
class EmailServiceImpl implements EmailServiceInterface {
  constructor(
    private readonly mailService: MailerService,
    private readonly jwtService: JwtService
  ) {}
  async sendVerificationToken(userId: string, email: string): Promise<string> {
    const payload = { userId: userId };
    const token = this.jwtService.sign(payload, {
      algorithm: 'HS256',
      secret: process.env.VERIFICATION_SECRET,
      expiresIn: process.env.VERIFICATION_DURATION,
    });
    try {
      await this.mailService.sendMail({
        to: email,
        subject: 'SIGN UP VERIFICATION',
        text: process.env.CONFIRMATION_URL + '?token=' + token,
      });
    } catch (err) {
      console.log(err);
    }
    return token;
  }
}

export const EmailServiceImplProvider: Provider = {
  provide: EmailServiceInterface,
  useClass: EmailServiceImpl,
};
