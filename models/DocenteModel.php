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
        try {
            $cols = $this->pdo->query("SHOW COLUMNS FROM DOCENTES LIKE 'calificacion'")->fetchAll();
            if (empty($cols)) {
                $this->pdo->exec("ALTER TABLE DOCENTES ADD calificacion DECIMAL(3,1) DEFAULT 5.0");
            }
        } catch (Throwable $e) {}

        try {
            $cols = $this->pdo->query("SHOW COLUMNS FROM DOCENTES LIKE 'observaciones'")->fetchAll();
            if (empty($cols)) {
                $this->pdo->exec("ALTER TABLE DOCENTES ADD observaciones TEXT NULL");
            }
        } catch (Throwable $e) {}
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
}
