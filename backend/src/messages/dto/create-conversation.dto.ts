import { IsString, IsOptional, IsArray, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
  EVENT = 'EVENT',
}

export class CreateConversationDto {
  @ApiProperty({
    description: 'Type de conversation',
    enum: ConversationType,
  })
  @IsEnum(ConversationType)
  type: ConversationType;

  @ApiPropertyOptional({
    description: 'Nom de la conversation (requis pour les groupes)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: "URL de l'image de la conversation",
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    description: 'IDs des membres à ajouter',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds: string[];

  @ApiPropertyOptional({
    description: "ID de l'événement (pour les conversations d'événement)",
  })
  @IsOptional()
  @IsUUID('4')
  eventId?: string;
}
