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

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'TaskDetail'>

export default function TaskDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<TaskDetailRouteProp>();
  const { task } = route.params;
  const [subtaskInputs, setSubtaskInputs] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [confirmedSubtasks, setConfirmedSubtasks] = useState<{ text: string; checked: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Converter o task original para TaskDto
  const [currentTask, setCurrentTask] = useState<TaskDto>(convertTaskToDto(task));

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setIsLoading(true);

        // Usando o serviço centralizado em vez de fetch direto
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
      // Monta nova subtask
      const newSubtask: SubtaskDto = { title: inputText, done: false };

      // Busca subtasks atuais e adiciona a nova
      const updatedSubtasks = [...confirmedSubtasks.map((s) => ({ title: s.text, done: s.checked })), newSubtask];

      // Usa o serviço centralizado para atualizar
      await tasksService.updateSubtasks(task.id, updatedSubtasks);

      // Limpa input e atualiza estado local
      const updatedInputs = [...subtaskInputs];
      updatedInputs.splice(index, 1);
      setSubtaskInputs(updatedInputs);

      setConfirmedSubtasks((prev) => [...prev, { text: inputText, checked: false }]);
    } catch (error) {
      console.error('Erro ao enviar subtask para API:', error);
      Alert.alert('Erro', 'Erro ao criar subtask');
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

      // Atualiza no backend
      try {
        const updatedSubtasks = updated.map((s) => ({ title: s.text, done: s.checked }));
        await tasksService.updateSubtasks(task.id, updatedSubtasks);
      } catch (error) {
        console.error('Erro ao atualizar status da subtask:', error);
        // Reverte o estado local em caso de erro
        updated[index].checked = !updated[index].checked;
        setConfirmedSubtasks([...updated]);
        Alert.alert('Erro', 'Não foi possível atualizar a subtask');
      }
    } else {
      console.warn('Formato inválido de subtask em:', updated[index]);
    }
  };

  const deleteTask = async () => {
    try {
      // Usa o serviço centralizado para deletar
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

  const updateSubtaskText = async (index: number, newText: string) => {
    try {
      const updated = [...confirmedSubtasks];
      updated[index].text = newText;
      setConfirmedSubtasks(updated);

      // Atualiza no backend
      const updatedSubtasks = updated.map((s) => ({ title: s.text, done: s.checked }));
      await tasksService.updateSubtasks(task.id, updatedSubtasks);
    } catch (error) {
      console.error('Erro ao atualizar texto da subtask:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a subtask');
    }
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
  };

  // Função para obter estilo da prioridade baseado no valor numérico
  function getPriorityStyle(task: TaskDto) {
    // Verificar tanto priority quanto prioridade
    const priorityValue = (task as any).priority !== undefined ? (task as any).priority : task.prioridade;

    console.log('Prioridade recebida:', priorityValue, 'Tipo:', typeof priorityValue);

    if (priorityValue === undefined || priorityValue === null) {
      return null;
    }

    // Converter para número se for string
    let priorityNumber: number;
    if (typeof priorityValue === 'string') {
      priorityNumber = Number.parseInt(priorityValue, 10);
      if (Number.isNaN(priorityNumber)) {
        // Se não conseguir converter, tentar mapear strings
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

    // Mapear números para cores e textos
    switch (priorityNumber) {
      case 3:
        return { backgroundColor: '#32C25B', text: 'ALTA' }; // Verde
      case 2:
        return { backgroundColor: '#FFD93D', text: 'MÉDIA' }; // Amarelo
      case 1:
        return { backgroundColor: '#FF6B6B', text: 'BAIXA' }; // Vermelho
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
          {/* Header e Conteúdo */}
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
                <Image source={require('../assets/avatars/Vector1.png')} />
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

            {/* Inputs de novas subtasks */}
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
                {/* Subtasks confirmadas */}
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
                        <Image source={require('../assets/avatars/Vector.png')} />
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Botão Adicionar Subtask */}
            {!isLoading && confirmedSubtasks.length > 0 && (
              <TouchableOpacity onPress={addSubtaskInput} style={styles.buttonFloating}>
                <Text style={styles.subtaskButtonText}>ADICIONAR SUBTASK</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Barra de Navegação Inferior */}
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

// Mantendo os mesmos estilos do arquivo original com adições para tags e prioridades
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
  // Estilos para tags cinzas
  tagChip: {
    backgroundColor: '#808080', // Cinza
    marginRight: 8,
    marginTop: 4,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  tagChipText: {
    fontSize: 12,
    fontFamily: 'Roboto-Base',
    color: '#FFFFFF', // Letras brancas
    fontWeight: '500',
  },
  // Estilos para prioridade
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
    color: '#FFFFFF', // Letras brancas para todas as prioridades
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
