using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CampaignAnalytics.API.Models
{
    public class LoyaltyProgram
    {
        [Key]
        public int ProgramId { get; set; }

        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<LoyaltyTier> Tiers { get; set; } = new List<LoyaltyTier>();
        public ICollection<LoyaltyTransaction> Transactions { get; set; } = new List<LoyaltyTransaction>();
    }
}
