import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { AuthResponseDto, LoginDto } from '../../models/auth.models';

const mockAuthResponse: AuthResponseDto = {
  token: 'mock.jwt.token',
  email: 'test@example.com',
  fullName: 'Test User',
  roles: ['Viewer'],
  expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, ApiService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store token in localStorage after successful login', (done) => {
    const dto: LoginDto = { email: 'test@example.com', password: 'Password1!' };

    service.login(dto).subscribe(response => {
      expect(response.token).toBe('mock.jwt.token');
      expect(localStorage.getItem('auth_token')).toBe('mock.jwt.token');
      done();
    });

    const req = httpMock.expectOne('https://localhost:7000/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResponse);
  });

  it('should update currentUser$ with logged-in user after login', (done) => {
    const dto: LoginDto = { email: 'test@example.com', password: 'Password1!' };

    service.login(dto).subscribe(() => {
      service.currentUser$.subscribe(user => {
        expect(user).not.toBeNull();
        expect(user?.email).toBe('test@example.com');
        done();
      });
    });

    const req = httpMock.expectOne('https://localhost:7000/api/auth/login');
    req.flush(mockAuthResponse);
  });

  it('should emit isAuthenticated$ as false when no token is stored', (done) => {
    localStorage.clear();
    // Recreate the service so it reads fresh storage
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, ApiService]
    });
    const freshService = TestBed.inject(AuthService);

    freshService.isAuthenticated$.subscribe(isAuth => {
      expect(isAuth).toBeFalse();
      done();
    });
  });

  it('should clear user and token on logout', (done) => {
    const dto: LoginDto = { email: 'test@example.com', password: 'Password1!' };

    service.login(dto).subscribe(() => {
      service.logout();
      expect(localStorage.getItem('auth_token')).toBeNull();
      service.currentUser$.subscribe(user => {
        expect(user).toBeNull();
        done();
      });
    });

    const req = httpMock.expectOne('https://localhost:7000/api/auth/login');
    req.flush(mockAuthResponse);
  });

  it('should return isAuthenticated$ as true after successful login', (done) => {
    const dto: LoginDto = { email: 'test@example.com', password: 'Password1!' };

    service.login(dto).subscribe(() => {
      service.isAuthenticated$.subscribe(isAuth => {
        expect(isAuth).toBeTrue();
        done();
      });
    });

    const req = httpMock.expectOne('https://localhost:7000/api/auth/login');
    req.flush(mockAuthResponse);
  });

  it('should correctly report hasRole() for the authenticated user', (done) => {
    const adminResponse: AuthResponseDto = { ...mockAuthResponse, roles: ['Admin'] };
    const dto: LoginDto = { email: 'admin@example.com', password: 'Password1!' };

    service.login(dto).subscribe(() => {
      service.hasRole('Admin').subscribe(isAdmin => {
        expect(isAdmin).toBeTrue();
        done();
      });
    });

    const req = httpMock.expectOne('https://localhost:7000/api/auth/login');
    req.flush(adminResponse);
  });
});
