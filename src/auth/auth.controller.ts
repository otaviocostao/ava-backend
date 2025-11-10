import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ 
    summary: 'Autentica um usuário e retorna um token JWT',
    description: 'Valida as credenciais (email e senha) do usuário. Se válidas, retorna um token JWT e os dados do usuário autenticado.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login realizado com sucesso. Retorna o token JWT e dados do usuário.',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid-do-usuario',
          name: 'Nome do Usuário',
          email: 'usuario@email.com',
          roles: ['student']
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Credenciais inválidas (email ou senha incorretos).'
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Obtém os dados do usuário autenticado',
    description: 'Retorna os dados do usuário atualmente autenticado com base no token JWT enviado no header Authorization. Útil para verificar a sessão do usuário e obter informações atualizadas sobre seu perfil e permissões.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dados do usuário autenticado retornados com sucesso.',
    schema: {
      example: {
        id: 'uuid-do-usuario',
        email: 'usuario@email.com',
        roles: ['student']
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token JWT inválido ou expirado. É necessário fazer login novamente.'
  })
  me(@Req() req: any) {
    return req.user;
  }
}


