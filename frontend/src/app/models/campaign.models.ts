export interface CampaignResponseDto {
  campaignId: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  status: 'Draft' | 'Active' | 'Paused' | 'Completed' | 'Cancelled';
  budget: number;
  spentAmount: number;
  createdAt: string;
  createdByUserId: string;
}

export interface CampaignCreateDto {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  budget?: number;
}

export interface CampaignUpdateDto {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  status?: 0 | 1 | 2 | 3 | 4;
}

export interface CampaignSummaryReport {
  campaignId: number;
  campaignName: string;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  spentAmount: number;
  roi: number;
}
