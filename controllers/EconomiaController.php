<?php
require_once __DIR__ . '/../core/database.php';
require_once __DIR__ . '/../models/EconomiaModel.php';

class EconomiaController
{
    private $model;

    public function __construct()
    {
        $pdo = Conexion::connection();
        $this->model = new EconomiaModel($pdo);
        $this->model->ensureTable();
    }

    public function handleRequest(string $method, array $payload = []): array
    {
        if ($method === 'GET') {
            return [
                'success' => true,
                'message' => 'Parámetros económicos cargados correctamente.',
                'data' => $this->model->getMetrics()
            ];
        }

        if ($method === 'POST' || $method === 'PATCH') {
            try {
                $updated = $this->model->updateMetrics($payload);
                return [
                    'success' => true,
                    'message' => 'Parámetros económicos actualizados correctamente en base de datos.',
                    'data' => $updated
                ];
            } catch (Throwable $e) {
                return [
                    'success' => false,
                    'message' => 'Error al guardar configuración económica: ' . $e->getMessage(),
                    'data' => null
                ];
            }
        }

        return ['success' => false, 'message' => 'Método no soportado.', 'data' => null];
    }
}
