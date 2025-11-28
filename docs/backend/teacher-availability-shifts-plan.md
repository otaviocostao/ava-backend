# Plano: Turnos Específicos por Dia da Semana

## Objetivo
Permitir que professores disponibilizem turnos específicos por dia da semana (ex: "tarde na terça" e "noite na quinta"), em vez de apenas marcar turnos gerais.

## Estrutura Proposta

### 1. Criar Enum ShiftType
```typescript
export enum ShiftType {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
}
```

### 2. Criar Entidade TeacherSemesterAvailabilityShift
- Relacionamento ManyToOne com TeacherSemesterAvailability
- Constraint única: availability + dayOfWeek + shift

### 3. Modificar TeacherSemesterAvailability
- Remover: `morning`, `afternoon`, `evening`, `weekdays`
- Adicionar: relação OneToMany com `shifts`

### 4. Atualizar DTOs
- Remover campos antigos
- Adicionar: `shifts: Array<{ dayOfWeek: DayOfWeek; shift: ShiftType }>`

### 5. Atualizar Service
- Validar pelo menos um shift
- Salvar shifts como entidades relacionadas
- Carregar shifts nas queries

### 6. Atualizar Resumo
- Agrupar shifts por professor e dia

## Estrutura de Dados

**Request:**
```typescript
{
  teacherId: string;
  academicPeriodId: string;
  shifts: [
    { dayOfWeek: 'terca-feira', shift: 'afternoon' },
    { dayOfWeek: 'quinta-feira', shift: 'evening' }
  ];
  disciplineIds?: string[];
  observations?: string;
}
```
