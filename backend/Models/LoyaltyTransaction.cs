using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CampaignAnalytics.API.Models
{
    public class LoyaltyTransaction
    {
        [Key]
        public long TransactionId { get; set; }

        [Required]
        public int ProgramId { get; set; }
        public LoyaltyProgram? Program { get; set; }

        [Required]
        public int CampaignId { get; set; }
        public Campaign? Campaign { get; set; }

        [Required, MaxLength(450)]
        public string UserId { get; set; } = string.Empty;
        public ApplicationUser? User { get; set; }

        public int PointsEarned { get; set; }
        public int PointsRedeemed { get; set; }

        [Required, MaxLength(50)]
        public string TransactionType { get; set; } = string.Empty;  // "Earn", "Redeem", "Expire"

        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;

        [MaxLength(500)]
        public string? Notes { get; set; }
    }
}
