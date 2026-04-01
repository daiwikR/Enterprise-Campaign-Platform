using System;
using System.ComponentModel.DataAnnotations;

namespace CampaignAnalytics.API.DTOs.Campaigns
{
    public class CampaignUpdateDto
    {
        [MaxLength(200)]
        public string? Name { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? Budget { get; set; }

        public int? Status { get; set; }  // CampaignStatus enum value
    }
}
