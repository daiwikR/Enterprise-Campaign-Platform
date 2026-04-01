using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CampaignAnalytics.API.Models
{
    public class CampaignEvent
    {
        [Key]
        public long EventId { get; set; }

        [Required]
        public int CampaignId { get; set; }
        public Campaign? Campaign { get; set; }

        [Required, MaxLength(100)]
        public string EventType { get; set; } = string.Empty;  // e.g. "Impression", "Click", "Conversion"

        [MaxLength(500)]
        public string? Source { get; set; }

        public DateTime OccurredAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "nvarchar(max)")]
        public string? Metadata { get; set; }  // JSON blob for extensibility

        [Column(TypeName = "decimal(18,2)")]
        public decimal? Revenue { get; set; }
    }
}
