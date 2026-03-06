import { IsIn } from 'class-validator';

export class RespondToParticipationRequestDto {
  @IsIn(['ACCEPT', 'REFUSE'])
  action: 'ACCEPT' | 'REFUSE';
}
