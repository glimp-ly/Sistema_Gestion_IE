<?php
Security::verificarRol(['Director', 'Administrador', 'Director']);

$pageTitle = "Portal Administrativo - IEP Corazón de Jesús College";
require_once "views/components/head.php";
?>
<body>

  <div id="app-layout">
    <!-- Capa de fondo oscura para móviles -->
    <div class="sidebar-overlay" id="sidebar-overlay"></div>

    <!-- Menú de Navegación Lateral (Sidebar) -->
    <?php 
    $activeRole = 'admin';
    require_once "views/components/sidebar.php"; 
    ?>

    <!-- Contenedor Principal de la Página -->
    <div class="main-wrapper">
      <!-- Barra de Navegación Superior (Navbar) -->
      <?php 
      $userRoleLabel = "Director";
      $badgeCount = 3;
      require_once "views/components/navbar.php"; 
      ?>

      <!-- Espacio dinámico donde el Router JS inyectará las vistas de forma asíncrona -->
      <main class="main-content" id="main-content"></main>
    </div>
  </div>

  <!-- Ventana Modal Genérica Reutilizable -->
  <?php require_once "views/components/modal.php"; ?>

  <!-- Carga de Módulos Javascript e Inicialización -->
  <?php 
  $moduleScript = "admin.js";
  require_once "views/components/scripts.php"; 
  ?>
</body>
</html>
