<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
    'steadfast' => [
        'api_key'    => env('STEADFAST_API_KEY'),
        'secret_key' => env('STEADFAST_SECRET_KEY'),
        'base_url'   => env('STEADFAST_BASE_URL', 'https://portal.steadfast.com.bd/api/v1'),
        'test_mode'  => env('STEADFAST_TEST_MODE', false), // ← add this
    ],

    'pathao' => [
        'client_id'        => env('PATHAO_CLIENT_ID'),
        'client_secret'    => env('PATHAO_CLIENT_SECRET'),
        'username'         => env('PATHAO_USERNAME'),
        'password'         => env('PATHAO_PASSWORD'),
        'store_id'         => env('PATHAO_STORE_ID'),
        'base_url'         => env('PATHAO_BASE_URL', 'https://api-hermes.pathao.com'),
        // Default city/zone used until a proper location picker is built
        // into the order form — sellers can override these in Settings
        'default_city_id'  => env('PATHAO_DEFAULT_CITY_ID', 1),
        'default_zone_id'  => env('PATHAO_DEFAULT_ZONE_ID', 1),
        'test_mode'        => env('PATHAO_TEST_MODE', true),
    ],

    'redx' => [
        'api_token'        => env('REDX_API_TOKEN'),
        'base_url'         => env('REDX_BASE_URL', 'https://openapi.redx.com.bd/v1.0.0-beta'),
        'pickup_store_id'  => env('REDX_PICKUP_STORE_ID'),
        'default_area'     => env('REDX_DEFAULT_AREA', ''),
        'default_area_id'  => env('REDX_DEFAULT_AREA_ID'),
        'test_mode'        => env('REDX_TEST_MODE', true),
    ],
    'cloudinary' => [
        'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
        'api_key'    => env('CLOUDINARY_API_KEY'),
        'api_secret' => env('CLOUDINARY_API_SECRET'),
    ],

    'facebook' => [
        // A password YOU choose — must match the Verify Token you enter
        // in the Facebook webhook settings. Facebook uses it to confirm
        // it's really talking to your server.
        'verify_token'  => env('FACEBOOK_VERIFY_TOKEN'),
        // Your app secret (from App Settings → Basic). Optional now, used
        // later to verify webhook signatures for security.
        'app_secret'    => env('FACEBOOK_APP_SECRET'),
        // Graph API version
        'graph_version' => env('FACEBOOK_GRAPH_VERSION', 'v21.0'),
    ],

];
