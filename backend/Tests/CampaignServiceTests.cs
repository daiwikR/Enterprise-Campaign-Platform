using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CampaignAnalytics.API.Data;
using CampaignAnalytics.API.DTOs.Campaigns;
using CampaignAnalytics.API.Models;
using CampaignAnalytics.API.Repositories;
using CampaignAnalytics.API.Services;
using Moq;
using Xunit;

namespace CampaignAnalytics.API.Tests
{
    public class CampaignServiceTests
    {
        private readonly Mock<ICampaignRepository> _repoMock;
        private readonly CampaignService _service;

        public CampaignServiceTests()
        {
            _repoMock = new Mock<ICampaignRepository>();
            _service  = new CampaignService(_repoMock.Object);
        }

        [Fact]
        public async Task CreateCampaignAsync_ValidDto_ReturnsMappedResponse()
        {
            var dto = new CampaignCreateDto
            {
                Name      = "Test Campaign",
                StartDate = DateTime.UtcNow.AddDays(1),
                Budget    = 5000m
            };

            _repoMock.Setup(r => r.CreateAsync(It.IsAny<Campaign>()))
                     .ReturnsAsync((Campaign c) => { c.CampaignId = 1; return c; });

            var result = await _service.CreateCampaignAsync(dto, "user-1");

            Assert.Equal("Test Campaign", result.Name);
            Assert.Equal(1, result.CampaignId);
            Assert.Equal("Draft", result.Status);
        }

        [Fact]
        public async Task CreateCampaignAsync_EndDateBeforeStart_ThrowsArgumentException()
        {
            var dto = new CampaignCreateDto
            {
                Name      = "Bad Dates",
                StartDate = DateTime.UtcNow.AddDays(5),
                EndDate   = DateTime.UtcNow.AddDays(1),
                Budget    = 1000m
            };

            await Assert.ThrowsAsync<ArgumentException>(
                () => _service.CreateCampaignAsync(dto, "user-1"));
        }

        [Fact]
        public async Task GetCampaignByIdAsync_NotFound_ReturnsNull()
        {
            _repoMock.Setup(r => r.GetByIdAsync(99))
                     .ReturnsAsync((Campaign?)null);

            var result = await _service.GetCampaignByIdAsync(99);

            Assert.Null(result);
        }

        [Fact]
        public async Task GetAllCampaignsAsync_ReturnsMappedList()
        {
            var campaigns = new List<Campaign>
            {
                new Campaign { CampaignId = 1, Name = "Alpha", Status = CampaignStatus.Active,
                               StartDate = DateTime.UtcNow, CreatedByUserId = "u1" },
                new Campaign { CampaignId = 2, Name = "Beta",  Status = CampaignStatus.Draft,
                               StartDate = DateTime.UtcNow, CreatedByUserId = "u2" }
            };
            _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(campaigns);

            var result = await _service.GetAllCampaignsAsync();

            Assert.Equal(2, result.Count());
        }

        [Fact]
        public async Task DeleteCampaignAsync_NotFound_ReturnsFalse()
        {
            _repoMock.Setup(r => r.DeleteAsync(99)).ReturnsAsync(false);

            var result = await _service.DeleteCampaignAsync(99);

            Assert.False(result);
        }
    }
}
