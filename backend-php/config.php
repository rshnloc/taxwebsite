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
    'FRONTEND_URL' => 'https://tax.careerxera.com',
    'LOG_PATH' => __DIR__ . '/logs/app.log',
    'MAIL_FROM_EMAIL' => 'no-reply@tax.careerxera.com',
    'MAIL_FROM_NAME' => 'Helpshack',
    'APP_ENV' => 'production',
];
