import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisRepository implements OnModuleDestroy, OnModuleInit {
  constructor(@Inject('RedisClient') private readonly redisClient: Redis) {}

  onModuleDestroy(): void {
    this.redisClient.disconnect();
  }

  onModuleInit(): void {
    this.redisClient.on('error', (err) => {
      console.log(err);
    });

    this.redisClient.on('connect', () => {
      console.log('Redis connected');
    });

    this.redisClient.on('reconnecting', () => {
      console.log('Redis reconnecting');
    });
  }

  async get(prefix: string, key: string): Promise<string | null> {
    return this.redisClient.get(`${prefix}:${key}`);
  }

  async set(prefix: string, key: string, value: string): Promise<void> {
    await this.redisClient.set(`${prefix}:${key}`, value);
  }

  async delete(prefix: string, key: string): Promise<void> {
    await this.redisClient.del(`${prefix}:${key}`);
  }

  async expire(prefix: string, key: string, seconds: number): Promise<void> {
    await this.redisClient.expire(`${prefix}:${key}`, seconds);
  }

  async hincrby(prefix: string, key: string, field: string, value: number) {
    await this.redisClient.hincrby(`${prefix}:${key}`, field, value);
  }

  async hset(
    prefix: string,
    key: string,
    field: string,
    value: string | number,
  ): Promise<void> {
    await this.redisClient.hset(`${prefix}:${key}`, field, value);
  }

  async hget(
    prefix: string,
    key: string,
    field: string,
  ): Promise<string | null> {
    return this.redisClient.hget(`${prefix}:${key}`, field);
  }

  async hdel(prefix: string, key: string, field: string): Promise<void> {
    await this.redisClient.hdel(`${prefix}:${key}`, field);
  }

  async hgetall(
    prefix: string,
    key: string,
  ): Promise<{ [key: string]: string }> {
    return this.redisClient.hgetall(`${prefix}:${key}`);
  }

  async hkeys(prefix: string, key: string): Promise<string[]> {
    return this.redisClient.hkeys(`${prefix}:${key}`);
  }

  async hvals(prefix: string, key: string): Promise<string[]> {
    return this.redisClient.hvals(`${prefix}:${key}`);
  }

  async hexists(prefix: string, key: string, field: string): Promise<number> {
    return this.redisClient.hexists(`${prefix}:${key}`, field);
  }

  async publish(channel: string, message: string): Promise<number> {
    return this.redisClient.publish(channel, message);
  }

  async subscribe(
    channel: string,
    handler: (message: string) => void,
  ): Promise<void> {
    const subscriber = this.redisClient.duplicate();
    await subscriber.subscribe(channel);
    subscriber.on('message', (chan, msg) => {
      if (chan === channel) {
        handler(msg);
      }
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.redisClient.unsubscribe(channel);
  }

  getClient(): Redis {
    return this.redisClient;
  }
}
