<?php

session_start();

require_once "core/config.php";
require_once "core/database.php";
require_once "core/router.php";
require_once "core/security.php";

/**
 * Enrutador / Controlador Frontal (Front Controller) para la I.E.P. Colegio Corazón de Jesús.
 * 
 * Este script centraliza todas las peticiones HTTP entrantes. Su objetivo es decidir
 * qué recurso estático (CSS, JS, imágenes) o qué vista (archivo HTML) debe servirse,
 * actuando como un sistema de enrutamiento básico que evita exponer la estructura directa de carpetas.
 */

// 1. Obtener el directorio base donde se ejecuta el script.
// Útil cuando el proyecto está dentro de una subcarpeta (ej. /Sistema_Gestion_IE/) y no en la raíz del servidor.
$base_dir = dirname($_SERVER['SCRIPT_NAME']);
$request_uri = $_SERVER['REQUEST_URI'];

// 2. Limpiar los parámetros de consulta (query string, ej. ?id=5) para analizar solo la ruta limpia.
$path = parse_url($request_uri, PHP_URL_PATH);

// 3. Remover el subdirectorio base de la ruta para obtener el recurso relativo solicitado.
if ($base_dir !== '/' && strpos($path, $base_dir) === 0) {
    $path = substr($path, strlen($base_dir));
}

// Limpiar diagonales iniciales
$path = ltrim($path, '/');

// los html se deben cambiar a php puro, ya que ejecutan codigo php desde ellos
// 4. Ruta por defecto: Si la ruta está vacía o apunta a index.php, redirige a la vista principal (index.html).
if ($path === '' || $path === 'index.php') {
    $path = 'auth/login.php'; // Cambiado a login.php para que sea la página de inicio de sesión
}

// 5. Normalizar rutas relativas que por error busquen carpetas de recursos dentro de la carpeta 'views/'
if (preg_match('/^views\/(css|js|docs)\//', $path)) {
    $path = substr($path, 6); // Quita los primeros 6 caracteres correspondientes a 'views/'
}

// --- ENRUTAMIENTO ---

// A. Servir archivos estáticos desde el directorio público (/public)
// Si la ruta comienza con css/, js/ o docs/, buscamos el archivo físico correspondiente en /public/
if (preg_match('/^(css|js|docs)\//', $path)) {
    $file = __DIR__ . '/public/' . $path;
    if (file_exists($file)) {
        // Obtenemos la extensión del archivo para asociarla a su tipo MIME correspondiente.
        $ext = pathinfo($file, PATHINFO_EXTENSION);
        $content_types = [
            'css'  => 'text/css',
            'js'   => 'application/javascript',
            'pdf'  => 'application/pdf',
            'png'  => 'image/png',
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif'  => 'image/gif',
            'svg'  => 'image/svg+xml',
            'json' => 'application/json'
        ];
        // Si la extensión está mapeada, enviamos la cabecera Content-Type correcta al navegador
        if (isset($content_types[$ext])) {
            header('Content-Type: ' . $content_types[$ext]);
        }
        // Leemos y enviamos el contenido del archivo estático al cliente y detenemos la ejecución
        readfile($file);
        exit;
    }
}

// B. Servir vistas HTML desde el directorio de vistas (/views)
// Definimos una lista de vistas HTML permitidas en nuestra aplicación.
$views = ['index.html', 'auth/login.php', 'docente.php', 'admin.php'];
if (in_array($path, $views)) {
    $file = __DIR__ . '/views/' . $path;
    if (file_exists($file)) {
        // Enviamos el contenido de la vista HTML al cliente y detenemos la ejecución.
        readfile($file);
        exit;
    }
}

// C. Respuesta de error 404 (Recurso no encontrado)
// Si ninguna de las reglas anteriores coincidió, el recurso no existe.
header("HTTP/1.0 404 Not Found");
echo "<h1>404 Not Found</h1>";
echo "<p>La ruta especificada no existe en el sistema.</p>";
exit;

