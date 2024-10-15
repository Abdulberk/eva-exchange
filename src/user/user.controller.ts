import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { AuthenticatedRequest } from 'src/auth/interfaces/request.interface';

@Controller('user')
export class UserController {

  constructor(private readonly userService: UserService) {}

  
  @UseGuards(JwtAuthGuard)
  @Get('me/portfolio')
  async getUserPortfolio(@Req() req: AuthenticatedRequest): Promise<any> {
    const user = req.user.sub
   

    return this.userService.getUserWithPortfolioShares(user);
  }
}

