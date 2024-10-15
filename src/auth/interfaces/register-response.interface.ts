import { User } from '@prisma/client';

export interface RegisterResponse {
  user: Partial<User>;
  message: string;
}
