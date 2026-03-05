/**
 * Test users from seed (backend). Same password for all: Organizer123!
 */
export const testUsers = {
  organizer: {
    email: 'organizer@eventnow.fr',
    password: 'Organizer123!',
    role: 'ORGANIZER' as const,
  },
  client: {
    email: 'client@eventnow.fr',
    password: 'Organizer123!',
    role: 'CLIENT' as const,
  },
  staff: {
    email: 'staff@eventnow.fr',
    password: 'Organizer123!',
    role: 'STAFF' as const,
  },
} as const;

export type TestUserRole = keyof typeof testUsers;
