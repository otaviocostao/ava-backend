// Polyfill para garantir que crypto.randomUUID esteja disponível
// Este arquivo deve ser importado antes de qualquer outro módulo que use TypeORM

import { randomUUID } from 'crypto';

// Garantir que crypto.randomUUID esteja disponível globalmente
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = {
    randomUUID: randomUUID,
  };
}

// Também garantir no objeto global (para compatibilidade)
if (typeof (global as any).crypto === 'undefined') {
  (global as any).crypto = {
    randomUUID: randomUUID,
  };
}

