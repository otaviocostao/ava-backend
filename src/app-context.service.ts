import { Injectable } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';

@Injectable()
export class AppContextService {
  private app: INestApplication | null = null;

  setApp(app: INestApplication): void {
    this.app = app;
  }

  getApp(): INestApplication | null {
    return this.app;
  }
}

