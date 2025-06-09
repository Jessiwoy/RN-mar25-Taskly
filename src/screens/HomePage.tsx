'use client';

import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import TabBar from '../components/molecules/TabBar';
import CreateTaskModal from './modal/CreateTaskModal';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BiometricModal from './modal/BiometricModal';
import { useAuth } from '../context/AuthContext';
import { tasksService, type TaskDto, type CreateTaskDto, convertDtoToTask, formatDateForAPI } from '../domain/tasks';
import { userService, type UserProfileDto } from '../domain/user';
import { storage } from '../utils/storage';

type HomePageNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HomePage'>

export default function HomePage() {
  const navigation = useNavigation<HomePageNavigationProp>();
  const { signOut } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prazo, setPrazo] = useState('');
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricCredentials, setBiometricCredentials] = useState<{ email: string; password: string } | null>(null);

  const verifyAuth = useCallback(async () => {
    const token = await storage.getToken();
    if (!token) {
      signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });
    }
  }, [signOut, navigation]);

  const checkBiometricAndAvatarFlow = useCallback(async () => {
    try {
      const firstLogin = await AsyncStorage.getItem('firstLogin');
      if (firstLogin === 'true') {
        await AsyncStorage.removeItem('firstLogin');
        navigation.replace('AvatarSelectionScreen');
        return;
      }

      const enabled = await AsyncStorage.getItem('biometricEnabled');
      const remember = await AsyncStorage.getItem('rememberMe');
      const creds = await AsyncStorage.getItem('biometricCredentials');

      if (!enabled && remember && creds) {
        setBiometricCredentials(JSON.parse(creds));
        setShowBiometricModal(true);
      }
    } catch (error) {
      console.error('Erro ao verificar fluxo de login:', error);
    }
  }, [navigation]);

  const loadUserProfile = useCallback(async () => {
    try {
      const profileData = await userService.getProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Erro ao carregar o perfil:', error);
    }
  }, []);

  const loadTasksFromAPI = useCallback(async () => {
    setIsLoading(true);
    try {
      const tasksData = await tasksService.getAllTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error('Erro ao buscar tarefas da API:', error);
      Alert.alert('Erro', 'Não foi possível carregar as tarefas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasksFromAPI();
  }, [loadTasksFromAPI]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  useEffect(() => {
    checkBiometricAndAvatarFlow();
  }, [checkBiometricAndAvatarFlow]);

  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  const avatarMap: Record<string, string> = {
    avatar_1: 'https://compass-pb-taskly.s3.sa-east-1.amazonaws.com/avatar1.png',
    avatar_2: 'https://compass-pb-taskly.s3.sa-east-1.amazonaws.com/avatar2.png',
    avatar_3: 'https://compass-pb-taskly.s3.sa-east-1.amazonaws.com/avatar3.png',
    avatar_4: 'https://compass-pb-taskly.s3.sa-east-1.amazonaws.com/avatar4.png',
    avatar_5: 'https://compass-pb-taskly.s3.sa-east-1.amazonaws.com/avatar5.png',
  };

  const sendTaskToAPI = async (title: string, description: string, deadline: string) => {
    try {
      const formattedDeadline = formatDateForAPI(deadline);

      const taskData: CreateTaskDto = {
        title,
        description,
        deadline: formattedDeadline,
        done: false,
      };

      console.log('Conteúdo enviado no POST:', taskData);

      const newTask = await tasksService.createTask(taskData);
      console.log('Resposta da API:', newTask);

      const normalizedTask: TaskDto = {
        id: newTask.id || '',
        title: newTask.title || title,
        description: newTask.description || description,
        deadline: newTask.deadline || formattedDeadline,
        status: newTask.status || 'pendente',
        done: newTask.done || false,
        tags: newTask.tags || [],
        subtasks: newTask.subtasks || [],
        prioridade: newTask.prioridade,
        createdAt: newTask.createdAt,
        updatedAt: newTask.updatedAt,
        prazo: newTask.prazo,
      };

      setTasks((prev) => [...prev, normalizedTask]);
    } catch (error) {
      console.error('Erro no envio de tarefa:', error);
      Alert.alert('Erro', 'Não foi possível criar a tarefa');
    }
  };

  const handleCreate = async () => {
    if (!titulo || !descricao || !prazo) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    await sendTaskToAPI(titulo, descricao, prazo);
    setTitulo('');
    setDescricao('');
    setPrazo('');
    setModalVisible(false);
  };

  const toggleStatus = async (id: string) => {
    try {
      const currentTask = tasks.find((task) => task.id === id);
      if (!currentTask) {return;}

      const newStatus = currentTask.status === 'pendente' ? 'concluida' : 'pendente';

      setTasks((prev) =>
        prev.map((task) =>
          task.id === id
            ? {
              ...task,
              status: newStatus,
              done: newStatus === 'concluida',
            }
            : task,
        ),
      );

      await tasksService.updateTask(id, {
        status: newStatus,
        done: newStatus === 'concluida',
        deadline: currentTask.deadline || formatDateForAPI(new Date().toISOString()),
      });

      console.log(`Status da task ${id} alterado para: ${newStatus}`);
    } catch (error) {
      console.error('Erro ao atualizar status da task:', error);
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id
            ? {
              ...task,
              status: task.status === 'pendente' ? 'concluida' : 'pendente',
              done: task.status !== 'pendente',
            }
            : task,
        ),
      );
      Alert.alert('Erro', 'Não foi possível atualizar o status da tarefa');
    }
  };

  const renderTask = ({ item }: { item: TaskDto }) => {
    console.log('Renderizando task:', {
      id: item.id,
      title: item.title,
      description: item.description,
      status: item.status,
      done: item.done,
      deadline: item.deadline,
    });

    return (
      <View style={styles.cardTask}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title || 'Título não disponível'}</Text>
          <TouchableOpacity style={styles.checkbox} onPress={() => toggleStatus(item.id)}>
            {(item.status === 'concluida' || item.done === true) && (
              <Image
                source={{ uri: 'https://compass-pb-taskly.s3.sa-east-1.amazonaws.com/checkbox.png' }}
                style={{ width: 23, height: 23 }}
                onError={() => console.log('Erro ao carregar imagem do checkbox')}
              />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.cardDescription}>{item.description || 'Descrição não disponível'}</Text>
        {item.deadline && <Text style={styles.cardDeadline}>Prazo: {item.deadline}</Text>}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() =>
            navigation.navigate('TaskStack', {
              screen: 'TaskDetail',
              params: { task: convertDtoToTask(item) },
            })
          }
        >
          <Text style={styles.detailsButtonText}>VER DETALHES</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>TASKLY</Text>
          <Avatar.Image
            size={45}
            source={{ uri: avatarMap[profile?.picture || 'avatar_1'] }}
          />
        </View>

        <TouchableOpacity style={styles.filtro}>
          <Image
            source={{ uri: 'https://compass-pb-taskly.s3.sa-east-1.amazonaws.com/filtro.png' }}
            style={{ width: 20, height: 20 }}
          />
        </TouchableOpacity>

        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#583CC4" />
          </View>
        ) : tasks.length === 0 ? (
          <View style={styles.card}>
            <Image source={{ uri: 'https://compass-pb-taskly.s3.sa-east-1.amazonaws.com/sad.png' }}
                   style={{ width: 120, height: 120 }}
            />
            <Text style={styles.label}>No momento você não possui tarefa</Text>
            <TouchableOpacity style={styles.buttonEmptyState} onPress={() => setModalVisible(true)}>
              <Text style={styles.resolveButtonText}>Criar Tarefas</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={renderTask}
            contentContainerStyle={styles.taskList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {!isLoading && tasks.length !== 0 && (
        <TouchableOpacity style={styles.buttonFloating} onPress={() => setModalVisible(true)}>
          <Text style={styles.resolveButtonText}>Criar Tarefas</Text>
        </TouchableOpacity>
      )}

      <CreateTaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        titulo={titulo}
        descricao={descricao}
        prazo={prazo}
        onChangeTitulo={setTitulo}
        onChangeDescricao={setDescricao}
        onChangePrazo={setPrazo}
        onSubmit={handleCreate}
      />

      {showBiometricModal && biometricCredentials && (
        <BiometricModal
          credentials={biometricCredentials}
          visible={showBiometricModal}
          onClose={() => setShowBiometricModal(false)}
        />
      )}

      <TabBar
        onClipboardPress={() => console.log('Clipboard')}
        onBellPress={() => console.log('Bell')}
        onMenuPress={() => console.log('Menu')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    paddingHorizontal: 25,
  },
  container: {
    flex: 1,
  },
  header: {
    marginTop: 20,
    marginBottom: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filtro: {
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Roboto-Bold',
    color: '#1E1E1E',
  },
  label: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Roboto-Base',
    color: '#AAAAAA',
  },
  card: {
    alignItems: 'center',
  },
  buttonEmptyState: {
    marginTop: 14,
    backgroundColor: '#583CC4',
    borderRadius: 8,
    justifyContent: 'center',
    paddingVertical: 10,
    width: '100%',
    marginBottom: 10,
  },
  buttonFloating: {
    position: 'absolute',
    bottom: 70,
    left: 27,
    right: 27,
    backgroundColor: '#583CC4',
    borderRadius: 8,
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 10,
    zIndex: 10,
  },
  resolveButtonText: {
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cardTask: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
    color: '#1E1E1E',
  },
  cardDescription: {
    marginTop: 6,
    fontSize: 14,
    color: '#4F4F4F',
  },
  cardDeadline: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  taskList: {
    gap: 16,
    paddingBottom: 120,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#B58B46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 4,
  },
  tag: {
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    color: '#555',
  },
  detailsButton: {
    marginTop: 12,
    alignSelf: 'center',
    backgroundColor: '#5B3CC4',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
  },
});
