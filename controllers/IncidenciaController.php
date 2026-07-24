<?php

require_once __DIR__ . '/../core/database.php';
require_once __DIR__ . '/../models/IncidenciaModel.php';

class IncidenciaController
{
    private IncidenciaModel $model;

    public function __construct()
    {
        $this->model = new IncidenciaModel(Conexion::connection());
    }

    public function handleRequest(string $method, array $payload = [], array $query = []): array
    {
        $idCredencial = (int)($_SESSION['usuario_id'] ?? 0);
        $rol = strtolower(trim((string)($_SESSION['rol_nombre'] ?? '')));

        if ($idCredencial <= 0 || $rol === '') {
            return $this->respuesta(false, 'La sesión no está activa.', null, 401);
        }

        $esDocente = $rol === 'docente';
        $esAdmin = in_array($rol, ['director', 'administrador', 'admin'], true);

        if (!$esDocente && !$esAdmin) {
            return $this->respuesta(false, 'No tiene permisos para usar este módulo.', null, 403);
        }

        if ($method === 'GET') {
            $action = strtolower(trim((string)($query['action'] ?? 'list')));

            if ($action === 'students') {
                if (!$esDocente) {
                    return $this->respuesta(false, 'Solo el docente puede consultar alumnos desde este formulario.', null, 403);
                }
                $idDocente = $this->obtenerIdDocente($idCredencial);
                return $this->respuesta(true, 'Alumnos asignados cargados correctamente.', $this->model->listarAlumnosPorDocente($idDocente));
            }

            if ($esDocente) {
                $idDocente = $this->obtenerIdDocente($idCredencial);
                return $this->respuesta(true, 'Incidencias del docente cargadas correctamente.', $this->model->listarPorDocente($idDocente));
            }

            return $this->respuesta(true, 'Incidencias cargadas correctamente.', $this->model->listarTodas());
        }

        if ($method === 'POST') {
            if (!$esDocente) {
                return $this->respuesta(false, 'Solo los docentes pueden registrar incidencias.', null, 403);
            }

            $idAlumno = (int)($payload['id_alumno'] ?? 0);
            $texto = trim((string)($payload['texto'] ?? ''));
            $prioridad = $this->normalizarPrioridad((string)($payload['prioridad'] ?? 'Media'));

            if ($idAlumno <= 0) {
                return $this->respuesta(false, 'Seleccione un alumno.', null, 422);
            }
            if ($texto === '' || strlen($texto) < 10) {
                return $this->respuesta(false, 'Describa la incidencia con al menos 10 caracteres.', null, 422);
            }
            if (strlen($texto) > 3000) {
                return $this->respuesta(false, 'La descripción no puede superar los 3000 caracteres.', null, 422);
            }

            $idDocente = $this->obtenerIdDocente($idCredencial);
            $registro = $this->model->crear($idDocente, $idAlumno, $texto, $prioridad);
            return $this->respuesta(true, 'Incidencia registrada y enviada a Dirección.', $registro, 201);
        }

        if ($method === 'PATCH') {
            if (!$esAdmin) {
                return $this->respuesta(false, 'Solo Dirección puede gestionar la prioridad.', null, 403);
            }

            $idIncidencia = (int)($payload['id_incidencia'] ?? 0);
            $prioridad = $this->normalizarPrioridad((string)($payload['prioridad'] ?? ''));

            if ($idIncidencia <= 0) {
                return $this->respuesta(false, 'La incidencia indicada no es válida.', null, 422);
            }

            $registro = $this->model->actualizarPrioridad($idIncidencia, $prioridad);
            if (!$registro) {
                return $this->respuesta(false, 'La incidencia no fue encontrada.', null, 404);
            }

            return $this->respuesta(true, 'Prioridad actualizada correctamente.', $registro);
        }

        if ($method === 'DELETE') {
            if (!$esAdmin) {
                return $this->respuesta(false, 'Solo Dirección puede eliminar incidencias.', null, 403);
            }

            $idIncidencia = (int)($payload['id_incidencia'] ?? 0);
            if ($idIncidencia <= 0) {
                return $this->respuesta(false, 'La incidencia indicada no es válida.', null, 422);
            }

            if (!$this->model->eliminar($idIncidencia)) {
                return $this->respuesta(false, 'La incidencia no fue encontrada.', null, 404);
            }

            return $this->respuesta(true, 'Incidencia eliminada correctamente.', ['id_incidencia' => $idIncidencia]);
        }

        return $this->respuesta(false, 'Método no permitido.', null, 405);
    }

    private function obtenerIdDocente(int $idCredencial): int
    {
        $idDocente = $this->model->obtenerIdDocentePorCredencial($idCredencial);
        if (!$idDocente) {
            throw new RuntimeException('La cuenta docente no está vinculada con la tabla DOCENTES.');
        }
        return $idDocente;
    }

    private function normalizarPrioridad(string $prioridad): string
    {
        $valor = strtolower(trim($prioridad));
        $permitidas = [
            'baja' => 'Baja',
            'media' => 'Media',
            'alta' => 'Alta',
        ];

        if (!isset($permitidas[$valor])) {
            throw new InvalidArgumentException('La prioridad debe ser Baja, Media o Alta.');
        }

        return $permitidas[$valor];
    }

    private function respuesta(bool $success, string $message, mixed $data = null, int $status = 200): array
    {
        return [
            'success' => $success,
            'message' => $message,
            'data' => $data,
            'status' => $status,
        ];
    }
}
