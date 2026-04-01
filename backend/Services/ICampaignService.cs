using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CampaignAnalytics.API.Data;
using CampaignAnalytics.API.DTOs.Campaigns;

namespace CampaignAnalytics.API.Services
{
    public interface ICampaignService
    {
        Task<IEnumerable<CampaignResponseDto>> GetAllCampaignsAsync();
        Task<CampaignResponseDto?> GetCampaignByIdAsync(int campaignId);
        Task<CampaignResponseDto> CreateCampaignAsync(CampaignCreateDto dto, string userId);
        Task<CampaignResponseDto?> UpdateCampaignAsync(int campaignId, CampaignUpdateDto dto);
        Task<bool> DeleteCampaignAsync(int campaignId);
        Task<IEnumerable<CampaignSummaryReport>> GetSummaryReportAsync(
            int? campaignId, DateTime? startDate, DateTime? endDate);
    }
}
