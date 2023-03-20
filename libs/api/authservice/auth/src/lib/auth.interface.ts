export interface AuthServiceInterface {
  login(
    emailOrUsername: string,
    password: string,
    existingRefreshToken?: string
  ): Promise<LoginResponse>;
  register(
    email: string,
    username: string,
    password: string,
    lastname: string,
    firstname: string
  ): Promise<RegisterResponse>;
  logout(existingRefreshToken?: string): Promise<void>;
  refresh(token: string, email: string): Promise<refreshResponse>;
  verify(email: string, verifyToken: string): Promise<void>;
  sendVerification(email: string, userId:string): Promise<string>;
  forgotPassword(email: string): Promise<void>;
  changePassword(email: string, token: string): Promise<void>;
}

export const AuthServiceInterface = 'AuthServiceInterface';

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  email: string;
  username: string;
  firstname: string;
  lastname: string;
};

type RegisterResponse = LoginResponse;

type refreshResponse = {
  accessToken: string;
  refresToken: string;
};
