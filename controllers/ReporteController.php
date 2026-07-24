<?php
/**
 * Controlador de Reportes Generales
 *
 * Maneja las peticiones de datos de la BD para el módulo de Reportes:
 *   - Reporte de Notas
 *   - Reporte de Asistencias
 *   - Alumnos con Filtros Combinados
 *   - Opciones dinámicas de filtros (Niveles, Grados)
 *
 * Filtra automáticamente por docente cuando el usuario logueado es docente.
 * Si es director/admin, muestra todos los registros.
 */

require_once __DIR__ . '/../core/database.php';
require_once __DIR__ . '/../models/ReporteModel.php';
require_once __DIR__ . '/../models/AsistenciaModel.php';

class ReporteController
{
    private $reporteModel;
    private $asistenciaModel;
    private $pdo;

    public function __construct()
    {
        $this->pdo = Conexion::connection();
        $this->reporteModel   = new ReporteModel($this->pdo);
        $this->asistenciaModel = new AsistenciaModel($this->pdo);
    }

    /**
     * Obtiene el id_docente a partir del id_credenciales (usuario_id de la sesión).
     * Cadena: CREDENCIALES.id_persona → DOCENTES.id_persona → id_docente
     */
    private function getIdDocenteFromSession(array $sessionData): ?int
    {
        $usuarioId = $sessionData['usuario_id'] ?? null;
        if (!$usuarioId) return null;

        $rolNombre = strtolower(trim($sessionData['rol_nombre'] ?? ''));
        // Solo buscar id_docente si el rol es 'docente'
        if ($rolNombre !== 'docente') return null;

        $stmt = $this->pdo->prepare("
            SELECT d.id_docente 
            FROM DOCENTES d
            INNER JOIN CREDENCIALES c ON c.id_persona = d.id_persona
            WHERE c.id_credenciales = ?
            LIMIT 1
        ");
        $stmt->execute([$usuarioId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? (int)$row['id_docente'] : null;
    }

    /**
     * Determina si el usuario logueado es director/admin (ve todo).
     */
    private function isDirector(array $sessionData): bool
    {
        $rol = strtolower(trim($sessionData['rol_nombre'] ?? ''));
        return in_array($rol, ['director', 'administrador', 'admin']);
    }

    public function handleRequest(string $method, array $payload = [], array $query = [], array $sessionData = []): array
    {
        if ($method !== 'GET' && $method !== 'POST') {
            return ['success' => false, 'message' => 'Método HTTP no soportado.', 'data' => null];
        }

        $tipo = trim((string)($query['tipo'] ?? $payload['tipo'] ?? 'notas'));
        $params = array_merge($query, $payload);

        // Determinar id_docente si aplica (null para director/admin = ver todo)
        $idDocente = $this->getIdDocenteFromSession($sessionData);

        switch ($tipo) {
            case 'filtros':
                $data = $this->reporteModel->getFiltrosOpciones($idDocente);
                return [
                    'success' => true,
                    'message' => 'Opciones de filtros cargadas desde la BD.',
                    'data'    => $data
                ];

            case 'notas':
                $data = $this->reporteModel->getReporteNotas($params, $idDocente);
                return [
                    'success' => true,
                    'message' => 'Reporte de notas cargado desde la BD.',
                    'data'    => $data
                ];

            case 'asistencia':
            case 'resumen_asistencia':
                $data = $this->asistenciaModel->getResumenPorAlumno($params, $idDocente);
                return [
                    'success' => true,
                    'message' => 'Reporte de asistencias cargado desde la BD.',
                    'data'    => $data
                ];

            case 'consolidado':
                $data = $this->reporteModel->getReporteConsolidado($params, $idDocente);
                return [
                    'success' => true,
                    'message' => 'Reporte consolidado cargado desde la BD.',
                    'data'    => $data
                ];

            default:
                return [
                    'success' => false,
                    'message' => "Tipo de reporte '{$tipo}' no reconocido. Opciones: filtros, notas, asistencia, consolidado.",
                    'data'    => null
                ];
        }
    }
}
