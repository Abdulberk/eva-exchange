import { Request } from 'express';
import { TokenPayload } from './token-payload.interface';

export interface AuthenticatedRequest extends Request {
  user: TokenPayload;
}
