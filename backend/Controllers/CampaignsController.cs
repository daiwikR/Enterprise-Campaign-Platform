using System;
using System.Security.Claims;
using System.Threading.Tasks;
using CampaignAnalytics.API.DTOs.Campaigns;
using CampaignAnalytics.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampaignAnalytics.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CampaignsController : ControllerBase
    {
        private readonly ICampaignService _service;

        public CampaignsController(ICampaignService service)
        {
            _service = service;
        }

        /// <summary>Returns all campaigns.</summary>
        [HttpGet]
        [Authorize(Policy = "AllRoles")]
        public async Task<IActionResult> GetAll()
        {
            var campaigns = await _service.GetAllCampaignsAsync();
            return Ok(campaigns);
        }

        /// <summary>Returns a single campaign by ID.</summary>
        [HttpGet("{id:int}")]
        [Authorize(Policy = "AllRoles")]
        public async Task<IActionResult> GetById(int id)
        {
            var campaign = await _service.GetCampaignByIdAsync(id);
            return campaign == null ? NotFound() : Ok(campaign);
        }

        /// <summary>Creates a new campaign (Manager+ only).</summary>
        [HttpPost]
        [Authorize(Policy = "ManagerUp")]
        public async Task<IActionResult> Create([FromBody] CampaignCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                         ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                         ?? string.Empty;

            try
            {
                var created = await _service.CreateCampaignAsync(dto, userId);
                return CreatedAtAction(nameof(GetById), new { id = created.CampaignId }, created);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>Updates an existing campaign (Manager+ only).</summary>
        [HttpPut("{id:int}")]
        [Authorize(Policy = "ManagerUp")]
        public async Task<IActionResult> Update(int id, [FromBody] CampaignUpdateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var updated = await _service.UpdateCampaignAsync(id, dto);
                return updated == null ? NotFound() : Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>Deletes a campaign (Admin only).</summary>
        [HttpDelete("{id:int}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteCampaignAsync(id);
            return deleted ? NoContent() : NotFound();
        }

        /// <summary>Returns campaign summary report via Stored Procedure.</summary>
        [HttpGet("report/summary")]
        [Authorize(Policy = "AnalystUp")]
        public async Task<IActionResult> GetSummaryReport(
            [FromQuery] int? campaignId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            var report = await _service.GetSummaryReportAsync(campaignId, startDate, endDate);
            return Ok(report);
        }
    }
}
