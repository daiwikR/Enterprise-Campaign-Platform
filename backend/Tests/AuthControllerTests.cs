using System.Threading.Tasks;
using CampaignAnalytics.API.Controllers;
using CampaignAnalytics.API.DTOs.Auth;
using CampaignAnalytics.API.Models;
using CampaignAnalytics.API.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace CampaignAnalytics.API.Tests
{
    public class AuthControllerTests
    {
        private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
        private readonly Mock<SignInManager<ApplicationUser>> _signInManagerMock;
        private readonly Mock<RoleManager<IdentityRole>> _roleManagerMock;
        private readonly Mock<ITokenService> _tokenServiceMock;
        private readonly AuthController _controller;

        public AuthControllerTests()
        {
            var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
            _userManagerMock = new Mock<UserManager<ApplicationUser>>(
                userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

            var contextAccessor = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
            var claimsFactory = new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>();
            _signInManagerMock = new Mock<SignInManager<ApplicationUser>>(
                _userManagerMock.Object, contextAccessor.Object, claimsFactory.Object, null!, null!, null!, null!);

            var roleStoreMock = new Mock<IRoleStore<IdentityRole>>();
            _roleManagerMock = new Mock<RoleManager<IdentityRole>>(
                roleStoreMock.Object, null!, null!, null!, null!);

            _tokenServiceMock = new Mock<ITokenService>();

            _controller = new AuthController(
                _userManagerMock.Object,
                _signInManagerMock.Object,
                _roleManagerMock.Object,
                _tokenServiceMock.Object);
        }

        [Fact]
        public async Task Login_InvalidCredentials_ReturnsUnauthorized()
        {
            _userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync((ApplicationUser?)null);

            var result = await _controller.Login(new LoginDto { Email = "x@x.com", Password = "wrong" });

            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        [Fact]
        public async Task Login_ValidCredentials_ReturnsOkWithToken()
        {
            var user = new ApplicationUser { Id = "1", Email = "admin@test.com", UserName = "admin@test.com", FirstName = "Admin", LastName = "User" };
            _userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);
            _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, It.IsAny<string>(), true))
                .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);
            _tokenServiceMock.Setup(x => x.GenerateTokenAsync(user)).ReturnsAsync("fake-jwt-token");
            _userManagerMock.Setup(x => x.GetRolesAsync(user)).ReturnsAsync(new List<string> { "Admin" });

            var result = await _controller.Login(new LoginDto { Email = "admin@test.com", Password = "Valid@123" });

            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<AuthResponseDto>(ok.Value);
            Assert.Equal("fake-jwt-token", response.Token);
        }

        [Fact]
        public async Task Register_InvalidRole_ReturnsBadRequest()
        {
            var dto = new RegisterDto
            {
                FirstName = "John", LastName = "Doe",
                Email = "john@test.com", Password = "Valid@123",
                Role = "SuperHacker"
            };

            var result = await _controller.Register(dto);

            Assert.IsType<BadRequestObjectResult>(result);
        }
    }
}
