using DomoNow.Parking.Api.Middleware;
using DomoNow.Parking.Application;
using DomoNow.Parking.Infrastructure;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// Add Application and Infrastructure layers
builder.Services.AddApplicationLayer();
builder.Services.AddInfrastructureLayer(builder.Configuration);

// Add Controllers and JSON options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// OpenAPI / Swagger Documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "DomoNow PropTech - Visitor Parking API",
        Version = "v1",
        Description = "High-performance .NET 10 LTS backend service for Visitor Parking Management, CQRS, and Concurrency Controls.",
        Contact = new OpenApiContact
        {
            Name = "DomoNow Architecture Team",
            Email = "architecture@domonow.io"
        }
    });

    // Support XML comments if present
    var xmlFilename = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

// CORS Configuration for Single-SPA Microfrontends monorepo
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendOrigins", policy =>
    {
        policy.WithOrigins(
                "http://localhost:9000", // Single-SPA Root Orchestrator
                "http://localhost:9001", // Angular Operations MFE
                "http://localhost:9002", // Vue Analytics MFE
                "http://127.0.0.1:9000",
                "http://127.0.0.1:9001",
                "http://127.0.0.1:9002"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Global Exception Handling Middleware (RFC 7807 ProblemDetails)
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Enable Swagger UI in both Development and Production for container verification
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "DomoNow Parking API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowFrontendOrigins");

app.MapControllers();

// Root landing endpoint
app.MapGet("/", () => Results.Redirect("/swagger"));

app.Run();

// Required for WebApplicationFactory<Program> in Integration Tests
public partial class Program { }
