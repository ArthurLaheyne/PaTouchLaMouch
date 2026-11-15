<?php
// Enregistre les niveaux de la Sandbox (remplace l'API AWS éteinte le 2026-11-14).
//
// POST JSON : { "password": "...", "action": "create" | "replace" | "delete", "id": "...", "json": { ... } }
//   create  (par défaut) : ajoute le niveau "json", renvoie son nouvel id
//   replace : remplace le contenu du niveau "id" par "json" (même id, date mise à jour)
//   delete  : supprime le niveau "id"
// "json" : { lines, intersections, dragons, start, end }. Dragons, départ et arrivée peuvent porter un
// "anchor" (segment entre deux bornes, utilisé par l'éditeur pour rouvrir le niveau ; ignoré par le jeu).
//
// Les niveaux sont dans data/levels.json (initialisé depuis levels.json au premier enregistrement),
// la version précédente dans data/levels.bak.json.
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

$action = $payload['action'] ?? 'create';
if (!in_array($action, ['create', 'replace', 'delete'], true)) {
    reply(400, ['error' => 'Action inconnue']);
}
$id = null;
if ($action !== 'create') {
    $id = $payload['id'] ?? null;
    if (!is_string($id) || !preg_match('/^[A-Za-z0-9-]{1,64}$/', $id)) {
        reply(400, ['error' => 'Identifiant de niveau invalide']);
    }
}

// ---- Validation du niveau ----

function invalid($message) {
    reply(422, ['error' => $message]);
}
function isPoint($p) {
    return is_array($p) && is_numeric($p['x'] ?? null) && is_numeric($p['y'] ?? null);
}
function point($p) {
    return ['x' => (float) $p['x'], 'y' => (float) $p['y']];
}
function isLineKey($k, $lineCount) {
    return is_int($k) && $k >= 0 && $k < $lineCount;
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
// Ancrage facultatif : { line, prev, next, u } ; un ancrage invalide est simplement ignoré
function anchor($a, $lineCount) {
    $isNode = function ($n) use ($lineCount) {
        return $n === 'start' || $n === 'end' || isLineKey($n, $lineCount);
    };
    if (!is_array($a) || !isLineKey($a['line'] ?? null, $lineCount) || !$isNode($a['prev'] ?? null)
        || !$isNode($a['next'] ?? null) || !is_numeric($a['u'] ?? null) || $a['u'] < 0 || $a['u'] > 1) {
        return null;
    }
    return ['line' => $a['line'], 'prev' => $a['prev'], 'next' => $a['next'], 'u' => (float) $a['u']];
}

function validateLevel($level) {
    if (!is_array($level) || !is_array($level['lines'] ?? null) || count($level['lines']) === 0 || count($level['lines']) > MAX_ITEMS) {
        invalid('Le niveau doit contenir des lignes');
    }
    $lines = [];
    foreach (array_values($level['lines']) as $i => $line) {
        if (!is_array($line) || !isPoint($line['start'] ?? null) || !isPoint($line['end'] ?? null)) {
            invalid("Ligne $i invalide");
        }
        $lines[] = ['name' => $i, 'start' => point($line['start']), 'end' => point($line['end'])];
    }
    $lineCount = count($lines);

    $collect = function ($items, $label, $withAnchor) use ($lineCount) {
        if (!is_array($items) || count($items) > MAX_ITEMS) {
            invalid("$label invalides");
        }
        $out = [];
        foreach (array_values($items) as $i => $item) {
            $keys = is_array($item) ? lineKeys($item['lines'] ?? null, $lineCount) : null;
            if (!isPoint($item['position'] ?? null) || $keys === null) {
                invalid("$label $i invalide");
            }
            $entry = ['name' => is_scalar($item['name'] ?? null) ? $item['name'] : $i, 'position' => point($item['position']), 'lines' => $keys];
            if ($withAnchor && ($a = anchor($item['anchor'] ?? null, $lineCount))) {
                $entry['anchor'] = $a;
            }
            $out[] = $entry;
        }
        return $out;
    };
    $intersections = $collect($level['intersections'] ?? [], 'Intersections', false);
    $dragons = $collect($level['dragons'] ?? [], 'Dragons', true);

    $endpoint = function ($p, $message) use ($lineCount) {
        $keys = is_array($p) ? lineKeys($p['lines'] ?? null, $lineCount) : null;
        if (!isPoint($p) || !$keys) {
            invalid("$message : placez-le avant d'enregistrer");
        }
        $out = point($p) + ['lines' => $keys];
        if ($a = anchor($p['anchor'] ?? null, $lineCount)) {
            $out['anchor'] = $a;
        }
        return $out;
    };
    $start = $endpoint($level['start'] ?? null, 'Départ manquant');
    $end = $endpoint($level['end'] ?? null, 'Arrivée manquante');

    return compact('lines', 'intersections', 'dragons', 'start', 'end');
}

$levelJson = $action === 'delete' ? null : validateLevel($payload['json'] ?? null);
$now = gmdate('Y-m-d\TH:i:s.v\Z');

// ---- Lecture / écriture avec verrou ----

$dataDir = __DIR__ . '/data';
$dataFile = $dataDir . '/levels.json';
if (!is_dir($dataDir) && !mkdir($dataDir, 0755, true)) {
    reply(500, ['error' => 'Impossible de créer le dossier data']);
}

$fh = fopen($dataFile, 'c+');
if (!$fh || !flock($fh, LOCK_EX)) {
    reply(500, ['error' => "Impossible d'ouvrir le fichier des niveaux"]);
}
function release($fh) {
    flock($fh, LOCK_UN);
    fclose($fh);
}

$current = stream_get_contents($fh);
if (trim($current) === '') {
    $current = @file_get_contents(__DIR__ . '/levels.json') ?: '[]';
}
$levels = json_decode($current, true);
if (!is_array($levels)) {
    release($fh);
    reply(500, ['error' => 'Fichier des niveaux corrompu, enregistrement annulé']);
}

if ($action === 'create') {
    $id = bin2hex(random_bytes(16));
    $levels[] = ['id' => $id, 'datetime' => $now, 'json' => $levelJson];
    $status = 201;
} else {
    $index = null;
    foreach ($levels as $i => $level) {
        if (($level['id'] ?? null) === $id) {
            $index = $i;
            break;
        }
    }
    if ($index === null) {
        release($fh);
        reply(404, ['error' => 'Niveau introuvable']);
    }
    if ($action === 'replace') {
        $levels[$index]['json'] = $levelJson;
        $levels[$index]['datetime'] = $now;
    } else {
        array_splice($levels, $index, 1);
    }
    $status = 200;
}

file_put_contents($dataDir . '/levels.bak.json', $current); // Sauvegarde de la version précédente
$encoded = json_encode(array_values($levels), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION);
ftruncate($fh, 0);
rewind($fh);
$written = fwrite($fh, $encoded);
fflush($fh);
release($fh);

if ($written !== strlen($encoded)) {
    reply(500, ['error' => "Erreur d'écriture"]);
}

reply($status, ['ok' => true, 'action' => $action, 'id' => $id]);
