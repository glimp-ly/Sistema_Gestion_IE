<?php
/**
 * Controlador de Asistencia
 *
 * Maneja las peticiones HTTP para el módulo de registro de asistencias.
 * Trabaja sobre la tabla ASISTENCIA existente:
 *   (id_asistencia, fecha, tipo, id_alumno)
 *
 * Métodos HTTP soportados:
 *
 *   GET ?fecha=YYYY-MM-DD
 *     → Devuelve todos los registros de asistencia de esa fecha
 *
 *   GET ?id_alumno=X
 *     → Devuelve el historial completo de asistencias de un alumno
 *
 *   POST { fecha, registros: [{ id_alumno, tipo }] }
 *     → Registra o actualiza asistencias en lote para una fecha
 *
 *   POST { id_alumno, fecha, tipo }
 *     → Registra o actualiza la asistencia de un solo alumno
 */
require_once __DIR__ . '/../core/database.php';
require_once __DIR__ . '/../models/AsistenciaModel.php';

class AsistenciaController
{
    private $model;

    public function __construct()
    {
        $pdo = Conexion::connection();
        $this->model = new AsistenciaModel($pdo);
    }

    /**
     * Despacha la petición al método del modelo correspondiente.
     *
     * @param string $method  Método HTTP ('GET', 'POST')
     * @param array  $payload Cuerpo de la petición (JSON decodificado o form-data)
     * @param array  $query   Parámetros de la URL ($_GET)
     * @return array Respuesta estandarizada ['success', 'message', 'data']
     */
    public function handleRequest(string $method, array $payload = [], array $query = []): array
    {
        // ── GET: consultas de lectura ──────────────────────────────────────────
        if ($method === 'GET') {

            // Historial de un alumno específico
            if (!empty($query['id_alumno'])) {
                $idAlumno = (int)$query['id_alumno'];
                $data = $this->model->getPorAlumno($idAlumno);
                return [
                    'success' => true,
                    'message' => 'Historial de asistencias cargado.',
                    'data'    => $data
                ];
            }

            // Alumnos con asistencia precargada para una fecha (con filtro de nivel opcional)
            if (!empty($query['fecha'])) {
                $fecha = trim((string)$query['fecha']);
                $nivel = trim((string)($query['nivel'] ?? ''));
                $data  = $this->model->getEstudiantesParaFecha($fecha, $nivel);
                return [
                    'success' => true,
                    'message' => "Alumnos cargados para la fecha {$fecha}.",
                    'data'    => $data
                ];
            }

            // Resumen de asistencias (para reportes)
            if (!empty($query['tipo']) && $query['tipo'] === 'resumen') {
                $filtros = [
                    'fecha_inicio' => trim((string)($query['fecha_inicio'] ?? '')),
                    'fecha_fin'    => trim((string)($query['fecha_fin'] ?? '')),
                    'id_alumno'    => (int)($query['id_alumno'] ?? 0)
                ];
                $data = $this->model->getResumenPorAlumno($filtros);
                return [
                    'success' => true,
                    'message' => 'Resumen de asistencias cargado.',
                    'data'    => $data
                ];
            }

            return [
                'success' => false,
                'message' => "Especifique ?fecha=YYYY-MM-DD, ?id_alumno=X o ?tipo=resumen.",
                'data'    => null
            ];
        }


        // ── POST: registro de asistencias ──────────────────────────────────────
        if ($method === 'POST') {
            $fecha    = trim((string)($payload['fecha'] ?? ''));

            if ($fecha === '') {
                return [
                    'success' => false,
                    'message' => "El campo 'fecha' es obligatorio.",
                    'data'    => null
                ];
            }

            // Registro en LOTE: viene el arreglo 'registros'
            if (!empty($payload['registros']) && is_array($payload['registros'])) {
                try {
                    $resultado = $this->model->registrarLote($fecha, $payload['registros']);
                    $msg = "Asistencia registrada: {$resultado['guardados']} alumno(s) guardado(s).";
                    if (!empty($resultado['errores'])) {
                        $msg .= ' Errores: ' . implode('; ', $resultado['errores']);
                    }
                    return [
                        'success' => true,
                        'message' => $msg,
                        'data'    => $resultado
                    ];
                } catch (Throwable $e) {
                    return [
                        'success' => false,
                        'message' => 'Error al registrar asistencias: ' . $e->getMessage(),
                        'data'    => null
                    ];
                }
            }

            // Registro INDIVIDUAL: viene id_alumno y tipo directamente
            $idAlumno = (int)($payload['id_alumno'] ?? 0);
            $tipo     = strtoupper(trim((string)($payload['tipo'] ?? '')));

            if ($idAlumno <= 0 || $tipo === '') {
                return [
                    'success' => false,
                    'message' => "Para registro individual se requieren: fecha, id_alumno y tipo (P/T/F).",
                    'data'    => null
                ];
            }

            try {
                $registro = $this->model->registrarUno($idAlumno, $fecha, $tipo);
                return [
                    'success' => true,
                    'message' => 'Asistencia registrada correctamente.',
                    'data'    => $registro
                ];
            } catch (InvalidArgumentException $e) {
                return [
                    'success' => false,
                    'message' => $e->getMessage(),
                    'data'    => null
                ];
            }
        }

        return ['success' => false, 'message' => 'Método HTTP no soportado.', 'data' => null];
    }
}
