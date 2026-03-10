import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Organizer123!', 10);

  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@eventnow.fr' },
    update: {},
    create: {
      username: 'organizer_eventnow',
      email: 'organizer@eventnow.fr',
      passwordHash: hash,
      role: 'ORGANIZER',
    },
  });

  const client = await prisma.user.upsert({
    where: { email: 'client@eventnow.fr' },
    update: {},
    create: {
      username: 'client_eventnow',
      email: 'client@eventnow.fr',
      passwordHash: hash,
      role: 'CLIENT',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@eventnow.fr' },
    update: {},
    create: {
      username: 'staff_eventnow',
      email: 'staff@eventnow.fr',
      passwordHash: hash,
      role: 'STAFF',
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
    update: {
      address: '211 Avenue Jean Jaurès, 75019 Paris',
      city: 'Paris',
      postalCode: '75019',
      country: 'France',
      latitude: 48.891885,
      longitude: 2.393354,
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Concert Jazz Festival',
      description: 'Soirée jazz exceptionnelle avec des artistes internationaux. Ambiance lounge et terrasse.',
      location: 'Zénith Paris',
      address: '211 Avenue Jean Jaurès, 75019 Paris',
      city: 'Paris',
      postalCode: '75019',
      country: 'France',
      latitude: 48.891885,
      longitude: 2.393354,
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
    update: {
      address: 'Domaine National de Saint-Cloud, 92210 Saint-Cloud',
      city: 'Saint-Cloud',
      postalCode: '92210',
      country: 'France',
      latitude: 48.841667,
      longitude: 2.108611,
    },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      title: 'Festival Rock en Seine',
      description: 'Trois jours de rock et musiques actuelles. Camping sur place.',
      location: 'Domaine national de Saint-Cloud',
      address: 'Domaine National de Saint-Cloud, 92210 Saint-Cloud',
      city: 'Saint-Cloud',
      postalCode: '92210',
      country: 'France',
      latitude: 48.841667,
      longitude: 2.108611,
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
    update: {
      address: '5 Parvis Alan Turing, 75013 Paris',
      city: 'Paris',
      postalCode: '75013',
      country: 'France',
      latitude: 48.832370,
      longitude: 2.377250,
    },
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      title: 'Conférence Tech & Innovation',
      description: 'Keynotes et ateliers sur l\'IA, le cloud et les tendances 2026.',
      location: 'Station F, Paris',
      address: '5 Parvis Alan Turing, 75013 Paris',
      city: 'Paris',
      postalCode: '75013',
      country: 'France',
      latitude: 48.832370,
      longitude: 2.377250,
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
    update: {
      address: '211 Avenue Jean Jaurès, 75019 Paris',
      city: 'Paris',
      postalCode: '75019',
      country: 'France',
      latitude: 48.893611,
      longitude: 2.390278,
    },
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      title: 'Soirée Electro Under the Stars',
      description: 'DJ set en plein air. Bar et food trucks.',
      location: 'Parc de la Villette, Paris',
      address: '211 Avenue Jean Jaurès, 75019 Paris',
      city: 'Paris',
      postalCode: '75019',
      country: 'France',
      latitude: 48.893611,
      longitude: 2.390278,
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

  await prisma.event.create({
    data: {
      title: 'Concert Jazz à Toulouse',
      description: 'Soirée jazz au Zénith de Toulouse.',
      location: 'Zénith Toulouse',
      address: 'Avenue Raymond Badiou, 31100 Toulouse',
      city: 'Toulouse',
      postalCode: '31000',
      country: 'France',
      latitude: 43.604652,
      longitude: 1.444209,
      eventDate: futureDate(21),
      organizerId: organizer.id,
      ticketCategories: {
        create: [
          { name: 'Standard', price: 35, initialStock: 800, currentStock: 800 },
          { name: 'VIP', price: 80, initialStock: 100, currentStock: 100 },
        ],
      },
    },
  });

  await prisma.event.create({
    data: {
      title: 'Festival Les Nuits de Fourvière',
      description: 'Concert en plein air au théâtre antique.',
      location: 'Théâtre antique de Fourvière',
      address: '6 Rue de l\'Antiquaille, 69005 Lyon',
      city: 'Lyon',
      postalCode: '69005',
      country: 'France',
      latitude: 45.759723,
      longitude: 4.819107,
      eventDate: futureDate(50),
      organizerId: organizer.id,
      ticketCategories: {
        create: [
          { name: 'Pelouse', price: 45, initialStock: 2000, currentStock: 2000 },
          { name: 'Assis', price: 65, initialStock: 1500, currentStock: 1500 },
        ],
      },
    },
  });

  await prisma.event.create({
    data: {
      title: 'Match de Ligue 1',
      description: 'Rencontre de football au stade Vélodrome.',
      location: 'Stade Vélodrome',
      address: '3 Boulevard Michelet, 13008 Marseille',
      city: 'Marseille',
      postalCode: '13008',
      country: 'France',
      latitude: 43.269644,
      longitude: 5.395900,
      eventDate: futureDate(18),
      organizerId: organizer.id,
      ticketCategories: {
        create: [
          { name: 'Tribune', price: 40, initialStock: 3000, currentStock: 3000 },
          { name: 'Virage', price: 25, initialStock: 5000, currentStock: 5000 },
        ],
      },
    },
  });

  await prisma.event.create({
    data: {
      title: 'Salon du Vin',
      description: 'Dégustations et rencontres avec les vignerons.',
      location: 'Parc des Expositions Bordeaux',
      address: 'Cours Jules Ladoumegue, 33300 Bordeaux',
      city: 'Bordeaux',
      postalCode: '33300',
      country: 'France',
      latitude: 44.837789,
      longitude: -0.579180,
      eventDate: futureDate(35),
      organizerId: organizer.id,
      ticketCategories: {
        create: [
          { name: 'Entrée', price: 15, initialStock: 2000, currentStock: 2000 },
          { name: 'Dégustation premium', price: 45, initialStock: 300, currentStock: 300 },
        ],
      },
    },
  });

  await prisma.event.create({
    data: {
      title: 'Braderie de Lille',
      description: 'Grande braderie annuelle, brocante et ambiance festive.',
      location: 'Centre-ville Lille',
      address: 'Place de la République, 59000 Lille',
      city: 'Lille',
      postalCode: '59000',
      country: 'France',
      latitude: 50.629246,
      longitude: 3.057256,
      eventDate: futureDate(90),
      organizerId: organizer.id,
      ticketCategories: {
        create: [
          { name: 'Accès libre', price: 0, initialStock: 10000, currentStock: 10000 },
        ],
      },
    },
  });

  await prisma.event.create({
    data: {
      title: 'Concert aux Nefs',
      description: 'Concert acoustique dans un lieu unique.',
      location: 'Les Nefs, Nantes',
      address: 'Parc des Chantiers, 44400 Rezé',
      city: 'Nantes',
      postalCode: '44000',
      country: 'France',
      latitude: 47.218371,
      longitude: -1.553621,
      eventDate: futureDate(42),
      organizerId: organizer.id,
      ticketCategories: {
        create: [
          { name: 'Standard', price: 28, initialStock: 600, currentStock: 600 },
        ],
      },
    },
  });

  await prisma.event.create({
    data: {
      title: 'Expo Street Art Nice',
      description: 'Exposition en plein air sur la promenade.',
      location: 'Promenade des Anglais',
      address: 'Promenade des Anglais, 06000 Nice',
      city: 'Nice',
      postalCode: '06000',
      country: 'France',
      latitude: 43.695898,
      longitude: 7.264953,
      eventDate: futureDate(25),
      organizerId: organizer.id,
      ticketCategories: {
        create: [
          { name: 'Visite libre', price: 0, initialStock: 5000, currentStock: 5000 },
        ],
      },
    },
  });

  console.log('Seed OK: 1 organisateur, 1 client, 1 staff, 11 événements (Paris, Toulouse, Lyon, Marseille, Bordeaux, Lille, Nantes, Nice) créés.');
  console.log('Compte organisateur: organizer@eventnow.fr / Organizer123!');
  console.log('Compte client: client@eventnow.fr / Organizer123!');
  console.log('Compte staff: staff@eventnow.fr / Organizer123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
