export interface TaskDto {
  id: string
  title: string
  description: string
  tags?: string[]
  prioridade?: 'ALTA' | 'MEDIA' | 'BAIXA'
  priority?: number // Adicionado campo priority para compatibilidade
  subtasks?: SubtaskDto[]
  createdAt?: string
  updatedAt?: string
  // Propriedades adicionais que existem no tipo Task original
  done?: boolean
  status?: 'pendente' | 'concluida'
  prazo?: string
  deadline?: string
}

export interface SubtaskDto {
  id?: string
  title: string
  done: boolean
}

export interface CreateTaskDto {
  title: string
  description: string
  deadline: string // Campo obrigatório que a API espera
  done?: boolean
  tags?: string[]
  prioridade?: 'ALTA' | 'MEDIA' | 'BAIXA'
  priority?: number // Adicionado campo priority para compatibilidade
}

export interface UpdateTaskDto {
  title?: string
  description?: string
  tags?: string[]
  prioridade?: 'ALTA' | 'MEDIA' | 'BAIXA'
  priority?: number // Adicionado campo priority para compatibilidade
  subtasks?: SubtaskDto[]
  // Adicionando propriedades que podem ser atualizadas
  done?: boolean
  status?: 'pendente' | 'concluida'
  prazo?: string
  deadline?: string
}

export interface TasksResponse {
  tasks: TaskDto[]
  total: number
}

// Função utilitária para converter Task para TaskDto
export const convertTaskToDto = (task: any): TaskDto => {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    tags: task.tags,
    prioridade: task.prioridade,
    priority: task.priority, // Incluir priority se existir
    subtasks: task.subtasks,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    done: task.done,
    status: task.status,
    prazo: task.prazo,
    deadline: task.deadline,
  };
};

// Função utilitária para converter TaskDto para o tipo Task original (para navegação)
export const convertDtoToTask = (taskDto: TaskDto): any => {
  return {
    id: taskDto.id,
    title: taskDto.title,
    description: taskDto.description,
    tags: taskDto.tags || [], // Garante que tags seja sempre um array
    prioridade: taskDto.prioridade,
    priority: taskDto.priority, // Incluir priority se existir
    subtasks: taskDto.subtasks || [],
    createdAt: taskDto.createdAt,
    updatedAt: taskDto.updatedAt,
    done: taskDto.done || false,
    status: taskDto.status || 'pendente',
    prazo: taskDto.prazo || '',
    deadline: taskDto.deadline || '',
  };
};

// Função utilitária para formatar data no formato dd/mm/yyyy
export const formatDateForAPI = (dateString: string): string => {
  // Se já está no formato correto, retorna como está
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    return dateString;
  }

  // Se está em outro formato, tenta converter
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Se não conseguir converter, retorna a data atual
  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const year = today.getFullYear();
  return `${day}/${month}/${year}`;
};
