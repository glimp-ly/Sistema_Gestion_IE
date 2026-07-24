<?php

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

require_once __DIR__ . '/../../core/config.php';
require_once __DIR__ . '/../../core/database.php';
require_once __DIR__ . '/../../core/security.php';
require_once __DIR__ . '/../../controllers/IncidenciaController.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Allow: GET, POST, PATCH, DELETE, OPTIONS');

function responderIncidencias(array $result): never
{
    http_response_code((int)($result['status'] ?? 200));
    unset($result['status']);
    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $payload = [];
    $rawBody = file_get_contents('php://input');

    if ($rawBody !== false && trim($rawBody) !== '') {
        $decoded = json_decode($rawBody, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $payload = $decoded;
        } else {
            parse_str($rawBody, $payload);
        }
    }

    if ($method === 'POST') {
        $payload = array_merge($_POST, $payload);
    }

    if (in_array($method, ['POST', 'PATCH', 'DELETE'], true)) {
        $csrfToken = (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($payload['csrf_token'] ?? ''));
        if (!Security::validarTokenCSRF($csrfToken)) {
            responderIncidencias([
                'success' => false,
                'message' => 'Token de seguridad inválido. Recargue la página e inténtelo nuevamente.',
                'data' => null,
                'status' => 419,
            ]);
        }
    }

    $controller = new IncidenciaController();
    $result = $controller->handleRequest($method, $payload, $_GET);
    responderIncidencias($result);
} catch (InvalidArgumentException $e) {
    responderIncidencias([
        'success' => false,
        'message' => $e->getMessage(),
        'data' => null,
        'status' => 422,
    ]);
} catch (RuntimeException $e) {
    $mensaje = $e->getMessage();
    $status = str_contains(strtolower($mensaje), 'sesión') ? 401 : 422;
    responderIncidencias([
        'success' => false,
        'message' => $mensaje,
        'data' => null,
        'status' => $status,
    ]);
} catch (Throwable $e) {
    error_log('Error en API de incidencias: ' . $e->getMessage());
    responderIncidencias([
        'success' => false,
        'message' => 'No fue posible procesar la solicitud de incidencias.',
        'data' => null,
        'status' => 500,
    ]);
}
