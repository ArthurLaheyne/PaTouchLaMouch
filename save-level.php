<?php
// Enregistre un niveau créé dans la Sandbox (remplace l'API AWS éteinte le 2026-11-14).
//
// POST JSON : { "password": "...", "json": { lines, intersections, dragons, start, end } }
// Les niveaux sont ajoutés à data/levels.json (initialisé depuis levels.json au premier enregistrement).
// Le hash du mot de passe est dans save-level.config.php, généré par la CI (jamais versionné).

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const MAX_BODY_BYTES = 1000000;
const MAX_ITEMS = 1000;

function reply($status, $data) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    reply(405, ['error' => 'Méthode non autorisée']);
}

$configFile = __DIR__ . '/save-level.config.php';
if (!is_file($configFile)) {
    reply(500, ['error' => 'Enregistrement non configuré sur le serveur']);
}
$config = require $configFile;

$body = file_get_contents('php://input', false, null, 0, MAX_BODY_BYTES + 1);
if ($body === false || strlen($body) > MAX_BODY_BYTES) {
    reply(413, ['error' => 'Niveau trop volumineux']);
}
$payload = json_decode($body, true);
if (!is_array($payload)) {
    reply(400, ['error' => 'JSON invalide']);
}

if (!is_string($payload['password'] ?? null) || !password_verify($payload['password'], $config['password_hash'])) {
    sleep(1); // Ralentit les essais de mots de passe
    reply(401, ['error' => 'Mot de passe incorrect']);
}

// ---- Validation du niveau ----

function isPoint($p) {
    return is_array($p) && is_numeric($p['x'] ?? null) && is_numeric($p['y'] ?? null);
}
function point($p) {
    return ['x' => (float) $p['x'], 'y' => (float) $p['y']];
}
function lineKeys($keys, $lineCount) {
    if (!is_array($keys) || count($keys) > MAX_ITEMS) {
        return null;
    }
    $out = [];
    foreach ($keys as $k) {
        // -1 accepté pour compatibilité avec les anciens exports des dragons
        if (!is_int($k) || $k < -1 || $k >= $lineCount) {
            return null;
        }
        $out[] = $k;
    }
    return $out;
}
function invalid($message) {
    reply(422, ['error' => $message]);
}

$level = $payload['json'] ?? null;
if (!is_array($level) || !is_array($level['lines'] ?? null) || count($level['lines']) === 0 || count($level['lines']) > MAX_ITEMS) {
    invalid('Le niveau doit contenir des lignes');
}

$lines = [];
foreach ($level['lines'] as $i => $line) {
    if (!is_array($line) || !isPoint($line['start'] ?? null) || !isPoint($line['end'] ?? null)) {
        invalid("Ligne $i invalide");
    }
    $lines[] = ['name' => $i, 'start' => point($line['start']), 'end' => point($line['end'])];
}
$lineCount = count($lines);

$collect = function ($items, $label) use ($lineCount) {
    if (!is_array($items) || count($items) > MAX_ITEMS) {
        invalid("$label invalides");
    }
    $out = [];
    foreach ($items as $i => $item) {
        $keys = is_array($item) ? lineKeys($item['lines'] ?? null, $lineCount) : null;
        if (!isPoint($item['position'] ?? null) || $keys === null) {
            invalid("$label $i invalide");
        }
        $out[] = ['name' => is_scalar($item['name'] ?? null) ? $item['name'] : $i, 'position' => point($item['position']), 'lines' => $keys];
    }
    return $out;
};
$intersections = $collect($level['intersections'] ?? [], 'Intersections');
$dragons = $collect($level['dragons'] ?? [], 'Dragons');

$endpoint = function ($p, $label) use ($lineCount) {
    $keys = is_array($p) ? lineKeys($p['lines'] ?? null, $lineCount) : null;
    if (!isPoint($p) || !$keys) {
        invalid("$label : placez-le avant d'exporter");
    }
    return point($p) + ['lines' => $keys];
};
$start = $endpoint($level['start'] ?? null, 'Départ manquant');
$end = $endpoint($level['end'] ?? null, 'Arrivée manquante');

$newLevel = [
    'id' => bin2hex(random_bytes(16)),
    'datetime' => gmdate('Y-m-d\TH:i:s.v\Z'),
    'json' => compact('lines', 'intersections', 'dragons', 'start', 'end'),
];

// ---- Écriture avec verrou ----

$dataDir = __DIR__ . '/data';
$dataFile = $dataDir . '/levels.json';
if (!is_dir($dataDir) && !mkdir($dataDir, 0755, true)) {
    reply(500, ['error' => 'Impossible de créer le dossier data']);
}

$fh = fopen($dataFile, 'c+');
if (!$fh || !flock($fh, LOCK_EX)) {
    reply(500, ['error' => "Impossible d'ouvrir le fichier des niveaux"]);
}
$current = stream_get_contents($fh);
if (trim($current) === '') {
    $current = @file_get_contents(__DIR__ . '/levels.json') ?: '[]';
}
$levels = json_decode($current, true);
if (!is_array($levels)) {
    flock($fh, LOCK_UN);
    fclose($fh);
    reply(500, ['error' => 'Fichier des niveaux corrompu, enregistrement annulé']);
}
$levels[] = $newLevel;
file_put_contents($dataDir . '/levels.bak.json', $current); // Sauvegarde de la version précédente

$encoded = json_encode($levels, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION);
ftruncate($fh, 0);
rewind($fh);
$written = fwrite($fh, $encoded);
fflush($fh);
flock($fh, LOCK_UN);
fclose($fh);

if ($written !== strlen($encoded)) {
    reply(500, ['error' => "Erreur d'écriture"]);
}

reply(201, ['ok' => true, 'id' => $newLevel['id']]);
