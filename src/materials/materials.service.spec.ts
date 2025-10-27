import { Test, TestingModule } from '@nestjs/testing';
import { MaterialsService } from './materials.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Material } from './entities/material.entity';
import { User } from '../users/entities/user.entity';
import { Class } from '../classes/entities/class.entity';

describe('MaterialsService', () => {
  let service: MaterialsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialsService,
        {
          provide: getRepositoryToken(Material),
          useValue: {},
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Class),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MaterialsService>(MaterialsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
