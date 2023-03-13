process.env['NODE_ENV'] = 'testing';
import { ConflictException } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { Test, TestingModule } from '@nestjs/testing';
import { AppConfig, MongoDbModule } from '@urlshortmono/api/shared';
import { DataSource } from 'typeorm';

import { User } from './auth.entity';
import { AuthServiceInterface } from './auth.interface';
import { AuthServiceImplProvider } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

describe('AUTH TESTS', () => {
  let authService: AuthServiceInterface;
  let module: TestingModule;
  let userDataSource: DataSource;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        AppConfig,
        MongoDbModule.forRoot({
          entities: [User],
          url: process.env.AUTH_SERVICE_MONGO_URI,
        }),
        TypeOrmModule.forFeature([User]),
        JwtModule.register({}),
      ],
      providers: [AuthServiceImplProvider],
    }).compile();

    authService = module.get<AuthServiceInterface>(AuthServiceInterface);
    userDataSource = module.get<DataSource>(DataSource);
  });

  describe('REGISTER TESTS', () => {
    it('SHOULD PASS when when receiving info from a new user', async () => {
      const userOne = {
        email: 'anjy@gmail.com',
        username: 'anjy',
        password: 'hello123',
        lastname: 'Akindipe',
        firstname: 'Anjola',
      };
      const response = await authService.register(
        userOne.email,
        userOne.username,
        userOne.password,
        userOne.lastname,
        userOne.firstname
      );

      expect(response).toHaveProperty('accessToken');
      expect(response).toHaveProperty('refreshToken');
      expect(response.accessToken).toBeTruthy();
      expect(response.refreshToken).toBeTruthy();
      expect(response.email).toBe(userOne.email);
      expect(response.username).toBe(userOne.username);
      expect(response.firstname).toBe(userOne.firstname);
      expect(response.lastname).toBe(userOne.lastname);
    });

    it('SHOULD FAIL if user already exits', async () => {
      const userOne = {
        email: 'anjy@gmail.com',
        username: 'anjy',
        password: 'hello123',
        lastname: 'Akindipe',
        firstname: 'Anjola',
      };
      await authService.register(
        userOne.email,
        userOne.username,
        userOne.password,
        userOne.lastname,
        userOne.firstname
      );
      const userTwo = {
        email: 'anjy@gmail.com',
        username: 'anjy',
        password: 'hello123',
        lastname: 'Michael',
        firstname: 'Daniel',
      };
      const tf = async () => {
        await authService.register(
          userTwo.email,
          userTwo.username,
          userTwo.password,
          userTwo.lastname,
          userTwo.firstname
        );
      };
      await expect(tf()).rejects.toThrow(ConflictException);
    });
  });
  describe('LOGIN TESTS', () => {
    const userOne = {
      email: 'anjy@gmail.com',
      username: 'anjy',
      password: 'hello123',
      lastname: 'Akindipe',
      firstname: 'Anjola',
    };
    beforeEach(async () => {
      await authService.register(
        userOne.email,
        userOne.username,
        userOne.password,
        userOne.lastname,
        userOne.firstname
      );
    });

    it('SHOULD PASS when user a passes in a correct username and password', async () => {
      const loginUser1 = {
        username: 'anjy',
        password: 'hello123',
      };
      const response = await authService.login(
        loginUser1.username,
        loginUser1.password
      );

      expect(response).toHaveProperty('accessToken');
      expect(response).toHaveProperty('refreshToken');
      expect(response).toHaveProperty('email');
      expect(response).toHaveProperty('username');
      expect(response).toHaveProperty('firstname');
      expect(response).toHaveProperty('lastname');
      expect(response.email).toBe(userOne.email);
      expect(response.username).toBe(userOne.username);
      expect(response.firstname).toBe(userOne.firstname);
      expect(response.lastname).toBe(userOne.lastname);
    });

    it('SHOULD PASS when user passes in a correct email and password', async () => {
      const loginUser2 = {
        username: 'anjy@gmail.com',
        password: 'hello123',
      };
      const response = await authService.login(
        loginUser2.username,
        loginUser2.password
      );

      expect(response).toHaveProperty('accessToken');
      expect(response).toHaveProperty('refreshToken');
      expect(response).toHaveProperty('email');
      expect(response).toHaveProperty('username');
      expect(response).toHaveProperty('firstname');
      expect(response).toHaveProperty('lastname');
      expect(response.email).toBe(userOne.email);
      expect(response.username).toBe(userOne.username);
      expect(response.firstname).toBe(userOne.firstname);
      expect(response.lastname).toBe(userOne.lastname);
    });

    it('SHOULD FAIL when user passes an invalid email or username', async () => {
      const tf = async () => {
        await authService.login('wrong', 'wrong');
      };
      await expect(tf()).rejects.toThrow(UnauthorizedException);
    });
    it('SHOULD FAIL when user passes an invalid password', async () => {
      const tf = async () => {
        await authService.login('wrong', 'wrong');
      };
      await expect(tf()).rejects.toThrow(UnauthorizedException);
    });
  });
  //   describe('LOGOUT TESTS', () => {
  //     const user = {
  //       email: 'anjy@gmail.com',
  //       username: 'anjy',
  //       password: 'hello123',
  //       lastname: 'Akindipe',
  //       firstname: 'Anjola',
  //     };
  //     let userDetails:User;
  //     let authResponse: {
  //         accessToken:string,
  //         refreshToken:string,
  //     }
  //     beforeAll(async () => {
  //       // register
  //       await authService.register(
  //         user.email,
  //         user.username,
  //         user.password,
  //         user.lastname,
  //         user.firstname
  //       );
  //      userDetails = await userDataSource.getMongoRepository<User>(User).findOne({where:{email: user.email}})
  //       // login
  //       await authService.login(
  //         user.username,
  //         user.password
  //       );
  //     });
  //     it('SHOULD PASS when method is triggered', () => {});
  //   });
  //   describe('REFRESH TOKEN TESTS', () => {});
  //   describe('FORGOT PASSWORD TEST', () => {});
  //   describe('CHANGE PASSWORD TEST', () => {});
  //   describe('VERIFY ACCOUNT TEST', () => {});
  //   describe('SEND VERIFICATION TEST', () => {});

  afterEach(() => {
    userDataSource.getRepository<User>(User).delete({});
  });
});
