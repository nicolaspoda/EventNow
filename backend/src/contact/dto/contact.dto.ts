import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ContactDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  name: string;

  @IsEmail({}, { message: 'Adresse email invalide' })
  @IsNotEmpty({ message: "L'email est obligatoire" })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Le sujet est obligatoire' })
  @MinLength(3, { message: 'Le sujet doit contenir au moins 3 caractères' })
  @MaxLength(150, { message: 'Le sujet ne peut pas dépasser 150 caractères' })
  subject: string;

  @IsString()
  @IsNotEmpty({ message: 'Le message est obligatoire' })
  @MinLength(10, { message: 'Le message doit contenir au moins 10 caractères' })
  @MaxLength(2000, {
    message: 'Le message ne peut pas dépasser 2000 caractères',
  })
  message: string;
}
