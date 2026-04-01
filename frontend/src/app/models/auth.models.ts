export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  department?: string;
  role: 'Admin' | 'Manager' | 'Analyst' | 'Viewer';
}

export interface AuthResponseDto {
  token: string;
  email: string;
  fullName: string;
  roles: string[];
  expiresAt: string;
}
