using System.ComponentModel.DataAnnotations;

namespace CampaignAnalytics.API.DTOs.Auth
{
    public class RegisterDto
    {
        [Required, MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required, MinLength(8)]
        public string Password { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? Department { get; set; }

        // Role must be one of: Admin, Manager, Analyst, Viewer
        [Required]
        public string Role { get; set; } = "Viewer";
    }
}
