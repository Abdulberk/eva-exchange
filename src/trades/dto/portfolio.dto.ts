import { Type } from 'class-transformer';
import { IsInt, IsString, IsArray, ValidateNested, IsNumber, IsPositive } from 'class-validator';
import { ShareDto } from '../../shares/dto/share.dto';

export class PortfolioDto {
  @IsInt()
  id: number;

  @IsString()
  ownerName: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShareDto)
  shares: ShareDto[];

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  totalValue: number;
}
