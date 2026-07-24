<?php

require_once "models/UsuarioModel.php";

class AuthController
{

    protected $usuarios;

    public function __construct()
    {
        $this->usuarios = new UsuarioModel();
    }

    public function index()
    {
        if (isset($_SESSION['usuario_id'])) {
            $rol = strtolower(trim($_SESSION['rol_nombre'] ?? ''));
            if (in_array($rol, ['director', 'administrador', 'admin'])) {
                header("Location: " . BASE_URL . "admin");
                exit;
            } else if ($rol === 'docente') {
                header("Location: " . BASE_URL . "docente");
                exit;
            }
        }
        require_once "views/auth/login.php";
    }

    public function login()
    {
        if ($_SERVER["REQUEST_METHOD"] == "POST") {
            $csrfToken = isset($_POST['csrf_token']) ? $_POST['csrf_token'] : '';
            if (!Security::validarTokenCSRF($csrfToken)) {
                echo json_encode(["success" => false, "mensaje" => "Token de seguridad inválido. Recargue la página."]);
                return;
            }

            $email = Security::sanitizarEntrada($_POST['email'] ?? '');
            $password = $_POST['password'] ?? '';

            if (empty($email) || empty($password)) {
                echo json_encode(["success" => false, "mensaje" => "Todos los campos son obligatorios."]);
                return;
            }

            $usuario = $this->usuarios->getUsuarioByEmail($email);

            if (!$usuario) {
                echo json_encode(["success" => false, "mensaje" => "Correo electrónico o contraseña incorrectos."]);
                return;
            }

            if (Security::verificarPassword($password, $usuario['password'])) {
                $nombreCompleto = trim($usuario['nombre'] . ' ' . ($usuario['ap_paterno'] ?? ''));
                $_SESSION['usuario_id']     = $usuario['id'];
                $_SESSION['usuario_nombre'] = !empty($nombreCompleto) ? $nombreCompleto : $usuario['nombre'];
                $_SESSION['usuario_email']  = $usuario['email'];
                $_SESSION['rol_id']         = $usuario['rol_id'];
                $_SESSION['rol_nombre']     = $usuario['rol_nombre'];
                $_SESSION['last_activity']  = time();

                // Si el rol es Docente, resolver y guardar el id_docente en sesión
                $rol = strtolower(trim($usuario['rol_nombre']));
                if ($rol === 'docente') {
                    require_once "models/UsuarioModel.php";
                    $usuarioModel = new UsuarioModel();
                    $idDocente = $usuarioModel->getIdDocenteByCredencial($usuario['id']);
                    $_SESSION['id_docente'] = $idDocente;
                }

                session_regenerate_id(true);

                // Determinar la URL de redirección según el rol asignado
                $rol = strtolower(trim($usuario['rol_nombre']));
                if (in_array($rol, ['director', 'administrador', 'admin'])) {
                    $redirect = BASE_URL . "admin";
                } else if ($rol === 'docente') {
                    $redirect = BASE_URL . "docente";
                } else {
                    $redirect = BASE_URL . "admin";
                }

                echo json_encode([
                    "success"  => true,
                    "mensaje"  => "Bienvenido, " . $_SESSION['usuario_nombre'],
                    "redirect" => $redirect
                ]);
            } else {
                echo json_encode(["success" => false, "mensaje" => "Correo electrónico o contraseña incorrectos."]);
            }
        } else {
            echo json_encode(["success" => false, "mensaje" => "Método no permitido."]);
        }
    }

    public function logout()
    {
        session_unset();
        session_destroy();
        header("Location: " . BASE_URL . "auth");
        exit;
    }

    public function accesoDenegado()
    {
        require_once "views/errors/403.php";
    }
}
