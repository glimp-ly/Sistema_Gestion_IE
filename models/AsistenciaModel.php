<?php
/**
 * Modelo de Asistencia
 *
 * Gestiona el registro y consulta de asistencias usando la tabla
 * `ASISTENCIA` existente en la base de datos.
 *
 * Estructura real de la tabla:
 *   id_asistencia  INT    AUTO_INCREMENT PK
 *   fecha          DATE   NOT NULL
 *   tipo           VARCHAR(2) NOT NULL  → 'P' (Presente), 'T' (Tardanza), 'F' (Falta)
 *   id_alumno      INT    NOT NULL
 */
class AsistenciaModel
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Registra o actualiza la asistencia de un alumno en una fecha dada.
     * Usa INSERT ... ON DUPLICATE KEY para evitar duplicados si existe
     * un índice UNIQUE en (id_alumno, fecha).
     * Si no existe ese índice, hace un REPLACE o DELETE+INSERT seguro.
     *
     * @param int    $idAlumno
     * @param string $fecha    Formato 'YYYY-MM-DD'
     * @param string $tipo     'P', 'T' o 'F'
     * @return array El registro insertado/actualizado
     */
    public function registrarUno(int $idAlumno, string $fecha, string $tipo): array
    {
        $tiposValidos = ['P', 'T', 'F'];
        $tipo = strtoupper(trim($tipo));

        if ($idAlumno <= 0 || $fecha === '' || !in_array($tipo, $tiposValidos)) {
            throw new InvalidArgumentException(
                "Datos inválidos: id_alumno={$idAlumno}, fecha={$fecha}, tipo={$tipo}"
            );
        }

        // Si ya existe un registro para ese alumno en esa fecha, lo actualiza
        $existeStmt = $this->pdo->prepare(
            "SELECT id_asistencia FROM ASISTENCIA WHERE id_alumno = ? AND fecha = ? LIMIT 1"
        );
        $existeStmt->execute([$idAlumno, $fecha]);
        $existente = $existeStmt->fetch(PDO::FETCH_ASSOC);

        if ($existente) {
            $upStmt = $this->pdo->prepare(
                "UPDATE ASISTENCIA SET tipo = ? WHERE id_asistencia = ?"
            );
            $upStmt->execute([$tipo, $existente['id_asistencia']]);
            $idAsistencia = (int)$existente['id_asistencia'];
        } else {
            $insStmt = $this->pdo->prepare(
                "INSERT INTO ASISTENCIA (fecha, tipo, id_alumno) VALUES (?, ?, ?)"
            );
            $insStmt->execute([$fecha, $tipo, $idAlumno]);
            $idAsistencia = (int)$this->pdo->lastInsertId();
        }

        return [
            'id_asistencia' => $idAsistencia,
            'id_alumno'     => $idAlumno,
            'fecha'         => $fecha,
            'tipo'          => $tipo
        ];
    }

    /**
     * Registra (o actualiza) la asistencia de múltiples alumnos en una sola llamada.
     * Ideal para el botón "Confirmar Asistencia" del módulo de docente.
     *
     * @param string $fecha    Fecha del día en formato 'YYYY-MM-DD'
     * @param array  $registros Array de ['id_alumno' => int, 'tipo' => 'P'|'T'|'F']
     * @return array Resumen con cantidad de registros guardados y errores
     */
    public function registrarLote(string $fecha, array $registros): array
    {
        $guardados = 0;
        $errores   = [];

        foreach ($registros as $reg) {
            $idAlumno = (int)($reg['id_alumno'] ?? 0);
            $tipo     = strtoupper(trim((string)($reg['tipo'] ?? 'P')));

            try {
                $this->registrarUno($idAlumno, $fecha, $tipo);
                $guardados++;
            } catch (InvalidArgumentException $e) {
                $errores[] = "Alumno {$idAlumno}: " . $e->getMessage();
            }
        }

        return [
            'fecha'    => $fecha,
            'guardados' => $guardados,
            'errores'  => $errores
        ];
    }

    /**
     * Obtiene todos los registros de asistencia de una fecha dada.
     * Hace JOIN con la tabla `alumnos` para traer el nombre y código.
     *
     * @param string $fecha
     * @return array
     */
    public function getPorFecha(string $fecha): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT a.id_asistencia, a.fecha, a.tipo, a.id_alumno, " .
            "al.cod_alumno, al.nombre_completo, al.nivel " .
            "FROM ASISTENCIA a " .
            "LEFT JOIN alumnos al ON al.id_alumno = a.id_alumno " .
            "WHERE a.fecha = ? " .
            "ORDER BY al.nombre_completo ASC"
        );
        $stmt->execute([$fecha]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Obtiene el historial completo de asistencias de un alumno específico.
     *
     * @param int $idAlumno
     * @return array
     */
    public function getPorAlumno(int $idAlumno): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT id_asistencia, fecha, tipo, id_alumno " .
            "FROM ASISTENCIA " .
            "WHERE id_alumno = ? " .
            "ORDER BY fecha DESC"
        );
        $stmt->execute([$idAlumno]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Devuelve TODOS los alumnos activos con su tipo de asistencia para una fecha.
     * Si el alumno no tiene registro ese día, se pre-asigna 'P' por defecto.
     * Filtrable por nivel educativo.
     *
     * @param string $fecha   Formato 'YYYY-MM-DD'
     * @param string $nivel   'Primaria', 'Inicial', etc. (vacío = todos)
     * @return array
     */
    public function getEstudiantesParaFecha(string $fecha, string $nivel = ''): array
    {
        $where  = ['al.es_activo = 1'];
        $params = [$fecha];   // para el LEFT JOIN ON a.fecha = ?

        if ($nivel !== '') {
            $where[]  = 'al.nivel = ?';
            $params[] = $nivel;
        }

        $whereStr = implode(' AND ', $where);

        $stmt = $this->pdo->prepare(
            "SELECT al.id_alumno, al.cod_alumno, al.nombre_completo, al.nivel, " .
            "g.nombre AS nombre_grado, g.seccion, " .
            "COALESCE(a.tipo, 'P') AS tipo " .
            "FROM alumnos al " .
            "INNER JOIN grado g ON g.id_grado = al.id_grado " .
            "LEFT JOIN ASISTENCIA a ON a.id_alumno = al.id_alumno AND a.fecha = ? " .
            "WHERE {$whereStr} " .
            "ORDER BY al.nombre_completo ASC"
        );
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Devuelve un resumen de asistencias (P, T, F) agrupado por alumno.
     * Útil para el módulo de Reportes de Asistencias.
     *
     * @param array $filtros  Soporta: 'fecha_inicio', 'fecha_fin', 'id_alumno'
     * @return array
     */
    public function getResumenPorAlumno(array $filtros = []): array
    {
        $where  = ['1=1'];
        $params = [];

        $fechaInicio = trim((string)($filtros['fecha_inicio'] ?? ''));
        $fechaFin    = trim((string)($filtros['fecha_fin'] ?? ''));
        $idAlumno    = (int)($filtros['id_alumno'] ?? 0);

        if ($fechaInicio !== '') {
            $where[]  = 'a.fecha >= ?';
            $params[] = $fechaInicio;
        }
        if ($fechaFin !== '') {
            $where[]  = 'a.fecha <= ?';
            $params[] = $fechaFin;
        }
        if ($idAlumno > 0) {
            $where[]  = 'a.id_alumno = ?';
            $params[] = $idAlumno;
        }

        $whereStr = implode(' AND ', $where);

        $stmt = $this->pdo->prepare(
            "SELECT a.id_alumno, " .
            "al.cod_alumno, al.nombre_completo, al.nivel, " .
            "g.nombre AS nombre_grado, g.seccion, " .
            "SUM(CASE WHEN a.tipo = 'P' THEN 1 ELSE 0 END) AS presentes, " .
            "SUM(CASE WHEN a.tipo = 'T' THEN 1 ELSE 0 END) AS tardanzas, " .
            "SUM(CASE WHEN a.tipo = 'F' THEN 1 ELSE 0 END) AS faltas, " .
            "COUNT(a.id_asistencia) AS total_dias, " .
            "ROUND(100.0 * SUM(CASE WHEN a.tipo = 'P' THEN 1 ELSE 0 END) " .
            "  / NULLIF(COUNT(a.id_asistencia), 0), 1) AS pct_asistencia " .
            "FROM ASISTENCIA a " .
            "LEFT JOIN alumnos al ON al.id_alumno = a.id_alumno " .
            "LEFT JOIN grado g ON g.id_grado = al.id_grado " .
            "WHERE {$whereStr} " .
            "GROUP BY a.id_alumno " .
            "ORDER BY al.nombre_completo ASC"
        );
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
