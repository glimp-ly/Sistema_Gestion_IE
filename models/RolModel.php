<?php

class RolModel
{

    private $conn;

    public function __construct()
    {
        $this->conn = Conexion::connection();
    }

    public function getRoles()
    {
        $query = "SELECT id_rol, nombre FROM ROL ORDER BY id_rol ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getRolById($id)
    {
        $query = "SELECT id_rol, nombre FROM ROL WHERE id_rol = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
