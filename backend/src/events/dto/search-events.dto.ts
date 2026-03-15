import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { EventType, EventCategory } from './create-event.dto';

export enum SortBy {
  RELEVANCE = 'RELEVANCE',
  DATE_ASC = 'DATE_ASC',
  DATE_DESC = 'DATE_DESC',
  PRICE_ASC = 'PRICE_ASC',
  PRICE_DESC = 'PRICE_DESC',
  POPULARITY = 'POPULARITY',
  DISTANCE_ASC = 'DISTANCE_ASC',
}

export enum PriceRange {
  FREE = 'FREE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  PREMIUM = 'PREMIUM',
}

export class SearchEventsDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').filter(Boolean);
    }
    return value;
  })
  @IsArray()
  @IsEnum(EventCategory, { each: true })
  categories?: EventCategory[];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radius?: number;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').filter(Boolean);
    }
    return value;
  })
  @IsArray()
  @IsEnum(PriceRange, { each: true })
  priceRanges?: PriceRange[];

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === '' || value === undefined) return undefined;
    return value;
  })
  @IsBoolean()
  availableOnly?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === '' || value === undefined) return undefined;
    return value;
  })
  @IsBoolean()
  myEvents?: boolean;

  /** Uniquement les événements dont l'organisateur est suivi par l'utilisateur connecté. */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === '' || value === undefined) return undefined;
    return value;
  })
  @IsBoolean()
  followedOnly?: boolean;

  /** Uniquement les événements dont l'organisateur est ami avec l'utilisateur connecté (follow mutuel). */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === '' || value === undefined) return undefined;
    return value;
  })
  @IsBoolean()
  friendsOnly?: boolean;

  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  /** Rayon en km pour filtrer les événements "près de moi" (avec latitude/longitude). */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radiusKm?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) return undefined;
    const n = Number(value);
    return Number.isNaN(n) || n < 1 ? undefined : Math.floor(n);
  })
  @IsNumber()
  page?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) return undefined;
    const n = Number(value);
    return Number.isNaN(n) || n < 1 ? undefined : Math.min(100, Math.floor(n));
  })
  @IsNumber()
  limit?: number;
}
