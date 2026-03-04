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
} from './dto';
import { SearchEventsDto } from './dto/search-events.dto';
import { EventCategory } from './dto/create-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
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
  @Roles('ORGANIZER', 'CLIENT')
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: any, @Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(user.id, createEventDto);
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

  @Get()
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: GetEventsQueryDto) {
    return this.eventsService.findAll(query);
  }

  @Get(':id')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'CLIENT')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, user.id, updateEventDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'CLIENT')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.eventsService.remove(id, user.id);
  }
}
