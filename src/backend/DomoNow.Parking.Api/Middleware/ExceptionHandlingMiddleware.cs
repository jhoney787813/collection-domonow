using System.Net;
using System.Text.Json;
using DomoNow.Parking.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace DomoNow.Parking.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred while processing HTTP request: {Path}", context.Request.Path);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/problem+json";

        var (statusCode, problemDetails) = exception switch
        {
            DomainConflictException conflictEx => (
                HttpStatusCode.Conflict,
                new ProblemDetails
                {
                    Status = (int)HttpStatusCode.Conflict,
                    Title = "Resource Conflict",
                    Detail = conflictEx.Message,
                    Type = "https://domonow.io/errors/conflict",
                    Instance = context.Request.Path
                }
            ),

            DbUpdateConcurrencyException => (
                HttpStatusCode.Conflict,
                new ProblemDetails
                {
                    Status = (int)HttpStatusCode.Conflict,
                    Title = "Optimistic Concurrency Conflict",
                    Detail = "The parking spot was modified by another transaction. Please refresh and try again.",
                    Type = "https://domonow.io/errors/concurrency-conflict",
                    Instance = context.Request.Path
                }
            ),

            DbUpdateException dbEx when IsPostgresUniqueViolation(dbEx) => (
                HttpStatusCode.Conflict,
                new ProblemDetails
                {
                    Status = (int)HttpStatusCode.Conflict,
                    Title = "Concurrency Invariant Violation",
                    Detail = "This parking spot already has an active vehicle assignment (enforced by partial unique index uq_parking_active_assignment).",
                    Type = "https://domonow.io/errors/spot-already-occupied",
                    Instance = context.Request.Path
                }
            ),

            NotFoundException notFoundEx => (
                HttpStatusCode.NotFound,
                new ProblemDetails
                {
                    Status = (int)HttpStatusCode.NotFound,
                    Title = "Resource Not Found",
                    Detail = notFoundEx.Message,
                    Type = "https://domonow.io/errors/not-found",
                    Instance = context.Request.Path
                }
            ),

            DomainValidationException valEx when valEx.Message.Contains("earlier than entry time", StringComparison.OrdinalIgnoreCase) => (
                HttpStatusCode.BadRequest,
                new ProblemDetails
                {
                    Status = (int)HttpStatusCode.BadRequest,
                    Title = "Temporal Validation Error",
                    Detail = valEx.Message,
                    Type = "https://domonow.io/errors/temporal-order-violation",
                    Instance = context.Request.Path,
                    Extensions = { ["errors"] = valEx.Errors }
                }
            ),

            DomainValidationException valEx => (
                HttpStatusCode.UnprocessableEntity,
                new ProblemDetails
                {
                    Status = (int)HttpStatusCode.UnprocessableEntity,
                    Title = "Validation Failure",
                    Detail = valEx.Message,
                    Type = "https://domonow.io/errors/validation-error",
                    Instance = context.Request.Path,
                    Extensions = { ["errors"] = valEx.Errors }
                }
            ),

            _ => (
                HttpStatusCode.InternalServerError,
                new ProblemDetails
                {
                    Status = (int)HttpStatusCode.InternalServerError,
                    Title = "Internal Server Error",
                    Detail = "An unexpected error occurred processing your request.",
                    Type = "https://domonow.io/errors/internal",
                    Instance = context.Request.Path
                }
            )
        };

        context.Response.StatusCode = (int)statusCode;

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, options));
    }

    private static bool IsPostgresUniqueViolation(DbUpdateException ex)
    {
        if (ex.InnerException is PostgresException pgEx && pgEx.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            return true;
        }

        var inner = ex.InnerException;
        while (inner != null)
        {
            if (inner.Message.Contains("uq_parking_active_assignment", StringComparison.OrdinalIgnoreCase) ||
                inner.Message.Contains("23505", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
            inner = inner.InnerException;
        }

        return false;
    }
}
