import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CampaignService } from '../../../core/services/campaign.service';
import { CampaignCreateDto, CampaignUpdateDto } from '../../../models/campaign.models';

function endDateAfterStartDate(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value as string | null;
  const end = group.get('endDate')?.value as string | null;
  if (start && end && new Date(end) <= new Date(start)) {
    return { endDateBeforeStartDate: true };
  }
  return null;
}

@Component({
  selector: 'app-campaign-form',
  template: `
    <div class="campaign-form">
      <h2>{{ isEditMode ? 'Edit Campaign' : 'New Campaign' }}</h2>

      <div *ngIf="errorMessage" class="error-banner" role="alert">
        {{ errorMessage }}
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

        <!-- Name -->
        <div class="form-field">
          <label for="name">Name <span aria-hidden="true">*</span></label>
          <input
            id="name"
            type="text"
            formControlName="name"
            [attr.aria-invalid]="isInvalid('name')"
            aria-describedby="name-error"
          />
          <span id="name-error" class="field-error" *ngIf="isInvalid('name')">
            <span *ngIf="form.get('name')?.errors?.['required']">Name is required.</span>
            <span *ngIf="form.get('name')?.errors?.['maxlength']">Name cannot exceed 200 characters.</span>
          </span>
        </div>

        <!-- Description -->
        <div class="form-field">
          <label for="description">Description</label>
          <textarea
            id="description"
            formControlName="description"
            rows="3"
            [attr.aria-invalid]="isInvalid('description')"
            aria-describedby="description-error"
          ></textarea>
          <span id="description-error" class="field-error" *ngIf="isInvalid('description')">
            Description cannot exceed 1000 characters.
          </span>
        </div>

        <!-- Start Date -->
        <div class="form-field">
          <label for="startDate">Start Date <span aria-hidden="true">*</span></label>
          <input
            id="startDate"
            type="datetime-local"
            formControlName="startDate"
            [attr.aria-invalid]="isInvalid('startDate')"
            aria-describedby="startDate-error"
          />
          <span id="startDate-error" class="field-error" *ngIf="isInvalid('startDate')">
            Start date is required.
          </span>
        </div>

        <!-- End Date -->
        <div class="form-field">
          <label for="endDate">End Date</label>
          <input
            id="endDate"
            type="datetime-local"
            formControlName="endDate"
            aria-describedby="endDate-error"
          />
          <span id="endDate-error" class="field-error"
            *ngIf="form.errors?.['endDateBeforeStartDate'] && form.get('endDate')?.touched">
            End date must be after start date.
          </span>
        </div>

        <!-- Budget -->
        <div class="form-field">
          <label for="budget">Budget ($)</label>
          <input
            id="budget"
            type="number"
            formControlName="budget"
            min="0"
            step="0.01"
            [attr.aria-invalid]="isInvalid('budget')"
            aria-describedby="budget-error"
          />
          <span id="budget-error" class="field-error" *ngIf="isInvalid('budget')">
            Budget must be a non-negative number.
          </span>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-primary" [disabled]="submitting">
            {{ submitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Campaign') }}
          </button>
          <button type="button" class="btn-secondary" (click)="onCancel()">Cancel</button>
        </div>

      </form>
    </div>
  `
})
export class CampaignFormComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  isEditMode = false;
  campaignId: number | null = null;
  submitting = false;
  errorMessage = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly campaignService: CampaignService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.buildForm();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.campaignId = Number(idParam);
      this.loadCampaign(this.campaignId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    this.form = this.fb.group(
      {
        name: ['', [Validators.required, Validators.maxLength(200)]],
        description: ['', [Validators.maxLength(1000)]],
        startDate: ['', [Validators.required]],
        endDate: [''],
        budget: [null, [Validators.min(0)]]
      },
      { validators: endDateAfterStartDate }
    );
  }

  private loadCampaign(id: number): void {
    this.campaignService.getById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: campaign => {
        this.form.patchValue({
          name: campaign.name,
          description: campaign.description ?? '',
          startDate: campaign.startDate ? campaign.startDate.slice(0, 16) : '',
          endDate: campaign.endDate ? campaign.endDate.slice(0, 16) : '',
          budget: campaign.budget
        });
      },
      error: () => {
        this.errorMessage = 'Failed to load campaign for editing.';
      }
    });
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && control.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const raw = this.form.value as {
      name: string;
      description: string;
      startDate: string;
      endDate: string;
      budget: number | null;
    };

    if (this.isEditMode && this.campaignId !== null) {
      const dto: CampaignUpdateDto = {
        name: raw.name || undefined,
        description: raw.description || undefined,
        startDate: raw.startDate ? new Date(raw.startDate).toISOString() : undefined,
        endDate: raw.endDate ? new Date(raw.endDate).toISOString() : undefined,
        budget: raw.budget ?? undefined
      };
      this.campaignService.update(this.campaignId, dto).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => void this.router.navigate(['/campaigns']),
        error: () => {
          this.errorMessage = 'Failed to update campaign.';
          this.submitting = false;
        }
      });
    } else {
      const dto: CampaignCreateDto = {
        name: raw.name,
        description: raw.description || undefined,
        startDate: new Date(raw.startDate).toISOString(),
        endDate: raw.endDate ? new Date(raw.endDate).toISOString() : undefined,
        budget: raw.budget ?? undefined
      };
      this.campaignService.create(dto).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => void this.router.navigate(['/campaigns']),
        error: () => {
          this.errorMessage = 'Failed to create campaign.';
          this.submitting = false;
        }
      });
    }
  }

  onCancel(): void {
    void this.router.navigate(['/campaigns']);
  }
}
