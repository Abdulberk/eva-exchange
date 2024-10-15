import { Controller, Post, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { TradesService } from './trades.service';
import { TradeDto } from './dto/trade.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/request.interface';

@Controller('trades')
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Post('buy')
  @UseGuards(JwtAuthGuard)
  async buy(@Body() tradeDto: TradeDto, @Req() req: AuthenticatedRequest) {
    const userId = Number(req.user.sub);

    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const result = await this.tradesService.buy(tradeDto, userId);
    return result;
  }


  @Post('sell')
  @UseGuards(JwtAuthGuard)
  async sell(@Body() tradeDto: TradeDto, @Req() req: AuthenticatedRequest) {
    const userId = Number(req.user.sub);

    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const result = await this.tradesService.sell(tradeDto, userId);
    return result;
  }

}
