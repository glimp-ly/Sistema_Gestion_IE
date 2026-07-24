<?php

/**
 * Modelo de plantillas oficiales almacenadas como BLOB.
 * Usa PLANTILLAS y ASIGNACION_PLANTILLAS sin modificar su estructura.
 */
class PlantillaModel
{
    private PDO $conn;

    public function __construct(PDO $conn)
    {
        $this->conn = $conn;
    }

    public function obtenerIdAdministrativoPorCredencial(int $idCredencial): ?int
    {
        $stmt = $this->conn->prepare(
            "SELECT a.id_administrativo
             FROM CREDENCIALES c
             INNER JOIN ADMINISTRATIVO a ON a.id_persona = c.id_persona
             WHERE c.id_credenciales = :id_credencial
             LIMIT 1"
        );
        $stmt->execute([':id_credencial' => $idCredencial]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? (int)$row['id_administrativo'] : null;
    }

    public function listarPorAdministrativo(int $idAdministrativo): array
    {
        $stmt = $this->conn->prepare(
            "SELECT
                p.id_plantilla,
                p.nombre,
                p.categoria,
                OCTET_LENGTH(p.archivo) AS tamano_bytes
             FROM PLANTILLAS p
             INNER JOIN ASIGNACION_PLANTILLAS ap ON ap.id_plantilla = p.id_plantilla
             WHERE ap.id_administrativo = :id_administrativo
             ORDER BY p.categoria, p.nombre"
        );
        $stmt->execute([':id_administrativo' => $idAdministrativo]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function crear(int $idAdministrativo, string $nombre, string $categoria, string $contenido): array
    {
        $this->conn->beginTransaction();
        try {
            $stmt = $this->conn->prepare(
                "INSERT INTO PLANTILLAS (nombre, categoria, archivo)
                 VALUES (:nombre, :categoria, :archivo)"
            );
            $stmt->bindValue(':nombre', $nombre, PDO::PARAM_STR);
            $stmt->bindValue(':categoria', $categoria, PDO::PARAM_STR);
            $stmt->bindValue(':archivo', $contenido, PDO::PARAM_LOB);
            $stmt->execute();

            $idPlantilla = (int)$this->conn->lastInsertId();

            $stmt = $this->conn->prepare(
                "INSERT INTO ASIGNACION_PLANTILLAS (id_administrativo, id_plantilla)
                 VALUES (:id_administrativo, :id_plantilla)"
            );
            $stmt->execute([
                ':id_administrativo' => $idAdministrativo,
                ':id_plantilla' => $idPlantilla,
            ]);

            $this->conn->commit();
            return [
                'id_plantilla' => $idPlantilla,
                'nombre' => $nombre,
                'categoria' => $categoria,
                'tamano_bytes' => strlen($contenido),
            ];
        } catch (Throwable $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            throw $e;
        }
    }

    public function obtenerArchivo(int $idAdministrativo, int $idPlantilla): ?array
    {
        $stmt = $this->conn->prepare(
            "SELECT p.id_plantilla, p.nombre, p.categoria, p.archivo
             FROM PLANTILLAS p
             INNER JOIN ASIGNACION_PLANTILLAS ap ON ap.id_plantilla = p.id_plantilla
             WHERE p.id_plantilla = :id_plantilla
               AND ap.id_administrativo = :id_administrativo
             LIMIT 1"
        );
        $stmt->execute([
            ':id_plantilla' => $idPlantilla,
            ':id_administrativo' => $idAdministrativo,
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function eliminar(int $idAdministrativo, int $idPlantilla): bool
    {
        $archivo = $this->obtenerArchivo($idAdministrativo, $idPlantilla);
        if (!$archivo) {
            return false;
        }

        $this->conn->beginTransaction();
        try {
            $stmt = $this->conn->prepare(
                "DELETE FROM ASIGNACION_PLANTILLAS
                 WHERE id_administrativo = :id_administrativo
                   AND id_plantilla = :id_plantilla"
            );
            $stmt->execute([
                ':id_administrativo' => $idAdministrativo,
                ':id_plantilla' => $idPlantilla,
            ]);

            $stmt = $this->conn->prepare(
                "SELECT COUNT(*) FROM ASIGNACION_PLANTILLAS WHERE id_plantilla = :id_plantilla"
            );
            $stmt->execute([':id_plantilla' => $idPlantilla]);
            $asignacionesRestantes = (int)$stmt->fetchColumn();

            if ($asignacionesRestantes === 0) {
                $stmt = $this->conn->prepare(
                    "DELETE FROM PLANTILLAS WHERE id_plantilla = :id_plantilla"
                );
                $stmt->execute([':id_plantilla' => $idPlantilla]);
            }

            $this->conn->commit();
            return true;
        } catch (Throwable $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            throw $e;
        }
    }
}
