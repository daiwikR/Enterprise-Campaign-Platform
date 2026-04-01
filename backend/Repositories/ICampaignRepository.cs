using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CampaignAnalytics.API.Data;
using CampaignAnalytics.API.Models;

namespace CampaignAnalytics.API.Repositories
{
    public interface ICampaignRepository
    {
        Task<IEnumerable<Campaign>> GetAllAsync();
        Task<Campaign?> GetByIdAsync(int campaignId);
        Task<Campaign> CreateAsync(Campaign campaign);
        Task<Campaign?> UpdateAsync(Campaign campaign);
        Task<bool> DeleteAsync(int campaignId);
        Task<bool> ExistsAsync(int campaignId);
        Task<IEnumerable<CampaignSummaryReport>> GetSummaryReportAsync(
            int? campaignId, DateTime? startDate, DateTime? endDate);
    }
}
