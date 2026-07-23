<?php

class UsuarioModel
{

    private $conn;

    private const BASE_SELECT = "
        SELECT 
            c.id_credenciales   AS id,
            p.nombre            AS nombre,
            p.ap_paterno        AS ap_paterno,
            p.ap_materno        AS ap_materno,
            c.username          AS email,
            r.id_rol            AS rol_id,
            r.nombre            AS rol_nombre
        FROM CREDENCIALES c
        INNER JOIN PERSONAS p       ON c.id_persona      = p.id_persona
        INNER JOIN USUARIO_ROL ur   ON c.id_credenciales = ur.id_credenciales
        INNER JOIN ROL r            ON ur.id_rol         = r.id_rol
    ";

    public function __construct()
    {
        $this->conn = Conexion::connection();
    }

    public function getUsuarios()
    {
        $query = self::BASE_SELECT . " ORDER BY c.id_credenciales ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getUsuarioById($id)
    {
        $query = self::BASE_SELECT . " WHERE c.id_credenciales = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getUsuarioByEmail($email)
    {
        $query = "
            SELECT 
                c.id_credenciales   AS id,
                p.nombre            AS nombre,
                p.ap_paterno        AS ap_paterno,
                p.ap_materno        AS ap_materno,
                c.username          AS email,
                c.password_hash     AS password,
                r.id_rol            AS rol_id,
                r.nombre            AS rol_nombre
            FROM CREDENCIALES c
            INNER JOIN PERSONAS p       ON c.id_persona      = p.id_persona
            INNER JOIN USUARIO_ROL ur   ON c.id_credenciales = ur.id_credenciales
            INNER JOIN ROL r            ON ur.id_rol         = r.id_rol
            WHERE c.username = :email
            LIMIT 1
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function crearUsuario($data)
    {
        $this->conn->beginTransaction();
        try {
            $stmt = $this->conn->prepare("
                INSERT INTO PERSONAS (dni, nombre, ap_paterno, ap_materno, fechaNa, direccion)
                VALUES (:dni, :nombre, :ap_paterno, :ap_materno, :fechaNa, :direccion)
            ");
            $stmt->execute([
                ':dni'        => $data['dni'] ?? '00000000',
                ':nombre'     => $data['nombre'],
                ':ap_paterno' => $data['ap_paterno'] ?? '',
                ':ap_materno' => $data['ap_materno'] ?? '',
                ':fechaNa'    => $data['fechaNa'] ?? date('Y-m-d'),
                ':direccion'  => $data['direccion'] ?? '',
            ]);
            $idPersona = $this->conn->lastInsertId();

            $stmt = $this->conn->prepare("
                INSERT INTO CREDENCIALES (username, password_hash, id_persona)
                VALUES (:username, :password_hash, :id_persona)
            ");
            $stmt->execute([
                ':username'      => $data['email'],
                ':password_hash' => $data['password'],
                ':id_persona'    => $idPersona,
            ]);
            $idCredenciales = $this->conn->lastInsertId();

            $stmt = $this->conn->prepare("
                INSERT INTO USUARIO_ROL (id_credenciales, id_rol)
                VALUES (:id_credenciales, :id_rol)
            ");
            $stmt->execute([
                ':id_credenciales' => $idCredenciales,
                ':id_rol'          => $data['rol_id'],
            ]);

            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            $this->conn->rollBack();
            error_log("Error al crear usuario: " . $e->getMessage());
            return false;
        }
    }

    public function actualizarUsuario($id, $data)
    {
        $this->conn->beginTransaction();
        try {
            $stmt = $this->conn->prepare("SELECT id_persona FROM CREDENCIALES WHERE id_credenciales = :id");
            $stmt->execute([':id' => $id]);
            $cred = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$cred) {
                throw new Exception("Credencial no encontrada.");
            }

            $stmt = $this->conn->prepare("
                UPDATE PERSONAS SET nombre = :nombre
                WHERE id_persona = :id_persona
            ");
            $stmt->execute([
                ':nombre'     => $data['nombre'],
                ':id_persona' => $cred['id_persona'],
            ]);

            if (!empty($data['password'])) {
                $stmt = $this->conn->prepare("
                    UPDATE CREDENCIALES SET username = :username, password_hash = :password_hash
                    WHERE id_credenciales = :id
                ");
                $stmt->execute([
                    ':username'      => $data['email'],
                    ':password_hash' => $data['password'],
                    ':id'            => $id,
                ]);
            } else {
                $stmt = $this->conn->prepare("
                    UPDATE CREDENCIALES SET username = :username
                    WHERE id_credenciales = :id
                ");
                $stmt->execute([
                    ':username' => $data['email'],
                    ':id'       => $id,
                ]);
            }

            $stmt = $this->conn->prepare("
                UPDATE USUARIO_ROL SET id_rol = :id_rol
                WHERE id_credenciales = :id_credenciales
            ");
            $stmt->execute([
                ':id_rol'          => $data['rol_id'],
                ':id_credenciales' => $id,
            ]);

            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            $this->conn->rollBack();
            error_log("Error al actualizar usuario: " . $e->getMessage());
            return false;
        }
    }

    public function eliminarUsuario($id)
    {
        $stmt = $this->conn->prepare("SELECT id_persona FROM CREDENCIALES WHERE id_credenciales = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $cred = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($cred) {
            $stmt = $this->conn->prepare("DELETE FROM PERSONAS WHERE id_persona = :id_persona");
            $stmt->bindParam(':id_persona', $cred['id_persona'], PDO::PARAM_INT);
            return $stmt->execute();
        }
        return false;
    }

    public function emailExiste($email, $idExcluir = null)
    {
        if ($idExcluir) {
            $query = "SELECT COUNT(*) as total FROM CREDENCIALES WHERE username = :email AND id_credenciales != :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':id', $idExcluir, PDO::PARAM_INT);
        } else {
            $query = "SELECT COUNT(*) as total FROM CREDENCIALES WHERE username = :email";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':email', $email);
        }
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'] > 0;
    }

    public function contarUsuarios()
    {
        $query = "SELECT COUNT(*) as total FROM CREDENCIALES";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'];
    }

    public function getPasswordHashById($idCredenciales)
    {
        $stmt = $this->conn->prepare(
            "SELECT password_hash FROM CREDENCIALES WHERE id_credenciales = :id"
        );
        $stmt->bindParam(':id', $idCredenciales, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? $row['password_hash'] : null;
    }

    public function cambiarPassword($idCredenciales, $nuevoHash)
    {
        $stmt = $this->conn->prepare(
            "UPDATE CREDENCIALES SET password_hash = :hash WHERE id_credenciales = :id"
        );
        $stmt->execute([
            ':hash' => $nuevoHash,
            ':id'   => $idCredenciales,
        ]);
        return $stmt->rowCount() > 0;
    }
}
