import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponseDto, LoginDto, RegisterDto } from '../../models/auth.models';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly currentUserSubject: BehaviorSubject<AuthResponseDto | null>;

  readonly currentUser$: Observable<AuthResponseDto | null>;
  readonly isAuthenticated$: Observable<boolean>;

  constructor(private apiService: ApiService) {
    const storedUser = this.loadUserFromStorage();
    this.currentUserSubject = new BehaviorSubject<AuthResponseDto | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.isAuthenticated$ = this.currentUser$.pipe(
      map(user => user !== null && this.isTokenValid(user))
    );
  }

  get currentUser(): AuthResponseDto | null {
    return this.currentUserSubject.value;
  }

  login(dto: LoginDto): Observable<AuthResponseDto> {
    return this.apiService.post<AuthResponseDto>('/api/auth/login', dto).pipe(
      tap(response => this.storeAuthData(response))
    );
  }

  register(dto: RegisterDto): Observable<AuthResponseDto> {
    return this.apiService.post<AuthResponseDto>('/api/auth/register', dto).pipe(
      tap(response => this.storeAuthData(response))
    );
  }

  logout(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    this.currentUserSubject.next(null);
  }

  hasRole(role: string): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => user !== null && user.roles.includes(role))
    );
  }

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  private storeAuthData(response: AuthResponseDto): void {
    localStorage.setItem(AUTH_TOKEN_KEY, response.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response));
    this.currentUserSubject.next(response);
  }

  private loadUserFromStorage(): AuthResponseDto | null {
    try {
      const raw = localStorage.getItem(AUTH_USER_KEY);
      if (!raw) return null;
      const user: AuthResponseDto = JSON.parse(raw) as AuthResponseDto;
      return this.isTokenValid(user) ? user : null;
    } catch {
      return null;
    }
  }

  private isTokenValid(user: AuthResponseDto): boolean {
    if (!user.token || !user.expiresAt) return false;
    return new Date(user.expiresAt) > new Date();
  }
}
