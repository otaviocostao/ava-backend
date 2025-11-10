# Autenticação (Backend) — Plano de Implementação

## Objetivo
Disponibilizar autenticação via JWT com endpoints `POST /auth/login` e `GET /auth/me`, usando senhas com hash e retornando dados do usuário (incluindo roles). Incluir a role `coordinator`.

## Decisões
- JWT com expiração padrão `1d` (configurável por `JWT_EXPIRES_IN`).
- Segredo em `JWT_SECRET`.
- Biblioteca: `@nestjs/jwt` (+ `passport-jwt` via strategy).
- `UsersService` exposto para ser consumido pelo `AuthService`.
- Role adicional: `coordinator`.

## Tarefas
- [x] Documento de planejamento criado (este arquivo).
- [x] Adicionar dependências: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`.
- [x] Criar `AuthModule` com `AuthService`, `AuthController`, `JwtStrategy` e `JwtAuthGuard`.
- [x] Adicionar método `findByEmailWithPassword(email)` no `UsersService`.
- [x] Exportar `UsersService` pelo `UsersModule`.
- [x] Alterar `init.ts` e `seed.ts` para salvar senhas com `bcrypt.hash`.
- [x] Incluir role `coordinator` em `init.ts` (roles iniciais).
- [x] Importar `AuthModule` no `AppModule`.

## Variáveis de ambiente
- `JWT_SECRET=uma_chave_segura`
- `JWT_EXPIRES_IN=1d`

## Contratos
Ver `docs/autenticacao/API-AUTH.md`.


