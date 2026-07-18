import { Role } from '@prisma/client';
import { Roles } from './roles.decorator';

class TestController {
  @Roles(Role.ADMIN, Role.ORGANIZER)
  handler() {
    return true;
  }
}

describe('Roles', () => {
  it('should set the roles metadata on the handler', () => {
    const metadata = Reflect.getMetadata(
      'roles',
      TestController.prototype.handler,
    );
    expect(metadata).toEqual([Role.ADMIN, Role.ORGANIZER]);
  });

  it('should set an empty roles array when called without arguments', () => {
    class NoRolesController {
      @Roles()
      handler() {
        return true;
      }
    }
    const metadata = Reflect.getMetadata(
      'roles',
      NoRolesController.prototype.handler,
    );
    expect(metadata).toEqual([]);
  });
});
