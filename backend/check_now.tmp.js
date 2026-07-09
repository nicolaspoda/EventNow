const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, username: true, email: true } });
  console.log('USERS:', JSON.stringify(users, null, 2));
  const events = await prisma.event.findMany({ where: { title: { contains: 'test', mode: 'insensitive' } }, select: { id: true, title: true, organizerId: true, type: true } });
  console.log('EVENTS matching test:', JSON.stringify(events, null, 2));
  const requests = await prisma.participationRequest.findMany({ include: { event: { select: { title: true } }, user: { select: { username: true } } } });
  console.log('REQUESTS:', JSON.stringify(requests, null, 2));
}
main().finally(() => prisma.$disconnect());
