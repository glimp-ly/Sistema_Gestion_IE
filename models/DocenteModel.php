<?php

/**
 * =====================================================================
 * MODELO: DocenteModel.php
 * Acceso a datos de la entidad DOCENTES conectada a PERSONAS, EXTRA_PERSONA,
 * CREDENCIALES y USUARIO_ROL en MySQL (Nombres de tabla en MAYÚSCULAS).
 * =====================================================================
 */

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

        // Las credenciales se vinculan a la misma persona del docente.  Así se
        // evita duplicar personas y el inicio de sesión puede identificarlo.
        $this->pdo->exec(
            "CREATE TABLE IF NOT EXISTS CREDENCIALES (" .
            "id_credenciales INT AUTO_INCREMENT PRIMARY KEY, " .
            "username VARCHAR(255) NOT NULL UNIQUE, " .
            "password_hash VARCHAR(255) NOT NULL, " .
            "id_persona INT NOT NULL UNIQUE" .
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
        $this->pdo->exec(
            "CREATE TABLE IF NOT EXISTS ROL (" .
            "id_rol INT AUTO_INCREMENT PRIMARY KEY, " .
            "nombre VARCHAR(30) NOT NULL UNIQUE" .
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
        $this->pdo->exec(
            "CREATE TABLE IF NOT EXISTS USUARIO_ROL (" .
            "id_usuario_rol INT AUTO_INCREMENT PRIMARY KEY, " .
            "id_credenciales INT NOT NULL, " .
            "id_rol INT NOT NULL, " .
            "UNIQUE KEY uq_usuario_rol (id_credenciales, id_rol)" .
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
        try {
            $cols = $this->pdo->query("SHOW COLUMNS FROM DOCENTES LIKE 'calificacion'")->fetchAll();
            if (empty($cols)) {
                $this->pdo->exec("ALTER TABLE DOCENTES ADD calificacion DECIMAL(3,1) DEFAULT 5.0");
            }
        } catch (Throwable $e) {
        }

        try {
            $cols = $this->pdo->query("SHOW COLUMNS FROM DOCENTES LIKE 'observaciones'")->fetchAll();
            if (empty($cols)) {
                $this->pdo->exec("ALTER TABLE DOCENTES ADD observaciones TEXT NULL");
            }
        } catch (Throwable $e) {
        }
    }

    /**
     * Obtiene la lista completa de docentes con su información personal y asignación de cursos.
     */
    public function getAll(): array
    {
        $sql = "SELECT 
                    d.id_docente, 
                    d.id_persona, 
                    d.cod_docente, 
                    d.tipo_contrato, 
                    d.es_activo, 
                    d.grado_academico, 
                    d.especialidad, 
                    d.id_buzon,
                    COALESCE(d.calificacion, 5.0) AS calificacion,
                    d.observaciones,
                    CONCAT(p.nombre, ' ', p.ap_paterno, ' ', p.ap_materno) AS nombre_completo,
                    p.dni, 
                    p.nombre, 
                    p.ap_paterno, 
                    p.ap_materno, 
                    p.fechaNa, 
                    p.direccion,
                    ep.correo AS email,
                    ep.telefono,
                    GROUP_CONCAT(DISTINCT c.nombre SEPARATOR ', ') AS cursos_a_cargo
                FROM DOCENTES d
                INNER JOIN PERSONAS p ON d.id_persona = p.id_persona
                LEFT JOIN EXTRA_PERSONA ep ON p.id_persona = ep.id_persona
                LEFT JOIN ASIGNACION_CURSO ac ON ac.id_docente = d.id_docente
                LEFT JOIN GRADO_CURSO gc ON gc.id_gradoCurso = ac.id_gradoCurso
                LEFT JOIN CURSO c ON c.id_curso = gc.id_curso
                GROUP BY d.id_docente
                ORDER BY d.id_docente DESC";

        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getCredentials(): array
    {
        $stmt = $this->pdo->query(
            "SELECT d.id_docente, d.cod_docente, " .
            "TRIM(CONCAT(p.nombre, ' ', p.ap_paterno, ' ', p.ap_materno)) AS nombre_completo, " .
            "c.username, r.nombre AS rol " .
            "FROM docentes d " .
            "INNER JOIN personas p ON p.id_persona = d.id_persona " .
            "INNER JOIN CREDENCIALES c ON c.id_persona = p.id_persona " .
            "INNER JOIN USUARIO_ROL ur ON ur.id_credenciales = c.id_credenciales " .
            "INNER JOIN ROL r ON r.id_rol = ur.id_rol " .
            "WHERE LOWER(r.nombre) = 'docente' " .
            "ORDER BY d.id_docente DESC"
        );
        $credentials = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($credentials as &$credential) {
            // La clave inicial es igual al usuario. El hash nunca se expone.
            $credential['password_temporal'] = $credential['username'];
        }
        unset($credential);
        return $credentials;
    }

    /**
     * Crea un nuevo docente registrando la persona, extras, buzón, docente, credenciales y rol.
     */
    public function create(array $data): array
    {
        $dni       = trim((string)($data['dni'] ?? ''));
        $nombre    = trim((string)($data['nombre'] ?? ''));
        $apPaterno = trim((string)($data['ap_paterno'] ?? ''));
        $apMaterno = trim((string)($data['ap_materno'] ?? ''));
        $fechaNa   = trim((string)($data['fechaNa'] ?? ''));
        $direccion = trim((string)($data['direccion'] ?? ''));
        $correo    = trim((string)($data['correo'] ?? $data['direccion'] ?? ''));
        $telefono  = trim((string)($data['telefono'] ?? '900000000'));

        $tipoContrato   = trim((string)($data['tipo_contrato'] ?? 'Nombrado'));
        $gradoAcademico = trim((string)($data['grado_academico'] ?? 'Licenciado'));
        $especialidad   = trim((string)($data['especialidad'] ?? 'Educación'));
        $esActivo       = !empty($data['es_activo']);

        if ($dni === '' || $nombre === '' || $apPaterno === '' || $apMaterno === '' || $fechaNa === '') {
            throw new InvalidArgumentException('Complete todos los campos obligatorios del docente (DNI, Nombres, Apellidos, Fecha Nacimiento).');
        }

        $this->pdo->beginTransaction();

        try {
            // 1. Generar código de docente automático (DOC-000X)
            $codeStmt = $this->pdo->query(
                "SELECT cod_docente FROM DOCENTES WHERE cod_docente LIKE 'DOC%' ORDER BY id_docente DESC LIMIT 1"
            );
            $lastCodeRow = $codeStmt->fetch(PDO::FETCH_ASSOC);
            $nextNumber = 1;

            if ($lastCodeRow && !empty($lastCodeRow['cod_docente'])) {
                $numPart = preg_replace('/[^0-9]/', '', $lastCodeRow['cod_docente']);
                if (!empty($numPart)) {
                    $nextNumber = (int)$numPart + 1;
                }
            }

            $codDocente = 'DOC-' . str_pad((string)$nextNumber, 4, '0', STR_PAD_LEFT);

            // 2. Insertar PERSONAS
            $personaStmt = $this->pdo->prepare(
                "INSERT INTO PERSONAS (dni, nombre, ap_paterno, ap_materno, fechaNa, direccion) VALUES (?, ?, ?, ?, ?, ?)"
            );
            $personaStmt->execute([$dni, $nombre, $apPaterno, $apMaterno, $fechaNa, $direccion]);
            $idPersona = (int)$this->pdo->lastInsertId();

            // 3. Insertar EXTRA_PERSONA
            $extraStmt = $this->pdo->prepare(
                "INSERT INTO EXTRA_PERSONA (id_persona, telefono, correo) VALUES (?, ?, ?)"
            );
            $extraStmt->execute([$idPersona, $telefono, $correo]);

            // 4. Crear BUZON
            $buzonStmt = $this->pdo->prepare("INSERT INTO BUZON (no_leidos) VALUES (0)");
            $buzonStmt->execute();
            $idBuzon = (int)$this->pdo->lastInsertId();

            $username = $this->buildUsername($nombre, $apPaterno, $apMaterno, $dni);
            $roleStmt = $this->pdo->prepare("SELECT id_rol FROM ROL WHERE LOWER(nombre) = 'docente' LIMIT 1");
            $roleStmt->execute();
            $idRol = (int)$roleStmt->fetchColumn();
            if ($idRol <= 0) {
                $createRoleStmt = $this->pdo->prepare("INSERT INTO ROL (nombre) VALUES ('Docente')");
                $createRoleStmt->execute();
                $idRol = (int)$this->pdo->lastInsertId();
            }

            $credentialStmt = $this->pdo->prepare(
                "INSERT INTO CREDENCIALES (username, password_hash, id_persona) VALUES (?, ?, ?)"
            );
            $credentialStmt->execute([$username, password_hash($username, PASSWORD_DEFAULT), $idPersona]);
            $idCredenciales = (int)$this->pdo->lastInsertId();

            $userRoleStmt = $this->pdo->prepare(
                "INSERT INTO USUARIO_ROL (id_credenciales, id_rol) VALUES (?, ?)"
            );
            $userRoleStmt->execute([$idCredenciales, $idRol]);

            $stmt = $this->pdo->prepare(
                "INSERT INTO docentes (id_persona, cod_docente, tipo_contrato, es_activo, grado_academico, especialidad, id_buzon, nombre_completo) " .
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            // 5. Insertar DOCENTES
            $docenteStmt = $this->pdo->prepare(
                "INSERT INTO DOCENTES (id_persona, cod_docente, tipo_contrato, es_activo, grado_academico, especialidad, id_buzon, calificacion) " .
                    "VALUES (?, ?, ?, ?, ?, ?, ?, 5.0)"
            );
            $docenteStmt->execute([
                $idPersona,
                $codDocente,
                $tipoContrato,
                $esActivo ? 1 : 0,
                $gradoAcademico,
                $especialidad,
                $idBuzon
            ]);
            $idDocente = (int)$this->pdo->lastInsertId();

            // 6. Crear CREDENCIALES de acceso (usuario por defecto: DNI o correo)
            $username = 'docente.' . strtolower($apPaterno) . $idDocente;
            $hashPass = password_hash('docente123', PASSWORD_BCRYPT);

            $credStmt = $this->pdo->prepare(
                "INSERT INTO CREDENCIALES (username, password_hash, id_persona) VALUES (?, ?, ?)"
            );
            $credStmt->execute([$username, $hashPass, $idPersona]);
            $idCred = (int)$this->pdo->lastInsertId();

            $record = $recordStmt->fetch(PDO::FETCH_ASSOC);
            if ($record) {
                $record['username'] = $username;
                $record['password_temporal'] = $username;
            }
            return $record ?: [];
            // 7. Asignar ROL 'Docente'
            $rolStmt = $this->pdo->query("SELECT id_rol FROM ROL WHERE nombre = 'Docente' LIMIT 1");
            $idRol = $rolStmt->fetchColumn() ?: 2;

            $userRolStmt = $this->pdo->prepare("INSERT INTO USUARIO_ROL (id_credenciales, id_rol) VALUES (?, ?)");
            $userRolStmt->execute([$idCred, $idRol]);

            $this->pdo->commit();

            return [
                'id_docente'      => $idDocente,
                'cod_docente'     => $codDocente,
                'nombre_completo' => "$nombre $apPaterno $apMaterno",
                'dni'             => $dni,
                'tipo_contrato'   => $tipoContrato,
                'grado_academico' => $gradoAcademico,
                'especialidad'    => $especialidad,
                'es_activo'       => $esActivo
            ];
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Cambia el estado activo/inactivo de un docente.
     */
    public function updateStatus(int $idDocente, bool $esActivo): array
    {
        $stmt = $this->pdo->prepare("UPDATE DOCENTES SET es_activo = ? WHERE id_docente = ?");
        $stmt->execute([$esActivo ? 1 : 0, $idDocente]);

        return [
            'id_docente' => $idDocente,
            'es_activo'  => $esActivo
        ];
    }

    /**
     * Califica el desempeño de un docente.
     */
    public function rateDocente(int $idDocente, float $calificacion, string $observaciones): array
    {
        $stmt = $this->pdo->prepare("UPDATE DOCENTES SET calificacion = ?, observaciones = ? WHERE id_docente = ?");
        $stmt->execute([$calificacion, $observaciones, $idDocente]);

        return [
            'id_docente'    => $idDocente,
            'calificacion'  => $calificacion,
            'observaciones' => $observaciones
        ];
    }

    private function buildUsername(string $nombre, string $apPaterno, string $apMaterno, string $dni): string
    {
        $raw = strtolower(trim($nombre . '.' . $apPaterno . '.' . $apMaterno . '.' . $dni));
        $normalized = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $raw);
        $normalized = $normalized === false ? $raw : $normalized;
        $normalized = preg_replace('/[^a-z0-9]+/', '.', $normalized);
        return trim((string)$normalized, '.');
    }
}
