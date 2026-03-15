import { SetMetadata } from '@nestjs/common';

export const IS_EVENT_STAFF_KEY = 'isEventStaff';
export const RequireEventStaff = () => SetMetadata(IS_EVENT_STAFF_KEY, true);
