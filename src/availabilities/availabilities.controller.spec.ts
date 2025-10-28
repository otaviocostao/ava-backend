import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilitiesController } from './availabilities.controller';
import { AvailabilitiesService } from './availabilities.service';

const mockAvailabilitiesService = {
  create: jest.fn(dto => ({
    id: Date.now(),
    ...dto,
  })),
  findAll: jest.fn(() => {
    return [{ id: 1, day: 'Monday', startTime: '09:00', endTime: '17:00' }];
  }),
};

describe('AvailabilitiesController', () => {
  let controller: AvailabilitiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilitiesController],
      providers: [
        {
          provide: AvailabilitiesService, 
          useValue: mockAvailabilitiesService,
        },
      ],
    }).compile();

    controller = module.get<AvailabilitiesController>(AvailabilitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get an array of availabilities', async () => {
    const result = await controller.findAll(); 

    expect(result).toEqual([{ id: 1, day: 'Monday', startTime: '09:00', endTime: '17:00' }]);

    expect(mockAvailabilitiesService.findAll).toHaveBeenCalled();
  });
});
