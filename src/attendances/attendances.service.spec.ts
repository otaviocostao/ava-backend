import { Test, TestingModule } from '@nestjs/testing';
import { AttendancesService } from './attendances.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';

describe('AttendancesService', () => {
  let service: AttendancesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendancesService,
        {
          provide: getRepositoryToken(Attendance),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Enrollment),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AttendancesService>(AttendancesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
