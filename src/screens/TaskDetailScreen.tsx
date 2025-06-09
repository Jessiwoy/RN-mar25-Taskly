'use client';

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import type { RootStackParamList } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import type { TaskDetailRouteProp } from '../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import Header from '../components/molecules/Header';
import TabBar from '../components/molecules/TabBar';
import { tasksService, type TaskDto, type SubtaskDto, convertTaskToDto, convertDtoToTask } from '../domain/tasks';

// Função helper para extrair data da task
const extractTaskDate = (taskObj: any): string | Date | undefined => {
  return taskObj?.deadline || taskObj?.prazo || taskObj?.data || taskObj?.date || taskObj?.dueDate || taskObj?.due_date;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'TaskDetail'>

export default function TaskDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<TaskDetailRouteProp>();
  const { task } = route.params;
  const [subtaskInputs, setSubtaskInputs] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [confirmedSubtasks, setConfirmedSubtasks] = useState<{ text: string; checked: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTask, setCurrentTask] = useState<TaskDto>(convertTaskToDto(task));

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setIsLoading(true);
        const foundTask = await tasksService.findTaskInList(task.id);

        if (foundTask?.subtasks) {
          const formattedSubtasks = foundTask.subtasks.map((sub: SubtaskDto) => ({
            text: sub.title,
            checked: sub.done,
          }));
          setConfirmedSubtasks(formattedSubtasks);
        }

        if (foundTask) {
          setCurrentTask(foundTask);
        }
      } catch (error) {
        console.error('Erro ao carregar subtasks da API:', error);
        Alert.alert('Erro', 'Não foi possível carregar os detalhes da tarefa');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskDetails();
  }, [task.id]);

  // Função para formatar data no formato dd/mm/yyyy
  const formatDateForAPI = (date: Date | string | undefined): string => {
    console.log('Data recebida para formatação:', date, 'Tipo:', typeof date);

    if (!date) {
      // Se não há deadline, usar data atual
      const today = new Date();
      const day = today.getDate().toString().padStart(2, '0');
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const year = today.getFullYear();
      console.log('Usando data atual:', `${day}/${month}/${year}`);
      return `${day}/${month}/${year}`;
    }

    let dateObj: Date;

    if (typeof date === 'string') {
      // Tentar diferentes formatos de string
      if (date.includes('/')) {
        // Formato dd/mm/yyyy ou mm/dd/yyyy
        const parts = date.split('/');
        if (parts.length === 3) {
          // Assumir dd/mm/yyyy
          dateObj = new Date(Number.parseInt(parts[2]), Number.parseInt(parts[1]) - 1, Number.parseInt(parts[0]));
        } else {
          dateObj = new Date(date);
        }
      } else if (date.includes('-')) {
        // Formato ISO ou yyyy-mm-dd
        dateObj = new Date(date);
      } else {
        // Tentar parsing direto
        dateObj = new Date(date);
      }
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      // Fallback para data atual
      console.log('Formato de data não reconhecido, usando data atual');
      dateObj = new Date();
    }

    // Verificar se a data é válida
    if (isNaN(dateObj.getTime())) {
      console.log('Data inválida, usando data atual');
      dateObj = new Date();
    }

    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();

    const formattedDate = `${day}/${month}/${year}`;
    console.log('Data formatada:', formattedDate);
    return formattedDate;
  };

  const addSubtaskInput = () => {
    setSubtaskInputs([...subtaskInputs, '']);
  };

  const updateSubtaskInput = (index: number, text: string) => {
    const updatedInputs = [...subtaskInputs];
    updatedInputs[index] = text;
    setSubtaskInputs(updatedInputs);
  };

  const confirmSubtask = async (index: number) => {
    const inputText = subtaskInputs[index].trim();
    if (!inputText) {return;}

    try {
      const newSubtask: SubtaskDto = { title: inputText, done: false };
      const updatedSubtasks = [...confirmedSubtasks.map((s) => ({ title: s.text, done: s.checked })), newSubtask];

      // Debug: verificar dados da tarefa atual
      console.log('currentTask completo:', currentTask);
      console.log('currentTask.deadline:', currentTask.deadline);
      console.log('currentTask.prazo:', currentTask.prazo);
      console.log('task original:', task);

      // Tentar diferentes campos de data
      const taskDeadline = extractTaskDate(currentTask) || extractTaskDate(task);

      console.log('Data encontrada:', taskDeadline);

      const formattedDeadline = formatDateForAPI(taskDeadline);

      // Preparar dados completos para a API
      const updateData = {
        subtasks: updatedSubtasks,
        deadline: formattedDeadline,
      };

      console.log('Enviando dados para API:', updateData);

      // Usar o serviço com dados completos
      await tasksService.updateSubtasks(task.id, updatedSubtasks, formattedDeadline);

      const updatedInputs = [...subtaskInputs];
      updatedInputs.splice(index, 1);
      setSubtaskInputs(updatedInputs);

      setConfirmedSubtasks((prev) => [...prev, { text: inputText, checked: false }]);
    } catch (error) {
      console.error('Erro ao enviar subtask para API:', error);
      Alert.alert('Erro', 'Erro ao criar subtask. Verifique se a tarefa possui uma data válida.');
    }
  };

  const toggleSubtaskChecked = async (index: number) => {
    const updated = [...confirmedSubtasks];

    if (typeof updated[index] === 'object' && 'checked' in updated[index]) {
      updated[index] = {
        ...updated[index],
        checked: !updated[index].checked,
      };
      setConfirmedSubtasks(updated);

      try {
        const updatedSubtasks = updated.map((s) => ({ title: s.text, done: s.checked }));
        const deadline = formatDateForAPI(extractTaskDate(currentTask));

        await tasksService.updateSubtasks(task.id, updatedSubtasks, deadline);
      } catch (error) {
        console.error('Erro ao atualizar status da subtask:', error);
        updated[index].checked = !updated[index].checked;
        setConfirmedSubtasks([...updated]);
        Alert.alert('Erro', 'Não foi possível atualizar a subtask');
      }
    } else {
      console.warn('Formato inválido de subtask em:', updated[index]);
    }
  };

  const updateSubtaskText = async (index: number, newText: string) => {
    try {
      const updated = [...confirmedSubtasks];
      updated[index].text = newText;
      setConfirmedSubtasks(updated);

      const updatedSubtasks = updated.map((s) => ({ title: s.text, done: s.checked }));
      const deadline = formatDateForAPI(extractTaskDate(currentTask));

      await tasksService.updateSubtasks(task.id, updatedSubtasks, deadline);
    } catch (error) {
      console.error('Erro ao atualizar texto da subtask:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a subtask');
    }
  };

  const deleteTask = async () => {
    try {
      await tasksService.deleteTask(task.id);
      Alert.alert('Sucesso', 'Tarefa resolvida com sucesso!');
      navigation.reset({
        index: 0,
        routes: [{ name: 'HomePage' }],
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível resolver a tarefa.');
      console.error(error);
    }
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
  };

  function getPriorityStyle(task: TaskDto) {
    const priorityValue = (task as any).priority !== undefined ? (task as any).priority : task.prioridade;

    console.log('Prioridade recebida:', priorityValue, 'Tipo:', typeof priorityValue);

    if (priorityValue === undefined || priorityValue === null) {
      return null;
    }

    let priorityNumber: number;
    if (typeof priorityValue === 'string') {
      priorityNumber = Number.parseInt(priorityValue, 10);
      if (Number.isNaN(priorityNumber)) {
        switch (priorityValue.toUpperCase()) {
          case 'ALTA':
            priorityNumber = 3;
            break;
          case 'MEDIA':
          case 'MÉDIA':
            priorityNumber = 2;
            break;
          case 'BAIXA':
            priorityNumber = 1;
            break;
          default:
            console.log('Prioridade string não reconhecida:', priorityValue);
            return null;
        }
      }
    } else {
      priorityNumber = priorityValue;
    }

    switch (priorityNumber) {
      case 3:
        return { backgroundColor: '#32C25B', text: 'ALTA' };
      case 2:
        return { backgroundColor: '#FFD93D', text: 'MÉDIA' };
      case 1:
        return { backgroundColor: '#FF6B6B', text: 'BAIXA' };
      default:
        console.log('Prioridade numérica não reconhecida:', priorityNumber);
        return null;
    }
  }

  return (
    <View style={styles.screen}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#583CC4" />
        </View>
      ) : (
        <>
          <View style={styles.container}>
            <Header
              onBack={() =>
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'HomePage' }],
                })
              }
            />

            <View style={styles.card}>
              <TouchableOpacity
                style={styles.editIcon}
                onPress={() => navigation.navigate('EditTask', { task: convertDtoToTask(currentTask) })}
              >
                <Image
                  source={{ uri: 'https://compass-pb-taskly.s3.sa-east-1.amazonaws.com/Vector1.png' }}
                  style={{ width: 24, height: 24 }}
                />
              </TouchableOpacity>

              <Text style={styles.label1}>Título</Text>
              <Text style={styles.value}>{currentTask.title}</Text>

              <Text style={styles.label}>Descrição</Text>
              <Text style={styles.description}>{currentTask.description}</Text>

              <Text style={styles.label}>Tags</Text>
              {currentTask.tags && currentTask.tags.length > 0 ? (
                <View style={styles.chips}>
                  {currentTask.tags.map((tag, index) => (
                    <View key={index} style={styles.tagChip}>
                      <Text style={styles.tagChipText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyInfoText}>Nenhuma tag adicionada</Text>
              )}

              <Text style={styles.label}>Prioridade</Text>
              {getPriorityStyle(currentTask) ? (
                <View
                  style={[styles.priorityChip, { backgroundColor: getPriorityStyle(currentTask)!.backgroundColor }]}
                >
                  <Text style={styles.priorityChipText}>{getPriorityStyle(currentTask)!.text}</Text>
                </View>
              ) : (
                <Text style={styles.emptyInfoText}>Sem prioridade definida</Text>
              )}

              <TouchableOpacity style={styles.resolveButton} onPress={deleteTask}>
                <Text style={styles.resolveButtonText}>RESOLVER TAREFA</Text>
              </TouchableOpacity>
            </View>

            {subtaskInputs.map((input, i) => (
              <View key={`input-${i}`} style={styles.subtaskInputContainer}>
                <TextInput
                  value={input}
                  placeholder="Digite a subtask"
                  onChangeText={(text) => updateSubtaskInput(i, text)}
                />
                <TouchableOpacity onPress={() => confirmSubtask(i)}>
                  <MaterialCommunityIcons name="arrow-right-circle" size={24} color="#32C25B" />
                </TouchableOpacity>
              </View>
            ))}

            {!isLoading && confirmedSubtasks.length === 0 && (
              <TouchableOpacity onPress={addSubtaskInput} style={styles.subtaskButton}>
                <Text style={styles.subtaskButtonText}>ADICIONAR SUBTASK</Text>
              </TouchableOpacity>
            )}

            <View style={styles.subtasksScrollArea}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
              >
                {confirmedSubtasks.map((sub, i) => (
                  <View key={`confirmed-${i}`} style={styles.confirmedSubtask}>
                    {editingIndex !== i && (
                      <TouchableOpacity onPress={() => toggleSubtaskChecked(i)}>
                        <MaterialCommunityIcons
                          name={sub.checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                          size={20}
                          color={sub.checked ? '#32C25B' : '#B58B46'}
                        />
                      </TouchableOpacity>
                    )}
                    {editingIndex === i ? (
                      <TextInput
                        style={styles.confirmedSubtaskText}
                        value={sub.text}
                        onChangeText={(text) => updateSubtaskText(i, text)}
                        autoFocus
                        onBlur={() => setEditingIndex(null)}
                      />
                    ) : (
                      <Text style={styles.confirmedSubtaskText}>{sub.text}</Text>
                    )}
                    <TouchableOpacity onPress={() => (editingIndex === i ? setEditingIndex(null) : startEditing(i))}>
                      {editingIndex === i ? (
                        <MaterialCommunityIcons name="arrow-right-circle" size={24} color="#32C25B" />
                      ) : (
                        <Image
                          source={{ uri: 'https://compass-pb-taskly.s3.sa-east-1.amazonaws.com/Vector.png' }}
                          style={{ width: 24, height: 24 }}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>

            {!isLoading && confirmedSubtasks.length > 0 && (
              <TouchableOpacity onPress={addSubtaskInput} style={styles.buttonFloating}>
                <Text style={styles.subtaskButtonText}>ADICIONAR SUBTASK</Text>
              </TouchableOpacity>
            )}
          </View>

          <TabBar
            onClipboardPress={() => console.log('Clipboard')}
            onBellPress={() => console.log('Bell')}
            onMenuPress={() => console.log('Menu')}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screen: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    justifyContent: 'space-between',
  },
  container: {
    paddingLeft: 27,
    paddingRight: 27,
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 4,
  },
  editIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  label1: {
    marginTop: 10,
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
    color: '#AAAAAA',
  },
  label: {
    marginTop: 10,
    fontSize: 18,
    fontFamily: 'Roboto-Regular',
    color: '#AAAAAA',
  },
  value: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Roboto-Regular',
    color: '#1E1E1E',
  },
  description: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: 'Roboto-Regular',
    color: '#1E1E1E',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  chip: {
    backgroundColor: '#E6E0F7',
    marginRight: 8,
    marginTop: 4,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  chipText: {
    fontSize: 12,
    fontFamily: 'Roboto-Base',
    color: '#1E1E1E',
  },
  tagChip: {
    backgroundColor: '#808080',
    marginRight: 8,
    marginTop: 4,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  tagChipText: {
    fontSize: 12,
    fontFamily: 'Roboto-Base',
    color: '#FFFFFF',
    fontWeight: '500',
  },
  priorityChip: {
    marginTop: 4,
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  priorityChipText: {
    fontSize: 12,
    fontFamily: 'Roboto-Base',
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyInfoText: {
    fontStyle: 'italic',
    color: '#999',
    marginTop: 4,
  },
  resolveButton: {
    marginTop: 14,
    borderColor: '#583CC4',
    borderWidth: 2,
    borderRadius: 8,
    justifyContent: 'center',
  },
  resolveButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto-Base',
    color: '#5B3CC4',
    textAlign: 'center',
  },
  subtasksScrollArea: {
    flex: 1,
    maxHeight: 250,
    marginTop: 10,
    paddingBottom: 10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  subtaskInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#5B3CC4',
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    height: 45,
    marginTop: 10,
  },
  confirmedSubtask: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E6E0F7',
  },
  confirmedSubtaskText: {
    flex: 1,
    marginLeft: 8,
    fontFamily: 'Roboto-Base',
    fontSize: 16,
    color: '#000000',
  },
  subtaskButton: {
    marginTop: 25,
    borderRadius: 8,
    backgroundColor: '#583CC4',
    paddingVertical: 2,
  },
  subtaskButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto-Base',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  buttonFloating: {
    position: 'absolute',
    bottom: 70,
    left: 27,
    right: 27,
    marginTop: 14,
    backgroundColor: '#583CC4',
    borderRadius: 8,
    justifyContent: 'center',
    paddingVertical: 2,
    marginBottom: 0,
    zIndex: 10,
  },
});
