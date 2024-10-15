import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  PrismaHealthIndicator,
  HealthCheck,
} from '@nestjs/terminus';
import { PrismaClient } from '@prisma/client';


export enum SERVER_STATUS {
  UP = 'up',
  DOWN = 'down',
}

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaHealthIndicator,
    private prismaClient: PrismaClient,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      async () =>
        this.prisma.pingCheck('database', this.prismaClient, {
          timeout: 5000,
        }),
      async () => ({
        server: SERVER_STATUS.UP,
      }),
    ]);
  }
}
