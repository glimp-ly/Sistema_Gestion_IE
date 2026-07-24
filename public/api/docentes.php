<?php
require_once __DIR__ . '/../../controllers/DocenteController.php';
require_once __DIR__ . '/../../core/security.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
} else {
    header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_HOST'] ?? ''));
}
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, X-Requested-With, X-CSRF-Token');

function responseJson($success, $message, $data = null)
{
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (empty($_SESSION['usuario_id'])) {
    http_response_code(401);
    responseJson(false, 'Debe iniciar sesión para acceder a este recurso.', null);
}

try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $input = file_get_contents('php://input');
    $payload = [];

    if (!empty($input)) {
        $decoded = json_decode($input, true);
        if (is_array($decoded) && !empty($decoded)) {
            $payload = $decoded;
        } else {
            parse_str($input, $payload);
        }
    }

    if ($method === 'POST' || $method === 'PATCH') {
        $csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $payload['csrf_token'] ?? $_POST['csrf_token'] ?? '';
        if (!Security::validarTokenCSRF($csrfToken)) {
            http_response_code(403);
            responseJson(false, 'Token CSRF inválido o ausente.', null);
        }
        $payload = array_merge($_POST, $payload);
    }
    if ($method === 'GET') {
        $payload = array_merge($_GET, $payload);
    }

    $controller = new DocenteController();
    $result = $controller->handleRequest($method, $payload);
    responseJson($result['success'], $result['message'], $result['data']);
} catch (Throwable $e) {
    http_response_code(500);
    responseJson(false, 'No fue posible procesar la solicitud: ' . $e->getMessage(), null);
}
?>
