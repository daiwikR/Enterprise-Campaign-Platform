using System;

namespace CampaignAnalytics.API.DTOs.Campaigns
{
    public class CampaignSummaryDto
    {
        public int CampaignId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public decimal Budget { get; set; }
        public decimal SpentAmount { get; set; }
        public long TotalEvents { get; set; }
    }
}
