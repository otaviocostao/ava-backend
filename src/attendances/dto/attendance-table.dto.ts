export class AttendanceTableCellDto {
  attendanceId: string;
  date: string;
  present: boolean;
}

export class AttendanceTableRowDto {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  attendances: AttendanceTableCellDto[];
}
