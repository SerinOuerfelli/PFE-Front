export interface LoginResponse {
  status: string; // e.g. '2FA_REQUIRED' or 'SUCCESS'
  secret?: string; // optional, only present if 2FA is required
  token?: string; // optional, for successful login
  role: string;
  id: number;
  email: string;
  username: string;
}