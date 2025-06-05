import type { TaskDto, CreateTaskDto, UpdateTaskDto } from '../dto/task.dto';
import api from '../../../utils/api.ts';

class TasksService {
  private readonly baseUrl = '/tasks';

  async getAllTasks(): Promise<TaskDto[]> {
    try {
      const response = await api.get<TaskDto[]>(this.baseUrl);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar todas as tasks:', error);
      throw error;
    }
  }

  async getTaskById(taskId: string): Promise<TaskDto> {
    try {
      const response = await api.get<TaskDto>(`${this.baseUrl}/${taskId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar task ${taskId}:`, error);
      throw error;
    }
  }

  async createTask(taskData: CreateTaskDto): Promise<TaskDto> {
    try {
      const response = await api.post<TaskDto>(this.baseUrl, taskData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar task:', error);
      throw error;
    }
  }

  async updateTask(taskId: string, taskData: UpdateTaskDto): Promise<TaskDto> {
    try {
      const response = await api.put<TaskDto>(`${this.baseUrl}/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar task ${taskId}:`, error);
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${taskId}`);
    } catch (error) {
      console.error(`Erro ao deletar task ${taskId}:`, error);
      throw error;
    }
  }

  async updateSubtasks(taskId: string, subtasks: any[]): Promise<TaskDto> {
    try {
      const response = await api.put<TaskDto>(`${this.baseUrl}/${taskId}`, {
        subtasks,
      });
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar subtasks da task ${taskId}:`, error);
      throw error;
    }
  }

  async findTaskInList(taskId: string): Promise<TaskDto | null> {
    try {
      const allTasks = await this.getAllTasks();
      return allTasks.find((task) => task.id === taskId) || null;
    } catch (error) {
      console.error('Erro ao buscar task na lista:', error);
      throw error;
    }
  }
}

export const tasksService = new TasksService();
