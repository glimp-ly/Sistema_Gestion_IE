<?php
/**
 * =====================================================================
 * COMPONENTE: sidebar.php
 * Menú de navegación lateral adaptable según el rol del usuario.
 * =====================================================================
 * 
 * Parámetros opcionales:
 * - $activeRole (string): 'admin' o 'docente' (por defecto se deduce de $_SESSION)
 */
$rolActual = strtolower(trim($_SESSION['rol_nombre'] ?? ''));
$esAdmin = ($activeRole ?? ($rolActual === 'docente' ? 'docente' : 'admin')) !== 'docente';
$usuarioNombre = $_SESSION['usuario_nombre'] ?? 'Usuario';

// Iniciales para el avatar
$partesNombre = explode(' ', trim($usuarioNombre));
$iniciales = '';
foreach (array_slice($partesNombre, 0, 2) as $p) {
    if (!empty($p)) {
        $iniciales .= strtoupper($p[0]);
    }
}
if (empty($iniciales)) {
    $iniciales = 'US';
}
?>
<aside class="sidebar">
  <div class="sidebar-header">
    <div class="school-logo">
      <!-- Escudo del Colegio en SVG -->
      <svg viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
        <path d="M2 17l10 5 10-5"></path>
        <path d="M2 12l10 5 10-5"></path>
      </svg>
      <span class="school-name">Corazón de Jesús</span>
    </div>
  </div>

  <!-- Menú principal con enlaces basados en Hash ('#') para enrutamiento SPA -->
  <ul class="sidebar-menu">
    <li class="menu-item">
      <a href="#info-personal" class="menu-link">
        <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        <span>Información Personal</span>
      </a>
    </li>

    <?php if ($esAdmin): ?>
      <!-- Módulos del Portal Administrativo -->
      <li class="menu-item">
        <a href="#incidencias" class="menu-link">
          <svg viewBox="0 0 24 24"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>Gestión Incidencias</span>
        </a>
      </li>
      <li class="menu-item">
        <a href="#docentes" class="menu-link">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
          <span>Reporte Docentes</span>
        </a>
      </li>
      <li class="menu-item">
        <a href="#add-docentes" class="menu-link">
          <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="17" y1="11" x2="23" y2="11"></line></svg>
          <span>Añadir Docentes</span>
        </a>
      </li>
      <li class="menu-item">
        <a href="#cursos" class="menu-link">
          <svg viewBox="0 0 24 24"><path d="M2 6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"></path><path d="M22 6a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2z"></path><path d="M6 8h4"></path><path d="M6 12h4"></path><path d="M6 16h4"></path></svg>
          <span>Gestión de Cursos</span>
        </a>
      </li>
      <li class="menu-item">
        <a href="#mensajeria" class="menu-link">
          <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <span>Mensajería y UGEL</span>
        </a>
      </li>
      <li class="menu-item">
        <a href="#plantillas" class="menu-link">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span>Plantillas UGEL</span>
        </a>
      </li>
      <li class="menu-item">
        <a href="#economia" class="menu-link">
          <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          <span>Gestión Económica</span>
        </a>
      </li>
    <?php else: ?>
      <!-- Módulos del Portal Docente -->
      <li class="menu-item">
        <a href="#cursos" class="menu-link">
          <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          <span>Mis Cursos</span>
        </a>
      </li>
      <li class="menu-item">
        <a href="#actividades" class="menu-link">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>Horarios y Actividades</span>
        </a>
      </li>
      <li class="menu-item">
        <a href="#asistencia" class="menu-link">
          <svg viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          <span>Registrar Asistencia</span>
        </a>
      </li>
      <li class="menu-item">
        <a href="#incidencias" class="menu-link">
          <svg viewBox="0 0 24 24"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>Incidencias</span>
        </a>
      </li>
      <li class="menu-item">
        <a href="#reportes" class="menu-link">
          <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          <span>Reportes</span>
        </a>
      </li>
    <?php endif; ?>
  </ul>

  <!-- Footer del Sidebar con avatar y datos del usuario -->
  <div class="sidebar-footer">
    <div style="display: flex; align-items: center; gap: 10px;">
      <div class="user-avatar" id="sidebar-user-avatar"><?php echo htmlspecialchars($iniciales); ?></div>
      <div style="display: flex; flex-direction: column; overflow: hidden;">
        <strong style="font-size: 13px; text-overflow: ellipsis; overflow: hidden;" id="sidebar-user-name"><?php echo htmlspecialchars($usuarioNombre); ?></strong>
        <span style="font-size: 10px; opacity: 0.7;">IEP Corazón de Jesús</span>
      </div>
    </div>
  </div>
</aside>
