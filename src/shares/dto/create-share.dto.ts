import { IsString, IsNotEmpty, Matches, IsNumber, Min } from 'class-validator';

export class CreateShareDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}$/, { message: 'Symbol must be 3 uppercase letters' })
  symbol: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;
}
