# Documentação Frontend - Expansão Disponibilização de Horários

## Visão Geral

Este documento descreve como implementar as telas frontend para a funcionalidade expandida de disponibilização de horários, incluindo:
1. Gerenciamento de cursos do professor (coordenador)
2. Disponibilização de turnos e disciplinas (professor)
3. Visualização de resumo por curso (coordenador)

## Estrutura de Telas

### 1. Tela: Gerenciamento de Cursos do Professor (Coordenador)
**Rota**: `/coordenador/professores/:teacherId/cursos`

**Funcionalidade**: Coordenador gerencia quais cursos cada professor participa.

**Componentes**:
- Lista de cursos vinculados ao professor
- Botão "Adicionar Curso"
- Modal/Formulário para adicionar curso
- Botão de remoção para cada curso

**Endpoints**:
- `GET /teacher-courses/teacher/:teacherId` - Listar cursos do professor
- `POST /teacher-courses` - Vincular professor a curso
- `DELETE /teacher-courses/:id` - Remover vínculo

**Payloads**:

```typescript
// POST /teacher-courses
{
  teacherId: string;
  courseId: string;
}

// Resposta GET /teacher-courses/teacher/:teacherId
[
  {
    id: string;
    teacher: { id: string; name: string; email: string };
    course: { id: string; name: string; code: string; department: { id: string; name: string } };
    createdAt: string;
  }
]
```

### 2. Tela: Disponibilização de Horários Expandida (Professor)
**Rota**: `/professor/disponibilizacao-horarios` (expandir existente)

**Funcionalidade**: Professor disponibiliza turnos E seleciona disciplinas de interesse dos cursos vinculados.

**Componentes**:
- Seleção de semestre (dropdown) - apenas futuros
- Seleção de turnos por dia da semana (grid/matriz):
  - Linhas: Dias da semana (Segunda a Sexta)
  - Colunas: Turnos (Manhã, Tarde, Noite)
  - Checkboxes para selecionar combinações específicas (ex: Tarde na Terça, Noite na Quinta)
- Seleção de disciplinas (multiselect) - apenas dos cursos do professor
- Campo de observações (opcional)
- Botões: "Salvar Rascunho" e "Enviar para Coordenação"
- Aba de histórico

**Endpoints**:
- `GET /teacher-semester-availabilities/teacher/:teacherId/available-semesters` - Semestres futuros
- `GET /teacher-courses/teacher/:teacherId` - Cursos do professor
- `GET /courses/:courseId` - Disciplinas do curso (já existe)
- `POST /teacher-semester-availabilities` - Criar/atualizar disponibilização
- `GET /teacher-semester-availabilities/teacher/:teacherId` - Histórico

**Payloads**:

```typescript
// POST /teacher-semester-availabilities
{
  teacherId: string;
  academicPeriodId: string;
  status?: 'draft' | 'submitted';
  shifts: [
    { dayOfWeek: 'terca-feira', shift: 'afternoon' },
    { dayOfWeek: 'quinta-feira', shift: 'evening' }
  ];
  observations?: string;
  disciplineIds?: string[];
}

// Resposta GET /teacher-semester-availabilities/teacher/:teacherId
[
  {
    id: string;
    academicPeriod: { id: string; period: string };
    status: 'draft' | 'submitted' | 'approved';
    shifts: [
      { id: string; dayOfWeek: 'terca-feira'; shift: 'afternoon' },
      { id: string; dayOfWeek: 'quinta-feira'; shift: 'evening' }
    ];
    disciplines: [{ id: string; name: string; code: string }];
    observations: string | null;
    createdAt: string;
    submittedAt: string | null;
    approvedAt: string | null;
  }
]
```

**Fluxo de Dados**:
1. Ao carregar a página:
   - Buscar semestres futuros
   - Buscar cursos do professor
   - Para cada curso, buscar disciplinas
   - Se houver disponibilização existente para o semestre selecionado, carregar dados

2. Ao selecionar semestre:
   - Verificar se já existe disponibilização
   - Se existir, carregar dados (shifts e disciplinas)
   - Se não existir, iniciar formulário vazio

3. Ao salvar:
   - Validar: pelo menos um shift selecionado (combinação dia+turno)
   - Validar: não permitir duplicação (mesmo dia + mesmo turno)
   - Validar: disciplinas selecionadas pertencem aos cursos do professor
   - Enviar payload com `shifts` (array de {dayOfWeek, shift}) e `disciplineIds`

### 3. Tela: Resumo de Disponibilizações por Curso (Coordenador)
**Rota**: `/coordenador/cursos/:courseId/disponibilizacoes`

**Funcionalidade**: Coordenador visualiza resumo de todas as disponibilizações dos professores de um curso para um semestre.

**Componentes**:
- Dropdown de seleção de semestre
- Tabela/Lista de professores com:
  - Nome do professor
  - Turnos disponíveis (Manhã/Tarde/Noite)
  - Disciplinas de interesse
  - Status (rascunho/enviada/aprovada)
  - Observações
- Botão "Gerar Grade do Semestre" (on hold - desabilitado por enquanto)

**Endpoints**:
- `GET /teacher-semester-availabilities/course/:courseId/semester/:semesterId/summary` - Resumo

**Payload**:

```typescript
// GET /teacher-semester-availabilities/course/:courseId/semester/:semesterId/summary
// Resposta:
{
  course: {
    id: string;
    name: string;
    code: string;
  };
  academicPeriod: {
    id: string;
    period: string;
  };
  teachers: [
    {
      id: string;
      name: string;
      email: string;
      shifts: [
        { dayOfWeek: 'terca-feira', shift: 'afternoon' },
        { dayOfWeek: 'quinta-feira', shift: 'evening' }
      ];
      disciplines: [
        {
          id: string;
          name: string;
          code: string;
        }
      ];
      status: 'draft' | 'submitted' | 'approved';
      observations: string | null;
      submittedAt: string | null;
      approvedAt: string | null;
    }
  ];
}
```

**Fluxo**:
1. Coordenador seleciona curso (da lista de cursos do departamento)
2. Seleciona semestre
3. Sistema busca resumo via endpoint
4. Exibe tabela com todos os professores e suas disponibilizações
5. Botão "Gerar Grade" fica visível mas desabilitado (on hold)

## Estados e Validações

### Validações Frontend

1. **Disponibilização de Horários (Professor)**:
   - Pelo menos um shift deve estar selecionado (combinação dia+turno)
   - Não permitir duplicação (mesmo dia + mesmo turno)
   - Disciplinas só podem ser selecionadas dos cursos vinculados
   - Semestre deve ser futuro
   - Ao enviar, status muda para 'submitted'

2. **Gerenciamento de Cursos (Coordenador)**:
   - Coordenador só pode gerenciar professores do seu departamento
   - Não permite duplicação (professor já vinculado ao curso)

3. **Resumo (Coordenador)**:
   - Coordenador só pode ver cursos do seu departamento
   - Mostrar apenas professores que têm disponibilização para o semestre

## Componentes Sugeridos

### ProfessorDisciplinesSelector
```typescript
interface Props {
  teacherId: string;
  selectedDisciplineIds: string[];
  onChange: (disciplineIds: string[]) => void;
}

// Busca cursos do professor
// Para cada curso, busca disciplinas
// Renderiza multiselect agrupado por curso
```

### TeacherAvailabilityForm
```typescript
interface Props {
  teacherId: string;
  semesterId?: string;
  onSave: (data: CreateTeacherSemesterAvailabilityDto) => void;
}

// Formulário completo com:
// - Seleção de semestre
// - Grid/matriz de turnos por dia (checkboxes: dia x turno)
// - Seletor de disciplinas
// - Campo de observações
// - Botões de ação
```

### CourseAvailabilitySummary
```typescript
interface Props {
  courseId: string;
  semesterId: string;
}

// Tabela com resumo
// Botão "Gerar Grade" (desabilitado)
```

## Navegação

### Fluxo do Coordenador
1. `/coordenador/professores` - Lista professores
2. `/coordenador/professores/:id/cursos` - Gerencia cursos do professor
3. `/coordenador/cursos` - Lista cursos
4. `/coordenador/cursos/:id/disponibilizacoes` - Ver resumo

### Fluxo do Professor
1. `/professor/disponibilizacao-horarios` - Disponibilizar horários e disciplinas
2. Histórico na mesma página (aba)

## Observações Importantes

1. **Disciplinas**: O professor só vê disciplinas dos cursos que está vinculado. Se não estiver vinculado a nenhum curso, mostrar mensagem: "Você não está vinculado a nenhum curso. Entre em contato com o coordenador."

2. **Semestres Futuros**: Apenas semestres com `startDate > hoje` devem aparecer no dropdown.

3. **Status**: 
   - `draft`: Pode editar
   - `submitted`: Não pode editar (aguardando aprovação)
   - `approved`: Não pode editar (já aprovado)

4. **Botão Gerar Grade**: Deixar visível mas desabilitado com tooltip: "Funcionalidade em desenvolvimento"

5. **Validação de Disciplinas**: Se o professor selecionar uma disciplina que não pertence aos seus cursos, o backend retornará erro. O frontend deve validar antes de enviar para melhor UX.

## Exemplo de Integração

```typescript
// Hook para buscar cursos e disciplinas do professor
const useTeacherCoursesAndDisciplines = (teacherId: string) => {
  const { data: teacherCourses } = useQuery({
    queryKey: ['teacher-courses', teacherId],
    queryFn: () => api.get(`/teacher-courses/teacher/${teacherId}`),
  });

  const { data: coursesWithDisciplines } = useQueries({
    queries: teacherCourses?.data?.map((tc: TeacherCourse) => ({
      queryKey: ['course', tc.course.id],
      queryFn: () => api.get(`/courses/${tc.course.id}`),
    })) || [],
  });

  const allDisciplines = useMemo(() => {
    return coursesWithDisciplines
      ?.flatMap((course) => course.data?.disciplines || [])
      .filter((d, index, self) => 
        index === self.findIndex((t) => t.id === d.id)
      ) || [];
  }, [coursesWithDisciplines]);

  return { teacherCourses, allDisciplines };
};
```

