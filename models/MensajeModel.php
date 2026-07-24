<?php

/**
 * Modelo de mensajería interna usando las tablas existentes BUZON y MENSAJE.
 * El campo id_buzon identifica el buzón del destinatario.
 */
class MensajeModel
{
    private PDO $conn;

    public function __construct(PDO $conn)
    {
        $this->conn = $conn;
    }

    public function obtenerUsuarioPorCredencial(int $idCredencial): ?array
    {
        $stmt = $this->conn->prepare(
            "SELECT
                c.id_credenciales,
                c.username,
                CONCAT(p.nombre, ' ', p.ap_paterno, ' ', p.ap_materno) AS nombre_completo,
                COALESCE(d.id_buzon, a.id_buzon) AS id_buzon,
                CASE WHEN d.id_docente IS NOT NULL THEN 'Docente' ELSE 'Director' END AS tipo
             FROM CREDENCIALES c
             INNER JOIN PERSONAS p ON p.id_persona = c.id_persona
             LEFT JOIN DOCENTES d ON d.id_persona = p.id_persona
             LEFT JOIN ADMINISTRATIVO a ON a.id_persona = p.id_persona
             WHERE c.id_credenciales = :id_credencial
             LIMIT 1"
        );
        $stmt->execute([':id_credencial' => $idCredencial]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function obtenerUsuarioPorUsername(string $username): ?array
    {
        $stmt = $this->conn->prepare(
            "SELECT
                c.id_credenciales,
                c.username,
                CONCAT(p.nombre, ' ', p.ap_paterno, ' ', p.ap_materno) AS nombre_completo,
                COALESCE(d.id_buzon, a.id_buzon) AS id_buzon,
                CASE WHEN d.id_docente IS NOT NULL THEN 'Docente' ELSE 'Director' END AS tipo,
                d.id_docente,
                a.id_administrativo
             FROM CREDENCIALES c
             INNER JOIN PERSONAS p ON p.id_persona = c.id_persona
             LEFT JOIN DOCENTES d ON d.id_persona = p.id_persona
             LEFT JOIN ADMINISTRATIVO a ON a.id_persona = p.id_persona
             WHERE c.username = :username
             LIMIT 1"
        );
        $stmt->execute([':username' => $username]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function listarDocentes(string $usernameAdmin): array
    {
        $stmt = $this->conn->prepare(
            "SELECT
                c.username,
                d.id_docente,
                d.cod_docente,
                d.especialidad,
                CONCAT(p.nombre, ' ', p.ap_paterno, ' ', p.ap_materno) AS nombre_completo,
                SUM(CASE
                    WHEN m.leido = 0
                     AND m.emisor = c.username
                     AND m.destinatario = :admin_username
                    THEN 1 ELSE 0 END) AS no_leidos
             FROM DOCENTES d
             INNER JOIN PERSONAS p ON p.id_persona = d.id_persona
             INNER JOIN CREDENCIALES c ON c.id_persona = p.id_persona
             LEFT JOIN CREDENCIALES ca ON ca.username = :admin_username_lookup
             LEFT JOIN ADMINISTRATIVO a ON a.id_persona = ca.id_persona
             LEFT JOIN MENSAJE m ON m.id_buzon = a.id_buzon
             WHERE d.es_activo = 1
             GROUP BY c.username, d.id_docente, d.cod_docente, d.especialidad,
                      p.nombre, p.ap_paterno, p.ap_materno
             ORDER BY p.ap_paterno, p.ap_materno, p.nombre"
        );
        $stmt->execute([
            ':admin_username' => $usernameAdmin,
            ':admin_username_lookup' => $usernameAdmin,
        ]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function obtenerDirectorPrincipal(): ?array
    {
        $stmt = $this->conn->prepare(
            "SELECT
                c.username,
                a.id_administrativo,
                a.id_buzon,
                CONCAT(p.nombre, ' ', p.ap_paterno, ' ', p.ap_materno) AS nombre_completo
             FROM ADMINISTRATIVO a
             INNER JOIN PERSONAS p ON p.id_persona = a.id_persona
             INNER JOIN CREDENCIALES c ON c.id_persona = p.id_persona
             WHERE a.es_activo = 1
               AND a.id_buzon IS NOT NULL
             ORDER BY a.id_administrativo ASC
             LIMIT 1"
        );
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function obtenerConversacion(array $actual, array $otro): array
    {
        $this->marcarLeidos($actual, (string)$otro['username']);

        $stmt = $this->conn->prepare(
            "SELECT
                id_mensaje,
                mensaje,
                DATE_FORMAT(fecha_envio, '%Y-%m-%d %H:%i') AS fecha_envio,
                leido,
                emisor,
                destinatario
             FROM MENSAJE
             WHERE (emisor = :actual_1 AND destinatario = :otro_1)
                OR (emisor = :otro_2 AND destinatario = :actual_2)
             ORDER BY fecha_envio ASC, id_mensaje ASC"
        );
        $stmt->execute([
            ':actual_1' => $actual['username'],
            ':otro_1' => $otro['username'],
            ':otro_2' => $otro['username'],
            ':actual_2' => $actual['username'],
        ]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function enviar(array $emisor, array $destinatario, string $mensaje): array
    {
        $this->conn->beginTransaction();
        try {
            $stmt = $this->conn->prepare(
                "INSERT INTO MENSAJE (mensaje, fecha_envio, leido, emisor, destinatario, id_buzon)
                 VALUES (:mensaje, NOW(), 0, :emisor, :destinatario, :id_buzon)"
            );
            $stmt->execute([
                ':mensaje' => $mensaje,
                ':emisor' => $emisor['username'],
                ':destinatario' => $destinatario['username'],
                ':id_buzon' => (int)$destinatario['id_buzon'],
            ]);

            $idMensaje = (int)$this->conn->lastInsertId();

            $stmt = $this->conn->prepare(
                "UPDATE BUZON SET no_leidos = no_leidos + 1 WHERE id_buzon = :id_buzon"
            );
            $stmt->execute([':id_buzon' => (int)$destinatario['id_buzon']]);

            $stmt = $this->conn->prepare(
                "SELECT
                    id_mensaje,
                    mensaje,
                    DATE_FORMAT(fecha_envio, '%Y-%m-%d %H:%i') AS fecha_envio,
                    leido,
                    emisor,
                    destinatario
                 FROM MENSAJE
                 WHERE id_mensaje = :id_mensaje"
            );
            $stmt->execute([':id_mensaje' => $idMensaje]);
            $registro = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

            $this->conn->commit();
            return $registro;
        } catch (Throwable $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            throw $e;
        }
    }

    public function obtenerNotificaciones(array $actual): array
    {
        $idBuzon = (int)$actual['id_buzon'];

        // Calcula el contador desde MENSAJE para que no dependa de datos de prueba
        // que quizá no hayan actualizado manualmente BUZON.no_leidos.
        $stmt = $this->conn->prepare(
            "SELECT COUNT(*)
             FROM MENSAJE
             WHERE id_buzon = :id_buzon
               AND leido = 0"
        );
        $stmt->execute([':id_buzon' => $idBuzon]);
        $count = (int)$stmt->fetchColumn();

        $stmt = $this->conn->prepare(
            "UPDATE BUZON SET no_leidos = :no_leidos WHERE id_buzon = :id_buzon"
        );
        $stmt->execute([
            ':no_leidos' => $count,
            ':id_buzon' => $idBuzon,
        ]);

        $stmt = $this->conn->prepare(
            "SELECT
                id_mensaje,
                mensaje,
                DATE_FORMAT(fecha_envio, '%Y-%m-%d %H:%i') AS fecha_envio,
                emisor
             FROM MENSAJE
             WHERE id_buzon = :id_buzon AND leido = 0
             ORDER BY fecha_envio DESC, id_mensaje DESC
             LIMIT 5"
        );
        $stmt->execute([':id_buzon' => $idBuzon]);

        return [
            'no_leidos' => $count,
            'recientes' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        ];
    }

    public function listarComunicacionesUgel(array $actual): array
    {
        $idBuzon = (int)$actual['id_buzon'];

        $this->conn->beginTransaction();
        try {
            $stmt = $this->conn->prepare(
                "UPDATE MENSAJE
                 SET leido = 1
                 WHERE id_buzon = :id_buzon
                   AND leido = 0
                   AND (UPPER(emisor) LIKE 'UGEL%' OR UPPER(emisor) LIKE 'MINEDU%')"
            );
            $stmt->execute([':id_buzon' => $idBuzon]);

            $this->recalcularNoLeidos($idBuzon);

            $stmt = $this->conn->prepare(
                "SELECT
                    id_mensaje,
                    mensaje,
                    DATE_FORMAT(fecha_envio, '%Y-%m-%d %H:%i') AS fecha_envio,
                    leido,
                    emisor,
                    destinatario
                 FROM MENSAJE
                 WHERE id_buzon = :id_buzon
                   AND (UPPER(emisor) LIKE 'UGEL%' OR UPPER(emisor) LIKE 'MINEDU%')
                 ORDER BY fecha_envio DESC, id_mensaje DESC"
            );
            $stmt->execute([':id_buzon' => $idBuzon]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $this->conn->commit();
            return $rows;
        } catch (Throwable $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            throw $e;
        }
    }

    private function marcarLeidos(array $actual, string $usernameEmisor): void
    {
        $this->conn->beginTransaction();
        try {
            $stmt = $this->conn->prepare(
                "UPDATE MENSAJE
                 SET leido = 1
                 WHERE id_buzon = :id_buzon
                   AND emisor = :emisor
                   AND destinatario = :destinatario
                   AND leido = 0"
            );
            $stmt->execute([
                ':id_buzon' => (int)$actual['id_buzon'],
                ':emisor' => $usernameEmisor,
                ':destinatario' => $actual['username'],
            ]);

            $this->recalcularNoLeidos((int)$actual['id_buzon']);

            $this->conn->commit();
        } catch (Throwable $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            throw $e;
        }
    }

    private function recalcularNoLeidos(int $idBuzon): void
    {
        $stmt = $this->conn->prepare(
            "UPDATE BUZON
             SET no_leidos = (
                SELECT COUNT(*)
                FROM MENSAJE m
                WHERE m.id_buzon = :id_buzon_count
                  AND m.leido = 0
             )
             WHERE id_buzon = :id_buzon_where"
        );
        $stmt->execute([
            ':id_buzon_count' => $idBuzon,
            ':id_buzon_where' => $idBuzon,
        ]);
    }

}
