import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    request.body = this.sanitize(request.body);

    return next.handle().pipe(map((data) => this.sanitize(data)));
  }

  private sanitize(obj: any): any {
    if (typeof obj === 'string') {
      return sanitizeHtml(obj, {
        allowedTags: [],
        allowedAttributes: {},
      });
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitize(item));
    }

    // Les Date ne sont pas des records énumérables : sans ce garde-fou elles
    // deviennent {} et disparaissent à la sérialisation JSON.
    if (obj instanceof Date) {
      return obj;
    }

    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((acc, key) => {
        acc[key] = this.sanitize(obj[key]);
        return acc;
      }, {});
    }

    return obj;
  }
}
