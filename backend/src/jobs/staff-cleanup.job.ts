import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TicketsService } from '../tickets/tickets.service';

/**
 * Job planifié qui supprime les affectations staff pour les événements terminés.
 * Le nettoyage est aussi exécuté à la volée dans getStaffEvents pour que le menu
 * staff disparaisse immédiatement après la fin d'un événement.
 */
@Injectable()
export class StaffCleanupJob {
  private readonly logger = new Logger(StaffCleanupJob.name);

  constructor(private readonly ticketsService: TicketsService) {}

  @Cron('0 2 * * *')
  async removeStaffForEndedEvents() {
    this.logger.log('Nettoyage du staff des événements terminés...');
    await this.ticketsService.removeStaffForEndedEvents();
    this.logger.log('Nettoyage terminé.');
  }
}
