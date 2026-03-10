import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: "Le nom d'utilisateur est obligatoire" })
  @MinLength(3, { message: "Le nom d'utilisateur doit contenir au moins 3 caracteres" })
  @MaxLength(30, { message: "Le nom d'utilisateur ne peut pas depasser 30 caracteres" })
  @Matches(USERNAME_REGEX, {
    message: "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores",
  })
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export class RegisterOrganizerDto {
  @IsString()
  @IsNotEmpty({ message: "Le nom d'utilisateur est obligatoire" })
  @MinLength(3, { message: "Le nom d'utilisateur doit contenir au moins 3 caracteres" })
  @MaxLength(30, { message: "Le nom d'utilisateur ne peut pas depasser 30 caracteres" })
  @Matches(USERNAME_REGEX, {
    message: "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores",
  })
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  organizationName?: string;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsNotEmpty({ message: "Vous devez confirmer etre un organisateur d'evenement" })
  confirmOrganizer: boolean;
}
