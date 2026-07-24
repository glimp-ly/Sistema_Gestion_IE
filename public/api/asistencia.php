<?php
/**
 * Endpoint de API: Asistencias
 * URI: /api/asistencia.php
 *
 * GET ?fecha=YYYY-MM-DD          → asistencias de esa fecha
 * GET ?id_alumno=X               → historial de un alumno
 * POST { fecha, registros:[...] } → registro en lote
 * POST { fecha, id_alumno, tipo } → registro individual
 */
require_once __DIR__ . '/../../controllers/AsistenciaController.php';

header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, X-Requested-With');

function responseJson($success, $message, $data = null): void
{
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data'    => $data
    ]);
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

    $controller = new AsistenciaController();
    $result     = $controller->handleRequest($method, $payload, $query);
    responseJson($result['success'], $result['message'], $result['data']);
} catch (Throwable $e) {
    http_response_code(500);
    responseJson(false, 'No fue posible procesar la solicitud: ' . $e->getMessage(), null);
}
?>
