import { IsInt, IsString, ValidateNested } from 'class-validator';
import { PortfolioDto } from './portfolio.dto';
import { Type } from 'class-transformer';

export class UserWithPortfolioDto {
  @IsInt()
  id: number;

  @IsString()
  email: string;

  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => PortfolioDto)
  portfolio: PortfolioDto;
}
