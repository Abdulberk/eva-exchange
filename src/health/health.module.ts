import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [PrismaClient, ConfigService],
})
export class HealthModule {}