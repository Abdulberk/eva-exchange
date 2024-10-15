import { IsNumber, IsString, IsNotEmpty, Min } from 'class-validator';

export class TradeDto {

  @IsString()
  @IsNotEmpty()
  shareSymbol: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}
