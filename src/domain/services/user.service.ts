import {
  EmailChangeData,
  PasswordChangeData,
  ProfileUpdateData,
  UserProfile,
} from '../models/user.models'

export interface UserService {
  getCurrentUser(): Promise<UserProfile | null>
  updateProfile(data: ProfileUpdateData): Promise<UserProfile>
  changePassword(data: PasswordChangeData): Promise<void>
  requestEmailChange(data: EmailChangeData): Promise<void>
  confirmEmailChange(token: string): Promise<void>
  requestEmailVerification(): Promise<void>
  verifyEmail(token: string): Promise<void>
}
