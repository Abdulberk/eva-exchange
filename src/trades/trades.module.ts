import { Module } from '@nestjs/common';
import { TradesService } from './trades.service';
import { TradesController } from './trades.controller';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { DatabaseModule, LoggerModule } from '@app/common';
import { UserModule } from 'src/user/user.module';
import { SharesModule } from 'src/shares/shares.module';
import { RedisModule } from '@app/common/redis';
@Module({
  imports: [
    JwtModule.register({}),
    LoggerModule,
    DatabaseModule,
    UserModule,
    SharesModule,
  ],
  providers: [TradesService, JwtService],
  controllers: [TradesController],
})
export class TradesModule {}
