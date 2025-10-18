import { Module } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { MaterialsController } from './materials.controller';
import { Material } from './entities/material.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Class } from 'src/classes/entities/class.entity';

@Module({
  imports: [
      TypeOrmModule.forFeature([Material, User, Class]),
    ],
  controllers: [MaterialsController],
  providers: [MaterialsService],
})
export class MaterialsModule {}
