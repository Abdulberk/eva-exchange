import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisRepository } from './redis.repository';
import { Prisma } from '@prisma/client';
import { RedisPrefixEnum } from './enums/redis-prefix.enum';

@Injectable()
export class RedisService {
  constructor(
    @Inject(RedisRepository) private readonly redisRepository: RedisRepository,
  ) {}

  async getShare(symbol: string): Promise<any> {
    const cachedShare = await this.redisRepository.get(
      RedisPrefixEnum.SHARE,
      symbol,
    );
    if (cachedShare) {
      return JSON.parse(cachedShare);
    }
    return null;
  }

  async cacheShare(symbol: string, shareData: any): Promise<void> {
    const serializedShare = {
      ...shareData,
      price:
        typeof shareData.price === 'object' && 'toNumber' in shareData.price
          ? shareData.price.toNumber()
          : shareData.price,
    };
    await this.redisRepository.set(
      RedisPrefixEnum.SHARE,
      symbol,
      JSON.stringify(serializedShare),
    );
  }

  async getPortfolio(userId: number): Promise<any> {
    const cachedPortfolio = await this.redisRepository.get(
      RedisPrefixEnum.PORTFOLIO,
      userId.toString(),
    );
    if (cachedPortfolio) {
      return JSON.parse(cachedPortfolio);
    }
    return null;
  }

  async cachePortfolio(userId: number, portfolioData: any): Promise<void> {
    await this.redisRepository.set(
      RedisPrefixEnum.PORTFOLIO,
      userId.toString(),
      JSON.stringify(portfolioData),
    );
  }

  async getUser(userId: number): Promise<any> {
    const cachedUser = await this.redisRepository.get(
      RedisPrefixEnum.USER,
      userId.toString(),
    );
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }
    return null;
  }

  async cacheUser(userId: number, userData: any): Promise<void> {
    await this.redisRepository.set(
      RedisPrefixEnum.USER,
      userId.toString(),
      JSON.stringify(userData),
    );
  }

  async deleteShare(symbol: string): Promise<void> {
    await this.redisRepository.delete(RedisPrefixEnum.SHARE, symbol);
  }

  async getUserWithPortfolio(userId: number): Promise<any> {
    const cachedUser = await this.redisRepository.get(
      RedisPrefixEnum.USER_PORTFOLIO,
      userId.toString(),
    );
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }
    return null;
  }

  async cacheUserWithPortfolio(
    userId: number,
    userWithPortfolioData: any,
  ): Promise<void> {
    await this.redisRepository.set(
      RedisPrefixEnum.USER_PORTFOLIO,
      userId.toString(),
      JSON.stringify(userWithPortfolioData),
    );
  }
  getClient(): Redis {
    return this.redisRepository.getClient();
  }
}
