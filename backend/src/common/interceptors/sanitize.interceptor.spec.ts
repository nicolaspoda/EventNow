import { Test, TestingModule } from '@nestjs/testing';
import { SanitizeInterceptor } from './sanitize.interceptor';
import { of } from 'rxjs';

describe('SanitizeInterceptor', () => {
  let interceptor: SanitizeInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SanitizeInterceptor],
    }).compile();

    interceptor = module.get<SanitizeInterceptor>(SanitizeInterceptor);
  });

  it('should sanitize HTML from string body', (done) => {
    const request = { body: '<script>alert("xss")</script>Hello' };
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as any;
    const next = { handle: () => of('Hello') };

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(request.body).toBe('Hello');
        done();
      },
    });
  });

  it('should sanitize nested objects', (done) => {
    const request = { body: { title: '<b>Event</b>', description: 'Clean text' } };
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as any;
    const next = { handle: () => of({ result: true }) };

    interceptor.intercept(context, next).subscribe({
      complete: () => {
        expect(request.body.title).toBe('Event');
        expect(request.body.description).toBe('Clean text');
        done();
      },
    });
  });

  it('should sanitize response data', (done) => {
    const request = { body: {} };
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as any;
    const next = { handle: () => of({ message: '<script>xss</script>' }) };

    interceptor.intercept(context, next).subscribe({
      next: (value: any) => {
        expect(value.message).toBe('');
        done();
      },
    });
  });

  it('should sanitize arrays', (done) => {
    const request = { body: ['<b>Item 1</b>', '<i>Item 2</i>'] };
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as any;
    const next = { handle: () => of(['<b>resp</b>']) };

    interceptor.intercept(context, next).subscribe({
      next: (value: any) => {
        expect(value[0]).toBe('resp');
        done();
      },
    });
  });

  it('should preserve Date objects without converting to empty object', (done) => {
    const date = new Date('2026-01-01');
    const request = { body: { createdAt: date } };
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as any;
    const next = { handle: () => of({ date }) };

    interceptor.intercept(context, next).subscribe({
      next: (value: any) => {
        expect(value.date).toBeInstanceOf(Date);
        done();
      },
    });
  });

  it('should pass through numbers and booleans', (done) => {
    const request = { body: { count: 42, active: true } };
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as any;
    const next = { handle: () => of({ count: 42, active: false }) };

    interceptor.intercept(context, next).subscribe({
      next: (value: any) => {
        expect(value.count).toBe(42);
        expect(value.active).toBe(false);
        done();
      },
    });
  });

  it('should handle null body', (done) => {
    const request = { body: null };
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as any;
    const next = { handle: () => of(null) };

    interceptor.intercept(context, next).subscribe({
      next: (value: any) => {
        expect(value).toBeNull();
        done();
      },
    });
  });

  it('should handle undefined body', (done) => {
    const request = { body: undefined };
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as any;
    const next = { handle: () => of(undefined) };

    interceptor.intercept(context, next).subscribe({
      next: (value: any) => {
        expect(value).toBeUndefined();
        done();
      },
    });
  });
});
