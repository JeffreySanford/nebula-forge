import { Controller, Get, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { Observable } from 'rxjs';
import { User } from './schemas/user.schema';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  getAllUsers(): Observable<User[]> {
    return this.userService.findAll();
  }

  @Post()
  createUser(@Body() body: { username: string; email?: string }): Observable<User> {
    return this.userService.create(body.username, body.email);
  }
}
