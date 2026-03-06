import { IsUUID } from 'class-validator';

export class CreateParticipationRequestDto {
  @IsUUID()
  eventId: string;
}
