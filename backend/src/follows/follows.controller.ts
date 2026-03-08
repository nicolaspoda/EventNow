import {
  Controller,
  Post,
  Delete,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('follows')
@UseGuards(JwtAuthGuard)
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post('user/:userId')
  @HttpCode(HttpStatus.OK)
  async follow(
    @CurrentUser() user: { id: string },
    @Param('userId') followingId: string,
  ) {
    return this.followsService.follow(user.id, followingId);
  }

  @Delete('user/:userId')
  @HttpCode(HttpStatus.OK)
  async unfollow(
    @CurrentUser() user: { id: string },
    @Param('userId') followingId: string,
  ) {
    return this.followsService.unfollow(user.id, followingId);
  }

  @Patch('user/:userId/notifications')
  @HttpCode(HttpStatus.OK)
  async setNotifications(
    @CurrentUser() user: { id: string },
    @Param('userId') followingId: string,
    @Body() body: { enabled: boolean },
  ) {
    return this.followsService.setNotificationsEnabled(user.id, followingId, body.enabled === true);
  }

  @Get('user/:userId/check')
  async isFollowing(
    @CurrentUser() user: { id: string },
    @Param('userId') followingId: string,
  ) {
    const following = await this.followsService.isFollowing(user.id, followingId);
    return { following };
  }

  @Get('user/:userId/followers')
  async getFollowers(
    @Param('userId') userId: string,
    @CurrentUser() user?: { id: string },
  ) {
    return this.followsService.getFollowers(userId, 50, user?.id);
  }

  @Get('user/:userId/following')
  async getFollowing(
    @Param('userId') userId: string,
    @CurrentUser() user?: { id: string },
  ) {
    return this.followsService.getFollowing(userId, 50, user?.id);
  }

  @Get('user/:userId/friends')
  async getFriends(
    @Param('userId') userId: string,
    @CurrentUser() user?: { id: string },
  ) {
    return this.followsService.getFriends(userId, 50, user?.id);
  }
}
