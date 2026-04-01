using Microsoft.AspNetCore.Identity;
using System.Collections.Generic;

namespace CampaignAnalytics.API.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Department { get; set; }

        public ICollection<Campaign> CreatedCampaigns { get; set; } = new List<Campaign>();
        public ICollection<LoyaltyTransaction> LoyaltyTransactions { get; set; } = new List<LoyaltyTransaction>();
    }
}
