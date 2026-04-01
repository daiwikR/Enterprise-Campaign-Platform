import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';
import { BehaviorSubject } from 'rxjs';
import { AuthResponseDto } from './models/auth.models';
import { HttpClientTestingModule } from '@angular/common/http/testing';

const mockUser: AuthResponseDto = {
  token: 'mock.jwt.token',
  email: 'user@example.com',
  fullName: 'Test User',
  roles: ['Viewer'],
  expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
};

describe('AppComponent', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  const userSubject = new BehaviorSubject<AuthResponseDto | null>(null);

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser$: userSubject.asObservable(),
      isAuthenticated$: userSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        RouterTestingModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();
  });

  it('should create the app component', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should show navigation when user is logged in', () => {
    userSubject.next(mockUser);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('nav')).toBeTruthy();
  });

  it('should not show navigation when user is not logged in', () => {
    userSubject.next(null);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('nav')).toBeNull();
  });

  it('should call authService.logout() when logout button is clicked', () => {
    userSubject.next(mockUser);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const logoutBtn = compiled.querySelector('.logout-btn') as HTMLButtonElement;
    logoutBtn?.click();
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });
});
