import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Organizer123!', 10);

  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@eventnow.fr' },
    update: {},
    create: {
      email: 'organizer@eventnow.fr',
      passwordHash: hash,
      firstName: 'Marie',
      lastName: 'Martin',
      role: 'ORGANIZER',
    },
  });

  const now = new Date();
  const futureDate = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(20, 0, 0, 0);
    return d;
  };

  await prisma.event.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Concert Jazz Festival',
      description: 'Soirée jazz exceptionnelle avec des artistes internationaux. Ambiance lounge et terrasse.',
      location: 'Zénith Paris',
      eventDate: futureDate(30),
      organizerId: organizer.id,
      ticketCategories: {
        create: [
          { name: 'Fosse', description: 'Accès fosse debout', price: 45, initialStock: 500, currentStock: 500 },
          { name: 'Gradin', description: 'Place assise gradin', price: 30, initialStock: 1000, currentStock: 1000 },
          { name: 'VIP', description: 'Backstage + cocktail', price: 120, initialStock: 50, currentStock: 50 },
        ],
      },
    },
  });

  await prisma.event.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      title: 'Festival Rock en Seine',
      description: 'Trois jours de rock et musiques actuelles. Camping sur place.',
      location: 'Domaine national de Saint-Cloud',
      eventDate: futureDate(60),
      organizerId: organizer.id,
      ticketCategories: {
        create: [
          { name: 'Pass 1 jour', price: 59, initialStock: 2000, currentStock: 2000 },
          { name: 'Pass 3 jours', price: 149, initialStock: 1000, currentStock: 1000 },
        ],
      },
    },
  });

  await prisma.event.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      title: 'Conférence Tech & Innovation',
      description: 'Keynotes et ateliers sur l\'IA, le cloud et les tendances 2026.',
      location: 'Station F, Paris',
      eventDate: futureDate(14),
      organizerId: organizer.id,
      ticketCategories: {
        create: [
          { name: 'Standard', price: 0, initialStock: 300, currentStock: 300 },
          { name: 'Premium', description: 'Déjeuner + networking', price: 49, initialStock: 100, currentStock: 100 },
        ],
      },
    },
  });

  await prisma.event.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      title: 'Soirée Electro Under the Stars',
      description: 'DJ set en plein air. Bar et food trucks.',
      location: 'Parc de la Villette, Paris',
      eventDate: futureDate(45),
      organizerId: organizer.id,
      ticketCategories: {
        create: [
          { name: 'Early bird', price: 25, initialStock: 500, currentStock: 500 },
          { name: 'Standard', price: 35, initialStock: 1500, currentStock: 1500 },
        ],
      },
    },
  });

  console.log('Seed OK: 1 organisateur, 4 événements créés.');
  console.log('Compte organisateur: organizer@eventnow.fr / Organizer123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
