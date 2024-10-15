import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { createLogger, transports, format, Logger } from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}] ${message}`;
        }),
      ),
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'application.log' }),
      ],
    });
  }

  log(message: string) {
    this.logger.info(message);
  }

  error(message: string, trace?: string) {
    this.logger.error(`${message} - Trace: ${trace}`);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }

  verbose(message: string) {
    this.logger.verbose(message);
  }
}
