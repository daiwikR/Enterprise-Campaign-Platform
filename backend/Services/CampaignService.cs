using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CampaignAnalytics.API.Data;
using CampaignAnalytics.API.DTOs.Campaigns;
using CampaignAnalytics.API.Models;
using CampaignAnalytics.API.Repositories;

namespace CampaignAnalytics.API.Services
{
    public class CampaignService : ICampaignService
    {
        private readonly ICampaignRepository _repository;

        public CampaignService(ICampaignRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<CampaignResponseDto>> GetAllCampaignsAsync()
        {
            var campaigns = await _repository.GetAllAsync();
            return campaigns.Select(MapToResponse);
        }

        public async Task<CampaignResponseDto?> GetCampaignByIdAsync(int campaignId)
        {
            var campaign = await _repository.GetByIdAsync(campaignId);
            return campaign == null ? null : MapToResponse(campaign);
        }

        public async Task<CampaignResponseDto> CreateCampaignAsync(CampaignCreateDto dto, string userId)
        {
            if (dto.EndDate.HasValue && dto.EndDate.Value <= dto.StartDate)
                throw new ArgumentException("EndDate must be after StartDate.");

            var campaign = new Campaign
            {
                Name            = dto.Name,
                Description     = dto.Description,
                StartDate       = dto.StartDate,
                EndDate         = dto.EndDate,
                Budget          = dto.Budget,
                Status          = CampaignStatus.Draft,
                CreatedByUserId = userId,
                CreatedAt       = DateTime.UtcNow,
                UpdatedAt       = DateTime.UtcNow,
            };

            var created = await _repository.CreateAsync(campaign);
            return MapToResponse(created);
        }

        public async Task<CampaignResponseDto?> UpdateCampaignAsync(int campaignId, CampaignUpdateDto dto)
        {
            var existing = await _repository.GetByIdAsync(campaignId);
            if (existing == null) return null;

            if (dto.Name        != null) existing.Name        = dto.Name;
            if (dto.Description != null) existing.Description = dto.Description;
            if (dto.StartDate   != null) existing.StartDate   = dto.StartDate.Value;
            if (dto.EndDate     != null) existing.EndDate     = dto.EndDate;
            if (dto.Budget      != null) existing.Budget      = dto.Budget.Value;
            if (dto.Status      != null) existing.Status      = (CampaignStatus)dto.Status.Value;

            if (existing.EndDate.HasValue && existing.EndDate.Value <= existing.StartDate)
                throw new ArgumentException("EndDate must be after StartDate.");

            var updated = await _repository.UpdateAsync(existing);
            return updated == null ? null : MapToResponse(updated);
        }

        public async Task<bool> DeleteCampaignAsync(int campaignId)
        {
            return await _repository.DeleteAsync(campaignId);
        }

        public async Task<IEnumerable<CampaignSummaryReport>> GetSummaryReportAsync(
            int? campaignId, DateTime? startDate, DateTime? endDate)
        {
            return await _repository.GetSummaryReportAsync(campaignId, startDate, endDate);
        }

        private static CampaignResponseDto MapToResponse(Campaign c) => new()
        {
            CampaignId      = c.CampaignId,
            Name            = c.Name,
            Description     = c.Description,
            StartDate       = c.StartDate,
            EndDate         = c.EndDate,
            Status          = c.Status.ToString(),
            Budget          = c.Budget,
            SpentAmount     = c.SpentAmount,
            CreatedAt       = c.CreatedAt,
            CreatedByUserId = c.CreatedByUserId,
        };
    }
}
