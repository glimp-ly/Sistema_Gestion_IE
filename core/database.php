<?php
    /**
     * Clase de Conexión a la Base de Datos
     * Implementa el patrón de diseño Singleton para asegurar que solo exista
     * una instancia/conexión activa a la base de datos durante el ciclo de vida de la solicitud.
     */
    class Conexion {
        // Credenciales de conexión (configuración típica local en XAMPP/WAMP)
        private static $host = "localhost";
        private static $db_name = "colegio_DB";
        private static $username = "root";
        private static $password = "";

        /**
         * Propiedad estática que almacenará la única conexión (instancia de PDO)
         * para que sea compartida en todo el sistema.
         */
        private static $instance = null;

        /**
         * Método estático para obtener la conexión única.
         * Si no existe, se crea; si ya existe, se retorna la existente (evitando múltiples conexiones).
         */
        public static function connection() {
            if (self::$instance === null) {
                try {
                    // Instanciamos el objeto PDO para conectar con MySQL/MariaDB
                    self::$instance = new PDO(
                        "mysql:host=" . self::$host . ";dbname=" . self::$db_name . ";charset=utf8mb4",
                        self::$username,
                        self::$password,
                        [
                            // Configuración avanzada de PDO:
                            // 1. Lanzar excepciones cuando ocurran errores de SQL/Conexión
                            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                            // 2. Retornar los datos en arreglos asociativos por defecto (ej. ['nombre' => 'Juan'])
                            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                            // 3. Desactivar la emulación de consultas preparadas para mayor seguridad contra SQL Injection
                            PDO::ATTR_EMULATE_PREPARES => false,
                        ]
                    );
                } catch (PDOException $e) {
                    // En caso de error, lo registramos internamente en los logs del servidor (seguridad)
                    error_log("Error de conexión BD: " . $e->getMessage());

                    // Al usuario le mostramos un mensaje genérico para no revelar detalles sensibles (como contraseñas o rutas de archivos)
                    throw new Exception("Error interno del servidor. Inténtelo más tarde.");
                }   
            }
            // Retorna la conexión activa (objeto PDO)
            return self::$instance;
        }
    }
?>