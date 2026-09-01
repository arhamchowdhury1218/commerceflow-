<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:5173',
        'https://commerceflow-frontend.vercel.app',
        'https://commerceflow-frontend-git-main-arham-chowdhury-s-projects.vercel.app',
    ],
    'allowed_origins_patterns' => [
        // This allows ALL vercel.app preview URLs automatically
        '#^https://commerceflow-frontend.*\.vercel\.app$#',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
