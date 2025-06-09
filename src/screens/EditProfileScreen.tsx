'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUserProfile } from '../hooks/useUserProfile';
import { useTheme } from '../context/ThemeContext';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';
import FooterNav from '../components/atoms/FooterNav';

type NavigationProp = StackNavigationProp<RootStackParamList, 'EditProfileScreen'>

const avatarMap: Record<string, string> = {
  avatar_1: 'https://compass-pb-taskly.s3.sa-east-1.amazonaws.com/avatar1.png',
  avatar_2: 'https://compass-pb-taskly.s3.sa-east-1.amazonaws.com/avatar2.png',
  avatar_3: 'https://compass-pb-taskly.s3.sa-east-1.amazonaws.com/avatar3.png',
  avatar_4: 'https://compass-pb-taskly.s3.sa-east-1.amazonaws.com/avatar4.png',
  avatar_5: 'https://compass-pb-taskly.s3.sa-east-1.amazonaws.com/avatar5.png',
};

export default function EditProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { profile, updateProfile } = useUserProfile();
  const { isDarkMode } = useTheme();

  const [name, setName] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [picture, setPicture] = useState<string>('avatar_1'); // Valor padrão
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Refs para os inputs
  const nameInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhoneNumber(applyPhoneMask(profile.phone_number || ''));
      setEmail(profile.email || '');
      // Usar picture do perfil ou avatar_1 como padrão
      setPicture(profile.picture || 'avatar_1');
      console.log('Perfil carregado:', profile);
    }
  }, [profile]);

  // Monitorar eventos de teclado
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Função para aplicar máscara no telefone
  const applyPhoneMask = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');

    // Aplica a máscara (XX) X XXXX-XXXX
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 3) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  // Função para remover máscara e retornar apenas números
  const removePhoneMask = (value: string) => {
    return value.replace(/\D/g, '');
  };

  // Função para validar se o telefone tem 11 dígitos
  const isValidPhone = (phone: string) => {
    const numbers = removePhoneMask(phone);
    return numbers.length === 11;
  };

  // Handler para mudança no campo de telefone
  const handlePhoneChange = (text: string) => {
    const masked = applyPhoneMask(text);
    setPhoneNumber(masked);
  };

  // Função para rolar até o input quando focado
  const handleInputFocus = (inputRef: React.RefObject<TextInput | null>) => {
    setTimeout(() => {
      if (scrollViewRef.current && inputRef.current) {
        inputRef.current.measureLayout(
          // @ts-ignore - O tipo está incorreto, mas a função existe
          scrollViewRef.current,
          (x: number, y: number) => {
            scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
          },
          () => console.log('Falha ao medir layout'),
        );
      }
    }, 100);
  };

  // Função para selecionar avatar
  const handleAvatarSelect = (avatarKey: string) => {
    setPicture(avatarKey);
  };

  const handleSave = async () => {
    try {
      // Validar telefone antes de enviar
      if (!isValidPhone(phone_number)) {
        Alert.alert(
          'Erro',
          'Número de telefone inválido. Digite um número com DDD + 9 + 8 dígitos.\nExemplo: (48) 9 9999-9999',
        );
        return;
      }

      // Remover máscara do telefone antes de enviar
      const cleanPhone = removePhoneMask(phone_number);

      // Preparar dados para envio, incluindo TODOS os campos necessários
      const updateData = {
        name,
        phone_number: cleanPhone,
        email, // Incluir email para satisfazer o tipo
        picture, // Incluir picture
      };

      console.log('Dados preparados para envio:', updateData);
      console.log('Picture selecionado:', picture);

      // Debug: verificar se updateProfile está recebendo todos os campos
      console.log('Chamando updateProfile com:', JSON.stringify(updateData, null, 2));

      await updateProfile(updateData);

      Alert.alert('Sucesso', 'Informações atualizadas com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      Alert.alert('Erro', 'Não foi possível atualizar as informações.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#1E1E1E' : '#fff' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: isDarkMode ? '#fff' : '#fff' }]}>‹ VOLTAR</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>EDIÇÃO DE PERFIL</Text>
          <View style={{ width: 80 }} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.labelname, { color: isDarkMode ? '#fff' : '#000' }]}>Nome</Text>
          <TextInput
            ref={nameInputRef}
            style={[
              styles.input,
              { backgroundColor: isDarkMode ? '#333' : '#eee', color: isDarkMode ? '#fff' : '#000' },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Digite seu nome"
            placeholderTextColor={isDarkMode ? '#999' : '#666'}
            onFocus={() => handleInputFocus(nameInputRef)}
          />

          <Text style={[styles.label, { color: isDarkMode ? '#fff' : '#000' }]}>Telefone</Text>
          <TextInput
            ref={phoneInputRef}
            style={[
              styles.input,
              { backgroundColor: isDarkMode ? '#333' : '#eee', color: isDarkMode ? '#fff' : '#000' },
            ]}
            value={phone_number}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            placeholder="(48) 9 9999-9999"
            placeholderTextColor={isDarkMode ? '#999' : '#666'}
            maxLength={16} // (XX) X XXXX-XXXX = 16 caracteres
            onFocus={() => handleInputFocus(phoneInputRef)}
          />

          {/* Indicador visual para formato do telefone */}
          <Text style={[styles.phoneHint, { color: isDarkMode ? '#999' : '#666' }]}>Formato: (DDD) 9 XXXX-XXXX</Text>

          <Text style={[styles.label, { color: isDarkMode ? '#fff' : '#000' }]}>Email</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDarkMode ? '#333' : '#eee',
                color: isDarkMode ? '#999' : '#666',
                opacity: 0.7,
              },
            ]}
            value={email}
            editable={false}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="Email não editável"
            placeholderTextColor={isDarkMode ? '#666' : '#999'}
          />

          {/* Seletor de Avatar */}
          <Text style={[styles.label, { color: isDarkMode ? '#fff' : '#000' }]}>Avatar</Text>
          <View style={styles.avatarContainer}>
            {Object.entries(avatarMap).map(([key, url]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.avatarOption,
                  {
                    borderColor: picture === key ? '#5B3CC4' : isDarkMode ? '#555' : '#ddd',
                    borderWidth: picture === key ? 3 : 1,
                    backgroundColor: isDarkMode ? '#333' : '#fff',
                  },
                ]}
                onPress={() => handleAvatarSelect(key)}
              >
                <Image source={{ uri: url }} style={styles.avatarImage} />
                {picture === key && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Debug: Mostrar avatar selecionado */}
          <Text style={[styles.debugText, { color: isDarkMode ? '#999' : '#666' }]}>Avatar selecionado: {picture}</Text>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Salvar</Text>
          </TouchableOpacity>

          {/* Espaço extra no final para garantir que o conteúdo não fique sob o teclado */}
          <View style={{ height: keyboardVisible ? 300 : 100 }} />
        </ScrollView>

        <FooterNav />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100, // Espaço extra para o footer
  },
  labelname: {
    fontSize: 16,
    marginBottom: 6,
    fontWeight: '600',
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    fontWeight: '600',
    marginTop: 10,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    fontSize: 16,
  },
  phoneHint: {
    fontSize: 12,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  saveButton: {
    marginTop: 30,
    backgroundColor: '#5B3CC4',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  backText: {
    paddingTop: 10,
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    backgroundColor: '#1E1E1E',
    marginRight: 50,
    marginLeft: 5,
    padding: 10,
    borderRadius: 20,
  },
  // Estilos para o seletor de avatar
  avatarContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 10,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#5B3CC4',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  debugText: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
