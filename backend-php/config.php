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

    // ── Mail (SMTP) ───────────────────────────────────────────
    // On Hostinger: use your cPanel email account credentials
    // Host is usually: mail.careerxera.com  (or smtp.hostinger.com)
    // Port: 465 (SSL) or 587 (TLS)
    'MAIL_FROM_EMAIL' => 'no-reply@tax.careerxera.com',
    'MAIL_FROM_NAME'  => 'Tax CareerXera',
    'MAIL_SMTP_HOST'  => 'smtp.hostinger.com',   // change to mail.yourdomain.com if needed
    'MAIL_SMTP_PORT'  => 465,                    // 465 = SSL, 587 = TLS
    'MAIL_SMTP_USER'  => 'no-reply@tax.careerxera.com',  // your cPanel email address
    'MAIL_SMTP_PASS'  => 'YOUR_EMAIL_PASSWORD',          // cPanel email password
    'MAIL_SMTP_ENC'   => 'ssl',                          // 'ssl' for 465, 'tls' for 587

    'APP_ENV' => 'production',
];
