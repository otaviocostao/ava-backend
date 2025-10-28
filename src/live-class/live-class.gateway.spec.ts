import { Test, TestingModule } from '@nestjs/testing';
import { LiveClassGateway } from './live-class.gateway';

describe('LiveClassGateway', () => {
  let gateway: LiveClassGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LiveClassGateway],
    }).compile();

    gateway = module.get<LiveClassGateway>(LiveClassGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
