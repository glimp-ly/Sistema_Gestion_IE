<?php
require_once __DIR__ . '/../core/database.php';
require_once __DIR__ . '/../models/CursoModel.php';

class CursoController
{
    private $model;

    public function __construct()
    {
        $pdo = Conexion::connection();
        $this->model = new CursoModel($pdo);
        $this->model->ensureTables();
    }

    public function handleRequest(string $method, array $payload = []): array
    {
        if ($method === 'GET') {
            return ['success' => true, 'message' => 'Datos de cursos cargados correctamente.', 'data' => $this->model->getReferenceData()];
        }

        if ($method === 'POST') {
            try {
                $action = $payload['action'] ?? 'create-course';

                if ($action === 'assign-course') {
                    $record = $this->model->assignCourse($payload);
                    return ['success' => true, 'message' => 'Asignación registrada correctamente.', 'data' => $record];
                }

                $record = $this->model->createCourse($payload);
                return ['success' => true, 'message' => 'Curso registrado correctamente.', 'data' => $record];
            } catch (InvalidArgumentException $e) {
                return ['success' => false, 'message' => $e->getMessage(), 'data' => null];
            }
        }

        return ['success' => false, 'message' => 'Método no soportado.', 'data' => null];
    }
}
