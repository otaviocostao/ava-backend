export interface DetailedGradebookDto {
  geral: {
    mediaGeral: number;
    frequenciaGeral: number;
    disciplinasAprovadas: number;
    totalDisciplinas: number;
  };
  disciplinas: {
    disciplina: string;
    codigo: string;
    media: number;
    frequencia: number;
    situacao: 'Aprovado' | 'Reprovado' | 'Recuperação' | 'Em Andamento';
    notas: {
        unidade: string;
        nota: number | null;
    }[];
    cor: string;
  }[];
}