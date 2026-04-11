export const validateExam = (data: Partial<any>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.title?.trim()) {
    errors.push('Le titre de l\'examen est requis');
  }

  if (!data.subject) {
    errors.push('La matière est requise');
  }

  if (!data.grade_level || data.grade_level < 1 || data.grade_level > 12) {
    errors.push('Le niveau de classe doit être entre 1 et 12');
  }

  if (!data.questions?.length) {
    errors.push('Au moins une question est requise');
  }

  data.questions?.forEach((question: any, idx: number) => {
    if (!question.content?.trim()) {
      errors.push(`La question ${idx + 1} doit contenir un texte`);
    }
    if (!question.points || question.points < 0) {
      errors.push(`La valeur des points pour la question ${idx + 1} doit être positive`);
    }
    if (question.difficulty < 1 || question.difficulty > 10) {
      errors.push(`La difficulté pour la question ${idx + 1} doit être entre 1 et 10`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateStudent = (data: Partial<any>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.class_name?.trim()) {
    errors.push('Le nom de la classe est requis');
  }

  if (!data.grade_level || data.grade_level < 1 || data.grade_level > 12) {
    errors.push('Le niveau de classe doit être entre 1 et 12');
  }

  if (!data.first_name?.trim()) {
    errors.push('Le prénom est requis');
  }

  if (!data.last_name?.trim()) {
    errors.push('Le nom de famille est requis');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateSubmission = (data: {
  exam_id: string;
  student_id: string;
  answers?: { question_id: string; answer: string }[];
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.exam_id) {
    errors.push('L\'ID de l\'examen est requis');
  }

  if (!data.student_id) {
    errors.push('L\'ID de l\'élève est requis');
  }

  if (!data.answers?.length) {
    errors.push('Au moins une réponse est requise');
  }

  if (data.answers && data.answers.length) {
    data.answers.forEach((answer: any) => {
      if (!answer.question_id) {
        errors.push('L\'ID de la question est requis');
      }
      if (!answer.answer?.trim()) {
        errors.push('La réponse est requise');
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
