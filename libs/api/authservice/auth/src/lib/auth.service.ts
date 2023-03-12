import { Injectable } from '@nestjs/common';
import { Provider } from '@nestjs/common/interfaces/modules';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './auth.entity';
import { AuthServiceInterface } from './auth.interface';

@Injectable()
class AuthServiceImpl implements AuthServiceInterface {
  constructor(@InjectRepository(User) private userRepository: Repository<User> ){

  }
  login(emailOrUsername: string, password: string): Promise<{ accesstoken: string; refreshtoken: string; email: string; username: string; firstname: string; lastname: string; }> {
    throw new Error('Method not implemented.');
  }
  register(email: string, username: string, password: any, lastname: string, firstname: string): Promise<{ accesstoken: string; refreshtoken: string; email: string; username: string; firstname: string; lastname: string; }> {
    throw new Error('Method not implemented.');
  }
  logout(email: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  refresh(token: string, email: string): Promise<{ accessToken: string; refresToken: string; }> {
    throw new Error('Method not implemented.');
  }
  verify(email: string, verifyToken: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  sendVerification(email: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  forgotPassword(email: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  changePassword(email: string, token: string): Promise<void> {
    throw new Error('Method not implemented.');
  }


}

export const AuthServiceImplProvider: Provider ={
  provide: AuthServiceInterface,
  useClass: AuthServiceImpl
}
