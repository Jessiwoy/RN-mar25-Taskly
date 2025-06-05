'use client';

import { useState, useEffect } from 'react';
import { tasksService, type TaskDto, type CreateTaskDto, type UpdateTaskDto, formatDateForAPI } from '../domain/tasks';

export const useTasks = () => {
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedTasks = await tasksService.getAllTasks();
      setTasks(fetchedTasks);
    } catch (err) {
      setError('Erro ao carregar tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: CreateTaskDto) => {
    try {
      setLoading(true);
      setError(null);
      const newTask = await tasksService.createTask(taskData);
      setTasks((prev) => [...prev, newTask]);
      return newTask;
    } catch (err) {
      setError('Erro ao criar task');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskId: string, taskData: UpdateTaskDto) => {
    try {
      setLoading(true);
      setError(null);
      const updatedTask = await tasksService.updateTask(taskId, taskData);
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updatedTask : task)));
      return updatedTask;
    } catch (err) {
      setError('Erro ao atualizar task');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      setLoading(true);
      setError(null);
      await tasksService.deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (err) {
      setError('Erro ao deletar task');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (taskId: string) => {
    try {
      const currentTask = tasks.find((task) => task.id === taskId);
      if (!currentTask) {return;}

      // Optimistic update
      const newStatus = currentTask.status === 'pendente' ? 'concluida' : 'pendente';
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)));

      // Update on backend - incluindo deadline para evitar erro da API
      await tasksService.updateTask(taskId, {
        status: newStatus,
        deadline: currentTask.deadline || formatDateForAPI(new Date().toISOString()),
      });
    } catch (err) {
      // Revert optimistic update on error
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: task.status === 'pendente' ? 'concluida' : 'pendente' } : task,
        ),
      );
      setError('Erro ao atualizar status da task');
      console.error(err);
      throw err;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
  };
};
