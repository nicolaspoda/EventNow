import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Vide toutes les tables sauf users.
 * Les données de test (organisateur, client, staff, événements) pourront être remises dans le seed plus tard.
 */
async function clearDbExceptUsers() {
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.participantReview.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.review.deleteMany();
  await prisma.participationRequest.deleteMany();
  await prisma.staffInvitation.deleteMany();
  await prisma.eventStaff.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.order.deleteMany();
  await prisma.ticketCategory.deleteMany();
  await prisma.event.deleteMany();
}

async function main() {
  await clearDbExceptUsers();
  console.log('BDD vidée (users conservés). Aucune donnée de test recréée.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
