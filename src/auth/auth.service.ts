import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const roles = (user.roles || []).map((r) => r.name);
    const payload = { sub: user.id, email: user.email, roles };
    const access_token = await this.jwtService.signAsync(payload);

    const { password: _p, ...safeUser } = user as any;
    return { access_token, user: { ...safeUser, roles } };
  }
}


