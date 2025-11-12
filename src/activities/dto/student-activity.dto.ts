export interface StudentActivityDto {
  id: string;
  titulo: string;
  descricao: string | null;
  dataVencimento: Date | null;
  disciplina: string;
  status: 'pendente' | 'concluido' | 'avaliado';
  nota: number | null;
  dataConclusao: string | null;
}