import {
  IsAlphanumeric,
  IsEmail,
  IsJWT,
  IsNotEmpty,
  MinLength,
  min,
} from 'class-validator';

// register dto
export class RegisterRequestDto {
  @IsEmail()
  email: string;
  @IsNotEmpty()
  @MinLength(2)
  firstname: string;
  @IsNotEmpty()
  @MinLength(2)
  lastname: string;
  @IsNotEmpty()
  @MinLength(6)
  password: string;
  @IsNotEmpty()
  @MinLength(4)
  @IsAlphanumeric()
  username: string;
}

export type RegisterResponseDto = {
  accessToken: string;
  refreshToken?: string;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
};

// login dto
export class LoginRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsNotEmpty()
  password: string;
  refreshToken?: string;
}

export type LoginResponseDto = {
  accessToken: string;
  refreshToken?: string;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
};

// logout dto
export class LogoutRequestDto {
  refreshToken?: string;
}

// verify dto
export class VerifyDtoRequest {
  @IsJWT()
  verificationToken: string;
}
