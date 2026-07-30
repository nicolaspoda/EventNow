import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { SearchEventsDto, SortBy, PriceRange } from './search-events.dto';
import { EventType, EventCategory } from './create-event.dto';

describe('SearchEventsDto', () => {
  it('should validate with no fields set (all optional)', async () => {
    const dto = plainToClass(SearchEventsDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate a fully populated query', async () => {
    const plain = {
      query: 'jazz',
      type: EventType.COMMUNITY,
      categories: 'CONCERT,FESTIVAL',
      location: 'Lyon',
      city: 'Lyon',
      radius: '15',
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
      priceRanges: 'FREE,LOW',
      availableOnly: 'true',
      myEvents: 'false',
      followedOnly: 'true',
      friendsOnly: 'false',
      sortBy: SortBy.DATE_ASC,
      latitude: '48.85',
      longitude: '2.35',
      radiusKm: '10',
      page: '2',
      limit: '50',
    };
    const dto = plainToClass(SearchEventsDto, plain);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.categories).toEqual([EventCategory.CONCERT, EventCategory.FESTIVAL]);
    expect(dto.priceRanges).toEqual([PriceRange.FREE, PriceRange.LOW]);
    expect(dto.availableOnly).toBe(true);
    expect(dto.myEvents).toBe(false);
    expect(dto.followedOnly).toBe(true);
    expect(dto.friendsOnly).toBe(false);
    expect(dto.radius).toBe(15);
    expect(dto.latitude).toBe(48.85);
    expect(dto.longitude).toBe(2.35);
    expect(dto.radiusKm).toBe(10);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(50);
  });

  it('should reject an invalid type', async () => {
    const dto = plainToClass(SearchEventsDto, { type: 'NOT_A_TYPE' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('type');
  });

  it('should accept categories already provided as an array', async () => {
    const dto = plainToClass(SearchEventsDto, {
      categories: [EventCategory.SPORT],
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.categories).toEqual([EventCategory.SPORT]);
  });

  it('should reject an invalid category value', async () => {
    const dto = plainToClass(SearchEventsDto, { categories: 'NOT_A_CATEGORY' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('categories');
  });

  it('should reject an invalid price range value', async () => {
    const dto = plainToClass(SearchEventsDto, { priceRanges: 'NOT_A_RANGE' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('priceRanges');
  });

  it('should accept priceRanges already provided as an array', async () => {
    const dto = plainToClass(SearchEventsDto, {
      priceRanges: [PriceRange.HIGH],
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.priceRanges).toEqual([PriceRange.HIGH]);
  });

  describe.each(['availableOnly', 'myEvents', 'followedOnly', 'friendsOnly'] as const)(
    '%s boolean transform',
    (field) => {
      it('transforms "true" to true', async () => {
        const dto = plainToClass(SearchEventsDto, { [field]: 'true' });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
        expect(dto[field]).toBe(true);
      });

      it('transforms "false" to false', async () => {
        const dto = plainToClass(SearchEventsDto, { [field]: 'false' });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
        expect(dto[field]).toBe(false);
      });

      it('transforms an empty string to undefined', async () => {
        const dto = plainToClass(SearchEventsDto, { [field]: '' });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
        expect(dto[field]).toBeUndefined();
      });

      it('rejects a non-boolean-like value', async () => {
        const dto = plainToClass(SearchEventsDto, { [field]: 'maybe' });
        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe(field);
      });
    },
  );

  describe('page transform', () => {
    it('keeps a valid page number, floored', async () => {
      const dto = plainToClass(SearchEventsDto, { page: '3.9' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(3);
    });

    it('transforms an empty string to undefined', async () => {
      const dto = plainToClass(SearchEventsDto, { page: '' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.page).toBeUndefined();
    });

    it('transforms a non-numeric value to undefined', async () => {
      const dto = plainToClass(SearchEventsDto, { page: 'abc' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.page).toBeUndefined();
    });

    it('transforms a value below 1 to undefined', async () => {
      const dto = plainToClass(SearchEventsDto, { page: '0' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.page).toBeUndefined();
    });
  });

  describe('limit transform', () => {
    it('keeps a valid limit, floored', async () => {
      const dto = plainToClass(SearchEventsDto, { limit: '25.5' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.limit).toBe(25);
    });

    it('caps the limit at 100', async () => {
      const dto = plainToClass(SearchEventsDto, { limit: '500' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.limit).toBe(100);
    });

    it('transforms an empty string to undefined', async () => {
      const dto = plainToClass(SearchEventsDto, { limit: '' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.limit).toBeUndefined();
    });

    it('transforms a non-numeric value to undefined', async () => {
      const dto = plainToClass(SearchEventsDto, { limit: 'xyz' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.limit).toBeUndefined();
    });

    it('transforms a value below 1 to undefined', async () => {
      const dto = plainToClass(SearchEventsDto, { limit: '-5' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.limit).toBeUndefined();
    });
  });

  it('should reject an invalid sortBy', async () => {
    const dto = plainToClass(SearchEventsDto, { sortBy: 'RANDOM' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('sortBy');
  });

  it('should reject a non-numeric radius', async () => {
    const dto = plainToClass(SearchEventsDto, { radius: 'far' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('radius');
  });
});
