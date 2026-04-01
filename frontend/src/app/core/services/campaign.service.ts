import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  CampaignResponseDto,
  CampaignCreateDto,
  CampaignUpdateDto,
  CampaignSummaryReport
} from '../../models/campaign.models';

@Injectable({
  providedIn: 'root'
})
export class CampaignService {
  private readonly basePath = '/api/campaigns';

  constructor(private apiService: ApiService) {}

  getAll(): Observable<CampaignResponseDto[]> {
    return this.apiService.get<CampaignResponseDto[]>(this.basePath);
  }

  getById(id: number): Observable<CampaignResponseDto> {
    return this.apiService.get<CampaignResponseDto>(`${this.basePath}/${id}`);
  }

  create(dto: CampaignCreateDto): Observable<CampaignResponseDto> {
    return this.apiService.post<CampaignResponseDto>(this.basePath, dto);
  }

  update(id: number, dto: CampaignUpdateDto): Observable<CampaignResponseDto> {
    return this.apiService.put<CampaignResponseDto>(`${this.basePath}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.basePath}/${id}`);
  }

  getSummaryReport(
    campaignId?: number,
    startDate?: string,
    endDate?: string
  ): Observable<CampaignSummaryReport[]> {
    let params = new HttpParams();
    if (campaignId !== undefined && campaignId !== null) {
      params = params.set('campaignId', campaignId.toString());
    }
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    return this.apiService.get<CampaignSummaryReport[]>(
      `${this.basePath}/report/summary`,
      params
    );
  }
}
