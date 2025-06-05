'use client';

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import type { RootStackParamList } from '../navigation/types';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import Header from '../components/molecules/Header';
import TabBar from '../components/molecules/TabBar';
import { tasksService, type UpdateTaskDto, convertDtoToTask, formatDateForAPI, convertTaskToDto } from '../domain/tasks';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'TaskDetail'>
type EditTaskRouteProp = RouteProp<RootStackParamList, 'EditTask'>

function removeEmojis(text: string) {
  return text.replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|\uFE0F|\u200D|[\u2600-\u26FF])/g,
    '',
  );
}

function removeNumbers(text: string) {
  return text.replace(/[^A-Za-zÀ-ÿ\s]/g, '');
}

function isValidDate(dateStr: string): boolean {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;

  if (!regex.test(dateStr)) {
    return false;
  }
  const [_, dayStr, monthStr, yearStr] = dateStr.match(regex) || [];
  const day = Number.parseInt(dayStr, 10);
  const month = Number.parseInt(monthStr, 10) - 1; // meses são de 0 a 11
  const year = Number.parseInt(yearStr, 10);

  const date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
}

// Função para converter prioridade string para número
function convertPriorityToNumber(priority: string): number | undefined {
  switch (priority) {
    case 'ALTA':
      return 3;
    case 'MEDIA':
      return 2;
    case 'BAIXA':
      return 1;
    default:
      return undefined;
  }
}

// Função para converter prioridade número para string (para exibição)
function convertPriorityToString(priority: string | number | undefined): 'ALTA' | 'MEDIA' | 'BAIXA' | '' {
  if (typeof priority === 'number') {
    switch (priority) {
      case 3:
        return 'ALTA';
      case 2:
        return 'MEDIA';
      case 1:
        return 'BAIXA';
      default:
        return '';
    }
  }
  if (typeof priority === 'string') {
    const upperPriority = priority.toUpperCase();
    if (upperPriority === 'ALTA' || upperPriority === 'MEDIA' || upperPriority === 'BAIXA') {
      return upperPriority as 'ALTA' | 'MEDIA' | 'BAIXA';
    }
  }
  return '';
}

export default function EditTaskScreen() {
  const route = useRoute<EditTaskRouteProp>();
  const { task } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [tagInput, setTagInput] = useState('');
  const [tagsList, setTagsList] = useState<string[]>(task.tags || []);

  // Verificar tanto priority quanto prioridade para compatibilidade
  const initialPriority = (task as any).priority || task.prioridade;
  const [selectedPriority, setSelectedPriority] = useState<'ALTA' | 'MEDIA' | 'BAIXA' | ''>(
    convertPriorityToString(initialPriority),
  );

  // Usar prazo como fallback se deadline não existir
  const [dueDate, setDueDate] = useState(task.prazo || (task as any).deadline || '');
  const [dateError, setDateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag !== '' && !tagsList.includes(trimmedTag)) {
      const newTagsList = [...tagsList, trimmedTag];
      setTagsList(newTagsList);
      setTagInput('');
      console.log('Tag adicionada:', trimmedTag, 'Lista atual:', newTagsList);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTagsList = tagsList.filter((tag) => tag !== tagToRemove);
    setTagsList(newTagsList);
    console.log('Tag removida:', tagToRemove, 'Lista atual:', newTagsList);
  };

  const handleConfirmEdit = async () => {
    try {
      if (isSubmitting) {return;}
      setIsSubmitting(true);

      // Validar data se foi preenchida
      if (dueDate && !isValidDate(dueDate)) {
        setDateError('Data inválida');
        setIsSubmitting(false);
        return;
      }

      // Formatar a data para o formato esperado pela API
      const formattedDeadline = dueDate ? formatDateForAPI(dueDate) : undefined;

      // Converter prioridade para número
      const priorityNumber = selectedPriority ? convertPriorityToNumber(selectedPriority) : undefined;

      // Dados que serão enviados para a API usando o serviço centralizado
      const updatedTaskData: UpdateTaskDto = {
        title,
        description,
        tags: tagsList, // Usar a lista de tags atualizada
        done: task.done, // mantém o valor original
        priority: priorityNumber as any, // Enviar como número usando o campo "priority"
        deadline: formattedDeadline, // Incluir deadline para a API
      };

      console.log('Enviando atualização para a API:', updatedTaskData);
      console.log('Tags sendo enviadas:', tagsList);
      console.log('Prioridade sendo enviada como priority:', priorityNumber);

      // Atualiza os dados usando o serviço centralizado
      const updatedTaskDto = await tasksService.updateTask(task.id, updatedTaskData);
      console.log('Resposta da API:', updatedTaskDto);

      // Converter a task original para DTO e depois mesclar com os dados atualizados
      const originalTaskDto = convertTaskToDto(task);

      // Criar TaskDto atualizado com tipos corretos
      const finalTaskDto = {
        ...originalTaskDto,
        title: updatedTaskDto.title || title,
        description: updatedTaskDto.description || description,
        tags: tagsList, // Usar as tags do estado local
        done: updatedTaskDto.done !== undefined ? updatedTaskDto.done : task.done,
        status: updatedTaskDto.status || originalTaskDto.status,
        priority: priorityNumber as any, // Usar a prioridade numérica no campo priority
        prioridade: priorityNumber as any, // Manter também no campo prioridade para compatibilidade
        prazo: dueDate || originalTaskDto.prazo,
        deadline: formattedDeadline || updatedTaskDto.deadline,
        // Manter outros campos da resposta da API
        createdAt: updatedTaskDto.createdAt || originalTaskDto.createdAt,
        updatedAt: updatedTaskDto.updatedAt,
        subtasks: updatedTaskDto.subtasks || originalTaskDto.subtasks,
      };

      console.log('TaskDto final:', finalTaskDto);

      // Navega de volta para a tela de detalhes com a tarefa atualizada
      navigation.navigate('TaskDetail', { task: convertDtoToTask(finalTaskDto) });
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a tarefa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.viewOne}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.screen}>
            {/* Header */}
            <View style={styles.container}>
              <Header onBack={() => navigation.goBack()} />
              <View style={styles.card}>
                <Text style={styles.label1}>Título</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite aqui"
                  maxLength={100}
                  value={title}
                  onChangeText={(text) => setTitle(removeNumbers(removeEmojis(text)))}
                />
                <Text style={styles.label}>Descrição</Text>
                <TextInput
                  style={styles.inputDescription}
                  multiline
                  maxLength={200}
                  placeholder="Digite sua mensagem..."
                  value={description}
                  onChangeText={(text) => setDescription(removeEmojis(text))}
                />
                <Text style={styles.label}>Tags</Text>
                <View style={styles.tagInputContainer}>
                  <TextInput
                    style={styles.tagInput}
                    placeholder="Digite a tag"
                    value={tagInput}
                    autoCapitalize="characters"
                    onChangeText={(text) => setTagInput(text.replace(/\s/g, '').toUpperCase())}
                    onSubmitEditing={handleAddTag}
                    returnKeyType="done"
                  />
                  <TouchableOpacity onPress={handleAddTag} style={styles.tagAddButton}>
                    <MaterialCommunityIcons name="arrow-right-circle" size={24} color="#32C25B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.chips}>
                  {tagsList.map((tag, index) => (
                    <View key={`${tag}-${index}`} style={styles.chip}>
                      <Text style={styles.chipText}>{tag}</Text>
                      <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                        <MaterialCommunityIcons name="close-circle" size={16} color="#C00" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <Text style={styles.label}>Prioridade</Text>
                <View style={styles.priorityContainer}>
                  {['ALTA', 'MEDIA', 'BAIXA'].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[styles.priorityOption, selectedPriority === level && styles.prioritySelected]}
                      onPress={() => setSelectedPriority(level as 'ALTA' | 'MEDIA' | 'BAIXA')}
                    >
                      <Text style={[styles.priorityText, selectedPriority === level && styles.priorityTextSelected]}>
                        {level === 'MEDIA' ? 'MÉDIA' : level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View>
                  <Text style={styles.label}>Prazo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="DD/MM/AAAA"
                    value={dueDate}
                    onChangeText={(text) => {
                      setDueDate(text);
                      if (text && !isValidDate(text)) {
                        setDateError('Data inválida');
                      } else {
                        setDateError('');
                      }
                    }}
                    keyboardType="numeric"
                  />
                  {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}
                </View>
              </View>
              {/* Botão Subtask */}
              <View style={styles.buttontouch}>
                <TouchableOpacity
                  style={styles.subtaskButton1}
                  onPress={() => navigation.navigate('TaskDetail', { task })}
                >
                  <Text style={styles.subtaskButtonText1}>CANCELAR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.subtaskButton2, isSubmitting && styles.disabledButton]}
                  onPress={handleConfirmEdit}
                  disabled={isSubmitting}
                >
                  <Text style={styles.subtaskButtonText2}>{isSubmitting ? 'ENVIANDO...' : 'CONFIRMAR'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {/* Barra de Navegação Inferior */}
      <TabBar
        onClipboardPress={() => console.log('Clipboard')}
        onBellPress={() => console.log('Bell')}
        onMenuPress={() => console.log('Menu')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  viewOne: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  screen: {
    backgroundColor: '#F4F4F4',
    justifyContent: 'space-between',
  },
  container: {
    paddingLeft: 27,
    paddingRight: 27,
  },
  input: {
    height: 41,
    marginBottom: 10,
    borderColor: '#5B3CC4',
    borderWidth: 2,
    borderRadius: 8,
    fontSize: 16,
    fontFamily: 'Roboto-Base',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  inputDescription: {
    minHeight: 45,
    marginBottom: 8,
    borderColor: '#5B3CC4',
    borderWidth: 2,
    borderRadius: 8,
    fontSize: 16,
    fontFamily: 'Roboto-Base',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 4,
    minHeight: 100,
  },
  label1: {
    marginTop: 10,
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
    color: '#AAAAAA',
  },
  label: {
    fontSize: 18,
    fontFamily: 'Roboto-Regular',
    color: '#AAAAAA',
  },
  description: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: 'Roboto-Regular',
    color: '#1E1E1E',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#5B3CC4',
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    height: 45,
    marginBottom: 8,
  },
  tagInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
  },
  tagAddButton: {
    marginLeft: 6,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6E0F7',
    marginRight: 8,
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  chipText: {
    fontSize: 16,
    fontFamily: 'Roboto-Base',
    color: '#1E1E1E',
    marginRight: 4,
  },
  buttontouch: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 2,
    marginTop: 2,
    marginBottom: 8,
  },
  priorityOption: {
    borderWidth: 2,
    borderColor: '#5B3CC4',
    borderRadius: 8,
    paddingHorizontal: 25,
  },
  prioritySelected: {
    backgroundColor: '#32C26B',
    borderColor: '#32C26B',
  },
  priorityText: {
    color: '#5B3CC4',
    fontFamily: 'Roboto-Base',
    fontSize: 16,
  },
  priorityTextSelected: {
    color: '#fff',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 4,
  },
  subtaskButton1: {
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#583CC4',
  },
  subtaskButton2: {
    borderRadius: 8,
    backgroundColor: '#583CC4',
    paddingVertical: 7,
    paddingHorizontal: 20,
  },
  disabledButton: {
    backgroundColor: '#9B8DD8',
  },
  subtaskButtonText1: {
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
    color: '#5B3CC4',
    textAlign: 'center',
  },
  subtaskButtonText2: {
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
