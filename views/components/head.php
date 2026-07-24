<?php
/**
 * =====================================================================
 * COMPONENTE: head.php
 * Encabezado HTML, metadatos, hojas de estilo CSS globales e inyección
 * de variables globales de sesión para JavaScript.
 * =====================================================================
 * 
 * Parámetros esperados:
 * - $pageTitle (string): Título dinámico de la pestaña del navegador
 */
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?php echo htmlspecialchars($pageTitle ?? 'IEP Corazón de Jesús College'); ?></title>

  <!-- Configuración Global JavaScript de Sesión y Rutas -->
  <script>
    const BASE_URL = "<?php echo BASE_URL; ?>";
    window.currentSession = {
      name: "<?php echo htmlspecialchars($_SESSION['usuario_nombre'] ?? 'Usuario'); ?>",
      email: "<?php echo htmlspecialchars($_SESSION['usuario_email'] ?? ''); ?>",
      role: "<?php echo htmlspecialchars($_SESSION['rol_nombre'] ?? ''); ?>",
      csrfToken: "<?php echo Security::generarTokenCSRF(); ?>"
    };
  </script>
  
  <!-- Hojas de estilo CSS que componen la interfaz del portal -->
  <link rel="stylesheet" href="<?php echo BASE_URL; ?>public/css/variables.css">
  <link rel="stylesheet" href="<?php echo BASE_URL; ?>public/css/common.css">
  <link rel="stylesheet" href="<?php echo BASE_URL; ?>public/css/dashboard.css">
  <link rel="stylesheet" href="<?php echo BASE_URL; ?>public/css/components.css">

  <!-- Script de Autenticación y Guardias de Seguridad -->
  <script src="<?php echo BASE_URL; ?>public/js/auth.js"></script>
  <meta name="csrf-token" content="<?php echo Security::generarTokenCSRF(); ?>">
</head>
<input type="hidden" name="csrf_token" value="<?php echo Security::generarTokenCSRF(); ?>">
