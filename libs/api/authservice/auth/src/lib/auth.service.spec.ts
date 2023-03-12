import { AuthServiceInterface } from './auth.interface';
import { TestingModule, Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AuthServiceImplProvider } from './auth.service';
import { MongoDbModule } from '../../../../shared/src/lib/db/mongodb.module';
import { User } from './auth.entity';
import { AppConfig } from '../../../../shared/src/lib/config/app.config';

describe('AUTH TESTS', () => {
  let authService: AuthServiceInterface;
  let module: TestingModule;
  let authDataSource: DataSource;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        AppConfig,
        MongoDbModule.forRoot({
          entities: [User],
          url: process.env.AUTH_SERVICE_MONGO_URI,
        }),
      ],
      providers: [AuthServiceImplProvider],
    });
  });

  describe('LOGIN TESTS', () => {});

  describe('REGISTER TESTS', () => {});
  describe('LOGOUT TESTS', () => {});
  describe('REFRESH TOKEN TESTS', () => {});
  describe('FORGOT PASSWORD TEST', () => {});
  describe('CHANGE PASSWORD TEST', () => {});
  describe('VERIFY ACCOUNT TEST', () => {});
  describe('SEND VERIFICATION TEST', () => {});
});
