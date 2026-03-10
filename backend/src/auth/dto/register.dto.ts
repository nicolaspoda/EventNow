import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom d’utilisateur est obligatoire' })
  @MinLength(3, { message: 'Le nom d’utilisateur doit contenir au moins 3 caractères' })
  @MaxLength(30, { message: 'Le nom d’utilisateur ne peut pas dépasser 30 caractères' })
  @Matches(USERNAME_REGEX, {
    message: 'Le nom d’utilisateur ne peut contenir que des lettres, chiffres et underscores',
  })
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
