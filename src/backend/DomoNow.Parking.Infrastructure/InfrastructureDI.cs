using DomoNow.Parking.Domain.Interfaces;
using DomoNow.Parking.Infrastructure.Data;
using DomoNow.Parking.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DomoNow.Parking.Infrastructure;

public static class InfrastructureDI
{
    public static IServiceCollection AddInfrastructureLayer(
        this IServiceCollection services, 
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? "Host=localhost;Port=5432;Database=domonow_parking;Username=domonow_user;Password=domonow_secret_pass";

        services.AddDbContext<ParkingDbContext>(options =>
        {
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(10),
                    errorCodesToAdd: null);
            });
        });

        services.AddScoped<IParkingSpotRepository, ParkingSpotRepository>();
        services.AddScoped<IParkingAssignmentRepository, ParkingAssignmentRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        return services;
    }
}
