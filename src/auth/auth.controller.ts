import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedRequest } from './interfaces/request.interface';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  register(@Body() createAuthDto: RegisterDto) {
    return this.authService.register(createAuthDto);
  }

  @Post('/login')
  login(@Body() loginAuthDto: LoginDto) {
    return this.authService.login(loginAuthDto);
  }
}
