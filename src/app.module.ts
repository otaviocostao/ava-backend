import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { CoursesModule } from './courses/courses.module';
import { DepartmentsModule } from './departments/departments.module';
import { DisciplinesModule } from './disciplines/disciplines.module';
import { ClassesModule } from './classes/classes.module';

@Module({
  imports: [UsersModule, RolesModule, CoursesModule, DepartmentsModule, DisciplinesModule, ClassesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
