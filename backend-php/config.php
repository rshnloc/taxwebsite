<?php
/**
 * Helpshack PHP API - Environment Configuration
 * Copy this to .env and fill in your values
 */
return [
    'DB_HOST' => 'localhost',
    'DB_PORT' => '3306',
    'DB_NAME' => 'helpshack',
    'DB_USER' => 'raushan',
    'DB_PASS' => '',
    'JWT_SECRET' => 'helpshack_jwt_secret_key_change_in_production',
    'JWT_EXPIRES_IN' => 604800, // 7 days in seconds
    'FRONTEND_URL' => 'https://frontend-pi-gilt-47.vercel.app',
    'APP_ENV' => 'production',
];
