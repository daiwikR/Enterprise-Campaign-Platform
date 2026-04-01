import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { AuthResponseDto } from '../../../models/auth.models';
import { CommonModule } from '@angular/common';

const mockAuthResponse: AuthResponseDto = {
  token: 'mock.jwt.token',
  email: 'user@example.com',
  fullName: 'Test User',
  roles: ['Viewer'],
  expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
};

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [
        ReactiveFormsModule,
        CommonModule,
        RouterTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create the login component', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form when both email and password are empty', () => {
    expect(component.loginForm.invalid).toBeTrue();
  });

  it('should show email validation error when email is empty and touched', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.markAsTouched();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#email-error')).toBeTruthy();
  });

  it('should show password validation error when password is too short', () => {
    component.loginForm.get('email')?.setValue('user@example.com');
    component.loginForm.get('password')?.setValue('short');
    component.loginForm.get('password')?.markAsTouched();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#password-error')).toBeTruthy();
  });

  it('should have a valid form when email and password are correctly filled', () => {
    component.loginForm.get('email')?.setValue('user@example.com');
    component.loginForm.get('password')?.setValue('Password1!');
    expect(component.loginForm.valid).toBeTrue();
  });

  it('should navigate to /campaigns on successful login', () => {
    authServiceSpy.login.and.returnValue(of(mockAuthResponse));
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    component.loginForm.get('email')?.setValue('user@example.com');
    component.loginForm.get('password')?.setValue('Password1!');
    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/campaigns']);
  });

  it('should display error message when login fails', () => {
    authServiceSpy.login.and.returnValue(
      throwError(() => ({ error: { message: 'Invalid credentials' } }))
    );

    component.loginForm.get('email')?.setValue('user@example.com');
    component.loginForm.get('password')?.setValue('Password1!');
    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage).toBe('Invalid credentials');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.alert-danger')).toBeTruthy();
  });

  it('should not call authService.login when form is invalid', () => {
    component.onSubmit();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });
});
