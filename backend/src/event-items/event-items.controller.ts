import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EventItemsService } from './event-items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

@Controller('events/:eventId/items')
@UseGuards(JwtAuthGuard)
export class EventItemsController {
  constructor(private readonly eventItemsService: EventItemsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getList(@Param('eventId') eventId: string, @CurrentUser() user: AuthUser) {
    return this.eventItemsService.getList(user.id, eventId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  addItem(
    @Param('eventId') eventId: string,
    @Body() dto: CreateItemDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.eventItemsService.addItem(user.id, eventId, dto);
  }

  @Patch(':itemId')
  @HttpCode(HttpStatus.OK)
  updateItem(
    @Param('eventId') eventId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItemDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.eventItemsService.updateItem(user.id, eventId, itemId, dto);
  }

  @Delete(':itemId')
  @HttpCode(HttpStatus.OK)
  deleteItem(
    @Param('eventId') eventId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.eventItemsService.deleteItem(user.id, eventId, itemId);
  }

  @Patch(':itemId/claim')
  @HttpCode(HttpStatus.OK)
  claimItem(
    @Param('eventId') eventId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.eventItemsService.claimItem(user.id, eventId, itemId);
  }
}
