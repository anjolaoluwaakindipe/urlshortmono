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
import { EmailServiceInterface } from './email.interface';
import { EmailServiceImplProvider } from './email.service';
import { EmailMockServiceImplProvider } from './emailMock.service';

describe('AUTH TESTS', () => {
  let authService: AuthServiceInterface;
  let module: TestingModule;
  let userDataSource: DataSource;
  let jwtService: JwtService;
  let emailService: EmailServiceInterface;

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
      providers: [AuthServiceImplProvider, EmailMockServiceImplProvider],
    }).compile();

    authService = module.get<AuthServiceInterface>(AuthServiceInterface);
    userDataSource = module.get<DataSource>(DataSource);
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailServiceInterface>(EmailServiceInterface);
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
    let existingRefreshToken;
    beforeEach(async () => {
      const registrationResponse = await authService.register(
        userOne.email,
        userOne.username,
        userOne.password,
        userOne.lastname,
        userOne.firstname
      );
      existingRefreshToken = registrationResponse.refreshToken
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

    it('SHOULD FAIL when a user gives a correct password but a wrong password', async()=>{
      const tf = async() =>{
        await authService.login(userOne.email, "wrong");
      }

      await  expect(tf()).rejects.toThrow(UnauthorizedException)
    })

    it("SHOULD PASS when a user logins with an existing refreshToken",async()=>{
      await authService.login(userOne.email, userOne.password, existingRefreshToken);
      const userOneInfo = await userDataSource.getMongoRepository(User).findOne({where:{email: userOne.email}});
      expect(userOneInfo.refreshTokens).toHaveLength(1);
    })
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
      await new Promise((resolve) => {
        setTimeout(resolve, 1000 * 1);
      });
      // login
      authResponse = await authService.login(user.username, user.password);
      userDetails = await userDataSource
        .getMongoRepository<User>(User)
        .findOne({ where: { email: user.email } });
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
    it("SHOULD PASS when user does not pass a refreshToken", async()=>{
      jest.spyOn(authService, "logout")
      const tf = async()=>{
        await authService.logout();
      }
      await expect(tf()).resolves
      expect(authService.logout).toHaveBeenCalledTimes(1);
    })

    it("SHOULD FAIL when user gives an invalid refresh token", async()=>{
      const tf = async() =>{
        await authService.logout("invalidId")
      }
      await expect(tf()).rejects.toThrow(UnauthorizedException)
    })
    it("SHOULD FAIL when the user gives an invalid userId in the refreshToken payload", async()=>{
      const token = jwtService.sign({userId: "invaliduserid"}, {secret: process.env.REFRESH_SECRET, algorithm: "HS256"});
      const tf = async() =>{
        await authService.logout(token);
      }
      await expect(tf()).rejects.toThrow(UnauthorizedException)
    })
    it("SHOULD FAIL when the user gives a valid refresh token that does not belong to the user anymore", async()=>{
      const registeredUser = await userDataSource.getMongoRepository(User).findOne({where:{email: user.email}});
      await new Promise((resolve)=>{
        setTimeout(resolve, 1000 * 3)
      })
      const token = jwtService.sign({userId: registeredUser._id.toString()}, {secret: process.env.REFRESH_SECRET, expiresIn: process.env.REFRESH_DURATION, algorithm: "HS256"})
      console.log(token)
      const tf = async() =>{
        await authService.logout(token)
      }
      await expect(tf).rejects.toThrow(UnauthorizedException)
      const updatedUser = await userDataSource.getMongoRepository(User).findOne({where:{email: user.email}});
      expect(updatedUser.refreshTokens).toHaveLength(0);
    })
    it('SHOULD PASS when user logouts with an expired valid refreshtoken', async () => {
      // check if refresh token from login is in the database
      expect(userDetails.refreshTokens).toContain(authResponse.refreshToken);

      // wait for 3 seconds
      await new Promise((resolve) => {
        setTimeout(resolve, 1000 * 1);
      });

      // check that refresh token still works even after expiring
      await authService.logout(authResponse.refreshToken);

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
        roles: [Roles.USER],
      };
      const invalidRefreshToken = jwtService.sign(payload, {
        secret: process.env.REFRESH_SECRET,
        expiresIn: process.env.REFRESH_DURATION,
      });

      // check that refresh token is invalid
      const tf = async () => {
        await authService.logout(invalidRefreshToken);
      };

      expect(tf()).rejects.toThrow(UnauthorizedException);
    });
  });
  describe('REFRESH TOKEN TESTS', () => {
    it('NOT IMPLEMENTED YET', async () => {
      const tf = async () => {
        await authService.refresh('test', 'test');
      };

      await expect(tf).rejects.toThrow(Error);
    });
  });
  describe('FORGOT PASSWORD TEST', () => {
    it('NOT IMPLEMENTED YET', async () => {
      const tf = async () => {
        await authService.forgotPassword('test');
      };

      await expect(tf).rejects.toThrow(Error);
    });
  });
  describe('CHANGE PASSWORD TEST', () => {
    it('NOT IMPLEMENTED YET', async () => {
      const tf = async () => {
        await authService.changePassword('test', 'test');
      };

      await expect(tf).rejects.toThrow(Error);
    });
  });
  describe('VERIFY ACCOUNT TEST', () => {
    describe('SEND VERIFICATION TESTS', () => {
      const user = {
        email: 'anjy@gmail.com',
        username: 'anjy',
        password: 'hello123',
        lastname: 'Akindipe',
        firstname: 'Anjola',
      };
      it('SHOULD PASS when user registers and verification link is sent during registration', async () => {
        jest.spyOn(emailService, 'sendVerificationToken');
        // register
        await authService.register(
          user.email,
          user.username,
          user.password,
          user.lastname,
          user.firstname
        );
        const registeredUser = await userDataSource
          .getMongoRepository(User)
          .findOne({ where: { email: user.email } });
        expect(emailService.sendVerificationToken).toHaveBeenCalledTimes(1);
        expect(registeredUser.verificationTokens).not.toBeFalsy();
      });
      it('SHOULD PASS when user sends verification link using his email and userId and verification token made after registration is changed', async () => {
        jest.spyOn(emailService, 'sendVerificationToken');
        // register
        await authService.register(
          user.email,
          user.username,
          user.password,
          user.lastname,
          user.firstname
        );
        const registeredUser = await userDataSource
          .getMongoRepository(User)
          .findOne({ where: { email: user.email } });
        const newVerificationToken = await authService.sendVerification(
          registeredUser._id.toString()
        );
        const updatedUser = await userDataSource
          .getMongoRepository(User)
          .findOne({ where: { email: user.email } });
        expect(emailService.sendVerificationToken).toHaveBeenCalledTimes(2);
        expect(newVerificationToken).toBe(updatedUser.verificationTokens);
      });
      it("SHOULD FAIL when user passes an invalid userId that isn't a HEX string", ()=>{
        const tf = async()=>{
          await authService.sendVerification("invalid user id");
        }

        expect(tf).rejects.toThrow(BadRequestException);
      })

      it("SHOULD FAIL when a user passes in a valid userId that does not exist in the database", async()=>{
        const tf = async()=>{
          await authService.sendVerification((new ObjectId()).toString())
        }

        expect(tf).rejects.toThrow(BadRequestException)
      })

      it("SHOULD PASS when a user is already verified and an verification link is not sent", async()=>{
        jest.spyOn(emailService, 'sendVerificationToken');
        // register
        await authService.register(
          user.email,
          user.username,
          user.password,
          user.lastname,
          user.firstname
        );
        const registeredUser = await userDataSource
          .getMongoRepository(User)
          .findOne({ where: { email: user.email } });
        await userDataSource.getMongoRepository(User).update({_id: registeredUser._id}, {verified: true})
        await authService.sendVerification(
          registeredUser._id.toString()
        );
        const updatedUser = await userDataSource
          .getMongoRepository(User)
          .findOne({ where: { email: user.email } });
        expect(emailService.sendVerificationToken).toHaveBeenCalledTimes(1);
        expect(updatedUser.verificationTokens).toBe("");
      })
    });
  });

  afterEach(async () => {
    await userDataSource.getRepository<User>(User).delete({});
  });
  // afterAll(()=>{
  //   module.close()
  // })
});
