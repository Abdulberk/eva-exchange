import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenPayload } from './interfaces/token-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponse } from './interfaces/register-response.interface';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { LoggerService } from '@app/common';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Partial<User>;
  }> {
    const { email, name, password } = registerDto;

    const existingUser = await this.userService.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const newUser: User = await this.userService.create({
      email,
      name,
      password,
    });

    if (!newUser) {
      throw new BadRequestException('Failed to create user');
    }
    const tokens = await this.generateTokens(newUser);

    const { accessToken, refreshToken } = tokens;

    return {
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    };
  }

  async login(loginAuthDto: LoginDto): Promise<any> {
    const user = await this.validateUser(loginAuthDto);
    const tokens = await this.generateTokens(user);

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async validateUser(loginAuthDto: LoginDto): Promise<User> {
    const userExists = await this.userService.findUserByEmail(
      loginAuthDto.email,
    );

    if (!userExists) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const comparePassword = await bcrypt.compare(
      loginAuthDto.password,
      userExists.password,
    );

    if (!comparePassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return userExists;
  }

  async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: TokenPayload = {
      email: user.email,
      sub: user.id,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES'),
      secret: this.configService.get('JWT_SECRET'),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES'),
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });

    return { accessToken, refreshToken };
  }
}
