import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MuralsService } from './murals.service';
import { MuralsController } from './murals.controller';
import { Mural } from './entities/mural.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Mural])],
  controllers: [MuralsController],
  providers: [MuralsService],
  exports: [MuralsService],
})
export class MuralsModule {}

