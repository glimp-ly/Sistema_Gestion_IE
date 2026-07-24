<?php

require_once __DIR__ . '/../core/database.php';
require_once __DIR__ . '/../models/ActividadModel.php';

class ActividadController
{
    private ActividadModel $model;

    public function __construct()
    {
        $this->model = new ActividadModel(Conexion::connection());
    }

    public function handleRequest(string $method, array $payload = [], array $query = []): array
    {
        $idCredencial = (int)($_SESSION['usuario_id'] ?? 0);
        $rol = strtolower(trim((string)($_SESSION['rol_nombre'] ?? '')));
        if ($idCredencial <= 0 || $rol !== 'docente') {
            return $this->respuesta(false, 'Solo el docente puede usar este módulo.', null, 403);
        }

        $idDocente = $this->model->obtenerIdDocentePorCredencial($idCredencial);
        if (!$idDocente) {
            return $this->respuesta(false, 'La cuenta no está vinculada con la tabla DOCENTES.', null, 422);
        }

        if ($method === 'GET') {
            $year = (int)($query['year'] ?? date('Y'));
            $month = (int)($query['month'] ?? date('n'));
            if ($year < 2020 || $year > 2100 || $month < 1 || $month > 12) {
                return $this->respuesta(false, 'El mes solicitado no es válido.', null, 422);
            }

            $firstDay = sprintf('%04d-%02d-01 00:00:00', $year, $month);
            $nextMonth = (new DateTimeImmutable($firstDay))->modify('+1 month')->format('Y-m-d H:i:s');

            return $this->respuesta(true, 'Agenda docente cargada correctamente.', [
                'cursos' => $this->model->listarCursosAsignados($idDocente),
                'horario' => $this->model->listarHorario($idDocente),
                'actividades' => $this->model->listarActividades($idDocente),
                'eventos' => $this->model->listarEventos($firstDay, $nextMonth),
                'periodo' => ['year' => $year, 'month' => $month],
            ]);
        }

        if ($method === 'POST' || $method === 'PATCH') {
            $idActividad = (int)($payload['id_actividad'] ?? 0);
            $idGradoCurso = (int)($payload['id_gradoCurso'] ?? 0);
            $nombre = trim((string)($payload['nombre'] ?? ''));
            $peso = filter_var($payload['peso'] ?? null, FILTER_VALIDATE_FLOAT);

            if ($idGradoCurso <= 0) {
                return $this->respuesta(false, 'Seleccione un curso y grado.', null, 422);
            }
            if ($nombre === '' || strlen($nombre) > 100) {
                return $this->respuesta(false, 'El nombre es obligatorio y no puede superar 100 caracteres.', null, 422);
            }
            if ($peso === false || $peso <= 0 || $peso > 100) {
                return $this->respuesta(false, 'El peso debe ser mayor que 0 y máximo 100.', null, 422);
            }

            if ($method === 'POST') {
                $registro = $this->model->crearActividad($idDocente, $idGradoCurso, $nombre, (float)$peso);
                return $this->respuesta(true, 'Actividad registrada correctamente.', $registro, 201);
            }

            if ($idActividad <= 0) {
                return $this->respuesta(false, 'La actividad indicada no es válida.', null, 422);
            }
            $registro = $this->model->actualizarActividad($idDocente, $idActividad, $idGradoCurso, $nombre, (float)$peso);
            if (!$registro) {
                return $this->respuesta(false, 'La actividad no fue encontrada.', null, 404);
            }
            return $this->respuesta(true, 'Actividad actualizada correctamente.', $registro);
        }

        if ($method === 'DELETE') {
            $idActividad = (int)($payload['id_actividad'] ?? 0);
            if ($idActividad <= 0) {
                return $this->respuesta(false, 'La actividad indicada no es válida.', null, 422);
            }
            try {
                if (!$this->model->eliminarActividad($idDocente, $idActividad)) {
                    return $this->respuesta(false, 'La actividad no fue encontrada.', null, 404);
                }
            } catch (RuntimeException $e) {
                return $this->respuesta(false, $e->getMessage(), null, 409);
            }
            return $this->respuesta(true, 'Actividad eliminada correctamente.', ['id_actividad' => $idActividad]);
        }

        return $this->respuesta(false, 'Método no permitido.', null, 405);
    }

    private function respuesta(bool $success, string $message, mixed $data = null, int $status = 200): array
    {
        return compact('success', 'message', 'data', 'status');
    }
}
