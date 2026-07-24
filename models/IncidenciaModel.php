<?php

/**
 * Modelo de incidencias disciplinarias.
 * Trabaja exclusivamente con las tablas existentes:
 * INCIDENCIA, ALUMNOS_INCIDENCIA, ALUMNOS, DOCENTES, PERSONAS y GRADO.
 */
class IncidenciaModel
{
    private PDO $conn;

    public function __construct(PDO $conn)
    {
        $this->conn = $conn;
    }

    public function obtenerIdDocentePorCredencial(int $idCredencial): ?int
    {
        $stmt = $this->conn->prepare(
            "SELECT d.id_docente
             FROM CREDENCIALES c
             INNER JOIN DOCENTES d ON d.id_persona = c.id_persona
             WHERE c.id_credenciales = :id_credencial
             LIMIT 1"
        );
        $stmt->execute([':id_credencial' => $idCredencial]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? (int)$row['id_docente'] : null;
    }

    public function listarAlumnosPorDocente(int $idDocente): array
    {
        $stmt = $this->conn->prepare(
            "SELECT DISTINCT
                a.id_alumno,
                a.cod_alumn,
                CONCAT(p.nombre, ' ', p.ap_paterno, ' ', p.ap_materno) AS nombre_completo,
                CONCAT(g.nombre, ' - ', g.seccion) AS grado
             FROM ALUMNOS a
             INNER JOIN PERSONAS p ON p.id_persona = a.id_persona
             INNER JOIN GRADO g ON g.id_grado = a.id_grado
             INNER JOIN GRADO_CURSO gc ON gc.id_grado = g.id_grado
             INNER JOIN ASIGNACION_CURSO ac ON ac.id_gradoCurso = gc.id_gradoCurso
             WHERE ac.id_docente = :id_docente
               AND CURDATE() >= ac.fecha_asignacion
               AND (ac.fecha_finAsig IS NULL OR CURDATE() <= ac.fecha_finAsig)
             ORDER BY g.nombre, g.seccion, p.ap_paterno, p.ap_materno, p.nombre"
        );
        $stmt->execute([':id_docente' => $idDocente]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function listarPorDocente(int $idDocente): array
    {
        return $this->listarConFiltro('WHERE i.id_docente = :id_docente', [':id_docente' => $idDocente]);
    }

    public function listarTodas(): array
    {
        return $this->listarConFiltro('', []);
    }

    private function listarConFiltro(string $where, array $params): array
    {
        $sql = "SELECT
                    i.id_incidencia,
                    i.texto,
                    i.prioridad,
                    DATE_FORMAT(i.fecha, '%Y-%m-%d') AS fecha,
                    a.id_alumno,
                    a.cod_alumn,
                    CONCAT(pa.nombre, ' ', pa.ap_paterno, ' ', pa.ap_materno) AS alumno,
                    CONCAT(g.nombre, ' - ', g.seccion) AS grado,
                    d.id_docente,
                    CONCAT(pd.nombre, ' ', pd.ap_paterno, ' ', pd.ap_materno) AS docente
                FROM INCIDENCIA i
                INNER JOIN DOCENTES d ON d.id_docente = i.id_docente
                INNER JOIN PERSONAS pd ON pd.id_persona = d.id_persona
                INNER JOIN ALUMNOS_INCIDENCIA ai ON ai.id_incidencia = i.id_incidencia
                INNER JOIN ALUMNOS a ON a.id_alumno = ai.id_alumno
                INNER JOIN PERSONAS pa ON pa.id_persona = a.id_persona
                INNER JOIN GRADO g ON g.id_grado = a.id_grado
                {$where}
                ORDER BY i.fecha DESC, i.id_incidencia DESC";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function crear(int $idDocente, int $idAlumno, string $texto, string $prioridad): array
    {
        $this->validarAlumno($idAlumno);

        $this->conn->beginTransaction();
        try {
            $stmt = $this->conn->prepare(
                "INSERT INTO INCIDENCIA (texto, prioridad, id_docente, fecha)
                 VALUES (:texto, :prioridad, :id_docente, CURDATE())"
            );
            $stmt->execute([
                ':texto' => $texto,
                ':prioridad' => $prioridad,
                ':id_docente' => $idDocente,
            ]);

            $idIncidencia = (int)$this->conn->lastInsertId();

            $stmt = $this->conn->prepare(
                "INSERT INTO ALUMNOS_INCIDENCIA (id_alumno, id_incidencia)
                 VALUES (:id_alumno, :id_incidencia)"
            );
            $stmt->execute([
                ':id_alumno' => $idAlumno,
                ':id_incidencia' => $idIncidencia,
            ]);

            $this->conn->commit();
            return $this->obtenerPorId($idIncidencia) ?? [];
        } catch (Throwable $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            throw $e;
        }
    }

    public function actualizarPrioridad(int $idIncidencia, string $prioridad): ?array
    {
        $stmt = $this->conn->prepare(
            "UPDATE INCIDENCIA
             SET prioridad = :prioridad
             WHERE id_incidencia = :id_incidencia"
        );
        $stmt->execute([
            ':prioridad' => $prioridad,
            ':id_incidencia' => $idIncidencia,
        ]);

        if ($stmt->rowCount() === 0 && !$this->existe($idIncidencia)) {
            return null;
        }

        return $this->obtenerPorId($idIncidencia);
    }

    public function eliminar(int $idIncidencia): bool
    {
        if (!$this->existe($idIncidencia)) {
            return false;
        }

        $this->conn->beginTransaction();
        try {
            $stmt = $this->conn->prepare(
                "DELETE FROM ALUMNOS_INCIDENCIA WHERE id_incidencia = :id_incidencia"
            );
            $stmt->execute([':id_incidencia' => $idIncidencia]);

            $stmt = $this->conn->prepare(
                "DELETE FROM INCIDENCIA WHERE id_incidencia = :id_incidencia"
            );
            $stmt->execute([':id_incidencia' => $idIncidencia]);

            $eliminada = $stmt->rowCount() > 0;
            $this->conn->commit();
            return $eliminada;
        } catch (Throwable $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            throw $e;
        }
    }

    private function obtenerPorId(int $idIncidencia): ?array
    {
        $rows = $this->listarConFiltro(
            'WHERE i.id_incidencia = :id_incidencia',
            [':id_incidencia' => $idIncidencia]
        );
        return $rows[0] ?? null;
    }

    private function existe(int $idIncidencia): bool
    {
        $stmt = $this->conn->prepare(
            "SELECT COUNT(*) FROM INCIDENCIA WHERE id_incidencia = :id_incidencia"
        );
        $stmt->execute([':id_incidencia' => $idIncidencia]);
        return (int)$stmt->fetchColumn() > 0;
    }

    private function validarAlumno(int $idAlumno): void
    {
        $stmt = $this->conn->prepare(
            "SELECT COUNT(*) FROM ALUMNOS WHERE id_alumno = :id_alumno"
        );
        $stmt->execute([':id_alumno' => $idAlumno]);

        if ((int)$stmt->fetchColumn() === 0) {
            throw new InvalidArgumentException('El alumno seleccionado no existe.');
        }
    }
}
