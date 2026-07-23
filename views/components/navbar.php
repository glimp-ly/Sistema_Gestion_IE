<?php
/**
 * Componente: navbar.php
 * Barra de navegación superior con información del usuario, notificaciones y botón Salir.
 * 
 * Parámetros opcionales:
 * - $userRoleLabel (string): Etiqueta del rol a mostrar (ej: "Director", "Docente")
 * - $badgeCount (int): Número de notificaciones en la campana
 */
$usuarioNombre = $_SESSION['usuario_nombre'] ?? 'Usuario';
$usuarioRol = $userRoleLabel ?? ($_SESSION['rol_nombre'] ?? 'Usuario');
$notifBadge = $badgeCount ?? 3;

// Iniciales para el avatar
$partesNombre = explode(' ', trim($usuarioNombre));
$iniciales = '';
foreach (array_slice($partesNombre, 0, 2) as $p) {
    if (!empty($p)) $iniciales .= strtoupper($p[0]);
}
if (empty($iniciales)) $iniciales = 'US';
?>
<header class="top-navbar">
  <div class="navbar-left">
    <!-- Botón hamburguesa: Abre el sidebar móvil (drawer) -->
    <button class="mobile-hamburger" id="mobile-drawer-btn">
      <svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
    </button>
    
    <!-- Botón de colapso: Oculta/Muestra el sidebar en escritorio -->
    <button class="toggle-sidebar-btn" id="desktop-collapse-btn">
      <svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
    </button>

    <!-- Título dinámico -->
    <h2 class="page-title" id="navbar-page-title">Cargando...</h2>
  </div>

  <div class="navbar-right">
    <!-- Campana de Notificaciones -->
    <div class="notification-bell">
      <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
      <span class="bell-badge"><?php echo htmlspecialchars($notifBadge); ?></span>
    </div>

    <!-- Información del perfil logueado -->
    <div class="user-profile">
      <div class="user-avatar"><?php echo htmlspecialchars($iniciales); ?></div>
      <div class="user-info">
        <span class="user-name" id="navbar-user-name"><?php echo htmlspecialchars($usuarioNombre); ?></span>
        <span class="user-role"><?php echo htmlspecialchars($usuarioRol); ?></span>
      </div>
    </div>

    <!-- Botón de cierre de sesión -->
    <button class="logout-btn" id="logout-btn" onclick="window.SchoolAuth.logout()">
      <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
      <span>Salir</span>
    </button>
  </div>
</header>
