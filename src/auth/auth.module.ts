import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtStrategy } from './jwt.strategy';
import type { SignOptions } from 'jsonwebtoken';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const expiresInConfig = cfg.get<string>('JWT_EXPIRES_IN');
        return {
          secret: cfg.get<string>('JWT_SECRET') || 'default-secret-change-in-production',
          signOptions: {
            expiresIn: expiresInConfig || '1d',
          } as SignOptions,
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}


