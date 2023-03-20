import {
  Controller,
  Inject,
  Req,
  Post,
  Body,
  Get,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from '@urlshortmono/data-access/grpc';
import { AuthServiceInterface, LoginResponse } from './auth.interface';
import {
  RegisterRequestDto,
  RegisterResponseDto,
  LoginRequestDto,
  LoginResponseDto,
} from './auth.dto';
import { Response, Request } from 'express';

@Controller('/auth')
export class AuthController {
  constructor(
    @Inject(AuthServiceInterface)
    private readonly authService: AuthServiceInterface
  ) {}

  @Post('/register')
  async registerUser(
    @Req() req: Request,
    @Body() requestBody: RegisterRequestDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<RegisterResponseDto> {
    console.log(requestBody);
    const response = await this.authService.register(
      requestBody.email,
      requestBody.username,
      requestBody.password,
      requestBody.lastname,
      requestBody.firstname
    );

    if (req.header('X-CLIENT') && req.header('X-CLIENT') == 'mobile') {
      return {
        ...response,
      };
    }
    res.cookie('refreshToken', response.accessToken, { httpOnly: true });
    return {
      accessToken: response.accessToken,
      username: response.username,
      email: response.email,
      firstname: response.firstname,
      lastname: response.lastname,
    };
  }

  @Post('/login')
  async loginUser(
    @Req() req: Request,
    @Body() requestBody: LoginRequestDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<LoginResponseDto> {
    let response: LoginResponse;
    if (req.header('X-CLIENT') && req.header('X-CLIENT') == 'mobile') {
      response = await this.authService.login(
        requestBody.email,
        requestBody.password,
        requestBody.refreshToken
      );
      return {
        ...response,
      };
    } else {
      response = await this.authService.login(
        requestBody.email,
        requestBody.password,
        req.cookies['refreshToken']
      );
      res.cookie('refreshToken', response.refreshToken, { httpOnly: true });
      return {
        accessToken: response.accessToken,
        email: response.email,
        firstname: response.firstname,
        username: response.username,
        lastname: response.lastname,
      };
    }
  }

  @Get("/logout")
  async logoutUser(@Req() req:Request):Promise<void>{
    return
  }
}
