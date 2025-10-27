import { Module } from '@nestjs/common';
import { LiveClassGateway } from './live-class.gateway';

@Module({
  providers: [LiveClassGateway],
})
export class LiveClassModule {}