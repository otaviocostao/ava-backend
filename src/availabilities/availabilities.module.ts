import { Module } from '@nestjs/common';
import { AvailabilitiesService } from './availabilities.service';
import { AvailabilitiesController } from './availabilities.controller';
import { Availability } from './entities/availability.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
      TypeOrmModule.forFeature([Availability, User]),
    ],
  controllers: [AvailabilitiesController],
  providers: [AvailabilitiesService],
})
export class AvailabilitiesModule {}
