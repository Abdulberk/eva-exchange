import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, LoggerModule } from '@app/common';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from '@app/common';
import { UserModule } from './user/user.module';
import { SharesModule } from './shares/shares.module';
import { TradesModule } from './trades/trades.module';
import { HealthModule } from './health/health.module';
import { RedisModule } from '@app/common/redis';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    AuthModule,
    DatabaseModule,
    UserModule,
    SharesModule,
    TradesModule,
    HealthModule,
    RedisModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
