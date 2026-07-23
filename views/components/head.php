<?php
/**
 * Componente: head.php
 * Encabezado HTML, meta tags, hojas de estilo CSS y configuración de sesión activa.
 * 
 * Parámetros esperados:
 * - $pageTitle (string): Título de la página
 */
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?php echo htmlspecialchars($pageTitle ?? 'Sistema de Gestión - IEP Corazón de Jesús'); ?></title>

  <script>
    const BASE_URL = "<?php echo BASE_URL; ?>";
    window.currentSession = {
      name: "<?php echo htmlspecialchars($_SESSION['usuario_nombre'] ?? 'Usuario'); ?>",
      email: "<?php echo htmlspecialchars($_SESSION['usuario_email'] ?? ''); ?>",
      role: "<?php echo htmlspecialchars($_SESSION['rol_nombre'] ?? ''); ?>"
    };
  </script>
  
  <!-- Hojas de estilo CSS que componen la interfaz -->
  <link rel="stylesheet" href="<?php echo BASE_URL; ?>public/css/variables.css">
  <link rel="stylesheet" href="<?php echo BASE_URL; ?>public/css/common.css">
  <link rel="stylesheet" href="<?php echo BASE_URL; ?>public/css/dashboard.css">
  <link rel="stylesheet" href="<?php echo BASE_URL; ?>public/css/components.css">

  <!-- Guardia de Seguridad JavaScript -->
  <script src="<?php echo BASE_URL; ?>public/js/auth.js"></script>
</head>
