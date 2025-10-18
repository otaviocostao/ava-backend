import { Module } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { Class } from './entities/class.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Discipline } from 'src/disciplines/entities/discipline.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
      TypeOrmModule.forFeature([Class, Discipline, User]),
    ],
  controllers: [ClassesController],
  providers: [ClassesService],
})
export class ClassesModule {}
