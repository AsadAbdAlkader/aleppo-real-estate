using Application.Common.Interfaces;
using Application.Users.Commands.ChangePassword;
using Application.Users.Commands.UpdateUserProfile;
using Application.Users.Queries.GetUserProfile;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace Application.UnitTests.Users;

public class UserProfileTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task GetUserProfileQueryHandler_ShouldReturnUserProfile_WhenUserExists()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@example.com",
            FirstName = "Ahmad",
            LastName = "Aleppo",
            Role = "Buyer",
            PhoneNumber = "+963911111111",
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var handler = new GetUserProfileQueryHandler(context);
        var query = new GetUserProfileQuery(userId);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.Id);
        Assert.Equal("test@example.com", result.Email);
        Assert.Equal("Ahmad", result.FirstName);
        Assert.Equal("Aleppo", result.LastName);
        Assert.Equal("Buyer", result.Role);
        Assert.Equal("+963911111111", result.PhoneNumber);
        Assert.Equal(user.CreatedAt, result.CreatedAt);
    }

    [Fact]
    public async Task GetUserProfileQueryHandler_ShouldReturnNull_WhenUserDoesNotExist()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var handler = new GetUserProfileQueryHandler(context);
        var query = new GetUserProfileQuery(Guid.NewGuid());

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateUserProfileCommandHandler_ShouldUpdateFieldsAndReturnDto()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "buyer@aleppo.com",
            PasswordHash = "hash123",
            FirstName = "Original",
            LastName = "Name",
            Role = "Buyer",
            PhoneNumber = null,
            CreatedAt = DateTime.UtcNow.AddDays(-20)
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var handler = new UpdateUserProfileCommandHandler(context);
        var command = new UpdateUserProfileCommand(
            userId,
            "UpdatedFirst",
            "UpdatedLast",
            "+963922222222"
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("UpdatedFirst", result.FirstName);
        Assert.Equal("UpdatedLast", result.LastName);
        Assert.Equal("+963922222222", result.PhoneNumber);
        Assert.Equal("buyer@aleppo.com", result.Email); // Email unchanged
        Assert.Equal("Buyer", result.Role); // Role unchanged

        var updatedUserInDb = await context.Users.FindAsync(userId);
        Assert.NotNull(updatedUserInDb);
        Assert.Equal("UpdatedFirst", updatedUserInDb.FirstName);
        Assert.Equal("UpdatedLast", updatedUserInDb.LastName);
        Assert.Equal("+963922222222", updatedUserInDb.PhoneNumber);
        Assert.Equal("hash123", updatedUserInDb.PasswordHash); // PasswordHash unchanged
        Assert.Equal("buyer@aleppo.com", updatedUserInDb.Email); // Email unchanged
        Assert.NotNull(updatedUserInDb.UpdatedAt);
    }

    [Fact]
    public async Task UpdateUserProfileCommandValidator_ShouldValidateFields()
    {
        // Arrange
        var validator = new UpdateUserProfileCommandValidator();

        var invalidCommand = new UpdateUserProfileCommand(
            Guid.NewGuid(),
            "", // Empty FirstName
            "", // Empty LastName
            new string('1', 51) // Phone number > 50 chars
        );

        // Act
        var result = await validator.ValidateAsync(invalidCommand);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "FirstName");
        Assert.Contains(result.Errors, e => e.PropertyName == "LastName");
        Assert.Contains(result.Errors, e => e.PropertyName == "PhoneNumber");
    }

    [Fact]
    public async Task ChangePasswordCommandHandler_ShouldChangePassword_WhenCurrentPasswordIsValid()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "user@aleppo.com",
            PasswordHash = "old_hashed_pw",
            FirstName = "User",
            LastName = "Test",
            Role = "Buyer"
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var hasherMock = new Mock<IPasswordHasher>();
        hasherMock.Setup(h => h.VerifyPassword("CurrentPassword123!", "old_hashed_pw"))
            .Returns(true);
        hasherMock.Setup(h => h.HashPassword("NewPassword456!"))
            .Returns("new_hashed_pw");

        var handler = new ChangePasswordCommandHandler(context, hasherMock.Object);
        var command = new ChangePasswordCommand(userId, "CurrentPassword123!", "NewPassword456!");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Equal("تم تغيير كلمة المرور بنجاح.", result.Message);

        var updatedUser = await context.Users.FindAsync(userId);
        Assert.NotNull(updatedUser);
        Assert.Equal("new_hashed_pw", updatedUser.PasswordHash);
        Assert.NotNull(updatedUser.UpdatedAt);
    }

    [Fact]
    public async Task ChangePasswordCommandHandler_ShouldFail_WhenCurrentPasswordIsInvalid()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "user@aleppo.com",
            PasswordHash = "old_hashed_pw",
            FirstName = "User",
            LastName = "Test",
            Role = "Buyer"
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var hasherMock = new Mock<IPasswordHasher>();
        hasherMock.Setup(h => h.VerifyPassword("WrongPassword!", "old_hashed_pw"))
            .Returns(false);

        var handler = new ChangePasswordCommandHandler(context, hasherMock.Object);
        var command = new ChangePasswordCommand(userId, "WrongPassword!", "NewPassword456!");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("كلمة المرور الحالية غير صحيحة.", result.ErrorMessage);

        var unchangedUser = await context.Users.FindAsync(userId);
        Assert.NotNull(unchangedUser);
        Assert.Equal("old_hashed_pw", unchangedUser.PasswordHash);
    }

    [Fact]
    public async Task ChangePasswordCommandValidator_ShouldEnforceMinimumLengthOf6()
    {
        // Arrange
        var validator = new ChangePasswordCommandValidator();
        var invalidCommand = new ChangePasswordCommand(Guid.NewGuid(), "Current123", "12345"); // NewPassword < 6 chars

        // Act
        var result = await validator.ValidateAsync(invalidCommand);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "NewPassword" && e.ErrorMessage.Contains("at least 6 characters"));
    }
}
