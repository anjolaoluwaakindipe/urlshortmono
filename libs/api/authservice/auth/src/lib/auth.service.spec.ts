process.env['NODE_ENV'] = 'testing';
import { ConflictException } from '@nestjs/common';
import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common/exceptions';
import { Test, TestingModule } from '@nestjs/testing';
import { AppConfig, MongoDbModule } from '@urlshortmono/api/shared';
import { DataSource } from 'typeorm';

import { User, Roles } from './auth.entity';
import { AuthServiceInterface } from './auth.interface';
import { AuthServiceImplProvider } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ObjectId } from 'mongodb';

describe('AUTH TESTS', () => {
  let authService: AuthServiceInterface;
  let module: TestingModule;
  let userDataSource: DataSource;
  let jwtService: JwtService;

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
    jwtService = module.get<JwtService>(JwtService);
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
  describe('LOGOUT TESTS', () => {
    const user = {
      email: 'anjy@gmail.com',
      username: 'anjy',
      password: 'hello123',
      lastname: 'Akindipe',
      firstname: 'Anjola',
    };
    let userDetails: User;
    let authResponse: {
      accessToken: string;
      refreshToken: string;
    };
    beforeEach(async () => {
      // register
      await authService.register(
        user.email,
        user.username,
        user.password,
        user.lastname,
        user.firstname
      );
      userDetails = await userDataSource
        .getMongoRepository<User>(User)
        .findOne({ where: { email: user.email } });
      // login
      authResponse = await authService.login(user.username, user.password);
    });
    it('SHOULD PASS when user logouts with an already existing refresh token', async () => {
      // check that refresh token from login is in the database
      expect(userDetails.refreshTokens).toContain(authResponse.refreshToken);

      // logout user
      await authService.logout(authResponse.refreshToken);

      // check that refresh token from login is not longer in the database
      const newUserDetails = await userDataSource
        .getMongoRepository<User>(User)
        .findOne({ where: { email: user.email } });
      expect(newUserDetails.refreshTokens).not.toContain(
        authResponse.refreshToken
      );
    });
    it('SHOULD FAIL when user logouts with an expired refreshtoken', async () => {
      // check if refresh token from login is in the database
      expect(userDetails.refreshTokens).toContain(authResponse.refreshToken);

      // wait for 3 seconds
      await new Promise((resolve) => {
        setTimeout(resolve, 1000 * 3);
      });

      // check that refresh token is expired
      const tf = async () => {
        await authService.logout(authResponse.refreshToken);
      };
      expect(tf()).rejects.toThrow(BadRequestException);

      // chekc that refresh token is no longer in the database after expiration check
      const newUserDetails = await userDataSource
        .getMongoRepository<User>(User)
        .findOne({ where: { email: user.email } });
      expect(newUserDetails.refreshTokens).not.toContain(
        authResponse.refreshToken
      );
    });
    it('SHOULD FAIL when user logouts with an refresh token that has an invalid user id', async () => {
      // generate an invalid user refreshToken
      const payload = {
        userId: new ObjectId().toString(),
        roles = [Roles.User],
      };
      const invalidRefreshToken = jwtService.sign(payload, {
        secret: process.env.REFRESH_SECRET,
        expiresIn: process.env.REFRESH_DURATION,
      });

      // check that refresh token is invalid
      const tf = async () => {
        await authService.logout(invalidRefreshToken);
      };

      expect(tf()).rejects.toThrow(BadRequestException);
    });
  });
  //   describe('REFRESH TOKEN TESTS', () => {});
  //   describe('FORGOT PASSWORD TEST', () => {});
  //   describe('CHANGE PASSWORD TEST', () => {});
  //   describe('VERIFY ACCOUNT TEST', () => {});
  //   describe('SEND VERIFICATION TEST', () => {});

  afterEach(() => {
    userDataSource.getRepository<User>(User).delete({});
  });
});
