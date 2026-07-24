<?php
require_once __DIR__ . '/../core/database.php';
require_once __DIR__ . '/../models/DocenteModel.php';

class DocenteController
{
    private $model;

    public function __construct()
    {
        $pdo = Conexion::connection();
        $this->model = new DocenteModel($pdo);
        $this->model->ensureTable();
    }

    public function handleRequest(string $method, array $payload = []): array
    {
        if ($method === 'GET') {
            if (($payload['action'] ?? '') === 'credentials') {
                $role = strtolower(trim($_SESSION['rol_nombre'] ?? ''));
                if (!in_array($role, ['director', 'administrador', 'admin'], true)) {
                    return ['success' => false, 'message' => 'No tiene permiso para consultar las credenciales.', 'data' => null];
                }
                return ['success' => true, 'message' => 'Credenciales cargadas correctamente.', 'data' => $this->model->getCredentials()];
            }
            return ['success' => true, 'message' => 'Docentes cargados correctamente.', 'data' => $this->model->getAll()];
        }

        if ($method === 'POST') {
            $action = (string)($payload['action'] ?? '');
            if ($action === 'rate' || (isset($payload['calificacion']) && !isset($payload['nombre_completo']) && !isset($payload['nombre']))) {
                $idDocente = (int)($payload['id_docente'] ?? 0);
                $calificacion = isset($payload['calificacion']) ? (float)$payload['calificacion'] : null;
                $observaciones = trim((string)($payload['observaciones'] ?? ''));

                if ($idDocente <= 0 || $calificacion === null) {
                    return ['success' => false, 'message' => 'Seleccione un docente y una calificación válida.', 'data' => null];
                }

                return ['success' => true, 'message' => 'Calificación registrada correctamente.', 'data' => $this->model->rateDocente($idDocente, $calificacion, $observaciones)];
            }

            try {
                $record = $this->model->create($payload);
                return ['success' => true, 'message' => 'Docente registrado correctamente.', 'data' => $record];
            } catch (InvalidArgumentException $e) {
                return ['success' => false, 'message' => $e->getMessage(), 'data' => null];
            }
        }

        if ($method === 'PATCH') {
            $idDocente = (int)($payload['id_docente'] ?? 0);
            $action = (string)($payload['action'] ?? '');

            if ($action === 'rate' || isset($payload['calificacion'])) {
                $calificacion = isset($payload['calificacion']) ? (float)$payload['calificacion'] : null;
                $observaciones = trim((string)($payload['observaciones'] ?? ''));

                if ($idDocente <= 0 || $calificacion === null) {
                    return ['success' => false, 'message' => 'Seleccione un docente y una calificación válida.', 'data' => null];
                }

                return ['success' => true, 'message' => 'Calificación registrada correctamente.', 'data' => $this->model->rateDocente($idDocente, $calificacion, $observaciones)];
            }

            $estado = isset($payload['es_activo']) ? filter_var($payload['es_activo'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) : null;

            if ($idDocente <= 0 || $estado === null) {
                return ['success' => false, 'message' => 'Datos incompletos para actualizar el estado.', 'data' => null];
            }

            return ['success' => true, 'message' => 'Estado actualizado correctamente.', 'data' => $this->model->updateStatus($idDocente, $estado)];
        }

        return ['success' => false, 'message' => 'Método no soportado.', 'data' => null];
    }
}
