import { Test, TestingModule } from '@nestjs/testing';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { Class } from './entities/class.entity';

const mockClassesService: jest.Mocked<ClassesService> = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ClassesController', () => {
  let controller: ClassesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassesController],
      providers: [
        {
          provide: ClassesService,
          useValue: mockClassesService,
        },
      ],
    }).compile();

    controller = module.get<ClassesController>(ClassesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a class using the service', async () => {
    const dto: CreateClassDto = {
      code: 'CLS001',
      semester: '2025-1',
      year: 2025,
      disciplineId: 'discipline-id',
      teacherId: 'teacher-id',
    };
    const createdClass = {
      id: 'class-id',
      ...dto,
    } as unknown as Class;

    mockClassesService.create.mockResolvedValue(createdClass);

    const result = await controller.create(dto);

    expect(mockClassesService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(createdClass);
  });

  it('should return all classes from the service', async () => {
    const classes = [
      { id: 'class-1', code: 'CLS001', semester: '2025-1', year: 2025 },
      { id: 'class-2', code: 'CLS002', semester: '2025-2', year: 2025 },
    ] as unknown as Class[];

    mockClassesService.findAll.mockResolvedValue(classes);

    const result = await controller.findAll();

    expect(mockClassesService.findAll).toHaveBeenCalled();
    expect(result).toEqual(classes);
  });

  it('should return a single class from the service', async () => {
    const id = 'class-id';
    const classEntity = {
      id,
      code: 'CLS001',
      semester: '2025-1',
      year: 2025,
    } as unknown as Class;

    mockClassesService.findOne.mockResolvedValue(classEntity);

    const result = await controller.findOne(id);

    expect(mockClassesService.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(classEntity);
  });

  it('should update a class using the service', async () => {
    const id = 'class-id';
    const dto: UpdateClassDto = {
      semester: '2025-2',
    };
    const updatedClass = {
      id,
      code: 'CLS001',
      semester: '2025-2',
      year: 2025,
    } as unknown as Class;

    mockClassesService.update.mockResolvedValue(updatedClass);

    const result = await controller.update(id, dto);

    expect(mockClassesService.update).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(updatedClass);
  });

  it('should remove a class using the service', async () => {
    const id = 'class-id';
    mockClassesService.remove.mockResolvedValue(undefined);

    await expect(controller.remove(id)).resolves.toBeUndefined();
    expect(mockClassesService.remove).toHaveBeenCalledWith(id);
  });
});
