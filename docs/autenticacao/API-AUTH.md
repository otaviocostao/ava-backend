# API de Autenticação

## POST /auth/login
Autentica um usuário pelo `email` e `password`.

Request:
```json
{
  "email": "ana.oliveira@ava.com",
  "password": "123456"
}
```

Response:
```json
{
  "access_token": "JWT...",
  "user": {
    "id": "uuid",
    "name": "Ana Oliveira",
    "email": "ana.oliveira@ava.com",
    "roles": ["student"]
  }
}
```

## GET /auth/me
Retorna dados do usuário autenticado (via `Authorization: Bearer <token>`).

Response:
```json
{
  "id": "uuid",
  "email": "ana.oliveira@ava.com",
  "roles": ["student"]
}
```


