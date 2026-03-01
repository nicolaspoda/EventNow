import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Dashboard (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let organizerToken: string;
  let clientToken: string;
  let organizerId: string;
  let clientId: string;
  let eventId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api/v1');

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    await prisma.user.deleteMany();
    await prisma.event.deleteMany();

    const organizerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'organizer@test.com',
        password: 'Test1234!',
        firstName: 'Organizer',
        lastName: 'Test',
        role: 'ORGANIZER',
      });

    organizerToken = organizerRes.body.access_token;
    organizerId = organizerRes.body.user.id;

    const clientRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'client@test.com',
        password: 'Test1234!',
        firstName: 'Client',
        lastName: 'Test',
        role: 'CLIENT',
      });

    clientToken = clientRes.body.access_token;
    clientId = clientRes.body.user.id;

    const eventRes = await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Test Event',
        description: 'Test Description',
        location: 'Test Location',
        event_date: '2026-12-31T20:00:00Z',
        type: 'PROFESSIONAL',
        ticket_categories: [
          {
            name: 'Standard',
            price: 50,
            initial_stock: 100,
          },
        ],
      });

    eventId = eventRes.body.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.event.deleteMany();
    await app.close();
  });

  describe('Organizer Dashboard', () => {
    it('/api/v1/dashboard/organizer/overview (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/dashboard/organizer/overview')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalEvents');
          expect(res.body).toHaveProperty('upcomingEvents');
          expect(res.body).toHaveProperty('totalRevenue');
          expect(res.body).toHaveProperty('totalTicketsSold');
          expect(res.body.totalEvents).toBeGreaterThanOrEqual(1);
        });
    });

    it('/api/v1/dashboard/organizer/events (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/dashboard/organizer/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('stats');
            expect(res.body[0].stats).toHaveProperty('fillRate');
            expect(res.body[0].stats).toHaveProperty('status');
          }
        });
    });

    it('/api/v1/dashboard/organizer/events/:id/stats (GET)', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/dashboard/organizer/events/${eventId}/stats`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('event');
          expect(res.body).toHaveProperty('categoriesStats');
          expect(res.body).toHaveProperty('totalRevenue');
          expect(res.body).toHaveProperty('totalSold');
        });
    });

    it('should return 403 when client tries to access organizer dashboard', () => {
      return request(app.getHttpServer())
        .get('/api/v1/dashboard/organizer/overview')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });

  describe('Client Dashboard', () => {
    it('/api/v1/dashboard/client/overview (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/dashboard/client/overview')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalEvents');
          expect(res.body).toHaveProperty('upcomingEvents');
          expect(res.body).toHaveProperty('totalParticipants');
          expect(res.body).toHaveProperty('averageParticipants');
        });
    });

    it('/api/v1/dashboard/client/events (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/dashboard/client/events')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should return 403 when organizer tries to access client dashboard', () => {
      return request(app.getHttpServer())
        .get('/api/v1/dashboard/client/overview')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(403);
    });
  });

  describe('Security', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/dashboard/organizer/overview')
        .expect(401);
    });

    it('should return 403 when accessing other user events', async () => {
      const otherOrganizerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'other@test.com',
          password: 'Test1234!',
          firstName: 'Other',
          lastName: 'Organizer',
          role: 'ORGANIZER',
        });

      const otherToken = otherOrganizerRes.body.access_token;

      return request(app.getHttpServer())
        .get(`/api/v1/dashboard/organizer/events/${eventId}/stats`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });
});
