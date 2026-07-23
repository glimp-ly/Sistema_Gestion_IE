<?php

/**
 * Clase de Conexión a la Base de Datos
 * Implementa el patrón Singleton. Soporta variables de entorno (Docker) 
 * con fallback automático a la configuración local (XAMPP).
 */
class Conexion
{
    private static $instance = null;

    public static function connection()
    {
        if (self::$instance === null) {
            $host     = getenv('DB_HOST') ?: "localhost";
            $db_name  = getenv('DB_NAME') ?: "colegio_DB";
            $username = getenv('DB_USER') ?: "root";
            $password = getenv('DB_PASS') !== false ? getenv('DB_PASS') : "";

            try {
                self::$instance = new PDO(
                    "mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8mb4",
                    $username,
                    $password,
                    [
                        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES   => false,
                    ]
                );
            } catch (PDOException $e) {
                error_log("Error de conexión BD: " . $e->getMessage());
                throw new Exception("Error interno del servidor. Inténtelo más tarde.");
            }
        }
        return self::$instance;
    }
}
