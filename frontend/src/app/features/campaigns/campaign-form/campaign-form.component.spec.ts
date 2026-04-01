import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CampaignFormComponent } from './campaign-form.component';
import { CampaignService } from '../../../core/services/campaign.service';
import { CommonModule } from '@angular/common';

describe('CampaignFormComponent — Create mode', () => {
  let component: CampaignFormComponent;
  let fixture: ComponentFixture<CampaignFormComponent>;
  let mockCampaignService: jasmine.SpyObj<CampaignService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockCampaignService = jasmine.createSpyObj('CampaignService', ['create', 'update', 'getById']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [CampaignFormComponent],
      imports: [ReactiveFormsModule, CommonModule],
      providers: [
        { provide: CampaignService, useValue: mockCampaignService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CampaignFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be invalid when name is empty', () => {
    component.form.get('name')?.setValue('');
    component.form.get('startDate')?.setValue('2026-05-01T00:00');
    expect(component.form.invalid).toBeTrue();
  });

  it('should be invalid when endDate is before startDate', () => {
    component.form.patchValue({
      name: 'Test Campaign',
      startDate: '2026-06-01T00:00',
      endDate: '2026-05-01T00:00'
    });
    expect(component.form.errors?.['endDateBeforeStartDate']).toBeTrue();
  });

  it('should be valid with required fields correctly filled', () => {
    component.form.patchValue({
      name: 'Valid Campaign',
      startDate: '2026-05-01T00:00',
      endDate: '2026-06-01T00:00',
      budget: 10000
    });
    expect(component.form.valid).toBeTrue();
  });

  it('should call campaignService.create on valid form submit in create mode', () => {
    mockCampaignService.create.and.returnValue(of({
      campaignId: 1, name: 'Valid Campaign', description: null,
      startDate: '2026-05-01T00:00:00Z', endDate: null,
      status: 'Draft', budget: 10000, spentAmount: 0,
      createdAt: '2026-04-01T00:00:00Z', createdByUserId: 'abc'
    }));

    component.form.patchValue({ name: 'Valid Campaign', startDate: '2026-05-01T00:00' });
    component.onSubmit();

    expect(mockCampaignService.create).toHaveBeenCalledOnce();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/campaigns']);
  });

  it('should show error message when create fails', () => {
    mockCampaignService.create.and.returnValue(throwError(() => new Error('Server error')));
    component.form.patchValue({ name: 'Campaign', startDate: '2026-05-01T00:00' });
    component.onSubmit();
    expect(component.errorMessage).toBeTruthy();
    expect(component.submitting).toBeFalse();
  });

  it('should mark all fields as touched on invalid submit', () => {
    component.form.get('name')?.setValue('');
    component.onSubmit();
    expect(component.form.get('name')?.touched).toBeTrue();
  });
});

describe('CampaignFormComponent — Edit mode', () => {
  let component: CampaignFormComponent;
  let fixture: ComponentFixture<CampaignFormComponent>;
  let mockCampaignService: jasmine.SpyObj<CampaignService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockCampaignService = jasmine.createSpyObj('CampaignService', ['create', 'update', 'getById']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockCampaignService.getById.and.returnValue(of({
      campaignId: 42, name: 'Existing Campaign', description: 'Desc',
      startDate: '2026-05-01T00:00:00Z', endDate: '2026-06-30T23:59:59Z',
      status: 'Active', budget: 50000, spentAmount: 5000,
      createdAt: '2026-04-01T00:00:00Z', createdByUserId: 'xyz'
    }));

    await TestBed.configureTestingModule({
      declarations: [CampaignFormComponent],
      imports: [ReactiveFormsModule, CommonModule],
      providers: [
        { provide: CampaignService, useValue: mockCampaignService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '42' } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CampaignFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load existing campaign data into form in edit mode', () => {
    expect(component.isEditMode).toBeTrue();
    expect(component.form.get('name')?.value).toBe('Existing Campaign');
  });

  it('should call campaignService.update on submit in edit mode', () => {
    mockCampaignService.update.and.returnValue(of({
      campaignId: 42, name: 'Updated', description: null,
      startDate: '2026-05-01T00:00:00Z', endDate: null,
      status: 'Active', budget: 50000, spentAmount: 5000,
      createdAt: '2026-04-01T00:00:00Z', createdByUserId: 'xyz'
    }));

    component.onSubmit();
    expect(mockCampaignService.update).toHaveBeenCalledWith(42, jasmine.any(Object));
  });
});
