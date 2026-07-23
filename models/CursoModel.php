<?php
/**
 * =====================================================================
 * MODELO: CursoModel.php
 * Acceso a datos de la entidad CURSO, GRADO, GRADO_CURSO y ASIGNACION_CURSO.
 * =====================================================================
 */

class CursoModel
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function ensureTables(): void
    {
        // Las tablas reales ya se crean mediante corazonJesus.sql
    }

    public function getReferenceData(): array
    {
        $coursesStmt = $this->pdo->query(
            "SELECT id_curso, nombre, descripcion FROM CURSO ORDER BY id_curso DESC"
        );
        $gradesStmt = $this->pdo->query(
            "SELECT id_grado, nombre, seccion, turno FROM GRADO ORDER BY nombre, seccion"
        );
        $teachersStmt = $this->pdo->query(
            "SELECT d.id_docente, d.cod_docente, CONCAT(p.nombre, ' ', p.ap_paterno) AS nombre_completo " .
            "FROM DOCENTES d " .
            "INNER JOIN PERSONAS p ON d.id_persona = p.id_persona " .
            "WHERE d.es_activo = 1 ORDER BY p.nombre, p.ap_paterno"
        );
        $assignmentsStmt = $this->pdo->query(
            "SELECT ac.id_asignacionCurso, ac.dia_horario, ac.hora_inicio, ac.hora_fin, ac.fecha_asignacion, ac.fecha_finAsig, " .
            "d.id_docente, d.cod_docente, CONCAT(p.nombre, ' ', p.ap_paterno) AS nombre_completo, " .
            "c.id_curso, c.nombre AS nombre_curso, " .
            "g.id_grado, g.nombre AS nombre_grado, g.seccion, gc.año " .
            "FROM ASIGNACION_CURSO ac " .
            "INNER JOIN DOCENTES d ON d.id_docente = ac.id_docente " .
            "INNER JOIN PERSONAS p ON d.id_persona = p.id_persona " .
            "INNER JOIN GRADO_CURSO gc ON gc.id_gradoCurso = ac.id_gradoCurso " .
            "INNER JOIN CURSO c ON c.id_curso = gc.id_curso " .
            "INNER JOIN GRADO g ON g.id_grado = gc.id_grado " .
            "ORDER BY ac.id_asignacionCurso DESC"
        );

        return [
            'courses'     => $coursesStmt->fetchAll(PDO::FETCH_ASSOC),
            'grades'      => $gradesStmt->fetchAll(PDO::FETCH_ASSOC),
            'teachers'    => $teachersStmt->fetchAll(PDO::FETCH_ASSOC),
            'assignments' => $assignmentsStmt->fetchAll(PDO::FETCH_ASSOC)
        ];
    }

    public function createCourse(array $data): array
    {
        $nombre      = trim((string)($data['nombre'] ?? ''));
        $descripcion = trim((string)($data['descripcion'] ?? ''));
        $idGrado     = (int)($data['id_grado'] ?? 0);
        $anio        = (int)($data['año'] ?? date('Y'));

        if ($nombre === '' || $descripcion === '') {
            throw new InvalidArgumentException('Complete los datos del curso.');
        }

        $this->pdo->beginTransaction();

        try {
            $idGradoReal = $this->resolveGradeId($idGrado);

            $cursoStmt = $this->pdo->prepare("INSERT INTO CURSO (nombre, descripcion) VALUES (?, ?)");
            $cursoStmt->execute([$nombre, $descripcion]);
            $idCurso = (int)$this->pdo->lastInsertId();

            $gradoCursoStmt = $this->pdo->prepare("INSERT INTO GRADO_CURSO (id_curso, id_grado, año) VALUES (?, ?, ?)");
            $gradoCursoStmt->execute([$idCurso, $idGradoReal, $anio]);
            $idGradoCurso = (int)$this->pdo->lastInsertId();

            $this->pdo->commit();

            return [
                'id_curso'      => $idCurso,
                'id_gradoCurso' => $idGradoCurso,
                'curso'         => ['id_curso' => $idCurso, 'nombre' => $nombre, 'descripcion' => $descripcion]
            ];
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function assignCourse(array $data): array
    {
        $idCurso         = (int)($data['id_curso'] ?? 0);
        $idDocente       = (int)($data['id_docente'] ?? 0);
        $diaHorarios     = trim((string)($data['dia_horario'] ?? ''));
        $horaInicio      = $this->normalizeTime((string)($data['hora_inicio'] ?? ''));
        $horaFin         = $this->normalizeTime((string)($data['hora_fin'] ?? ''));
        $fechaAsignacion = trim((string)($data['fecha_asignacion'] ?? date('Y-m-d')));
        $fechaFinAsig    = trim((string)($data['fecha_finAsig'] ?? ''));

        if ($idCurso <= 0 || $idDocente <= 0 || $diaHorarios === '') {
            throw new InvalidArgumentException('Complete los datos de la asignación.');
        }

        $gradoCursoStmt = $this->pdo->prepare("SELECT id_gradoCurso FROM GRADO_CURSO WHERE id_curso = ? ORDER BY id_gradoCurso DESC LIMIT 1");
        $gradoCursoStmt->execute([$idCurso]);
        $gradoCurso = $gradoCursoStmt->fetch(PDO::FETCH_ASSOC);

        if (empty($gradoCurso['id_gradoCurso'])) {
            throw new InvalidArgumentException('El curso seleccionado aún no tiene un grado asociado.');
        }

        $this->pdo->beginTransaction();

        try {
            $asignacionStmt = $this->pdo->prepare(
                "INSERT INTO ASIGNACION_CURSO (id_docente, id_gradoCurso, dia_horario, hora_inicio, hora_fin, fecha_asignacion, fecha_finAsig) VALUES (?, ?, ?, ?, ?, ?, ?)"
            );
            $asignacionStmt->execute([
                $idDocente,
                (int)$gradoCurso['id_gradoCurso'],
                $diaHorarios,
                $horaInicio,
                $horaFin,
                $fechaAsignacion,
                $fechaFinAsig !== '' ? $fechaFinAsig : null
            ]);

            $idAsignacion = (int)$this->pdo->lastInsertId();
            $this->pdo->commit();

            return [
                'id_asignacionCurso' => $idAsignacion,
                'id_curso'            => $idCurso,
                'id_docente'          => $idDocente,
                'id_gradoCurso'       => (int)$gradoCurso['id_gradoCurso'],
                'dia_horario'         => $diaHorarios,
                'hora_inicio'        => $horaInicio,
                'hora_fin'           => $horaFin,
                'fecha_asignacion'   => $fechaAsignacion,
                'fecha_finAsig'       => $fechaFinAsig !== '' ? $fechaFinAsig : null
            ];
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    private function normalizeTime(string $value): string
    {
        $value = trim($value);
        if ($value === '') {
            return '00:00:00';
        }

        if (preg_match('/^\d{1,2}:\d{2}$/', $value)) {
            return $value . ':00';
        }

        return $value;
    }

    private function resolveGradeId(int $idGrado): int
    {
        if ($idGrado > 0) {
            $stmt = $this->pdo->prepare("SELECT id_grado FROM GRADO WHERE id_grado = ?");
            $stmt->execute([$idGrado]);
            if ($stmt->fetchColumn()) {
                return $idGrado;
            }
        }

        $existingStmt = $this->pdo->query("SELECT id_grado FROM GRADO ORDER BY id_grado DESC LIMIT 1");
        $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);
        if (!empty($existing['id_grado'])) {
            return (int)$existing['id_grado'];
        }

        $defaultGradeStmt = $this->pdo->prepare("INSERT INTO GRADO (nombre, seccion, turno) VALUES (?, ?, ?)");
        $defaultGradeStmt->execute(['1° Primaria', 'A', 'Mañana']);
        return (int)$this->pdo->lastInsertId();
    }
}
