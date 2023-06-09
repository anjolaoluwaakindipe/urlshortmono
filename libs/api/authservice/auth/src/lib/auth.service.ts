import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common/exceptions';
import { Provider } from '@nestjs/common/interfaces/modules';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ObjectID, Repository } from 'typeorm';

import { Roles, User } from './auth.entity';
import { AuthServiceInterface } from './auth.interface';
import { ObjectId } from 'mongodb';
import { EmailServiceInterface } from './email.interface';
import { InternalServerErrorException } from '@nestjs/common/exceptions';

@Injectable()
class AuthServiceImpl implements AuthServiceInterface {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @Inject(EmailServiceInterface)
    private readonly emailService: EmailServiceInterface
  ) {}
  async login(
    emailOrUsername: string,
    password: string,
    existingRefreshToken?: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    email: string;
    username: string;
    firstname: string;
    lastname: string;
  }> {
    // check if email or username  exists
    const emailExists = await this.userRepository.findOne({
      where: { email: emailOrUsername },
    });
    const usernameExists = await this.userRepository.findOne({
      where: { username: emailOrUsername },
    });

    if (!emailExists && !usernameExists) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const existingUser = await this.userRepository.findOne({
      where: {
        ...(emailExists ? { email: emailOrUsername } : {}),
        ...(usernameExists ? { username: emailOrUsername } : {}),
      },
    });

    const refreshTokens = existingRefreshToken
      ? existingUser.refreshTokens.filter(
          (token) => token !== existingRefreshToken
        )
      : existingUser.refreshTokens;

    // check password
    const isPasswordOkay = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordOkay) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // create tokens
    const { accessToken, refreshToken } = await this.createAuthTokens(
      existingUser._id.toString(),
      existingUser.roles
    );

    // update user refresh tokens
    this.userRepository.update(existingUser._id, {
      refreshTokens: [...refreshTokens, refreshToken],
    });

    return {
      accessToken,
      refreshToken,
      email: existingUser.email,
      firstname: existingUser.firstname,
      username: existingUser.username,
      lastname: existingUser.lastname,
    };
  }
  async register(
    email: string,
    username: string,
    password: string,
    lastname: string,
    firstname: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    email: string;
    username: string;
    firstname: string;
    lastname: string;
  }> {
    // check if username or email already exists
    const existinguserbyEmail = await this.userRepository.findOne({
      where: { email },
    });
    const existinguserbyUsername = await this.userRepository.findOne({
      where: { username },
    });

    // prevent user from creating account with the same email/username
    if (existinguserbyEmail || existinguserbyUsername) {
      throw new ConflictException('Username or email already exists');
    }

    // create salt and hash password
    const saltOrRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltOrRounds);

    // save user and get all information
    const createdUser = await this.userRepository.save({
      email,
      username,
      firstname,
      lastname,
      password: passwordHash,
      refreshTokens: [],
    });

    // let tokens: { refreshToken: string; accessToken: string };

    // let verificationToken: string;

    const [tokens, verificationToken] = await Promise.all([
      this.createAuthTokens(createdUser._id.toString(), createdUser.roles),
      this.sendVerificationLink(email, createdUser._id.toString()),
    ]);

    // update user with refresh token
    await this.userRepository.update(
      { _id: createdUser._id },
      {
        refreshTokens: [
          ...createdUser.refreshTokens,
          ...(tokens.refreshToken ? [tokens.refreshToken] : []),
        ],
        verificationTokens: verificationToken || '',
      }
    );
    // send verification token to email

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      email: createdUser.email,
      firstname: createdUser.firstname,
      username: createdUser.username,
      lastname: createdUser.lastname,
    };
  }
  private async createAuthTokens(userId: string, roles: Roles[]) {
    const payload = { userId: userId, roles: roles };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.ACCESS_SECRET,
      algorithm: 'HS256',
      expiresIn: process.env.ACCESS_DURATION,
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.REFRESH_SECRET,
      algorithm: 'HS256',
      expiresIn: process.env.REFRESH_DURATION,
    });
    return { refreshToken, accessToken };
  }

  async logout(existingRefreshToken?: string): Promise<void> {
    if (!existingRefreshToken) {
      return;
    }

    // check payload for userId and roles
    const payload = this.jwtService.decode(existingRefreshToken) as {
      userId: string;
      roles: string;
    };

    if (!payload) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!ObjectId.isValid(payload.userId)) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    // check if userId exists in the database
    const existingUser = await this.userRepository.findOne({
      where: {
        _id: ObjectId.createFromHexString(
          payload.userId
        ) as unknown as ObjectID,
      },
    });

    if (!existingUser) {
      throw new UnauthorizedException('Invalid refreshToken');
    }

    // find if existing refresh token exists in user's field
    const existingToken = existingUser.refreshTokens.find(
      (token) => token === existingRefreshToken
    );

    // if not, user is hacked and delete all tokens generated
    if (!existingToken) {
      await this.userRepository.update(
        { _id: existingUser._id },
        { refreshTokens: [] }
      );
      throw new UnauthorizedException('Invalid refreshToken');
    }

    // if not remove existing refresh token
    const removedTokens = existingUser.refreshTokens.filter(
      (token) => token !== existingRefreshToken
    );

    // update user after
    await this.userRepository.update(
      { _id: existingUser._id },
      {
        refreshTokens: removedTokens,
      }
    );
  }
  refresh(
    token: string,
    email: string
  ): Promise<{ accessToken: string; refresToken: string }> {
    throw new Error('Method not implemented.');
  }
  async verify( verifyToken: string): Promise<void> {
    const payload = this.jwtService.decode(verifyToken) as { userId: string };

    if (!payload)
      throw new UnauthorizedException('Invalid verification token');
  

    if (!ObjectId.isValid(payload.userId))
      throw new UnauthorizedException('Invalid verification token');

    

    const existingUser = await this.userRepository.findOne({
      where: {_id:ObjectId.createFromHexString(payload.userId) as unknown as ObjectID ,verificationTokens: verifyToken },
    });

    if (!existingUser) throw new UnauthorizedException("Invalid verification token")

    await this.userRepository.update({_id: existingUser._id}, {verified: true, verificationTokens: ""})
  }
  private async sendVerificationLink(
    email: string,
    userId: string
  ): Promise<string> {
    const token: string = await this.emailService.sendVerificationToken(
      userId,
      email
    );
    return token;
  }
  async sendVerification(userId: string): Promise<string> {
    if (!ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid access token');
    }

    const existingUser = await this.userRepository.findOne({
      where: {
        _id: ObjectId.createFromHexString(userId) as unknown as ObjectID,
      },
    });

    if (!existingUser) {
      throw new BadRequestException('Invalid access token');
    }
    if (existingUser.verified) {
      await this.userRepository.update(
        { _id: existingUser._id },
        { verificationTokens: '' }
      );
      return;
    }
    const verificationToken = await this.sendVerificationLink(
      existingUser.email,
      userId
    );

    await this.userRepository.update(
      { _id: ObjectId.createFromHexString(userId) as unknown as ObjectID },
      { verificationTokens: verificationToken }
    );
    return verificationToken;
  }
  async forgotPassword(email: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async changePassword(email: string, token: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

export const AuthServiceImplProvider: Provider = {
  provide: AuthServiceInterface,
  useClass: AuthServiceImpl,
};
