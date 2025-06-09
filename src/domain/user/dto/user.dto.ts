export interface UserProfileDto {
  id?: string
  email?: string
  name?: string
  picture?: string
  createdAt?: string
  updatedAt?: string
}

export interface UpdateProfileDto {
  name?: string
  picture?: string
}
