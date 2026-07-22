<?php
class CursoModel
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function ensureTables(): void
    {
        $this->pdo->exec(
            "CREATE TABLE IF NOT EXISTS curso (" .
            "id_curso INT AUTO_INCREMENT PRIMARY KEY, " .
            "nombre VARCHAR(100) NOT NULL, " .
            "descripcion TEXT NOT NULL" .
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );

        $this->pdo->exec(
            "CREATE TABLE IF NOT EXISTS grado_curso (" .
            "id_gradoCurso INT AUTO_INCREMENT PRIMARY KEY, " .
            "id_curso INT NOT NULL, " .
            "id_grado INT NOT NULL, " .
            "año YEAR NOT NULL, " .
            "CONSTRAINT fk_gradocurso_curso FOREIGN KEY (id_curso) REFERENCES curso(id_curso), " .
            "CONSTRAINT fk_gradocurso_grado FOREIGN KEY (id_grado) REFERENCES grado(id_grado)" .
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );

        $this->pdo->exec(
            "CREATE TABLE IF NOT EXISTS asignacion_curso (" .
            "id_asignacionCurso INT AUTO_INCREMENT PRIMARY KEY, " .
            "id_docente INT NOT NULL, " .
            "id_gradoCurso INT NOT NULL, " .
            "dia_horario VARCHAR(20) NOT NULL, " .
            "hora_inicio TIME NOT NULL, " .
            "hora_fin TIME NOT NULL, " .
            "fecha_asignacion DATE NOT NULL, " .
            "fecha_finAsig DATE DEFAULT NULL, " .
            "CONSTRAINT fk_asigcurso_docente FOREIGN KEY (id_docente) REFERENCES docentes(id_docente), " .
            "CONSTRAINT fk_asigcurso_gradocurso FOREIGN KEY (id_gradoCurso) REFERENCES grado_curso(id_gradoCurso)" .
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
    }

    public function getReferenceData(): array
    {
        $coursesStmt = $this->pdo->query(
            "SELECT id_curso, nombre, descripcion FROM curso ORDER BY id_curso DESC"
        );
        $gradesStmt = $this->pdo->query(
            "SELECT id_grado, nombre, seccion, turno FROM grado ORDER BY nombre, seccion"
        );
        $teachersStmt = $this->pdo->query(
            "SELECT id_docente, cod_docente, nombre_completo FROM docentes WHERE es_activo = 1 ORDER BY nombre_completo"
        );
        $assignmentsStmt = $this->pdo->query(
            "SELECT ac.id_asignacionCurso, ac.dia_horario, ac.hora_inicio, ac.hora_fin, ac.fecha_asignacion, ac.fecha_finAsig, " .
            "d.id_docente, d.cod_docente, d.nombre_completo, " .
            "c.id_curso, c.nombre AS nombre_curso, " .
            "g.id_grado, g.nombre AS nombre_grado, g.seccion, gc.año " .
            "FROM asignacion_curso ac " .
            "INNER JOIN docentes d ON d.id_docente = ac.id_docente " .
            "INNER JOIN grado_curso gc ON gc.id_gradoCurso = ac.id_gradoCurso " .
            "INNER JOIN curso c ON c.id_curso = gc.id_curso " .
            "INNER JOIN grado g ON g.id_grado = gc.id_grado " .
            "ORDER BY ac.id_asignacionCurso DESC"
        );

        return [
            'courses' => $coursesStmt->fetchAll(PDO::FETCH_ASSOC),
            'grades' => $gradesStmt->fetchAll(PDO::FETCH_ASSOC),
            'teachers' => $teachersStmt->fetchAll(PDO::FETCH_ASSOC),
            'assignments' => $assignmentsStmt->fetchAll(PDO::FETCH_ASSOC)
        ];
    }

    public function createCourse(array $data): array
    {
        $nombre = trim((string)($data['nombre'] ?? ''));
        $descripcion = trim((string)($data['descripcion'] ?? ''));
        $idGrado = (int)($data['id_grado'] ?? 0);
        $anio = (int)($data['año'] ?? date('Y'));

        if ($nombre === '' || $descripcion === '') {
            throw new InvalidArgumentException('Complete los datos del curso.');
        }

        $this->pdo->beginTransaction();

        try {
            $idGradoReal = $this->resolveGradeId($idGrado);

            $cursoStmt = $this->pdo->prepare("INSERT INTO curso (nombre, descripcion) VALUES (?, ?)");
            $cursoStmt->execute([$nombre, $descripcion]);
            $idCurso = (int)$this->pdo->lastInsertId();

            $gradoCursoStmt = $this->pdo->prepare("INSERT INTO grado_curso (id_curso, id_grado, año) VALUES (?, ?, ?)");
            $gradoCursoStmt->execute([$idCurso, $idGradoReal, $anio]);
            $idGradoCurso = (int)$this->pdo->lastInsertId();

            $this->pdo->commit();

            return [
                'id_curso' => $idCurso,
                'id_gradoCurso' => $idGradoCurso,
                'curso' => ['id_curso' => $idCurso, 'nombre' => $nombre, 'descripcion' => $descripcion]
            ];
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function assignCourse(array $data): array
    {
        $idCurso = (int)($data['id_curso'] ?? 0);
        $idDocente = (int)($data['id_docente'] ?? 0);
        $diaHorarios = trim((string)($data['dia_horario'] ?? ''));
        $horaInicio = $this->normalizeTime((string)($data['hora_inicio'] ?? ''));
        $horaFin = $this->normalizeTime((string)($data['hora_fin'] ?? ''));
        $fechaAsignacion = trim((string)($data['fecha_asignacion'] ?? date('Y-m-d')));
        $fechaFinAsig = trim((string)($data['fecha_finAsig'] ?? ''));

        if ($idCurso <= 0 || $idDocente <= 0 || $diaHorarios === '') {
            throw new InvalidArgumentException('Complete los datos de la asignación.');
        }

        $gradoCursoStmt = $this->pdo->prepare("SELECT id_gradoCurso FROM grado_curso WHERE id_curso = ? ORDER BY id_gradoCurso DESC LIMIT 1");
        $gradoCursoStmt->execute([$idCurso]);
        $gradoCurso = $gradoCursoStmt->fetch(PDO::FETCH_ASSOC);

        if (empty($gradoCurso['id_gradoCurso'])) {
            throw new InvalidArgumentException('El curso seleccionado aún no tiene un grado asociado.');
        }

        $this->pdo->beginTransaction();

        try {
            $asignacionStmt = $this->pdo->prepare(
                "INSERT INTO asignacion_curso (id_docente, id_gradoCurso, dia_horario, hora_inicio, hora_fin, fecha_asignacion, fecha_finAsig) VALUES (?, ?, ?, ?, ?, ?, ?)"
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
                'id_curso' => $idCurso,
                'id_docente' => $idDocente,
                'id_gradoCurso' => (int)$gradoCurso['id_gradoCurso'],
                'dia_horario' => $diaHorarios,
                'hora_inicio' => $horaInicio,
                'hora_fin' => $horaFin,
                'fecha_asignacion' => $fechaAsignacion,
                'fecha_finAsig' => $fechaFinAsig !== '' ? $fechaFinAsig : null
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
            $stmt = $this->pdo->prepare("SELECT id_grado FROM grado WHERE id_grado = ?");
            $stmt->execute([$idGrado]);
            if ($stmt->fetchColumn()) {
                return $idGrado;
            }
        }

        $existingStmt = $this->pdo->query("SELECT id_grado FROM grado ORDER BY id_grado DESC LIMIT 1");
        $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);
        if (!empty($existing['id_grado'])) {
            return (int)$existing['id_grado'];
        }

        $defaultGradeStmt = $this->pdo->prepare("INSERT INTO grado (nombre, seccion, turno) VALUES (?, ?, ?)");
        $defaultGradeStmt->execute(['1', 'A', 'Mañana']);
        return (int)$this->pdo->lastInsertId();
    }
}
