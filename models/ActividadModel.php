<?php

/**
 * Modelo para actividades, calendario institucional y horario del docente.
 * Se adapta a las tablas existentes ACTIVIDADES, EVENTOS y ASIGNACION_CURSO.
 */
class ActividadModel
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

    public function listarCursosAsignados(int $idDocente): array
    {
        $stmt = $this->conn->prepare(
            "SELECT DISTINCT
                gc.id_gradoCurso,
                c.id_curso,
                c.nombre AS curso,
                g.id_grado,
                CONCAT(g.nombre, ' - ', g.seccion) AS grado,
                gc.`año` AS anio
             FROM ASIGNACION_CURSO ac
             INNER JOIN GRADO_CURSO gc ON gc.id_gradoCurso = ac.id_gradoCurso
             INNER JOIN CURSO c ON c.id_curso = gc.id_curso
             INNER JOIN GRADO g ON g.id_grado = gc.id_grado
             WHERE ac.id_docente = :id_docente
               AND CURDATE() >= ac.fecha_asignacion
               AND (ac.fecha_finAsig IS NULL OR CURDATE() <= ac.fecha_finAsig)
             ORDER BY g.nombre, g.seccion, c.nombre"
        );
        $stmt->execute([':id_docente' => $idDocente]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function listarHorario(int $idDocente): array
    {
        $stmt = $this->conn->prepare(
            "SELECT
                ac.id_asignacionCurso,
                ac.dia_horario,
                TIME_FORMAT(ac.hora_inicio, '%H:%i') AS hora_inicio,
                TIME_FORMAT(ac.hora_fin, '%H:%i') AS hora_fin,
                c.nombre AS curso,
                CONCAT(g.nombre, ' - ', g.seccion) AS grado,
                gc.`año` AS anio
             FROM ASIGNACION_CURSO ac
             INNER JOIN GRADO_CURSO gc ON gc.id_gradoCurso = ac.id_gradoCurso
             INNER JOIN CURSO c ON c.id_curso = gc.id_curso
             INNER JOIN GRADO g ON g.id_grado = gc.id_grado
             WHERE ac.id_docente = :id_docente
               AND CURDATE() >= ac.fecha_asignacion
               AND (ac.fecha_finAsig IS NULL OR CURDATE() <= ac.fecha_finAsig)
             ORDER BY FIELD(ac.dia_horario, 'Lunes','Martes','Miércoles','Miercoles','Jueves','Viernes','Sábado','Sabado','Domingo'), ac.hora_inicio"
        );
        $stmt->execute([':id_docente' => $idDocente]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function listarActividades(int $idDocente): array
    {
        $stmt = $this->conn->prepare(
            "SELECT DISTINCT
                a.id_actividad,
                a.nombre,
                a.peso,
                a.id_gradoCurso,
                c.nombre AS curso,
                CONCAT(g.nombre, ' - ', g.seccion) AS grado,
                gc.`año` AS anio
             FROM ACTIVIDADES a
             INNER JOIN GRADO_CURSO gc ON gc.id_gradoCurso = a.id_gradoCurso
             INNER JOIN CURSO c ON c.id_curso = gc.id_curso
             INNER JOIN GRADO g ON g.id_grado = gc.id_grado
             INNER JOIN ASIGNACION_CURSO ac ON ac.id_gradoCurso = gc.id_gradoCurso
             WHERE ac.id_docente = :id_docente
               AND CURDATE() >= ac.fecha_asignacion
               AND (ac.fecha_finAsig IS NULL OR CURDATE() <= ac.fecha_finAsig)
             ORDER BY gc.`año` DESC, g.nombre, c.nombre, a.id_actividad DESC"
        );
        $stmt->execute([':id_docente' => $idDocente]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function listarEventos(string $fechaInicio, string $fechaFin): array
    {
        $stmt = $this->conn->prepare(
            "SELECT
                e.id_evento,
                e.nombre,
                DATE_FORMAT(e.fecha_inicio, '%Y-%m-%d %H:%i') AS fecha_inicio,
                DATE_FORMAT(e.fecha_fin, '%Y-%m-%d %H:%i') AS fecha_fin,
                CONCAT(p.nombre, ' ', p.ap_paterno, ' ', p.ap_materno) AS creado_por_nombre
             FROM EVENTOS e
             INNER JOIN ADMINISTRATIVO a ON a.id_administrativo = e.creado_por
             INNER JOIN PERSONAS p ON p.id_persona = a.id_persona
             WHERE e.fecha_inicio < :fecha_fin
               AND e.fecha_fin >= :fecha_inicio
             ORDER BY e.fecha_inicio, e.id_evento"
        );
        $stmt->execute([
            ':fecha_inicio' => $fechaInicio,
            ':fecha_fin' => $fechaFin,
        ]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function crearActividad(int $idDocente, int $idGradoCurso, string $nombre, float $peso): array
    {
        $this->validarAsignacion($idDocente, $idGradoCurso);

        $stmt = $this->conn->prepare(
            "INSERT INTO ACTIVIDADES (nombre, peso, id_gradoCurso)
             VALUES (:nombre, :peso, :id_gradoCurso)"
        );
        $stmt->execute([
            ':nombre' => $nombre,
            ':peso' => $peso,
            ':id_gradoCurso' => $idGradoCurso,
        ]);

        return $this->obtenerActividad((int)$this->conn->lastInsertId(), $idDocente) ?? [];
    }

    public function actualizarActividad(int $idDocente, int $idActividad, int $idGradoCurso, string $nombre, float $peso): ?array
    {
        $this->validarAsignacion($idDocente, $idGradoCurso);
        if (!$this->obtenerActividad($idActividad, $idDocente)) {
            return null;
        }

        $stmt = $this->conn->prepare(
            "UPDATE ACTIVIDADES
             SET nombre = :nombre, peso = :peso, id_gradoCurso = :id_gradoCurso
             WHERE id_actividad = :id_actividad"
        );
        $stmt->execute([
            ':nombre' => $nombre,
            ':peso' => $peso,
            ':id_gradoCurso' => $idGradoCurso,
            ':id_actividad' => $idActividad,
        ]);

        return $this->obtenerActividad($idActividad, $idDocente);
    }

    public function eliminarActividad(int $idDocente, int $idActividad): bool
    {
        if (!$this->obtenerActividad($idActividad, $idDocente)) {
            return false;
        }
        if ($this->actividadTieneNotas($idActividad)) {
            throw new RuntimeException('No puede eliminarse porque ya tiene notas registradas.');
        }

        $stmt = $this->conn->prepare("DELETE FROM ACTIVIDADES WHERE id_actividad = :id_actividad");
        $stmt->execute([':id_actividad' => $idActividad]);
        return $stmt->rowCount() > 0;
    }

    private function actividadTieneNotas(int $idActividad): bool
    {
        $stmt = $this->conn->prepare(
            "SELECT EXISTS(
                SELECT 1
                FROM NOTAS
                WHERE id_actividad = :id_actividad
             )"
        );
        $stmt->execute([':id_actividad' => $idActividad]);
        return (bool)$stmt->fetchColumn();
    }

    private function obtenerActividad(int $idActividad, int $idDocente): ?array
    {
        $stmt = $this->conn->prepare(
            "SELECT DISTINCT
                a.id_actividad,
                a.nombre,
                a.peso,
                a.id_gradoCurso,
                c.nombre AS curso,
                CONCAT(g.nombre, ' - ', g.seccion) AS grado,
                gc.`año` AS anio
             FROM ACTIVIDADES a
             INNER JOIN GRADO_CURSO gc ON gc.id_gradoCurso = a.id_gradoCurso
             INNER JOIN CURSO c ON c.id_curso = gc.id_curso
             INNER JOIN GRADO g ON g.id_grado = gc.id_grado
             INNER JOIN ASIGNACION_CURSO ac ON ac.id_gradoCurso = gc.id_gradoCurso
             WHERE a.id_actividad = :id_actividad
               AND ac.id_docente = :id_docente
               AND CURDATE() >= ac.fecha_asignacion
               AND (ac.fecha_finAsig IS NULL OR CURDATE() <= ac.fecha_finAsig)
             LIMIT 1"
        );
        $stmt->execute([
            ':id_actividad' => $idActividad,
            ':id_docente' => $idDocente,
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    private function validarAsignacion(int $idDocente, int $idGradoCurso): void
    {
        $stmt = $this->conn->prepare(
            "SELECT COUNT(*)
             FROM ASIGNACION_CURSO
             WHERE id_docente = :id_docente
               AND id_gradoCurso = :id_gradoCurso
               AND CURDATE() >= fecha_asignacion
               AND (fecha_finAsig IS NULL OR CURDATE() <= fecha_finAsig)"
        );
        $stmt->execute([
            ':id_docente' => $idDocente,
            ':id_gradoCurso' => $idGradoCurso,
        ]);
        if ((int)$stmt->fetchColumn() === 0) {
            throw new InvalidArgumentException('El curso seleccionado no está asignado al docente.');
        }
    }
}
