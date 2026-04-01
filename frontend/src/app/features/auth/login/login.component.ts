import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <h1>Campaign Analytics</h1>
        <p class="subtitle">Sign in to your account</p>

        <div *ngIf="errorMessage" class="alert alert-danger" role="alert" aria-live="assertive">
          {{ errorMessage }}
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
          <div class="form-group">
            <label for="email">
              Email address <span class="required" aria-hidden="true">*</span>
            </label>
            <input
              id="email"
              type="email"
              class="form-control"
              [class.is-invalid]="isFieldInvalid('email')"
              formControlName="email"
              placeholder="you@company.com"
              autocomplete="email"
              aria-required="true"
              [attr.aria-describedby]="isFieldInvalid('email') ? 'email-error' : null"
            />
            <div *ngIf="isFieldInvalid('email')" id="email-error" class="invalid-feedback">
              <span *ngIf="loginForm.get('email')?.hasError('required')">Email is required.</span>
              <span *ngIf="loginForm.get('email')?.hasError('email')">Please enter a valid email address.</span>
            </div>
          </div>

          <div class="form-group">
            <label for="password">
              Password <span class="required" aria-hidden="true">*</span>
            </label>
            <input
              id="password"
              type="password"
              class="form-control"
              [class.is-invalid]="isFieldInvalid('password')"
              formControlName="password"
              placeholder="Minimum 8 characters"
              autocomplete="current-password"
              aria-required="true"
              [attr.aria-describedby]="isFieldInvalid('password') ? 'password-error' : null"
            />
            <div *ngIf="isFieldInvalid('password')" id="password-error" class="invalid-feedback">
              <span *ngIf="loginForm.get('password')?.hasError('required')">Password is required.</span>
              <span *ngIf="loginForm.get('password')?.hasError('minlength')">Password must be at least 8 characters.</span>
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            style="width:100%; margin-top:0.5rem;"
            [disabled]="isLoading"
            aria-label="Sign in"
          >
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  errorMessage = '';
  isLoading = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value as { email: string; password: string };

    this.authService
      .login({ email, password })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          void this.router.navigate(['/campaigns']);
        },
        error: (err: { error?: { message?: string } }) => {
          this.isLoading = false;
          this.errorMessage =
            err?.error?.message ?? 'Login failed. Please check your credentials.';
        }
      });
  }
}
