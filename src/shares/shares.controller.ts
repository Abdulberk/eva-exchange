import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SharesService } from './shares.service';
import { CreateShareDto } from './dto/create-share.dto';
import { UpdateShareDto } from './dto/update-share.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('shares')
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  @Post('/create')
  @UseGuards(JwtAuthGuard)
  async create(@Body() createShareDto: CreateShareDto) {
    const share = await this.sharesService.createShare(createShareDto);
    return { message: 'Share created successfully', share };
  }

  @Get('/list')
  async findAll() {
    const shares = await this.sharesService.findAll();
    return shares;
  }

  @Get(':symbol')
  async findBySymbol(@Param('symbol') symbol: string) {
    const share = await this.sharesService.findBySymbol(symbol);
    return share;
  }

  @Delete(':symbol')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('symbol') symbol: string) {
    const result = await this.sharesService.remove(symbol);
    return result;
  }

  @Put(':symbol')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('symbol') symbol: string,
    @Body() updateShareDto: UpdateShareDto,
  ) {
    const updatedShare = await this.sharesService.update(
      symbol,
      updateShareDto,
    );
    return { message: 'Share updated successfully', share: updatedShare };
  }
}
