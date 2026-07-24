<?php

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

require_once __DIR__ . '/../../core/config.php';
require_once __DIR__ . '/../../core/database.php';
require_once __DIR__ . '/../../core/security.php';
require_once __DIR__ . '/../../controllers/PlantillaController.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET' && strtolower((string)($_GET['action'] ?? '')) === 'download') {
    try {
        $controller = new PlantillaController();
        $idPlantilla = (int)($_GET['id'] ?? 0);
        if ($idPlantilla <= 0) {
            http_response_code(422);
            echo 'Identificador de plantilla inválido.';
            exit;
        }
        $archivo = $controller->obtenerArchivoParaDescarga($idPlantilla);
        if (!$archivo) {
            http_response_code(404);
            echo 'Archivo no encontrado.';
            exit;
        }

        $nombre = basename((string)$archivo['nombre']);
        $extension = strtolower(pathinfo($nombre, PATHINFO_EXTENSION));
        $mimes = [
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        $contenido = (string)$archivo['archivo'];

        header('Content-Type: ' . ($mimes[$extension] ?? 'application/octet-stream'));
        header('Content-Length: ' . strlen($contenido));
        header("Content-Disposition: attachment; filename*=UTF-8''" . rawurlencode($nombre));
        header('X-Content-Type-Options: nosniff');
        echo $contenido;
        exit;
    } catch (RuntimeException $e) {
        $mensaje = $e->getMessage();
        $minusculas = strtolower($mensaje);
        $status = str_contains($minusculas, 'sesión') ? 401 : (str_contains($minusculas, 'permis') ? 403 : 422);
        http_response_code($status);
        echo htmlspecialchars($mensaje, ENT_QUOTES, 'UTF-8');
        exit;
    } catch (Throwable $e) {
        error_log('Error descargando plantilla: ' . $e->getMessage());
        http_response_code(500);
        echo 'No se pudo descargar el archivo.';
        exit;
    }
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Allow: GET, POST, DELETE, OPTIONS');

function responderPlantillas(array $result): never
{
    http_response_code((int)($result['status'] ?? 200));
    unset($result['status']);
    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $payload = [];
    $rawBody = file_get_contents('php://input');
    if ($method === 'DELETE' && $rawBody !== false && trim($rawBody) !== '') {
        $decoded = json_decode($rawBody, true);
        if (is_array($decoded)) {
            $payload = $decoded;
        }
    }
    if ($method === 'POST') {
        $payload = $_POST;
    }

    if (in_array($method, ['POST', 'DELETE'], true)) {
        $csrfToken = (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($payload['csrf_token'] ?? ''));
        if (!Security::validarTokenCSRF($csrfToken)) {
            responderPlantillas([
                'success' => false,
                'message' => 'Token de seguridad inválido. Recargue la página.',
                'data' => null,
                'status' => 419,
            ]);
        }
    }

    $controller = new PlantillaController();
    responderPlantillas($controller->handleRequest($method, $payload, $_FILES));
} catch (RuntimeException $e) {
    $mensaje = $e->getMessage();
    $minusculas = strtolower($mensaje);
    $status = str_contains($minusculas, 'sesión') ? 401 : (str_contains($minusculas, 'permis') ? 403 : 422);
    responderPlantillas([
        'success' => false,
        'message' => $mensaje,
        'data' => null,
        'status' => $status,
    ]);
} catch (Throwable $e) {
    error_log('Error en API de plantillas: ' . $e->getMessage());
    responderPlantillas([
        'success' => false,
        'message' => 'No fue posible procesar las plantillas.',
        'data' => null,
        'status' => 500,
    ]);
}
