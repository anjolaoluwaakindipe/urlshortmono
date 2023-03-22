import { ConflictException, Injectable } from '@nestjs/common';
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

@Injectable()
class AuthServiceImpl implements AuthServiceInterface {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private jwtService: JwtService
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


    // create tokens
    const { refreshToken, accessToken } =  await this.createAuthTokens(
      createdUser._id.toString(),
      createdUser.roles
    );

    // update user with refresh token
    await this.userRepository.update(
      { _id: createdUser._id },
      {
        refreshTokens: [...createdUser.refreshTokens, refreshToken],
      }
    );
    // send verification token to email

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
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
    const refreshToken = await this.jwtService.signAsync( payload, {
      secret: process.env.REFRESH_SECRET,
      algorithm: 'HS256',
      expiresIn: process.env.REFRESH_DURATION,
    });
    return { refreshToken, accessToken };
  }

  async logout(existingRefreshToken?: string): Promise<void> {

    // check payload for userId and roles
    const payload = this.jwtService.decode(existingRefreshToken) as {
      userId: string;
      roles: string;
    };


    if(!ObjectId.isValid(payload.userId)){
      throw new UnauthorizedException("Invalid refresh token")
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
    await this.userRepository.update(existingUser._id.toString(), {
      refreshTokens: removedTokens,
    });

  }
  refresh(
    token: string,
    email: string
  ): Promise<{ accessToken: string; refresToken: string }> {
    throw new Error('Method not implemented.');
  }
  async verify(email: string, verifyToken: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async sendVerification(email: string): Promise<void> {
    throw new Error('Method not implemented.');
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
