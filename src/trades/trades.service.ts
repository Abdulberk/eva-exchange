// src/trades/trades.service.ts

import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DatabaseService } from '@app/common';
import { TradeDto } from './dto/trade.dto';
import { LoggerService } from '@app/common';
import { Prisma, Trade, TradeType } from '@prisma/client';
import { UserService } from 'src/user/user.service';
import { SharesService } from 'src/shares/shares.service';
import { RedisService } from '@app/common/redis';
import { RedisPrefixEnum } from '@app/common/redis/enums/redis-prefix.enum';

@Injectable()
export class TradesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: LoggerService,
    private readonly userService: UserService,
    private readonly sharesService: SharesService,
    private readonly redisService: RedisService,
  ) {}

  private async createTrade(
    prisma: Prisma.TransactionClient,
    portfolioId: number,
    shareId: number,
    quantity: number,
    price: number,
    type: TradeType,
  ): Promise<Trade> {
    return await prisma.trade.create({
      data: {
        portfolioId,
        shareId,
        quantity: type === TradeType.BUY ? quantity : -quantity,
        price: parseFloat(price.toFixed(2)),
        type,
      },
    });
  }

  private async handlePortfolioShare(
    prisma: Prisma.TransactionClient,
    portfolioId: number,
    shareId: number,
    quantity: number,
    type: TradeType,
  ) {
    if (type === TradeType.BUY) {
      await prisma.portfolioShare.upsert({
        where: {
          portfolioId_shareId: {
            portfolioId,
            shareId,
          },
        },
        update: {
          quantity: {
            increment: quantity,
          },
        },
        create: {
          portfolioId,
          shareId,
          quantity,
        },
      });
    } else if (type === TradeType.SELL) {
      await prisma.portfolioShare.update({
        where: {
          portfolioId_shareId: {
            portfolioId,
            shareId,
          },
        },
        data: {
          quantity: {
            decrement: quantity,
          },
        },
      });
    }
  }

  private calculateTotalCost(price: number, quantity: number): number {
    if (isNaN(price) || isNaN(quantity)) {
      throw new BadRequestException('Invalid price or quantity');
    }

    return parseFloat((price * quantity).toFixed(2));
  }

  async buy(
    tradeDto: TradeDto,
    userId: number,
  ): Promise<{ message: string; trade: Trade }> {
    const { shareSymbol, quantity } = tradeDto;

    this.logger.log(
      `User ${userId} attempting to buy ${quantity} shares of ${shareSymbol}`,
    );

    try {
      return await this.db.$transaction(async (prisma) => {
    
        const user = await this.userService.findUserWithPortfolio(
          userId,
          prisma,
        );

        if (!user || !user.portfolio) {
          this.logger.warn(`Invalid user or portfolio for user ID ${userId}`);
          throw new BadRequestException('Invalid user or portfolio');
        }

     
        let share = await this.redisService.getShare(shareSymbol);
        if (!share) {
          share = await this.sharesService.findBySymbolWithClient(
            shareSymbol,
            prisma,
          );

          if (!share) {
            this.logger.warn(`Share not found: ${shareSymbol}`);
            throw new BadRequestException('Share not found');
          }

          
          await this.redisService.cacheShare(shareSymbol, {
            ...share,
            price: share.price.toNumber(),
          });
        }

        
        const trade = await this.createTrade(
          prisma,
          user.portfolio.id,
          share.id,
          quantity,
          share.price, 
          TradeType.BUY,
        );

       
        await this.handlePortfolioShare(
          prisma,
          user.portfolio.id,
          share.id,
          quantity,
          TradeType.BUY,
        );

 
        const updatedPortfolio = await prisma.portfolio.findUnique({
          where: { id: user.portfolio.id },
          include: { portfolioShares: true },
        });

        if (!updatedPortfolio) {
          this.logger.warn(`Portfolio not found for user ID ${userId}`);
          throw new BadRequestException('Portfolio not found');
        }

       
        await this.redisService.cachePortfolio(userId, updatedPortfolio);

   
        const totalCost = this.calculateTotalCost(share.price, quantity);

        this.logger.log(
          `User ${userId} bought ${quantity} shares of ${shareSymbol} for a total of ${totalCost}`,
        );

        return {
          message: 'Purchase successful',
          trade: {
            ...trade,
            totalCost,
          },
        };
      });
    } catch (error) {
      this.logger.error(`Error during buy transaction: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to buy shares');
    }
  }

  async sell(
    tradeDto: TradeDto,
    userId: number,
  ): Promise<{ message: string; trade: Trade }> {
    const { shareSymbol, quantity } = tradeDto;

    this.logger.log(
      `User ${userId} attempting to sell ${quantity} shares of ${shareSymbol}`,
    );

    try {
      return await this.db.$transaction(async (prisma) => {
      
        const user = await this.userService.findUserWithPortfolio(
          userId,
          prisma,
        );

        if (!user || !user.portfolio) {
          this.logger.warn(`Invalid user or portfolio for user ID ${userId}`);
          throw new BadRequestException('Invalid user or portfolio');
        }

     
        let share = await this.redisService.getShare(shareSymbol);
        if (!share) {
          share = await this.sharesService.findBySymbolWithClient(
            shareSymbol,
            prisma,
          );

          if (!share) {
            this.logger.warn(`Share not found: ${shareSymbol}`);
            throw new BadRequestException('Share not found');
          }

          
          await this.redisService.cacheShare(shareSymbol, {
            ...share,
            price: share.price.toNumber(),
          });
        }

      
        const portfolioShare = await prisma.portfolioShare.findUnique({
          where: {
            portfolioId_shareId: {
              portfolioId: user.portfolio.id,
              shareId: share.id,
            },
          },
        });

        if (!portfolioShare || portfolioShare.quantity < quantity) {
          this.logger.warn(
            `Insufficient shares for user ID ${userId} in portfolio`,
          );
          throw new BadRequestException('Insufficient shares in portfolio');
        }

        
        const trade = await this.createTrade(
          prisma,
          user.portfolio.id,
          share.id,
          quantity,
          share.price, 
          TradeType.SELL,
        );

       
        await this.handlePortfolioShare(
          prisma,
          user.portfolio.id,
          share.id,
          quantity,
          TradeType.SELL,
        );

      
        const updatedPortfolio = await prisma.portfolio.findUnique({
          where: { id: user.portfolio.id },
          include: { portfolioShares: true },
        });

        if (!updatedPortfolio) {
          this.logger.warn(`Portfolio not found for user ID ${userId}`);
          throw new BadRequestException('Portfolio not found');
        }

        await this.redisService.cachePortfolio(userId, updatedPortfolio);

        
        const totalRevenue = this.calculateTotalCost(share.price, quantity);

        this.logger.log(
          `User ${userId} sold ${quantity} shares of ${shareSymbol} for a total of ${totalRevenue}`,
        );

        return {
          message: 'Sale successful',
          trade: {
            ...trade,
            totalCost: totalRevenue,
          },
        };
      });
    } catch (error) {
      this.logger.error(`Error during sell transaction: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to sell shares');
    }
  }
}
