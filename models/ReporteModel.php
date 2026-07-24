<?php
/**
 * =====================================================================
 * MODELO: ReporteModel.php
 * Procesa consultas consolidadas de notas y asistencias directamente de la BD MySQL.
 *
 * Cuando se recibe un $idDocente (rol docente), las consultas se limitan
 * a los alumnos de los grados/cursos asignados al docente vía ASIGNACION_CURSO.
 * Cuando $idDocente es null (rol director/admin), se muestran todos los registros.
 * =====================================================================
 */

class ReporteModel
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Obtiene los ids de grado donde el docente tiene cursos asignados.
     * Útil para filtrar alumnos y opciones de filtro.
     */
    private function getGradosDelDocente(int $idDocente): array
    {
        $stmt = $this->pdo->prepare("
            SELECT DISTINCT gc.id_grado
            FROM ASIGNACION_CURSO ac
            INNER JOIN GRADO_CURSO gc ON gc.id_gradoCurso = ac.id_gradoCurso
            WHERE ac.id_docente = ?
        ");
        $stmt->execute([$idDocente]);
        return array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'id_grado');
    }

    /**
     * Obtiene los ids de gradoCurso asignados al docente.
     * Útil para filtrar cursos y notas.
     */
    private function getGradoCursosDelDocente(int $idDocente): array
    {
        $stmt = $this->pdo->prepare("
            SELECT DISTINCT ac.id_gradoCurso
            FROM ASIGNACION_CURSO ac
            WHERE ac.id_docente = ?
        ");
        $stmt->execute([$idDocente]);
        return array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'id_gradoCurso');
    }

    /**
     * Obtiene los niveles y grados disponibles en la BD para popular filtros dinámicos.
     * Si $idDocente no es null, solo devuelve los grados donde el docente enseña.
     */
    public function getFiltrosOpciones(?int $idDocente = null): array
    {
        if ($idDocente !== null) {
            // Solo grados del docente
            $gradosDocente = $this->getGradosDelDocente($idDocente);
            if (empty($gradosDocente)) {
                return ['niveles' => [], 'grados' => []];
            }
            $placeholders = implode(',', array_fill(0, count($gradosDocente), '?'));
            $stmtGrados = $this->pdo->prepare("
                SELECT DISTINCT id_grado, nombre, seccion, turno 
                FROM GRADO 
                WHERE id_grado IN ($placeholders)
                ORDER BY nombre, seccion
            ");
            $stmtGrados->execute($gradosDocente);
        } else {
            // Director/admin: todos los grados
            $stmtGrados = $this->pdo->query("
                SELECT DISTINCT id_grado, nombre, seccion, turno 
                FROM GRADO 
                ORDER BY nombre, seccion
            ");
        }
        $grados = $stmtGrados->fetchAll(PDO::FETCH_ASSOC);

        $nivelesSet = [];
        $gradosList = [];

        foreach ($grados as $g) {
            $nombreG = $g['nombre'];
            if (stripos($nombreG, 'Primaria') !== false) {
                $nivel = 'Primaria';
            } elseif (stripos($nombreG, 'Secundaria') !== false) {
                $nivel = 'Secundaria';
            } else {
                $nivel = 'Inicial';
            }
            $nivelesSet[$nivel] = true;

            $gradosList[] = [
                'id_grado' => $g['id_grado'],
                'nombre'   => $nombreG . ($g['seccion'] ? ' ' . $g['seccion'] : ''),
                'nivel'    => $nivel
            ];
        }

        return [
            'niveles' => array_keys($nivelesSet),
            'grados'  => $gradosList
        ];
    }

    /**
     * Obtiene el reporte completo de notas por alumno y por asignatura desde la BD.
     * Si $idDocente no es null, solo muestra cursos y alumnos vinculados al docente.
     */
    public function getReporteNotas(array $filtros = [], ?int $idDocente = null): array
    {
        // 1. Cursos disponibles (filtrados por docente si aplica)
        if ($idDocente !== null) {
            $gradoCursosDocente = $this->getGradoCursosDelDocente($idDocente);
            if (empty($gradoCursosDocente)) {
                return [
                    'cursos'  => [],
                    'alumnos' => [],
                    'metricas' => [
                        'promedio_general' => 0,
                        'tasa_aprobacion'  => 100,
                        'destacado_nombre' => 'Ninguno',
                        'destacado_nota'   => '-'
                    ],
                    'promedios_asignatura' => []
                ];
            }

            // Cursos que enseña el docente
            $placeholders = implode(',', array_fill(0, count($gradoCursosDocente), '?'));
            $cursosStmt = $this->pdo->prepare("
                SELECT DISTINCT c.id_curso, c.nombre 
                FROM CURSO c
                INNER JOIN GRADO_CURSO gc ON gc.id_curso = c.id_curso
                WHERE gc.id_gradoCurso IN ($placeholders)
                ORDER BY c.id_curso ASC
            ");
            $cursosStmt->execute($gradoCursosDocente);

            // Grados donde enseña el docente (para filtrar alumnos)
            $gradosDocente = $this->getGradosDelDocente($idDocente);
        } else {
            $cursosStmt = $this->pdo->query("SELECT id_curso, nombre FROM CURSO ORDER BY id_curso ASC");
            $gradosDocente = null;
        }
        $cursos = $cursosStmt->fetchAll(PDO::FETCH_ASSOC);

        // 2. Alumnos base (filtrados por grados del docente si aplica)
        if ($gradosDocente !== null && !empty($gradosDocente)) {
            $placeholdersG = implode(',', array_fill(0, count($gradosDocente), '?'));
            $sqlAlumnos = "
                SELECT 
                    al.id_alumno,
                    al.cod_alumn AS cod_alumno,
                    CONCAT(p.ap_paterno, ' ', p.ap_materno, ', ', p.nombre) AS nombre_completo,
                    p.nombre,
                    p.ap_paterno,
                    p.ap_materno,
                    g.id_grado,
                    g.nombre AS nombre_grado,
                    g.seccion,
                    CASE 
                        WHEN g.nombre LIKE '%Primaria%' THEN 'Primaria' 
                        WHEN g.nombre LIKE '%Secundaria%' THEN 'Secundaria' 
                        ELSE 'Inicial' 
                    END AS nivel
                FROM ALUMNOS al
                INNER JOIN PERSONAS p ON p.id_persona = al.id_persona
                INNER JOIN GRADO g ON g.id_grado = al.id_grado
                WHERE al.id_grado IN ($placeholdersG)
                ORDER BY p.ap_paterno, p.ap_materno, p.nombre
            ";
            $alumnosStmt = $this->pdo->prepare($sqlAlumnos);
            $alumnosStmt->execute($gradosDocente);
        } else {
            $sqlAlumnos = "
                SELECT 
                    al.id_alumno,
                    al.cod_alumn AS cod_alumno,
                    CONCAT(p.ap_paterno, ' ', p.ap_materno, ', ', p.nombre) AS nombre_completo,
                    p.nombre,
                    p.ap_paterno,
                    p.ap_materno,
                    g.id_grado,
                    g.nombre AS nombre_grado,
                    g.seccion,
                    CASE 
                        WHEN g.nombre LIKE '%Primaria%' THEN 'Primaria' 
                        WHEN g.nombre LIKE '%Secundaria%' THEN 'Secundaria' 
                        ELSE 'Inicial' 
                    END AS nivel
                FROM ALUMNOS al
                INNER JOIN PERSONAS p ON p.id_persona = al.id_persona
                INNER JOIN GRADO g ON g.id_grado = al.id_grado
                ORDER BY p.ap_paterno, p.ap_materno, p.nombre
            ";
            $alumnosStmt = $this->pdo->query($sqlAlumnos);
        }
        $alumnosRaw = $alumnosStmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. Promedio por curso para cada alumno (filtrado por gradoCursos del docente si aplica)
        if ($idDocente !== null && !empty($gradoCursosDocente)) {
            $placeholdersGC = implode(',', array_fill(0, count($gradoCursosDocente), '?'));
            $sqlNotas = "
                SELECT 
                    n.id_alumno,
                    c.id_curso,
                    c.nombre AS nombre_curso,
                    ROUND(AVG(n.nota), 1) AS promedio_curso
                FROM NOTAS n
                INNER JOIN ACTIVIDADES act ON act.id_actividad = n.id_actividad
                INNER JOIN GRADO_CURSO gc ON gc.id_gradoCurso = act.id_gradoCurso
                INNER JOIN CURSO c ON c.id_curso = gc.id_curso
                WHERE gc.id_gradoCurso IN ($placeholdersGC)
                GROUP BY n.id_alumno, c.id_curso
            ";
            $notasStmt = $this->pdo->prepare($sqlNotas);
            $notasStmt->execute($gradoCursosDocente);
        } else {
            $sqlNotas = "
                SELECT 
                    n.id_alumno,
                    c.id_curso,
                    c.nombre AS nombre_curso,
                    ROUND(AVG(n.nota), 1) AS promedio_curso
                FROM NOTAS n
                INNER JOIN ACTIVIDADES act ON act.id_actividad = n.id_actividad
                INNER JOIN GRADO_CURSO gc ON gc.id_gradoCurso = act.id_gradoCurso
                INNER JOIN CURSO c ON c.id_curso = gc.id_curso
                GROUP BY n.id_alumno, c.id_curso
            ";
            $notasStmt = $this->pdo->query($sqlNotas);
        }
        $notasRaw = $notasStmt->fetchAll(PDO::FETCH_ASSOC);

        $notasMap = [];
        foreach ($notasRaw as $nr) {
            $notasMap[$nr['id_alumno']][$nr['id_curso']] = [
                'nombre_curso' => $nr['nombre_curso'],
                'promedio'     => (float)$nr['promedio_curso']
            ];
        }

        // Aplicar filtros en memoria (búsqueda, nivel, grado, rendimiento)
        $search = strtolower(trim((string)($filtros['search'] ?? '')));
        $nivelFilter = trim((string)($filtros['nivel'] ?? 'todos'));
        $gradoFilter = trim((string)($filtros['grado'] ?? 'todos'));
        $perfFilter  = trim((string)($filtros['rendimiento'] ?? 'todos'));

        $alumnosProcesados = [];
        $totalGradesSum = 0;
        $approvedCount = 0;
        $topStudent = null;
        $topAverage = -1;

        // Sumas por asignatura para el gráfico
        $cursoSumasMap = [];
        $cursoConteosMap = [];

        foreach ($cursos as $c) {
            $cursoSumasMap[$c['id_curso']] = 0;
            $cursoConteosMap[$c['id_curso']] = 0;
        }

        foreach ($alumnosRaw as $alu) {
            $id = (int)$alu['id_alumno'];
            
            // Coincidencia con filtros
            if ($search !== '') {
                $matchText = (stripos($alu['nombre_completo'], $search) !== false) ||
                             (stripos($alu['cod_alumno'], $search) !== false);
                if (!$matchText) continue;
            }

            if ($nivelFilter !== 'todos' && $nivelFilter !== '' && strcasecmp($alu['nivel'], $nivelFilter) !== 0) {
                continue;
            }

            if ($gradoFilter !== 'todos' && $gradoFilter !== '') {
                $gradoNameWithSec = trim($alu['nombre_grado'] . ($alu['seccion'] ? ' ' . $alu['seccion'] : ''));
                if (strcasecmp($alu['nombre_grado'], $gradoFilter) !== 0 && strcasecmp($gradoNameWithSec, $gradoFilter) !== 0) {
                    continue;
                }
            }

            // Mapeo de notas del alumno
            $studentGrades = $notasMap[$id] ?? [];
            $sumStudentGrades = 0;
            $countStudentGrades = 0;
            $cursosGradesMap = [];

            foreach ($cursos as $c) {
                $cId = (int)$c['id_curso'];
                $cName = $c['nombre'];

                if (isset($studentGrades[$cId])) {
                    $gradeVal = $studentGrades[$cId]['promedio'];
                    $cursosGradesMap[$cId] = $gradeVal;
                    $sumStudentGrades += $gradeVal;
                    $countStudentGrades++;

                    $cursoSumasMap[$cId] += $gradeVal;
                    $cursoConteosMap[$cId]++;
                } else {
                    $cursosGradesMap[$cId] = null; // Sin nota aún
                }
            }

            $promedioEstudiante = $countStudentGrades > 0 
                ? round($sumStudentGrades / $countStudentGrades, 1) 
                : 0.0;

            // Filtro por rendimiento
            if ($perfFilter === 'excelente' && $promedioEstudiante < 17.0) continue;
            if ($perfFilter === 'aprobado' && ($promedioEstudiante < 11.0 || $promedioEstudiante >= 17.0)) continue;
            if ($perfFilter === 'desaprobado' && $promedioEstudiante >= 11.0) continue;

            if ($promedioEstudiante >= 11.0) {
                $approvedCount++;
            }

            if ($promedioEstudiante > $topAverage) {
                $topAverage = $promedioEstudiante;
                $topStudent = $alu['nombre_completo'];
            }

            $totalGradesSum += $promedioEstudiante;

            $alumnosProcesados[] = array_merge($alu, [
                'notas_por_curso' => $cursosGradesMap,
                'promedio'         => $promedioEstudiante
            ]);
        }

        $totalAlumnosCount = count($alumnosProcesados);
        $promedioGeneral = $totalAlumnosCount > 0 ? round($totalGradesSum / $totalAlumnosCount, 1) : 0.0;
        $tasaAprobacion  = $totalAlumnosCount > 0 ? MathRound(($approvedCount / $totalAlumnosCount) * 100) : 100;

        // Construir promedios por asignatura para el gráfico
        $promediosPorAsignatura = [];
        foreach ($cursos as $c) {
            $cId = (int)$c['id_curso'];
            $cnt = $cursoConteosMap[$cId];
            $avg = $cnt > 0 ? round($cursoSumasMap[$cId] / $cnt, 1) : 0.0;
            $promediosPorAsignatura[] = [
                'id_curso' => $cId,
                'nombre'   => $c['nombre'],
                'promedio' => $avg
            ];
        }

        return [
            'cursos'  => $cursos,
            'alumnos' => $alumnosProcesados,
            'metricas' => [
                'promedio_general' => $promedioGeneral,
                'tasa_aprobacion'  => $tasaAprobacion,
                'destacado_nombre' => $topStudent ?? 'Ninguno',
                'destacado_nota'   => $topAverage >= 0 ? $topAverage : '-'
            ],
            'promedios_asignatura' => $promediosPorAsignatura
        ];
    }

    /**
     * Obtiene reporte consolidado de Notas + Asistencias para la pestaña de "Alumnos con Filtros".
     * Si $idDocente no es null, solo incluye alumnos de los grados del docente.
     */
    public function getReporteConsolidado(array $filtros = [], ?int $idDocente = null): array
    {
        $notasData = $this->getReporteNotas($filtros, $idDocente);
        $alumnosNotas = $notasData['alumnos'];

        // Obtener ids de alumnos ya filtrados para limitar la consulta de asistencia
        $alumnoIds = array_column($alumnosNotas, 'id_alumno');

        // Cargar asistencias por alumno (solo los alumnos ya filtrados)
        if (!empty($alumnoIds)) {
            $placeholders = implode(',', array_fill(0, count($alumnoIds), '?'));
            $sqlAsistencia = "
                SELECT 
                    al.id_alumno,
                    SUM(CASE WHEN a.tipo = 'P' THEN 1 ELSE 0 END) AS presentes,
                    SUM(CASE WHEN a.tipo = 'T' THEN 1 ELSE 0 END) AS tardanzas,
                    SUM(CASE WHEN a.tipo = 'F' THEN 1 ELSE 0 END) AS faltas,
                    COUNT(a.id_asistencia) AS total_dias
                FROM ALUMNOS al
                LEFT JOIN ASISTENCIA a ON a.id_alumno = al.id_alumno
                WHERE al.id_alumno IN ($placeholders)
                GROUP BY al.id_alumno
            ";
            $attStmt = $this->pdo->prepare($sqlAsistencia);
            $attStmt->execute($alumnoIds);
            $attRaw = $attStmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $attRaw = [];
        }

        $attMap = [];
        foreach ($attRaw as $ar) {
            $tot = (int)$ar['total_dias'];
            $pres = (int)$ar['presentes'];
            $pct = $tot > 0 ? round(($pres / $tot) * 100, 1) : 100.0;
            $attMap[$ar['id_alumno']] = [
                'presentes'      => $pres,
                'tardanzas'      => (int)$ar['tardanzas'],
                'faltas'         => (int)$ar['faltas'],
                'total_dias'     => $tot,
                'pct_asistencia' => $pct
            ];
        }

        $attFilter = trim((string)($filtros['asistencia'] ?? 'todos'));

        $consolidado = [];
        foreach ($alumnosNotas as $alu) {
            $id = (int)$alu['id_alumno'];
            $attInfo = $attMap[$id] ?? ['presentes' => 0, 'tardanzas' => 0, 'faltas' => 0, 'total_dias' => 0, 'pct_asistencia' => 100.0];
            $pct = $attInfo['pct_asistencia'];

            if ($attFilter === 'regular' && $pct < 80.0) continue;
            if ($attFilter === 'critico' && $pct >= 80.0) continue;

            $consolidado[] = array_merge($alu, [
                'asistencia' => $attInfo
            ]);
        }

        return [
            'alumnos' => $consolidado
        ];
    }
}

function MathRound($val) {
    return (int)round($val);
}
