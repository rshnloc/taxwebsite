<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/src/Database.php';
require_once __DIR__ . '/src/helpers.php';
require_once __DIR__ . '/src/Mailer.php';

$limit = isset($argv[1]) ? max(1, (int)$argv[1]) : 10;
$db = Database::getInstance()->getConnection();
$processed = Mailer::processQueue($db, $limit);

echo "Processed {$processed} queued email(s)." . PHP_EOL;