export interface AuthServiceInterface {
    login(emailOrUsername: string, password:string): Promise<loginResponse>
    register(email:string, username:string, password, lastname:string, firstname:string):Promise<registerResponse>
    logout(email:string):Promise<void>
    refresh(token:string, email:string):Promise<refreshResponse>
    verify(email:string, verifyToken:string):Promise<void>
    sendVerification(email:string):Promise<void>
    forgotPassword(email:string):Promise<void>
    changePassword(email:string, token:string):Promise<void>
}

export const AuthServiceInterface = "AuthServiceInterface"


type loginResponse = {
    accesstoken: string,
    refreshtoken:string,
    email: string,
    username:string,
    firstname:string,
    lastname:string,
} 


type registerResponse = loginResponse

type refreshResponse = {
    accessToken: string,
    refresToken: string,
}