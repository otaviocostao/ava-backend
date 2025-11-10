export interface DetailedAbsence {
  id: string;
  date: string;
  classHours: number;
  reason?: string;
  unit: '1ª Unidade' | '2ª Unidade' | 'Outra';
}

export interface DisciplineAttendance {
  id: string; // enrollmentId
  name: string; // Nome da disciplina
  teacher: string | null;
  totalWorkload: number;
  absencesByUnit: {
    unit1: number;
    unit2: number;
  };
  absences: DetailedAbsence[];
}

export interface AttendanceData {
  disciplines: DisciplineAttendance[];
  availableSemesters: string[];
}