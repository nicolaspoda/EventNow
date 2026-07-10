import { PrismaClient, Role, EventType, EventCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function clearDb() {
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
  await prisma.user.deleteMany();
}

async function main() {
  await clearDb();

  const hash = (pwd: string) => bcrypt.hash(pwd, 10);

  // --- Users ---
  const [admin, organizer, user] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@eventnow.fr',
        username: 'admin',
        passwordHash: await hash('Admin1234!'),
        role: Role.ADMIN,
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin',
      },
    }),
    prisma.user.create({
      data: {
        email: 'organizer@eventnow.fr',
        username: 'organizer',
        passwordHash: await hash('Organizer1234!'),
        role: Role.ORGANIZER,
        organizationName: 'EventPro Agency',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Organizer',
      },
    }),
    prisma.user.create({
      data: {
        email: 'user@eventnow.fr',
        username: 'testuser',
        passwordHash: await hash('User1234!'),
        role: Role.USER,
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=User',
      },
    }),
  ]);

  console.log('✅ Users créés');

  // --- Events ---
  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: 'Daft Punk Tribute Night',
        description:
          'Une soirée hommage épique aux légendaires Daft Punk. Live set, DJ, lasers et robots au programme. Une nuit inoubliable dans la capitale.',
        location: 'Accor Arena, Paris',
        address: '8 Boulevard de Bercy',
        city: 'Paris',
        postalCode: '75012',
        country: 'France',
        latitude: 48.8383,
        longitude: 2.3786,
        imageUrl:
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
        eventDate: new Date('2026-08-15T21:00:00'),
        endDate: new Date('2026-08-16T03:00:00'),
        organizerId: organizer.id,
        type: EventType.COMMUNITY,
        category: EventCategory.CONCERT,
        ticketCategories: {
          create: [
            { name: 'Fosse', description: 'Accès fosse debout', price: 45, initialStock: 500, currentStock: 500 },
            { name: 'Carré Or', description: 'Places assises face à la scène', price: 85, initialStock: 200, currentStock: 200 },
            { name: 'VIP', description: 'Accès lounge + meet & greet', price: 180, initialStock: 50, currentStock: 50 },
          ],
        },
      },
    }),
    prisma.event.create({
      data: {
        title: 'Tech Summit Paris 2026',
        description:
          'La conférence tech incontournable de l\'année. IA, Web3, DevOps — 40 speakers, 3 tracks, 1 journée pour tout comprendre.',
        location: 'Palais des Congrès, Paris',
        address: '2 Place de la Porte Maillot',
        city: 'Paris',
        postalCode: '75017',
        country: 'France',
        latitude: 48.8784,
        longitude: 2.2840,
        imageUrl:
          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        eventDate: new Date('2026-09-20T09:00:00'),
        endDate: new Date('2026-09-20T19:00:00'),
        organizerId: organizer.id,
        type: EventType.PROFESSIONAL,
        category: EventCategory.CONFERENCE,
        ticketCategories: {
          create: [
            { name: 'Standard', description: 'Accès à toutes les conférences', price: 129, initialStock: 800, currentStock: 800 },
            { name: 'Premium', description: 'Accès + workshop exclusif + déjeuner', price: 249, initialStock: 150, currentStock: 150 },
            { name: 'Startup Pass', description: 'Tarif réduit pour les startups early-stage', price: 79, initialStock: 100, currentStock: 100 },
          ],
        },
      },
    }),
    prisma.event.create({
      data: {
        title: 'Festival des Lumières — Lyon',
        description:
          'Le célèbre festival international illumine les rues de Lyon pendant 4 nuits magiques. Installations artistiques gratuites dans tout le centre-ville.',
        location: 'Centre-ville, Lyon',
        address: 'Place Bellecour',
        city: 'Lyon',
        postalCode: '69002',
        country: 'France',
        latitude: 45.7578,
        longitude: 4.8320,
        imageUrl:
          'https://images.unsplash.com/photo-1481833761820-0509d3217039?w=800',
        eventDate: new Date('2026-12-05T18:00:00'),
        endDate: new Date('2026-12-08T23:00:00'),
        organizerId: organizer.id,
        type: EventType.COMMUNITY,
        category: EventCategory.FESTIVAL,
        ticketCategories: {
          create: [
            { name: 'Entrée libre', description: 'Accès au parcours extérieur gratuit', price: 0, initialStock: 9999, currentStock: 9999 },
            { name: 'Pass Spectacles', description: 'Accès aux spectacles payants dans les salles', price: 35, initialStock: 400, currentStock: 400 },
          ],
        },
      },
    }),
    prisma.event.create({
      data: {
        title: 'Marathon de Bordeaux',
        description:
          'Courez à travers les vignobles bordelais sur le plus beau parcours de France. 42 km de paysages exceptionnels, ravitaillements au vin et à l\'eau.',
        location: 'Bordeaux',
        address: 'Place des Quinconces',
        city: 'Bordeaux',
        postalCode: '33000',
        country: 'France',
        latitude: 44.8378,
        longitude: -0.5792,
        imageUrl:
          'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800',
        eventDate: new Date('2026-10-11T08:00:00'),
        endDate: new Date('2026-10-11T15:00:00'),
        organizerId: organizer.id,
        type: EventType.COMMUNITY,
        category: EventCategory.SPORT,
        ticketCategories: {
          create: [
            { name: 'Marathon 42km', description: 'Dossard course complète', price: 65, initialStock: 3000, currentStock: 3000 },
            { name: 'Semi-marathon 21km', description: 'Dossard demi-marathon', price: 40, initialStock: 2000, currentStock: 2000 },
            { name: '10km Fun Run', description: 'Course décontractée pour tous', price: 20, initialStock: 1000, currentStock: 1000 },
          ],
        },
      },
    }),
    prisma.event.create({
      data: {
        title: 'Exposition "Le Futur du Travail"',
        description:
          'Une exposition immersive sur les mutations du monde du travail à l\'ère de l\'IA. Installations interactives, témoignages d\'experts et ateliers pratiques.',
        location: 'Cité des Sciences, Paris',
        address: '30 Avenue Corentin Cariou',
        city: 'Paris',
        postalCode: '75019',
        country: 'France',
        latitude: 48.8958,
        longitude: 2.3872,
        imageUrl:
          'https://images.unsplash.com/photo-1558403194-611308249627?w=800',
        eventDate: new Date('2026-07-10T10:00:00'),
        endDate: new Date('2026-09-30T18:00:00'),
        organizerId: organizer.id,
        type: EventType.PROFESSIONAL,
        category: EventCategory.EXHIBITION,
        ticketCategories: {
          create: [
            { name: 'Adulte', description: 'Entrée adulte', price: 16, initialStock: 500, currentStock: 500 },
            { name: 'Réduit', description: 'Étudiants, demandeurs d\'emploi', price: 10, initialStock: 300, currentStock: 300 },
            { name: 'Enfant -12 ans', description: 'Gratuit pour les moins de 12 ans', price: 0, initialStock: 200, currentStock: 200 },
          ],
        },
      },
    }),
    prisma.event.create({
      data: {
        title: 'Soirée Jazz au Sunset',
        description:
          'Une nuit de jazz manouche et swing dans le cadre intimiste du Sunset. Three quartets, ambiance feutrée, cocktails artisanaux.',
        location: 'Le Sunset, Paris',
        address: '60 Rue des Lombards',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
        latitude: 48.8601,
        longitude: 2.3477,
        imageUrl:
          'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800',
        eventDate: new Date('2026-07-25T20:30:00'),
        endDate: new Date('2026-07-26T00:00:00'),
        organizerId: organizer.id,
        type: EventType.COMMUNITY,
        category: EventCategory.CONCERT,
        ticketCategories: {
          create: [
            { name: 'Entrée', description: 'Place debout au bar', price: 20, initialStock: 150, currentStock: 150 },
            { name: 'Table réservée', description: 'Table pour 2 personnes', price: 55, initialStock: 30, currentStock: 30 },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ ${events.length} événements créés`);

  console.log('\n🎉 Seed terminé avec succès !\n');
  console.log('Comptes de connexion :');
  console.log('  👑 Admin      : admin@eventnow.fr      / Admin1234!');
  console.log('  🎪 Organisateur: organizer@eventnow.fr / Organizer1234!');
  console.log('  👤 Utilisateur : user@eventnow.fr      / User1234!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
