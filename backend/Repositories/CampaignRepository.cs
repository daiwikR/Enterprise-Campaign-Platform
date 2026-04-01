using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CampaignAnalytics.API.Data;
using CampaignAnalytics.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CampaignAnalytics.API.Repositories
{
    public class CampaignRepository : ICampaignRepository
    {
        private readonly AppDbContext _context;

        public CampaignRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Campaign>> GetAllAsync()
        {
            return await _context.Campaigns
                .AsNoTracking()
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<Campaign?> GetByIdAsync(int campaignId)
        {
            return await _context.Campaigns
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.CampaignId == campaignId);
        }

        public async Task<Campaign> CreateAsync(Campaign campaign)
        {
            _context.Campaigns.Add(campaign);
            await _context.SaveChangesAsync();
            return campaign;
        }

        public async Task<Campaign?> UpdateAsync(Campaign campaign)
        {
            var existing = await _context.Campaigns.FindAsync(campaign.CampaignId);
            if (existing == null) return null;

            existing.Name        = campaign.Name;
            existing.Description = campaign.Description;
            existing.StartDate   = campaign.StartDate;
            existing.EndDate     = campaign.EndDate;
            existing.Status      = campaign.Status;
            existing.Budget      = campaign.Budget;
            existing.SpentAmount = campaign.SpentAmount;
            existing.UpdatedAt   = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(int campaignId)
        {
            var campaign = await _context.Campaigns.FindAsync(campaignId);
            if (campaign == null) return false;

            _context.Campaigns.Remove(campaign);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(int campaignId)
        {
            return await _context.Campaigns.AnyAsync(c => c.CampaignId == campaignId);
        }

        public async Task<IEnumerable<CampaignSummaryReport>> GetSummaryReportAsync(
            int? campaignId, DateTime? startDate, DateTime? endDate)
        {
            return await _context.Set<CampaignSummaryReport>()
                .FromSqlRaw(
                    "EXEC dbo.GetCampaignSummaryReport @CampaignId={0}, @StartDate={1}, @EndDate={2}",
                    campaignId.HasValue ? (object)campaignId.Value : DBNull.Value,
                    startDate.HasValue  ? (object)startDate.Value  : DBNull.Value,
                    endDate.HasValue    ? (object)endDate.Value     : DBNull.Value)
                .ToListAsync();
        }
    }
}
