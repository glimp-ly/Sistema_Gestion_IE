<?php
session_start();
/**
 * Endpoint API: Reportes Generales
 * URI: /public/api/reportes.php
 */

require_once __DIR__ . '/../../controllers/ReporteController.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, X-Requested-With');

function responseJson($success, $message, $data = null): void
{
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data'    => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $method  = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $query   = $_GET;
    $payload = [];

    if ($method === 'POST') {
        $input = file_get_contents('php://input');
        if (!empty($input)) {
            $decoded = json_decode($input, true);
            $payload = is_array($decoded) ? $decoded : [];
            if (empty($payload)) {
                parse_str($input, $payload);
            }
        }
        $payload = array_merge($_POST, $payload);
    }

    // Datos de sesión para filtrar por rol
    $sessionData = [
        'usuario_id'  => $_SESSION['usuario_id'] ?? null,
        'rol_nombre'  => $_SESSION['rol_nombre'] ?? ''
    ];

    $controller = new ReporteController();
    $result     = $controller->handleRequest($method, $payload, $query, $sessionData);
    responseJson($result['success'], $result['message'], $result['data']);
} catch (Throwable $e) {
    http_response_code(500);
    responseJson(false, 'Error en el servidor al generar reporte: ' . $e->getMessage(), null);
}
