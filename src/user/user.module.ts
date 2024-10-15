import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtModule, JwtService } from '@nestjs/jwt';
@Module({
  imports: [
    JwtModule.register({}),
  ],
  providers: [UserService,JwtService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
