export interface EmailServiceInterface {
  sendVerificationToken(userId: string, email: string): Promise<string>;
}

export const EmailServiceInterface = 'EmailServiceInterface';
