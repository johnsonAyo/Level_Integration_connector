import { Request } from 'express';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, query } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        this.logger.log(
          `${method} ${url} ${duration}ms - Query: ${JSON.stringify(query)}`,
        );
      }),
      catchError((err: unknown) => {
        if (err instanceof Error) {
          this.logger.error({
            stack: err.stack,
            message: err.message,
            method,
            url,
            query,
            error: err,
          });
        }
        return throwError(() => err);
      }),
    );
  }
}
