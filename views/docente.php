<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/../core/config.php';
require_once __DIR__ . '/../core/security.php';
Security::verificarRol(['Docente', 'docente']);

$pageTitle = "Portal Docente - IEP Corazón de Jesús College";
require_once "views/components/head.php";
?>
<body>

  <div id="app-layout">
    <!-- Capa de fondo oscura para móviles -->
    <div class="sidebar-overlay" id="sidebar-overlay"></div>

    <!-- Menú de Navegación Lateral (Sidebar) -->
    <?php 
    $activeRole = 'docente';
    require_once "views/components/sidebar.php"; 
    ?>

    <!-- Contenedor Principal de la Página -->
    <div class="main-wrapper">
      <!-- Barra de Navegación Superior (Navbar) -->
      <?php 
      $userRoleLabel = "Docente";
      $badgeCount = 2;
      require_once "views/components/navbar.php"; 
      ?>

      <!-- Espacio dinámico donde el Router JS inyectará las vistas de forma asíncrona -->
      <main class="main-content" id="main-content"></main>
    </div>
  </div>

  <!-- Carga de Módulos Javascript e Inicialización -->
  <?php 
  $moduleScript = "docente.js";
  require_once "views/components/scripts.php"; 
  ?>
</body>
</html>
