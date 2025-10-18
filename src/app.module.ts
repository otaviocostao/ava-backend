import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { CoursesModule } from './courses/courses.module';
import { DepartmentsModule } from './departments/departments.module';
import { DisciplinesModule } from './disciplines/disciplines.module';
import { ClassesModule } from './classes/classes.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { GradesModule } from './grades/grades.module';
import { NewsModule } from './news/news.module';
import { VideoLessonsModule } from './video-lessons/video-lessons.module';
import { AttendancesModule } from './attendances/attendances.module';
import { PaymentsModule } from './payments/payments.module';
import { ActivitiesModule } from './activities/activities.module';
import { MaterialsModule } from './materials/materials.module';
import { LessonPlansModule } from './lesson-plans/lesson-plans.module';
import { AvailabilitiesModule } from './availabilities/availabilities.module';
import { SchedulesModule } from './schedules/schedules.module';
import { ForumsModule } from './forums/forums.module';
import { ForumPostsModule } from './forum-posts/forum-posts.module';
import { MessagesModule } from './messages/messages.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        
        autoLoadEntities: true,
        
        synchronize: true,
      }),
    }),
    UsersModule, RolesModule, CoursesModule, DepartmentsModule, DisciplinesModule, ClassesModule, EnrollmentsModule, VideoLessonsModule, AttendancesModule, PaymentsModule, GradesModule, NewsModule, ActivitiesModule, MaterialsModule, LessonPlansModule, AvailabilitiesModule, SchedulesModule, ForumsModule, ForumPostsModule, MessagesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
