<?php
    class Security {

        public static function generarTokenCSRF()
        {
            if (!isset($_SESSION['csrf_token'])) {
                $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
            }
            return $_SESSION['csrf_token'];
        }

        public static function validarTokenCSRF($token)
        {
            if (isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token)) {
                return true;
            }
            return false;
        }

        public static function campoCSRF()
        {
            $token = self::generarTokenCSRF();
            return '<input type="hidden" name="csrf_token" value="' . $token . '">';
        }

        public static function sanitizarEntrada($valor)
        {
            $valor = trim($valor);
            $valor = stripslashes($valor);
            $valor = htmlspecialchars($valor, ENT_QUOTES, 'UTF-8');
            return $valor;
        }

        public static function verificarSesion()
        {
            if (!isset($_SESSION['usuario_id'])) {
                header("Location: " . BASE_URL . "auth");
                exit;
            }
            self::verificarExpiracionSesion();
        }

        public static function verificarExpiracionSesion()
        {
            if (isset($_SESSION['last_activity'])) {
                $inactivo = time() - $_SESSION['last_activity'];
                if ($inactivo > SESSION_TIMEOUT) {
                    session_unset();
                    session_destroy();
                    session_start();
                    $_SESSION['mensaje_error'] = "Su sesión ha expirado por inactividad. Por favor, inicie sesión nuevamente.";
                    header("Location: " . BASE_URL . "auth");
                    exit;
                }
            }
            $_SESSION['last_activity'] = time();
        }

        public static function verificarRol($rolesPermitidos)
        {
            self::verificarSesion();
            if (!in_array($_SESSION['rol_nombre'], $rolesPermitidos)) {
                header("Location: " . BASE_URL . "auth/accesoDenegado");
                exit;
            }
        }

        public static function encriptarPassword($password)
        {
            return password_hash($password, PASSWORD_BCRYPT);
        }
        public static function verificarPassword($password, $hash)
        {
            return password_verify($password, $hash);
        }
    }
?>