import type { UserProfileDto, UpdateProfileDto } from "../dto/user.dto"
import api from '../../../utils/api.ts';

class UserService {
  private readonly baseUrl = "/profile"

  async getProfile(): Promise<UserProfileDto> {
    try {
      const response = await api.get<UserProfileDto>(this.baseUrl)
      return response.data
    } catch (error) {
      console.error("Erro ao buscar perfil do usuário:", error)
      throw error
    }
  }

  async updateProfile(profileData: UpdateProfileDto): Promise<UserProfileDto> {
    try {
      const response = await api.put<UserProfileDto>(this.baseUrl, profileData)
      return response.data
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      throw error
    }
  }
}

export const userService = new UserService()
