# Resumo: Alterações Necessárias no Frontend

## Mudança Principal: Turnos por Dia da Semana

**ANTES**: Turnos gerais (Manhã/Tarde/Noite) aplicados a todos os dias selecionados
**AGORA**: Turnos específicos por dia (ex: "Tarde na Terça" e "Noite na Quinta")

## 1. Estrutura de Dados - Payload

### ❌ Remover (campos antigos):
```typescript
{
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  weekdays: DayOfWeek[];
}
```

### ✅ Adicionar (nova estrutura):
```typescript
{
  shifts: Array<{
    dayOfWeek: DayOfWeek;  // 'segunda-feira', 'terca-feira', etc.
    shift: ShiftType;      // 'morning', 'afternoon', 'evening'
  }>;
}
```

**Exemplo:**
```typescript
{
  teacherId: "...",
  academicPeriodId: "...",
  shifts: [
    { dayOfWeek: 'terca-feira', shift: 'afternoon' },
    { dayOfWeek: 'quinta-feira', shift: 'evening' }
  ],
  disciplineIds: ["..."],
  observations: "..."
}
```

## 2. Interface do Usuário - Tela do Professor

### Componente de Seleção de Turnos

**ANTES**: 
- 3 switches: Manhã, Tarde, Noite
- 1 multiselect: Dias da semana

**AGORA**: 
- Grid/Matriz de checkboxes:
  - **Linhas**: Dias da semana (Segunda a Sexta, ou todos os dias)
  - **Colunas**: Turnos (Manhã, Tarde, Noite)
  - **Células**: Checkboxes para cada combinação

**Exemplo Visual:**
```
          | Manhã | Tarde | Noite
----------|-------|-------|-------
Segunda   |  ☐    |  ☐    |  ☐
Terça     |  ☐    |  ☑    |  ☐
Quarta    |  ☐    |  ☐    |  ☐
Quinta    |  ☐    |  ☐    |  ☑
Sexta     |  ☐    |  ☐    |  ☐
```

### Validações
- ✅ Pelo menos um checkbox deve estar marcado
- ✅ Não permitir duplicação (mesmo dia + mesmo turno já está coberto pela constraint do backend)

## 3. Carregamento de Dados Existentes

Ao carregar uma disponibilização existente:

**ANTES:**
```typescript
// Preencher switches e weekdays
setMorning(availability.morning);
setAfternoon(availability.afternoon);
setEvening(availability.evening);
setWeekdays(availability.weekdays);
```

**AGORA:**
```typescript
// Preencher grid baseado no array de shifts
const shifts = availability.shifts || [];
// Marcar checkboxes correspondentes no grid
shifts.forEach(shift => {
  markCheckbox(shift.dayOfWeek, shift.shift);
});
```

## 4. Preparação do Payload para Envio

**ANTES:**
```typescript
const payload = {
  teacherId,
  academicPeriodId,
  morning: morningSwitch,
  afternoon: afternoonSwitch,
  evening: eveningSwitch,
  weekdays: selectedWeekdays,
  disciplineIds,
  observations
};
```

**AGORA:**
```typescript
// Coletar todas as combinações selecionadas do grid
const shifts = [];
selectedDays.forEach(day => {
  if (morningChecked[day]) {
    shifts.push({ dayOfWeek: day, shift: 'morning' });
  }
  if (afternoonChecked[day]) {
    shifts.push({ dayOfWeek: day, shift: 'afternoon' });
  }
  if (eveningChecked[day]) {
    shifts.push({ dayOfWeek: day, shift: 'evening' });
  }
});

const payload = {
  teacherId,
  academicPeriodId,
  shifts,  // Array de { dayOfWeek, shift }
  disciplineIds,
  observations
};
```

## 5. Tela do Coordenador - Resumo

### Exibição dos Turnos

**ANTES:**
```typescript
// Mostrar: "Manhã, Tarde, Noite" (se todos marcados)
// Ou: "Manhã" (se só manhã)
```

**AGORA:**
```typescript
// Mostrar lista de combinações:
// "Tarde (Terça)", "Noite (Quinta)"
// Ou agrupar por turno:
// "Manhã: Segunda, Quarta"
// "Tarde: Terça"
// "Noite: Quinta"
```

**Exemplo de Renderização:**
```typescript
const formatShifts = (shifts: Array<{dayOfWeek: string, shift: string}>) => {
  const grouped = shifts.reduce((acc, s) => {
    if (!acc[s.shift]) acc[s.shift] = [];
    acc[s.shift].push(s.dayOfWeek);
    return acc;
  }, {});

  return Object.entries(grouped).map(([shift, days]) => 
    `${shift}: ${days.join(', ')}`
  ).join(' | ');
};
```

## 6. Endpoint de Resumo

**URL**: `GET /teacher-semester-availabilities/course/:courseId/semester/:semesterId/summary`

**IMPORTANTE**: O `semesterId` agora aceita tanto UUID quanto string do período:
- ✅ `GET .../semester/2961037a-33e7-4cc3-a2e4-f3de4b4edfa4/summary` (UUID)
- ✅ `GET .../semester/2026.2/summary` (string do período)

**Resposta:**
```typescript
{
  course: { id, name, code },
  academicPeriod: { id, period },
  teachers: [
    {
      id, name, email,
      shifts: [
        { dayOfWeek: 'terca-feira', shift: 'afternoon' },
        { dayOfWeek: 'quinta-feira', shift: 'evening' }
      ],
      disciplines: [...],
      status: 'draft' | 'submitted' | 'approved',
      ...
    }
  ]
}
```

## 7. Componentes Sugeridos

### ShiftGrid Component
```typescript
interface ShiftGridProps {
  selectedShifts: Array<{ dayOfWeek: DayOfWeek; shift: ShiftType }>;
  onChange: (shifts: Array<{ dayOfWeek: DayOfWeek; shift: ShiftType }>) => void;
}

// Renderiza grid de checkboxes
// Dias da semana nas linhas
// Turnos nas colunas
// Gerencia estado interno e notifica mudanças
```

## 8. Checklist de Alterações

- [ ] Remover campos `morning`, `afternoon`, `evening`, `weekdays` do formulário
- [ ] Criar componente `ShiftGrid` (grid de checkboxes)
- [ ] Atualizar lógica de carregamento de dados existentes
- [ ] Atualizar preparação do payload para envio
- [ ] Atualizar validações (pelo menos um shift)
- [ ] Atualizar exibição no resumo (coordenador)
- [ ] Atualizar endpoint de resumo para usar string do período (ex: "2026.2")
- [ ] Testar criação de nova disponibilização
- [ ] Testar edição de disponibilização existente
- [ ] Testar visualização no resumo do coordenador

## 9. Exemplo de Implementação do Grid

```typescript
const ShiftGrid = ({ selectedShifts, onChange }) => {
  const days = ['segunda-feira', 'terca-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira'];
  const shifts = ['morning', 'afternoon', 'evening'];
  
  const toggleShift = (day: DayOfWeek, shift: ShiftType) => {
    const exists = selectedShifts.some(
      s => s.dayOfWeek === day && s.shift === shift
    );
    
    if (exists) {
      onChange(selectedShifts.filter(
        s => !(s.dayOfWeek === day && s.shift === shift)
      ));
    } else {
      onChange([...selectedShifts, { dayOfWeek: day, shift }]);
    }
  };
  
  return (
    <table>
      <thead>
        <tr>
          <th>Dia</th>
          <th>Manhã</th>
          <th>Tarde</th>
          <th>Noite</th>
        </tr>
      </thead>
      <tbody>
        {days.map(day => (
          <tr key={day}>
            <td>{day}</td>
            {shifts.map(shift => (
              <td key={shift}>
                <input
                  type="checkbox"
                  checked={selectedShifts.some(
                    s => s.dayOfWeek === day && s.shift === shift
                  )}
                  onChange={() => toggleShift(day, shift)}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

## 10. Valores dos Enums

**DayOfWeek:**
- `'domingo'`
- `'segunda-feira'`
- `'terca-feira'`
- `'quarta-feira'`
- `'quinta-feira'`
- `'sexta-feira'`
- `'sabado'`

**ShiftType:**
- `'morning'`
- `'afternoon'`
- `'evening'`

## Observações Importantes

1. **Backward Compatibility**: Se houver dados antigos no banco, eles precisarão ser migrados. O frontend deve tratar apenas a nova estrutura.

2. **Validação Frontend**: Validar antes de enviar que pelo menos um shift está selecionado para melhor UX.

3. **Formato do Período**: O endpoint de resumo aceita tanto UUID quanto string (ex: "2026.2"). Use a string para melhor legibilidade na URL.

4. **Exibição no Resumo**: Considere agrupar shifts por turno ou por dia para melhor visualização.



