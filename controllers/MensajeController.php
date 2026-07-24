<?php

require_once __DIR__ . '/../core/database.php';
require_once __DIR__ . '/../models/MensajeModel.php';

class MensajeController
{
    private MensajeModel $model;

    public function __construct()
    {
        $this->model = new MensajeModel(Conexion::connection());
    }

    public function handleRequest(string $method, array $payload = [], array $query = []): array
    {
        $idCredencial = (int)($_SESSION['usuario_id'] ?? 0);
        $rol = strtolower(trim((string)($_SESSION['rol_nombre'] ?? '')));
        if ($idCredencial <= 0 || $rol === '') {
            return $this->respuesta(false, 'La sesión no está activa.', null, 401);
        }

        $actual = $this->model->obtenerUsuarioPorCredencial($idCredencial);
        if (!$actual || empty($actual['id_buzon'])) {
            return $this->respuesta(false, 'El usuario no tiene un buzón asociado.', null, 422);
        }

        $esDocente = $rol === 'docente';
        $esAdmin = in_array($rol, ['director', 'administrador', 'admin'], true);
        if (!$esDocente && !$esAdmin) {
            return $this->respuesta(false, 'No tiene permisos para usar la mensajería.', null, 403);
        }

        if ($method === 'GET') {
            $action = strtolower(trim((string)($query['action'] ?? 'notifications')));

            if ($action === 'notifications') {
                return $this->respuesta(true, 'Notificaciones cargadas.', $this->model->obtenerNotificaciones($actual));
            }

            if ($action === 'contacts') {
                if (!$esAdmin) {
                    return $this->respuesta(false, 'Solo Dirección puede listar docentes.', null, 403);
                }
                return $this->respuesta(true, 'Docentes cargados.', $this->model->listarDocentes((string)$actual['username']));
            }

            if ($action === 'director') {
                if (!$esDocente) {
                    return $this->respuesta(false, 'Esta consulta corresponde al portal docente.', null, 403);
                }
                $director = $this->model->obtenerDirectorPrincipal();
                if (!$director) {
                    return $this->respuesta(false, 'No existe un director activo con buzón.', null, 404);
                }
                return $this->respuesta(true, 'Director cargado.', $director);
            }

            if ($action === 'ugel') {
                if (!$esAdmin) {
                    return $this->respuesta(false, 'Solo Dirección puede consultar comunicaciones UGEL.', null, 403);
                }
                return $this->respuesta(true, 'Comunicaciones UGEL cargadas.', $this->model->listarComunicacionesUgel($actual));
            }

            if ($action === 'conversation') {
                $with = trim((string)($query['with'] ?? ''));
                if ($with === '') {
                    return $this->respuesta(false, 'Seleccione un contacto.', null, 422);
                }
                $otro = $this->model->obtenerUsuarioPorUsername($with);
                if (!$otro || !$this->contactoPermitido($esAdmin, $esDocente, $otro)) {
                    return $this->respuesta(false, 'El contacto seleccionado no está permitido.', null, 403);
                }
                $mensajes = $this->model->obtenerConversacion($actual, $otro);
                return $this->respuesta(true, 'Conversación cargada.', [
                    'contacto' => $otro,
                    'mensajes' => $mensajes,
                    'notificaciones' => $this->model->obtenerNotificaciones($actual),
                ]);
            }

            return $this->respuesta(false, 'Acción de mensajería no reconocida.', null, 404);
        }

        if ($method === 'POST') {
            $destinatarioUsername = trim((string)($payload['destinatario'] ?? ''));
            $mensaje = trim((string)($payload['mensaje'] ?? ''));

            if ($destinatarioUsername === '') {
                return $this->respuesta(false, 'Seleccione un destinatario.', null, 422);
            }
            if ($mensaje === '' || strlen($mensaje) > 2000) {
                return $this->respuesta(false, 'El mensaje debe contener entre 1 y 2000 caracteres.', null, 422);
            }

            $destinatario = $this->model->obtenerUsuarioPorUsername($destinatarioUsername);
            if (!$destinatario || !$this->contactoPermitido($esAdmin, $esDocente, $destinatario)) {
                return $this->respuesta(false, 'El destinatario no está permitido.', null, 403);
            }

            $registro = $this->model->enviar($actual, $destinatario, $mensaje);
            return $this->respuesta(true, 'Mensaje enviado correctamente.', $registro, 201);
        }

        return $this->respuesta(false, 'Método no permitido.', null, 405);
    }

    private function contactoPermitido(bool $esAdmin, bool $esDocente, array $contacto): bool
    {
        if ($esAdmin) {
            return !empty($contacto['id_docente']);
        }
        if ($esDocente) {
            return !empty($contacto['id_administrativo']);
        }
        return false;
    }

    private function respuesta(bool $success, string $message, mixed $data = null, int $status = 200): array
    {
        return compact('success', 'message', 'data', 'status');
    }
}
