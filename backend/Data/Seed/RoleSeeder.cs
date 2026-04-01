using Microsoft.AspNetCore.Identity;

namespace CampaignAnalytics.API.Data.Seed
{
    public static class RoleSeeder
    {
        public static readonly string[] Roles = { "Admin", "Manager", "Analyst", "Viewer" };

        public static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager)
        {
            foreach (var role in Roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                    await roleManager.CreateAsync(new IdentityRole(role));
            }
        }
    }
}
