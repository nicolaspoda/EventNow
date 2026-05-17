import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { BookingsModule } from './bookings/bookings.module';
import { OrdersModule } from './orders/orders.module';
import { TicketsModule } from './tickets/tickets.module';
import { PaymentModule } from './payment/payment.module';
import { LoggerModule } from './logger/logger.module';
import { SecurityModule } from './security/security.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UploadModule } from './upload/upload.module';
import { MailModule } from './mail/mail.module';
import { JobsModule } from './jobs/jobs.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ParticipationRequestsModule } from './participation-requests/participation-requests.module';
import { ParticipantReviewsModule } from './participant-reviews/participant-reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FollowsModule } from './follows/follows.module';
import { MessagesModule } from './messages/messages.module';
import { StaffInvitationsModule } from './staff-invitations/staff-invitations.module';
import { PromoCodesModule } from './promo-codes/promo-codes.module';
import { ReportsModule } from './reports/reports.module';
import { EventItemsModule } from './event-items/event-items.module';
import { PollsModule } from './polls/polls.module';
import { SanitizeInterceptor } from './common/interceptors/sanitize.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ThrottlerOverrideGuard } from './common/guards/throttler-override.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 1000,
      },
      {
        name: 'payment',
        ttl: 60000,
        limit: 50,
      },
    ]),
    LoggerModule,
    SecurityModule,
    PrismaModule,
    RedisModule,
    AuthModule,
    EventsModule,
    BookingsModule,
    OrdersModule,
    TicketsModule,
    PaymentModule,
    DashboardModule,
    UploadModule,
    MailModule,
    JobsModule,
    ReviewsModule,
    ParticipationRequestsModule,
    ParticipantReviewsModule,
    NotificationsModule,
    FollowsModule,
    MessagesModule,
    StaffInvitationsModule,
    PromoCodesModule,
    ReportsModule,
    EventItemsModule,
    PollsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerOverrideGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SanitizeInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
