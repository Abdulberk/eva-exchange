import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma, Share } from '@prisma/client';
import { DatabaseService } from '@app/common';
import { LoggerService } from '@app/common';
import { CreateShareDto } from './dto/create-share.dto';
import { UpdateShareDto } from './dto/update-share.dto';
import { RedisService } from '@app/common/redis';
import { RedisPrefixEnum } from '@app/common/redis/enums/redis-prefix.enum';

@Injectable()
export class SharesService {
  constructor(
    private readonly database: DatabaseService,
    private readonly logger: LoggerService,
    private readonly redisService: RedisService,
  ) {}

  async findBySymbolWithClient(
    symbol: string,
    prisma: Prisma.TransactionClient,
  ): Promise<Share | null> {
    return await prisma.share.findUnique({
      where: { symbol },
    });
  }

  

  async createShare(createShareDto: CreateShareDto): Promise<Share> {
    const { symbol, price } = createShareDto;
    this.logger.log(`Creating share with symbol ${symbol} and price ${price}`);

    try {
      const existingShare = await this.database.share.findUnique({
        where: { symbol },
      });

      if (existingShare) {
        this.logger.warn(`Share already exists: ${symbol}`);
        throw new BadRequestException('Share already exists');
      }

   
      const share = await this.database.share.create({
        data: {
          symbol,
          price,
        },
      });

     
      await this.redisService.cacheShare(symbol, {
        ...share,
        price: share.price.toNumber(),
      });

      this.logger.log(`Share ${symbol} created successfully`);

      return share;
    } catch (error) {
      this.logger.error(`Error creating share: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create share');
    }
  }

  async findBySymbol(symbol: string): Promise<Share> {
    this.logger.log(`Fetching share with symbol ${symbol}`);

    try {
      let share = await this.redisService.getShare(symbol);
      if (!share) {
        share = await this.database.share.findUnique({
          where: { symbol },
        });

        if (!share) {
          this.logger.warn(`Share not found: ${symbol}`);
          throw new BadRequestException('Share not found');
        }

      
        await this.redisService.cacheShare(symbol, {
          ...share,
          price: share.price.toNumber(),
        });
      }

      return share;
    } catch (error) {
      this.logger.error(`Error fetching share: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch share');
    }
  }

  async findAllShares(): Promise<Share[]> {
    this.logger.log('Fetching all shares');

    try {
      const shares = await this.database.share.findMany();
      return shares;
    } catch (error) {
      this.logger.error(`Error fetching shares: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch shares');
    }
  }

  async update(symbol: string, updateShareDto: UpdateShareDto): Promise<Share> {
    this.logger.log(`Updating share with symbol: ${symbol}`);
    try {
 
      const share = await this.findBySymbol(symbol);
      if (!share) {
        throw new NotFoundException('Share not found');
      }

      const newSymbol = updateShareDto.symbol
        ? updateShareDto.symbol
        : share.symbol;

   
      const updatedShare = await this.database.share.update({
        where: { symbol },
        data: {
          symbol: newSymbol,
          price: updateShareDto.price
            ? parseFloat(updateShareDto.price.toFixed(2))
            : share.price,
        },
      });

      this.logger.log(`Share updated successfully: ${updatedShare.symbol}`);

      if (newSymbol !== symbol) {

        await this.redisService.deleteShare(symbol);
      }

      await this.redisService.cacheShare(newSymbol, {
        ...updatedShare,
        price: updatedShare.price, 
      });

      return updatedShare;
    } catch (error) {
      this.logger.error(`Error updating share: ${error.message}`);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update share');
    }
  }
  async findAll(): Promise<Share[]> {
    try {
      const shares = await this.database.share.findMany();

      if (shares.length === 0) {
        this.logger.warn(`No shares found`);
        throw new NotFoundException('No shares found');
      }

      return shares;
    } catch (error) {
      this.logger.error(`Error fetching shares: ${error.message}`);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to fetch shares');
    }
  }
  async remove(symbol: string): Promise<{ message: string }> {
    this.logger.log(`Removing share with symbol: ${symbol}`);
    try {
      const share = await this.findBySymbol(symbol);

      if (!share) {
        this.logger.warn(`Share with symbol ${symbol} not found`);
        throw new NotFoundException('Share not found');
      }

      await this.database.share.delete({
        where: { symbol },
      });

      await this.redisService.deleteShare(symbol);

      this.logger.log(`Share removed successfully: ${symbol}`);
      return { message: 'Share removed successfully' };
    } catch (error) {
      this.logger.error(`Error removing share: ${error.message}`);
      throw error;
    }
  }
}
