export interface CurriculumDisciplineDto {
  id: string;
  code: string | null;
  name: string;
  academicPeriod: string | null; // período letivo (Class.semester)
  status: 'Aprovado' | 'Reprovado' | 'Cursando' | 'Pendente';
  finalGrade?: number;
  absences?: number;
  credits: number;
  workload: number;
  type: 'required' | 'optional';
}

export interface SemesterGroupDto {
  semester: number | string;
  disciplines: CurriculumDisciplineDto[];
}

export interface CurriculumSummaryDto {
  totalHours: number;
  completedHours: number;
  requiredDisciplines: {
    completed: number;
    total: number;
  };
  optionalDisciplines: {
    completed: number;
    total: number;
  };
}

export interface StudentCurriculumDto {
  course: {
    id: string;
    name: string;
    code: string | null;
  };
  summary: CurriculumSummaryDto;
  semesters: SemesterGroupDto[];
}

