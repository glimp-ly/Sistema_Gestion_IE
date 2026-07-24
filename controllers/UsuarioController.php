<?php

require_once "controllers/ValController.php";
require_once "models/UsuarioModel.php";
require_once "models/RolModel.php";

class UsuarioController
{

    protected $db;
    protected $roles;
    protected $validacion;
    protected $errores;

    public function __construct()
    {
        Security::verificarRol(['Director', 'Administrador']);
        $this->db = new UsuarioModel();
        $this->roles = new RolModel();
        $this->validacion = new ValController();
        $this->errores = array();
    }

    public function index()
    {
        $data = array(
            "contenido" => "views/usuarios/usuario.php",
            "titulo" => "Gestión de Usuarios",
            "resultado" => $this->db->getUsuarios()
        );
        // require_once TEMPLATE;
    }

    public function nuevo()
    {
        $data = array(
            "contenido" => "views/usuarios/usuario_nuevo.php",
            "titulo" => "Registrar Nuevo Usuario",
            "roles" => $this->roles->getRoles()
        );
        // require_once TEMPLATE;
    }

    public function registrar()
    {
        if ($_SERVER["REQUEST_METHOD"] == "POST") {

            $csrfToken = isset($_POST['csrf_token']) ? $_POST['csrf_token'] : '';
            if (!Security::validarTokenCSRF($csrfToken)) {
                echo json_encode(["success" => false, "mensaje" => "Token de seguridad inválido."]);
                return;
            }

            $nombre = Security::sanitizarEntrada($_POST['nombre'] ?? '');
            $email = Security::sanitizarEntrada($_POST['email'] ?? '');
            $password = $_POST['password'] ?? '';
            $rol_id = intval($_POST['rol_id'] ?? 0);

            $this->validarNombre($nombre);
            $this->validarEmail(null, $email);
            $this->validarPassword($password);
            $this->validarRol($rol_id);

            if ($this->errores) {
                echo json_encode(["success" => false, "errores" => $this->errores]);
            } else {
                $dataUsuario = [
                    "nombre" => $nombre,
                    "email" => $email,
                    "password" => Security::encriptarPassword($password),
                    "rol_id" => $rol_id
                ];

                $this->db->crearUsuario($dataUsuario);
                echo json_encode(["success" => true, "mensaje" => "Usuario registrado correctamente."]);
            }
        } else {
            echo json_encode(["success" => false, "mensaje" => "Método no permitido."]);
        }
    }

    public function verUsuario($id)
    {
        $data = array(
            "contenido" => "views/usuarios/usuario_editar.php",
            "titulo" => "Editar Usuario",
            "consulta" => $this->db->getUsuarioById($id),
            "roles" => $this->roles->getRoles()
        );
        // require_once TEMPLATE;
    }

    public function actualizar()
    {
        if ($_SERVER["REQUEST_METHOD"] == "POST") {

            $csrfToken = isset($_POST['csrf_token']) ? $_POST['csrf_token'] : '';
            if (!Security::validarTokenCSRF($csrfToken)) {
                echo json_encode(["success" => false, "mensaje" => "Token de seguridad inválido."]);
                return;
            }

            $id = intval($_POST['id'] ?? 0);
            $nombre = Security::sanitizarEntrada($_POST['nombre'] ?? '');
            $email = Security::sanitizarEntrada($_POST['email'] ?? '');
            $password = $_POST['password'] ?? '';
            $rol_id = intval($_POST['rol_id'] ?? 0);

            $this->validarNombre($nombre);
            $this->validarEmail($id, $email);
            if (!empty($password)) {
                $this->validarPassword($password);
            }
            $this->validarRol($rol_id);

            if ($this->errores) {
                echo json_encode(["success" => false, "errores" => $this->errores]);
            } else {
                $dataUsuario = [
                    "nombre" => $nombre,
                    "email" => $email,
                    "password" => !empty($password) ? Security::encriptarPassword($password) : '',
                    "rol_id" => $rol_id
                ];

                $this->db->actualizarUsuario($id, $dataUsuario);
                echo json_encode(["success" => true, "mensaje" => "Usuario actualizado correctamente."]);
            }
        } else {
            echo json_encode(["success" => false, "mensaje" => "Método no permitido."]);
        }
    }

    public function eliminar($id)
    {
        if ($id == $_SESSION['usuario_id']) {
            $_SESSION['mensaje_error'] = "No puede eliminar su propia cuenta.";
            header("Location: " . BASE_URL . "usuario");
            exit;
        }
        $this->db->eliminarUsuario($id);
        $_SESSION['mensaje'] = "Usuario eliminado correctamente.";
        header("Location: " . BASE_URL . "usuario");
        exit;
    }

    public function listarAjax()
    {
        $usuarios = $this->db->getUsuarios();
        echo json_encode($usuarios);
    }

    private function validarNombre($valor)
    {
        $opciones = array(
            "options" => array("min_range" => 2, "max_range" => 100)
        );
        if (!$this->validacion->validarRequeridos($valor)) {
            $this->errores["nombre"] = "Debe ingresar el nombre del usuario.";
        } else if (!$this->validacion->validarLongitudes($valor, $opciones)) {
            $this->errores["nombre"] = "El nombre debe tener entre 2 y 100 caracteres.";
        }
    }

    private function validarEmail($id, $valor)
    {
        if (!$this->validacion->validarRequeridos($valor)) {
            $this->errores["email"] = "Debe ingresar el correo electrónico.";
        } else if (!$this->validacion->validarCorreo($valor)) {
            $this->errores["email"] = "El formato del correo electrónico no es válido.";
        } else if ($this->db->emailExiste($valor, $id)) {
            $this->errores["email"] = "Este correo electrónico ya está registrado.";
        }
    }

    private function validarPassword($valor)
    {
        if (!$this->validacion->validarRequeridos($valor)) {
            $this->errores["password"] = "Debe ingresar una contraseña.";
        } else if (strlen($valor) < 4) {
            $this->errores["password"] = "La contraseña debe tener al menos 4 caracteres.";
        }
    }

    private function validarRol($valor)
    {
        if ($valor < 1 || $valor > 3) {
            $this->errores["rol_id"] = "Debe seleccionar un rol válido.";
        }
    }
}
