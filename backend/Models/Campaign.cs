using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CampaignAnalytics.API.Models
{
    public class Campaign
    {
        [Key]
        public int CampaignId { get; set; }

        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        [Required]
        public CampaignStatus Status { get; set; } = CampaignStatus.Draft;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Budget { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal SpentAmount { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // FK
        public string CreatedByUserId { get; set; } = string.Empty;
        public ApplicationUser? CreatedByUser { get; set; }

        public ICollection<CampaignEvent> Events { get; set; } = new List<CampaignEvent>();
        public ICollection<LoyaltyTransaction> LoyaltyTransactions { get; set; } = new List<LoyaltyTransaction>();
    }

    public enum CampaignStatus { Draft = 0, Active = 1, Paused = 2, Completed = 3, Cancelled = 4 }
}
