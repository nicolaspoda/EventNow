import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateParticipationRequestDto {
  @IsUUID()
  eventId: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
