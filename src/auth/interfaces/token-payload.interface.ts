export interface TokenPayload {
  email: string;
  sub: number;
  iat?: number;
  exp?: number;
}
