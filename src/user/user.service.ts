import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService, LoggerService } from '@app/common';
import { Prisma } from '@prisma/client';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '.prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { RedisService } from '@app/common/redis';
import { UserWithPortfolioDto } from 'src/trades/dto/user-with-portfolio.dto';
@Injectable()
export class UserService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
    private readonly redisService: RedisService,
    
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating user with email: ${createUserDto.email}`);
    try {
      const user = await this.findUserByEmail(createUserDto.email);
      if (user) {
        this.logger.warn(
          `User creation failed: Email ${createUserDto.email} already exists`,
        );
        throw new ConflictException('User already exists');
      }

      const rounds = 10;
      const salt = await bcrypt.genSalt(rounds);
      const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

      const newUser = await this.databaseService.user.create({
        data: {
          email: createUserDto.email,
          name: createUserDto.name,
          password: hashedPassword,
          portfolio: {
            create: {},
          },
        },
      });

      this.logger.log(`User created successfully: ${newUser.email}`);
      return newUser;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      this.logger.error(
        `Unexpected error creating user: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'An unexpected error occurred while creating the user.',
      );
    }
  }

  async findById(id: number): Promise<User> {
    const user = await this.databaseService.user.findUnique({
      where: { id },
      include: { portfolio: true },
    });
    if (!user) {
      this.logger.warn(`User with ID ${id} not found`);
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.databaseService.user.findUnique({
      where: { email },
    });
  }

  async findUserWithPortfolio(
    userId: number,
    prisma: Prisma.TransactionClient,
  ): Promise<
    Prisma.UserGetPayload<{
      include: { portfolio: true };
    }>
  > {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { portfolio: true },
    });

    if (!user || !user.portfolio) {
      this.logger.warn(`Invalid user or portfolio for user ID ${userId}`);
      throw new BadRequestException('Invalid user or portfolio');
    }

    return user;
  }

  async getUserWithPortfolioShares(
    userId: number,
  ): Promise<UserWithPortfolioDto> {
    this.logger.log(
      `Fetching user with portfolio shares for user ID: ${userId}`,
    );

    try {
     
      const userWithPortfolio =
        await this.redisService.getUserWithPortfolio(userId);

      if (userWithPortfolio) {
        this.logger.log(`User data fetched from cache for user ID: ${userId}`);
        return userWithPortfolio;
      }

      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        include: {
          portfolio: {
            include: {
              portfolioShares: {
                include: {
                  share: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        this.logger.warn(`User not found with ID: ${userId}`);
        throw new NotFoundException('User not found');
      }

      const portfolio = user.portfolio;

      if (!portfolio) {
        this.logger.warn(`Portfolio not found for user ID: ${userId}`);
        throw new NotFoundException('Portfolio not found');
      }

      const portfolioDto = {
        id: portfolio.id,
        ownerName: user.name,
        shares: portfolio.portfolioShares.map((ps) => ({
          symbol: ps.share.symbol,
          price: parseFloat(ps.share.price.toString()),
          quantity: ps.quantity,
          total: parseFloat(
            (parseFloat(ps.share.price.toString()) * ps.quantity).toFixed(2),
          ),
        })),
        totalValue: parseFloat(
          portfolio.portfolioShares
            .reduce(
              (acc, ps) =>
                acc + parseFloat(ps.share.price.toString()) * ps.quantity,
              0,
            )
            .toFixed(2),
        ),
      };

      const userWithPortfolioDto: UserWithPortfolioDto = {
        id: user.id,
        email: user.email,
        name: user.name,
        portfolio: portfolioDto,
      };

   
      await this.redisService.cacheUserWithPortfolio(
        userId,
        userWithPortfolioDto,
      );

      this.logger.log(
        `User data fetched from DB and cached for user ID: ${userId}`,
      );

      return userWithPortfolioDto;
    } catch (error) {
      this.logger.error(
        `Error fetching user with portfolio shares for user ID ${userId}: ${error.message}`,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch user portfolio');
    }
  }
}

