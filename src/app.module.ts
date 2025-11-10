import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppContextService } from './app-context.service';
import { StudentsModule } from './students/students.module';
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
import { LiveClassGateway } from './live-class/live-class.gateway';
import { LiveClassModule } from './live-class/live-class.module';
import { NoticeBoardModule } from './notice-board/notice-board.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const isSupabase = !!databaseUrl;

        console.log('\n🔍 Configuração do Banco de Dados:');
        if (isSupabase) {
          console.log('✅ Usando Supabase (DATABASE_URL configurada)');
          console.log('📍 Connection: PostgreSQL via URL');
          console.log('🔒 SSL: Habilitado (rejectUnauthorized: false)');
        } else {
          console.log('✅ Usando PostgreSQL Local');
          console.log(`📍 Host: ${configService.get<string>('DB_HOST', 'localhost')}`);
          console.log(`📍 Porta: ${configService.get<number>('DB_PORT', 5432)}`);
          console.log(`📍 Database: ${configService.get<string>('DB_DATABASE', 'ava_db')}`);
          console.log('🔒 SSL: Não necessário (conexão local)');
        }
        console.log('🔄 Sincronização: Habilitada (tabelas serão criadas automaticamente)\n');

        // Se DATABASE_URL estiver configurada, usa Supabase
        if (isSupabase) {
          return {
            type: 'postgres',
            url: databaseUrl,
            autoLoadEntities: true,
            synchronize: true,
            ssl: {
              rejectUnauthorized: false,
            },
          };
        }

        // Caso contrário, usa PostgreSQL local com variáveis separadas
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    UsersModule, RolesModule, CoursesModule, DepartmentsModule, DisciplinesModule, ClassesModule, EnrollmentsModule, VideoLessonsModule, AttendancesModule, PaymentsModule, GradesModule, NewsModule, ActivitiesModule, MaterialsModule, LessonPlansModule, AvailabilitiesModule, SchedulesModule, ForumsModule, ForumPostsModule, MessagesModule, LiveClassModule, NoticeBoardModule, StudentsModule, AuthModule
  ],
  controllers: [AppController],
  providers: [AppService, AppContextService, LiveClassGateway],
})
export class AppModule {}
