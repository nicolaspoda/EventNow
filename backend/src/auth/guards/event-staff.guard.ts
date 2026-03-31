import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EventStaffGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('Authentification requise');
    }

    const eventId = this.extractEventId(request);

    if (!eventId) {
      throw new BadRequestException(
        "Impossible de déterminer l'événement concerné",
      );
    }

    const isStaff = await this.prisma.eventStaff.findUnique({
      where: {
        eventId_userId: { eventId, userId: user.id },
      },
    });

    if (!isStaff) {
      throw new ForbiddenException(
        'Accès réservé au personnel de cet événement',
      );
    }

    return true;
  }

  private extractEventId(request: any): string | null {
    return (
      request.params?.eventId ||
      request.params?.event_id ||
      request.query?.eventId ||
      request.query?.event_id ||
      request.body?.eventId ||
      request.body?.event_id ||
      null
    );
  }
}
