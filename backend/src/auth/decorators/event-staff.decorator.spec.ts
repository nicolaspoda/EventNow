import { IS_EVENT_STAFF_KEY, RequireEventStaff } from './event-staff.decorator';

class TestController {
  @RequireEventStaff()
  handler() {
    return true;
  }
}

describe('RequireEventStaff', () => {
  it('should set the isEventStaff metadata to true on the handler', () => {
    const metadata = Reflect.getMetadata(
      IS_EVENT_STAFF_KEY,
      TestController.prototype.handler,
    );
    expect(metadata).toBe(true);
  });
});
