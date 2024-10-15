import { Module } from '@nestjs/common';
import { SharesController } from './shares.controller';
import { SharesService } from './shares.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
@Module({
  imports: [JwtModule.register({})],
  controllers: [SharesController],
  providers: [SharesService, JwtService],
  exports: [SharesService],
})
export class SharesModule {}
