<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Http\Middleware\HandleCors;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Explicitly register CORS middleware.
        $middleware->prepend(HandleCors::class);

        // Prevent API requests from redirecting to a missing web login route.
        $middleware->redirectGuestsTo(
            fn(Request $request) => $request->is('api/*')
                ? null
                : '/login'
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Return JSON errors for API requests.
        $exceptions->shouldRenderJsonWhen(
            fn(Request $request) => $request->is('api/*')
                || $request->expectsJson(),
        );
    })
    ->create();
