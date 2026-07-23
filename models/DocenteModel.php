<?php
class DocenteModel
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function ensureTable(): void
    {
        $this->pdo->exec(
            "CREATE TABLE IF NOT EXISTS personas (" .
            "id_persona INT AUTO_INCREMENT PRIMARY KEY, " .
            "dni VARCHAR(20) NOT NULL, " .
            "nombre VARCHAR(100) NOT NULL, " .
            "ap_paterno VARCHAR(100) NOT NULL, " .
            "ap_materno VARCHAR(100) NOT NULL, " .
            "fechaNa DATE NOT NULL, " .
            "direccion VARCHAR(150) NOT NULL" .
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );

        $this->pdo->exec(
            "CREATE TABLE IF NOT EXISTS buzon (" .
            "id_buzon INT AUTO_INCREMENT PRIMARY KEY, " .
            "no_leidos INT NOT NULL DEFAULT 0" .
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );

        $this->pdo->exec(
            "CREATE TABLE IF NOT EXISTS docentes (" .
            "id_docente INT AUTO_INCREMENT PRIMARY KEY, " .
            "id_persona INT NOT NULL, " .
            "cod_docente VARCHAR(20) NOT NULL UNIQUE, " .
            "tipo_contrato VARCHAR(50) NOT NULL, " .
            "es_activo TINYINT(1) NOT NULL DEFAULT 1, " .
            "grado_academico VARCHAR(100) NOT NULL, " .
            "especialidad VARCHAR(150) NOT NULL, " .
            "id_buzon INT NOT NULL, " .
            "nombre_completo VARCHAR(150) NOT NULL, " .
            "fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP" .
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );

        $this->pdo->exec(
            "ALTER TABLE docentes ADD COLUMN IF NOT EXISTS nombre_completo VARCHAR(150) NOT NULL DEFAULT ''"
        );
        $this->pdo->exec(
            "ALTER TABLE docentes ADD COLUMN IF NOT EXISTS fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        );
        $this->pdo->exec(
            "ALTER TABLE docentes ADD COLUMN IF NOT EXISTS calificacion DECIMAL(3,1) DEFAULT 5.0"
        );
        $this->pdo->exec(
            "ALTER TABLE docentes ADD COLUMN IF NOT EXISTS observaciones TEXT NULL"
        );
    }

    public function getAll(): array
    {
        $stmt = $this->pdo->query(
            "SELECT d.id_docente, d.id_persona, d.cod_docente, d.tipo_contrato, d.es_activo, d.grado_academico, d.especialidad, d.id_buzon, " .
            "COALESCE(NULLIF(TRIM(d.nombre_completo), ''), TRIM(CONCAT(p.nombre, ' ', COALESCE(p.ap_paterno, ''), ' ', COALESCE(p.ap_materno, '')))) AS nombre_completo, " .
            "d.fecha_registro, d.calificacion, d.observaciones, " .
            "p.dni, p.nombre, p.ap_paterno, p.ap_materno, p.fechaNa, p.direccion AS email, " .
            "GROUP_CONCAT(DISTINCT c.nombre SEPARATOR ', ') AS cursos_a_cargo " .
            "FROM docentes d " .
            "LEFT JOIN personas p ON d.id_persona = p.id_persona " .
            "LEFT JOIN asignacion_curso ac ON ac.id_docente = d.id_docente " .
            "LEFT JOIN grado_curso gc ON gc.id_gradoCurso = ac.id_gradoCurso " .
            "LEFT JOIN curso c ON c.id_curso = gc.id_curso " .
            "GROUP BY d.id_docente " .
            "ORDER BY d.id_docente DESC"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create(array $data): array
    {
        $dni = trim((string)($data['dni'] ?? ''));
        $nombre = trim((string)($data['nombre'] ?? ''));
        $apPaterno = trim((string)($data['ap_paterno'] ?? ''));
        $apMaterno = trim((string)($data['ap_materno'] ?? ''));
        $fechaNa = trim((string)($data['fechaNa'] ?? ''));
        $direccion = trim((string)($data['direccion'] ?? ''));

        $tipoContrato = trim((string)($data['tipo_contrato'] ?? ''));
        $gradoAcademico = trim((string)($data['grado_academico'] ?? ''));
        $especialidad = trim((string)($data['especialidad'] ?? ''));
        $esActivo = !empty($data['es_activo']);

        $nombreCompleto = trim((string)($data['nombre_completo'] ?? ''));
        if ($nombreCompleto === '' && ($nombre !== '' || $apPaterno !== '' || $apMaterno !== '')) {
            $nombreCompleto = trim("$nombre $apPaterno $apMaterno");
        }

        if ($dni === '' || $nombre === '' || $apPaterno === '' || $apMaterno === '' || $fechaNa === '' || $direccion === '' || $nombreCompleto === '' || $tipoContrato === '' || $gradoAcademico === '' || $especialidad === '') {
            throw new InvalidArgumentException('Complete todos los campos obligatorios de la Persona Natural y del Docente.');
        }

        $this->pdo->beginTransaction();

        try {
            $codeStmt = $this->pdo->query(
                "SELECT cod_docente FROM docentes WHERE cod_docente LIKE 'DOC%' ORDER BY CAST(SUBSTRING(cod_docente, 4) AS UNSIGNED) DESC LIMIT 1"
            );
            $lastCodeRow = $codeStmt->fetch(PDO::FETCH_ASSOC);
            $nextNumber = 1;

            if ($lastCodeRow && !empty($lastCodeRow['cod_docente'])) {
                $lastNumber = (int)substr($lastCodeRow['cod_docente'], 3);
                $nextNumber = $lastNumber + 1;
            }

            $codDocente = 'DOC' . str_pad((string)$nextNumber, 3, '0', STR_PAD_LEFT);

            $personaStmt = $this->pdo->prepare(
                "INSERT INTO personas (dni, nombre, ap_paterno, ap_materno, fechaNa, direccion) VALUES (?, ?, ?, ?, ?, ?)"
            );
            $personaStmt->execute([
                $dni,
                $nombre,
                $apPaterno,
                $apMaterno,
                $fechaNa,
                $direccion
            ]);
            $idPersona = (int)$this->pdo->lastInsertId();

            $buzonStmt = $this->pdo->prepare("INSERT INTO buzon (no_leidos) VALUES (?)");
            $buzonStmt->execute([0]);
            $idBuzon = (int)$this->pdo->lastInsertId();

            $stmt = $this->pdo->prepare(
                "INSERT INTO docentes (id_persona, cod_docente, tipo_contrato, es_activo, grado_academico, especialidad, id_buzon, nombre_completo) " .
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $idPersona,
                $codDocente,
                $tipoContrato,
                $esActivo ? 1 : 0,
                $gradoAcademico,
                $especialidad,
                $idBuzon,
                $nombreCompleto
            ]);

            $insertedId = (int)$this->pdo->lastInsertId();
            $this->pdo->commit();

            $recordStmt = $this->pdo->prepare(
                "SELECT d.id_docente, d.id_persona, d.cod_docente, d.tipo_contrato, d.es_activo, d.grado_academico, d.especialidad, d.id_buzon, d.nombre_completo, d.fecha_registro, " .
                "p.dni, p.nombre, p.ap_paterno, p.ap_materno, p.fechaNa, p.direccion AS email " .
                "FROM docentes d " .
                "LEFT JOIN personas p ON d.id_persona = p.id_persona " .
                "WHERE d.id_docente = ?"
            );
            $recordStmt->execute([$insertedId]);

            $record = $recordStmt->fetch(PDO::FETCH_ASSOC);
            return $record ?: [];
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function updateStatus(int $idDocente, bool $esActivo): array
    {
        $stmt = $this->pdo->prepare("UPDATE docentes SET es_activo = ? WHERE id_docente = ?");
        $stmt->execute([$esActivo ? 1 : 0, $idDocente]);

        return [
            'id_docente' => $idDocente,
            'es_activo' => $esActivo
        ];
    }

    public function rateDocente(int $idDocente, float $calificacion, string $observaciones): array
    {
        $stmt = $this->pdo->prepare("UPDATE docentes SET calificacion = ?, observaciones = ? WHERE id_docente = ?");
        $stmt->execute([$calificacion, $observaciones, $idDocente]);

        return [
            'id_docente' => $idDocente,
            'calificacion' => $calificacion,
            'observaciones' => $observaciones
        ];
    }
}
