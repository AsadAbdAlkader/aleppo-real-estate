using System.Diagnostics;
using System.Security.Cryptography;
using Application;
using Infrastructure;
using Infrastructure.Data;
using Web.Endpoints;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment() &&
    string.IsNullOrWhiteSpace(builder.Configuration["JwtSettings:Secret"]))
{
    builder.Configuration["JwtSettings:Secret"] = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
}

// Add services to the container.
builder.Services.AddOpenApi();

// Add Clean Architecture layer services
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration, builder.Environment);

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
if (builder.Environment.IsDevelopment() && allowedOrigins.Length == 0)
{
    allowedOrigins = ["http://localhost:4200", "https://localhost:4200"];
}
else if (!builder.Environment.IsDevelopment() && allowedOrigins.Length == 0)
{
    throw new InvalidOperationException("Configure Cors:AllowedOrigins before starting outside Development.");
}

var allowedHosts = builder.Configuration["AllowedHosts"];
if (!builder.Environment.IsDevelopment() &&
    (string.IsNullOrWhiteSpace(allowedHosts) || allowedHosts.Split(';').Any(host => host.Trim() == "*")))
{
    throw new InvalidOperationException("Configure specific AllowedHosts before starting outside Development.");
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClientApp", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

var applyMigrationsOnStartup = builder.Configuration.GetValue<bool?>("Database:ApplyMigrationsOnStartup")
    ?? builder.Environment.IsDevelopment();

if (applyMigrationsOnStartup)
{
    using var scope = app.Services.CreateScope();
    var initialiser = scope.ServiceProvider.GetRequiredService<ApplicationDbContextInitialiser>();
    await initialiser.InitialiseAsync();

    if (builder.Environment.IsDevelopment() &&
        builder.Configuration.GetValue("Database:SeedDemoData", true))
    {
        await initialiser.SeedAsync();
    }
}
else
{
    app.Logger.LogInformation("Database initialization skipped; apply migrations before serving traffic.");
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    // Auto-start Angular frontend dev server if port 4200 is not already running
    TryStartAngularDevServer(app.Logger, app.Services.GetRequiredService<IHostApplicationLifetime>());
}

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
});

app.UseCors("AllowClientApp");
app.UseStaticFiles();
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

// Map Endpoints
app.MapHealthEndpoints();
app.MapAuthEndpoints();
app.MapPropertyEndpoints();
app.MapFavoriteEndpoints();
app.MapInquiryEndpoints();
app.MapDashboardEndpoints();
app.MapAgentEndpoints();
app.MapAgencyEndpoints();
app.MapNotificationEndpoints();
app.MapUserEndpoints();
app.MapChatEndpoints();

app.MapFallbackToFile("index.html");

app.Run();

static void TryStartAngularDevServer(ILogger logger, IHostApplicationLifetime lifetime)
{
    try
    {
        using var client = new HttpClient { Timeout = TimeSpan.FromMilliseconds(500) };
        var response = client.GetAsync("http://localhost:4200").GetAwaiter().GetResult();
        logger.LogInformation("Angular frontend ClientApp is already active on http://localhost:4200");
    }
    catch
    {
        logger.LogInformation("Starting Angular frontend dev server (npm start) on http://localhost:4200...");
        
        var clientAppPath = Path.Combine(Directory.GetCurrentDirectory(), "ClientApp");
        if (!Directory.Exists(clientAppPath))
        {
            clientAppPath = Path.Combine(Directory.GetCurrentDirectory(), "src", "Web", "ClientApp");
        }

        if (Directory.Exists(clientAppPath))
        {
            var psi = new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = "/c npm start",
                WorkingDirectory = clientAppPath,
                UseShellExecute = true,
                CreateNoWindow = false
            };
            
            try
            {
                var process = Process.Start(psi);
                if (process != null)
                {
                    lifetime.ApplicationStopping.Register(() =>
                    {
                        try { if (!process.HasExited) process.Kill(true); } catch { }
                    });
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning("Could not auto-start Angular dev server: {Message}", ex.Message);
            }
        }
    }
}
