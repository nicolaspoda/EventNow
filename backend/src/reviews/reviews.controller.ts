import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post('events/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT')
  async create(
    @Param('eventId') eventId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: any,
  ) {
    return this.reviewsService.create(eventId, user.id, dto);
  }

  @Get('events/:eventId')
  async findAllByEvent(
    @Param('eventId') eventId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sortBy', new DefaultValuePipe('recent'))
    sortBy: 'recent' | 'highest' | 'lowest',
  ) {
    return this.reviewsService.findAllByEvent(eventId, page, limit, sortBy);
  }

  @Get('events/:eventId/can-review')
  @UseGuards(JwtAuthGuard)
  async canUserReview(
    @Param('eventId') eventId: string,
    @CurrentUser() user: any,
  ) {
    if (user.role !== 'CLIENT') {
      return { canReview: false, reason: 'Seuls les clients peuvent laisser un avis' };
    }
    return this.reviewsService.canUserReview(eventId, user.id);
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT')
  async getMyReviews(@CurrentUser() user: any) {
    return this.reviewsService.findAllByUser(user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
    @CurrentUser() user: any,
  ) {
    return this.reviewsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reviewsService.delete(id, user.id);
  }
}
