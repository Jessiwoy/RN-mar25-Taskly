import { useEffect, useState } from 'react';
import { storage } from '../utils/storage';
import { profileService } from '../domain/profile/services/profile.service';

const avatarMap: Record<string, string> = {
  avatar_1: 'https://compass-pb-taskly.s3.sa-east-1.amazonaws.com/avatar1.png',
  avatar_2: 'https://compass-pb-taskly.s3.sa-east-1.amazonaws.com/avatar2.png',
  avatar_3: 'https://compass-pb-taskly.s3.sa-east-1.amazonaws.com/avatar3.png',
  avatar_4: 'https://compass-pb-taskly.s3.sa-east-1.amazonaws.com/avatar4.png',
  avatar_5: 'https://compass-pb-taskly.s3.sa-east-1.amazonaws.com/avatar5.png',
};

interface ProfileData {
  name: string;
  phone_number: string;
  email?: string;
  picture: string;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [avatarSource, setAvatarSource] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile?.picture) {
      const avatar = avatarMap[profile.picture] || null;
      setAvatarSource(avatar);
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const token = await storage.getToken();
      if (!token) return;

      const data = await profileService.getProfile();
      console.log('✅ Dados recebidos do profileService:', data);

      setProfile({
        name: data.name,
        phone_number: data.phone_number,
        email: data.email,
        picture: data.picture,
      });
    } catch (error) {
      console.error('❌ Erro ao carregar o perfil:', error);
    }
  };

  const updateProfile = async (updatedData: { name: string; phone_number: string; email: string; picture: string }) => {
    try {
      const token = await storage.getToken();

      if (!token) throw new Error('Token não encontrado.');

      await profileService.updateProfile({
        name: updatedData.name,
        phone_number: updatedData.phone_number,
        email: updatedData.email,
        picture: updatedData.picture,
      });

      console.log('✅ Perfil atualizado com sucesso via profileService');

      // Buscar dados atualizados após o update
      await fetchProfile();
    } catch (error) {
      console.error('❌ Erro ao atualizar o perfil:', error);
      throw error;
    }
  };

  const deleteProfile = async () => {
    try {
      const token = await storage.getToken();
      if (!token) throw new Error('Token não encontrado.');

      await profileService.deleteProfile();
      console.log('🗑️ Perfil deletado com sucesso.');
      setProfile(null);
      setAvatarSource(null);
    } catch (error) {
      console.error('❌ Erro ao deletar o perfil:', error);
      throw error;
    }
  };

  return { profile, avatarSource, updateProfile, deleteProfile };
}
