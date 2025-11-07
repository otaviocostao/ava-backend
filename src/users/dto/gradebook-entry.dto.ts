export interface GradebookEntryDto {
  classId: string;
  className: string;
  classCode: string;
  teacherName: string | null;
  grades: {
    activityTitle: string;
    activityType: string;
    dueDate: Date | null;
    score: number | null;
    maxScore: number | null;
  }[];
  finalGrade?: number;
}