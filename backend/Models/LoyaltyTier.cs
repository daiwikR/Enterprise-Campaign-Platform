using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CampaignAnalytics.API.Models
{
    public class LoyaltyTier
    {
        [Key]
        public int TierId { get; set; }

        [Required]
        public int ProgramId { get; set; }
        public LoyaltyProgram? Program { get; set; }

        [Required, MaxLength(100)]
        public string TierName { get; set; } = string.Empty;  // Bronze, Silver, Gold, Platinum

        public int MinPoints { get; set; }
        public int MaxPoints { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal MultiplierBonus { get; set; } = 1.0m;
    }
}
