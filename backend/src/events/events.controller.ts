import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { EventsService } from './events.service';
import {
  CreateEventDto,
  UpdateEventDto,
  GetEventsQueryDto,
  CancelEventDto,
} from './dto';
import { SearchEventsDto } from './dto/search-events.dto';
import { EventCategory } from './dto/create-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('events')
export class EventsController {
  private readonly eventsService: EventsService;

  constructor(eventsService: EventsService) {
    this.eventsService = eventsService;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'USER')
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthUser,
    @Body() createEventDto: CreateEventDto,
  ) {
    return this.eventsService.create(user.id, createEventDto, user.role);
  }

  @Get('search')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  searchEvents(
    @Query() searchDto: SearchEventsDto,
    @CurrentUser() user?: { id: string },
  ) {
    return this.eventsService.searchEvents(searchDto, user?.id);
  }

  @Get('suggestions')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  getSearchSuggestions(@Query('q') query: string) {
    return this.eventsService.getSearchSuggestions(query);
  }

  @Get('categories')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  getCategories() {
    return Object.values(EventCategory);
  }

  @Get('locations')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  getLocations() {
    return this.eventsService.getAvailableLocations();
  }

  @Get('cities')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  getCities() {
    return this.eventsService.getAvailableCities();
  }

  @Get()
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: GetEventsQueryDto) {
    return this.eventsService.findAll(query);
  }

  @Get(':id')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    return this.eventsService.findOne(id, user?.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'USER')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, user.id, updateEventDto);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'USER')
  @HttpCode(HttpStatus.OK)
  cancelEvent(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() cancelEventDto: CancelEventDto,
  ) {
    return this.eventsService.cancelEvent(user.id, id, cancelEventDto.reason);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'USER')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.eventsService.remove(id, user.id);
  }
}
