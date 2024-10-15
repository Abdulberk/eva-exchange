import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

declare module 'express' {
  interface Request {
    user?: any;
    token?: string;
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = await this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Unauthorized access');
    }

    try {
      const payload: any = await this.jwtService.verifyAsync(token, {
        secret: await this.configService.get('JWT_SECRET'),
      });
      request.user = payload;
      request['token'] = payload;
    } catch (error) {
      throw new UnauthorizedException('Unauthorized access');
    }
    return true;
  }

  private async extractTokenFromHeader(request: Request): Promise<string> {
    const [type, token] = request.headers.authorization.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
