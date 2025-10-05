import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { CoursesModule } from './courses/courses.module';
import { DepartmentsModule } from './departments/departments.module';
import { DisciplinesModule } from './disciplines/disciplines.module';

@Module({
  imports: [UsersModule, RolesModule, CoursesModule, DepartmentsModule, DisciplinesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
