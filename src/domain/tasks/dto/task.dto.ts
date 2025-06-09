export interface TaskDto {
  id: string
  title: string
  description: string
  tags?: string[]
  prioridade?: 'ALTA' | 'MEDIA' | 'BAIXA'
  priority?: number
  subtasks?: SubtaskDto[]
  createdAt?: string
  updatedAt?: string
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
  deadline: string
  done?: boolean
  tags?: string[]
  prioridade?: 'ALTA' | 'MEDIA' | 'BAIXA'
  priority?: number
}

export interface UpdateTaskDto {
  title?: string
  description?: string
  tags?: string[]
  prioridade?: 'ALTA' | 'MEDIA' | 'BAIXA'
  priority?: number
  subtasks?: SubtaskDto[]
  done?: boolean
  status?: 'pendente' | 'concluida'
  prazo?: string
  deadline?: string
}

export interface TasksResponse {
  tasks: TaskDto[]
  total: number
}

export const convertTaskToDto = (task: any): TaskDto => {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    tags: task.tags,
    prioridade: task.prioridade,
    priority: task.priority,
    subtasks: task.subtasks,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    done: task.done,
    status: task.status,
    prazo: task.prazo,
    deadline: task.deadline,
  };
};

export const convertDtoToTask = (taskDto: TaskDto): any => {
  return {
    id: taskDto.id,
    title: taskDto.title,
    description: taskDto.description,
    tags: taskDto.tags || [],
    prioridade: taskDto.prioridade,
    priority: taskDto.priority,
    subtasks: taskDto.subtasks || [],
    createdAt: taskDto.createdAt,
    updatedAt: taskDto.updatedAt,
    done: taskDto.done || false,
    status: taskDto.status || 'pendente',
    prazo: taskDto.prazo || '',
    deadline: taskDto.deadline || '',
  };
};

export const formatDateForAPI = (dateString: string): string => {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    return dateString;
  }

  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const year = today.getFullYear();
  return `${day}/${month}/${year}`;
};
