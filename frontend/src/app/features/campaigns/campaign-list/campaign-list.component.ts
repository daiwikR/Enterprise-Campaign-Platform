import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CampaignService } from '../../../core/services/campaign.service';
import { AuthService } from '../../../core/services/auth.service';
import { CampaignResponseDto } from '../../../models/campaign.models';

@Component({
  selector: 'app-campaign-list',
  template: `
    <div class="campaign-list">
      <div class="list-header">
        <h2>Campaigns</h2>
        <button
          *ngIf="canCreate"
          (click)="onNewCampaign()"
          class="btn-primary"
          type="button"
        >
          New Campaign
        </button>
      </div>

      <div *ngIf="errorMessage" class="error-banner" role="alert">
        {{ errorMessage }}
      </div>

      <div *ngIf="loading" class="loading" aria-busy="true">Loading campaigns...</div>

      <table *ngIf="!loading && campaigns.length > 0" aria-label="Campaign list">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Status</th>
            <th scope="col">Budget</th>
            <th scope="col">Spent</th>
            <th scope="col">Start Date</th>
            <th scope="col">End Date</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let campaign of campaigns">
            <td>{{ campaign.name }}</td>
            <td>
              <span class="status-badge status-{{ campaign.status | lowercase }}">
                {{ campaign.status }}
              </span>
            </td>
            <td>{{ campaign.budget | currency }}</td>
            <td>{{ campaign.spentAmount | currency }}</td>
            <td>{{ campaign.startDate | date:'shortDate' }}</td>
            <td>{{ campaign.endDate ? (campaign.endDate | date:'shortDate') : '—' }}</td>
            <td class="actions">
              <button
                *ngIf="canEdit"
                (click)="onEdit(campaign.campaignId)"
                type="button"
                class="btn-secondary"
              >
                Edit
              </button>
              <button
                *ngIf="canDelete"
                (click)="onDelete(campaign.campaignId)"
                type="button"
                class="btn-danger"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <p *ngIf="!loading && campaigns.length === 0" class="empty-state">
        No campaigns found.
      </p>
    </div>
  `
})
export class CampaignListComponent implements OnInit, OnDestroy {
  campaigns: CampaignResponseDto[] = [];
  loading = true;
  errorMessage = '';
  canCreate = false;
  canEdit = false;
  canDelete = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly campaignService: CampaignService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) {
        this.canCreate = user.roles.some(r => ['Admin', 'Manager'].includes(r));
        this.canEdit = user.roles.some(r => ['Admin', 'Manager'].includes(r));
        this.canDelete = user.roles.includes('Admin');
      }
    });

    this.loadCampaigns();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCampaigns(): void {
    this.loading = true;
    this.errorMessage = '';
    this.campaignService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: data => {
        this.campaigns = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load campaigns. Please try again.';
        this.loading = false;
      }
    });
  }

  onNewCampaign(): void {
    void this.router.navigate(['/campaigns', 'new']);
  }

  onEdit(id: number): void {
    void this.router.navigate(['/campaigns', id, 'edit']);
  }

  onDelete(id: number): void {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    this.campaignService.delete(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.loadCampaigns(),
      error: () => {
        this.errorMessage = 'Failed to delete campaign.';
      }
    });
  }
}
