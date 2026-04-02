import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CampaignListComponent } from './campaign-list.component';
import { CampaignService } from '../../../core/services/campaign.service';
import { AuthService } from '../../../core/services/auth.service';
import { CampaignResponseDto } from '../../../models/campaign.models';
import { CommonModule } from '@angular/common';

const mockCampaigns: CampaignResponseDto[] = [
  {
    campaignId: 1,
    name: 'Spring Push',
    description: null,
    startDate: '2026-05-01T00:00:00Z',
    endDate: '2026-06-30T23:59:59Z',
    status: 'Active',
    budget: 50000,
    spentAmount: 12500,
    createdAt: '2026-04-01T12:00:00Z',
    createdByUserId: 'abc'
  },
  {
    campaignId: 2,
    name: 'Summer Sale',
    description: 'Big summer campaign',
    startDate: '2026-07-01T00:00:00Z',
    endDate: null,
    status: 'Draft',
    budget: 75000,
    spentAmount: 0,
    createdAt: '2026-04-01T13:00:00Z',
    createdByUserId: 'abc'
  }
];

describe('CampaignListComponent', () => {
  let component: CampaignListComponent;
  let fixture: ComponentFixture<CampaignListComponent>;
  let mockCampaignService: jasmine.SpyObj<CampaignService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockCampaignService = jasmine.createSpyObj('CampaignService', ['getAll', 'delete']);
    mockAuthService = jasmine.createSpyObj('AuthService', [], {
      currentUser$: of({ token: 'tok', email: 'a@b.com', fullName: 'A', roles: ['Admin'], expiresAt: '2099-01-01' })
    });
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockCampaignService.getAll.and.returnValue(of(mockCampaigns));

    await TestBed.configureTestingModule({
      declarations: [CampaignListComponent],
      imports: [CommonModule],
      providers: [
        { provide: CampaignService, useValue: mockCampaignService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CampaignListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load and display campaigns on init', () => {
    expect(mockCampaignService.getAll).toHaveBeenCalledTimes(1);
    expect(component.campaigns.length).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('should show error message when getAll fails', () => {
    mockCampaignService.getAll.and.returnValue(throwError(() => new Error('Network error')));
    component.loadCampaigns();
    expect(component.errorMessage).toBeTruthy();
    expect(component.loading).toBeFalse();
  });

  it('should enable delete button for Admin role', () => {
    expect(component.canDelete).toBeTrue();
  });

  it('should navigate to new campaign form on onNewCampaign', () => {
    component.onNewCampaign();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/campaigns', 'new']);
  });

  it('should navigate to edit form on onEdit', () => {
    component.onEdit(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/campaigns', 1, 'edit']);
  });

  it('should reload campaigns after successful delete', () => {
    mockCampaignService.delete.and.returnValue(of(undefined));
    spyOn(window, 'confirm').and.returnValue(true);
    component.onDelete(1);
    expect(mockCampaignService.delete).toHaveBeenCalledWith(1);
    expect(mockCampaignService.getAll).toHaveBeenCalledTimes(2);
  });

  it('should not call delete when confirm is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.onDelete(1);
    expect(mockCampaignService.delete).not.toHaveBeenCalled();
  });

  it('should show error message when delete fails', () => {
    mockCampaignService.delete.and.returnValue(throwError(() => new Error('Delete failed')));
    spyOn(window, 'confirm').and.returnValue(true);
    component.onDelete(1);
    expect(component.errorMessage).toBeTruthy();
  });
});

describe('CampaignListComponent — null user', () => {
  let component: CampaignListComponent;
  let fixture: ComponentFixture<CampaignListComponent>;

  beforeEach(async () => {
    const nullAuthService = jasmine.createSpyObj('AuthService', [], {
      currentUser$: of(null)
    });
    const mockCampaignService = jasmine.createSpyObj('CampaignService', ['getAll', 'delete']);
    mockCampaignService.getAll.and.returnValue(of([]));
    const mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [CampaignListComponent],
      imports: [CommonModule],
      providers: [
        { provide: CampaignService, useValue: mockCampaignService },
        { provide: AuthService, useValue: nullAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CampaignListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should not set permissions when currentUser$ emits null', () => {
    expect(component.canCreate).toBeFalse();
    expect(component.canEdit).toBeFalse();
    expect(component.canDelete).toBeFalse();
  });
});
