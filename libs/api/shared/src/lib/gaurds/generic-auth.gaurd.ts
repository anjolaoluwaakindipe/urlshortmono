import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Injectable,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import { InternalServerErrorException } from '@nestjs/common/exceptions';
import { ClientGrpc } from '@nestjs/microservices/interfaces';
import { Request } from 'express';
import { firstValueFrom, Observable } from 'rxjs';
import { AuthService } from '@urlshortmono/data-access/grpc';

@Injectable()
export class GenericAuthGaurd implements CanActivate, OnModuleInit {
  constructor(
    @Inject('AUTH_PACKAGE') private readonly grpcClient: ClientGrpc
  ) {}
  authGrpcService: AuthService;

  onModuleInit() {
    this.authGrpcService =
      this.grpcClient.getService<AuthService>('AuthService');
  }

  // gaurd activate method
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.authGrpcService) {
      throw new InternalServerErrorException();
    }

    // get request from context
    const request = context.switchToHttp().getRequest() as Request;

    // if user id and roles are not in the headers send an Unauthorized error
    if (!request.headers['user_id'] || !request.headers['roles']) {
      throw new UnauthorizedException('UNAUTHORIZED');
    }

    // if user id and roles are present extract their value
    const userId = request.headers['user_id'].toString();
    const roles = request.headers['roles']
      .toString()
      .split(',')
      .map((role) => role.trim()); // roles will be an array of strings

    // send both values, using a grpc client, to the auth server so as to check whether they are valid
    const isUserValidObs = this.authGrpcService.isValid({
      userId,
      roles,
    }); // this returns an Observable

    const isUserValidCheck = await firstValueFrom(isUserValidObs)
      .then((result) => {
        return result.isValid;
      })
      .catch((err) => {
        throw new InternalServerErrorException(
          'Could not communicate with RPC auth server'
        );
      }); // this gets the first value from the observablee

    // if it is not valid return an unauthorized error
    if (!isUserValidCheck) {
      throw new UnauthorizedException('Invalid user id and roles');
    }

    // set roles header to an array
    request.headers['roles'] = roles;

    // if everything is alright allow the request
    return true;
  }
}
