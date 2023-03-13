import { ConflictException, Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { Provider } from '@nestjs/common/interfaces/modules';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { Roles, User } from './auth.entity';
import { AuthServiceInterface } from './auth.interface';

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
          (token) => token != existingRefreshToken
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
    const { accessToken, refreshToken } = this.createAuthTokens(
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
      roles: [],
    });

    // create tokens
    const { refreshToken, accessToken } = this.createAuthTokens(
      createdUser._id.toString(),
      createdUser.roles
    );

    // update user with refresh token
    await this.userRepository.update(createdUser._id, {
      refreshTokens: [...createdUser.refreshTokens, refreshToken],
    });
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
  private createAuthTokens(userId: string, roles: Roles[]) {
    const payload = { userId: userId, roles: roles };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.ACCESS_SECRET,
      expiresIn: process.env.ACCESS_DURATION,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_SECRET,
      expiresIn: process.env.REFRESH_DURATION,
    });
    return { refreshToken, accessToken };
  }

  logout(existingRefreshToken?: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  refresh(
    token: string,
    email: string
  ): Promise<{ accessToken: string; refresToken: string }> {
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

export const AuthServiceImplProvider: Provider = {
  provide: AuthServiceInterface,
  useClass: AuthServiceImpl,
};
