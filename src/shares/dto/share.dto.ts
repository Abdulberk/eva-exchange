import { IsString, IsNumber, IsNotEmpty, IsPositive } from 'class-validator';

export class ShareDto {
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  total: number;
}
