using CampaignAnalytics.API.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CampaignAnalytics.API.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Campaign> Campaigns { get; set; }
        public DbSet<CampaignEvent> CampaignEvents { get; set; }
        public DbSet<LoyaltyProgram> LoyaltyPrograms { get; set; }
        public DbSet<LoyaltyTier> LoyaltyTiers { get; set; }
        public DbSet<LoyaltyTransaction> LoyaltyTransactions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Campaign indexes
            modelBuilder.Entity<Campaign>(entity =>
            {
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.StartDate);
                entity.HasIndex(e => e.CreatedByUserId);

                entity.HasOne(e => e.CreatedByUser)
                      .WithMany(u => u.CreatedCampaigns)
                      .HasForeignKey(e => e.CreatedByUserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // CampaignEvent indexes
            modelBuilder.Entity<CampaignEvent>(entity =>
            {
                entity.HasIndex(e => e.CampaignId);
                entity.HasIndex(e => e.OccurredAt);
                entity.HasIndex(e => e.EventType);

                entity.HasOne(e => e.Campaign)
                      .WithMany(c => c.Events)
                      .HasForeignKey(e => e.CampaignId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // LoyaltyTier constraints
            modelBuilder.Entity<LoyaltyTier>(entity =>
            {
                entity.HasIndex(e => e.ProgramId);

                entity.HasOne(e => e.Program)
                      .WithMany(p => p.Tiers)
                      .HasForeignKey(e => e.ProgramId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // LoyaltyTransaction indexes and relations
            modelBuilder.Entity<LoyaltyTransaction>(entity =>
            {
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.CampaignId);
                entity.HasIndex(e => e.TransactionDate);

                entity.HasOne(e => e.Program)
                      .WithMany(p => p.Transactions)
                      .HasForeignKey(e => e.ProgramId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Campaign)
                      .WithMany(c => c.LoyaltyTransactions)
                      .HasForeignKey(e => e.CampaignId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.User)
                      .WithMany(u => u.LoyaltyTransactions)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Stored procedure mappings (keyless entities for reporting)
            modelBuilder.Entity<CampaignSummaryReport>().HasNoKey().ToView(null);
            modelBuilder.Entity<LoyaltyEngagementReport>().HasNoKey().ToView(null);
        }
    }

    // Keyless DTOs for SP result sets
    public class CampaignSummaryReport
    {
        public int CampaignId { get; set; }
        public string CampaignName { get; set; } = string.Empty;
        public long TotalImpressions { get; set; }
        public long TotalClicks { get; set; }
        public long TotalConversions { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal SpentAmount { get; set; }
        public decimal ROI { get; set; }
    }

    public class LoyaltyEngagementReport
    {
        public int ProgramId { get; set; }
        public string ProgramName { get; set; } = string.Empty;
        public int TotalMembers { get; set; }
        public long TotalPointsEarned { get; set; }
        public long TotalPointsRedeemed { get; set; }
        public decimal RedemptionRate { get; set; }
    }
}
