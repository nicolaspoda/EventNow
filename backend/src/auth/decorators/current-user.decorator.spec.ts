import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from './current-user.decorator';

class TestController {
  getUser(@CurrentUser() user: unknown) {
    return user;
  }
}

describe('CurrentUser', () => {
  it('should return request.user from context', () => {
    const mockUser = { id: '1', email: 'test@test.com', role: 'USER' };
    const mockRequest = { user: mockUser };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => mockRequest }),
    } as ExecutionContext;
    const args = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      TestController,
      'getUser',
    );
    const key = Object.keys(args).find((k) => k.includes('custom'));
    if (!key) {
      throw new Error('custom param metadata not found');
    }
    const { factory } = args[key];
    const result = factory(undefined, ctx);
    expect(result).toBe(mockUser);
  });
});
