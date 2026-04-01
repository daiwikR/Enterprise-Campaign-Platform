using System;
using System.Collections.Generic;

namespace CampaignAnalytics.API.DTOs.Campaigns
{
    public class CampaignResponseDto
    {
        public int CampaignId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal Budget { get; set; }
        public decimal SpentAmount { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedByUserId { get; set; } = string.Empty;
    }
}
