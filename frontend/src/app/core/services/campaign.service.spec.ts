import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CampaignService } from './campaign.service';
import { ApiService } from './api.service';
import { CampaignResponseDto, CampaignCreateDto } from '../../models/campaign.models';

const mockCampaign: CampaignResponseDto = {
  campaignId: 1,
  name: 'Q1 Campaign',
  description: 'First quarter push',
  startDate: '2025-01-01',
  endDate: '2025-03-31',
  status: 'Active',
  budget: 50000,
  spentAmount: 12000,
  createdAt: '2024-12-15T00:00:00Z',
  createdByUserId: 'user-abc'
};

describe('CampaignService', () => {
  let service: CampaignService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CampaignService, ApiService]
    });
    service = TestBed.inject(CampaignService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAll() should send GET to /api/campaigns and return campaign list', (done) => {
    service.getAll().subscribe(campaigns => {
      expect(campaigns.length).toBe(1);
      expect(campaigns[0].name).toBe('Q1 Campaign');
      done();
    });

    const req = httpMock.expectOne('https://localhost:7000/api/campaigns');
    expect(req.request.method).toBe('GET');
    req.flush([mockCampaign]);
  });

  it('create() should send POST to /api/campaigns with the dto', (done) => {
    const createDto: CampaignCreateDto = {
      name: 'New Campaign',
      startDate: '2025-04-01',
      budget: 20000
    };

    service.create(createDto).subscribe(created => {
      expect(created.campaignId).toBe(1);
      expect(created.name).toBe('Q1 Campaign');
      done();
    });

    const req = httpMock.expectOne('https://localhost:7000/api/campaigns');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createDto);
    req.flush(mockCampaign);
  });

  it('delete() should send DELETE to /api/campaigns/:id', (done) => {
    service.delete(1).subscribe(() => {
      done();
    });

    const req = httpMock.expectOne('https://localhost:7000/api/campaigns/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('getById() should send GET to /api/campaigns/:id', (done) => {
    service.getById(1).subscribe(campaign => {
      expect(campaign.campaignId).toBe(1);
      done();
    });

    const req = httpMock.expectOne('https://localhost:7000/api/campaigns/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockCampaign);
  });

  it('getSummaryReport() should include query params when provided', (done) => {
    service.getSummaryReport(1, '2025-01-01', '2025-03-31').subscribe(report => {
      expect(report).toBeTruthy();
      done();
    });

    const req = httpMock.expectOne(r =>
      r.url === 'https://localhost:7000/api/campaigns/report/summary' &&
      r.params.get('campaignId') === '1' &&
      r.params.get('startDate') === '2025-01-01' &&
      r.params.get('endDate') === '2025-03-31'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
