<?php
/**
 * =====================================================================
 * COMPONENTE: scripts.php
 * Carga de scripts JavaScript base, enrutador SPA y configuración DOM.
 * =====================================================================
 * 
 * Parámetros esperados:
 * - $moduleScript (string): Nombre del script del módulo ('admin.js' o 'docente.js')
 */
$scriptNombre = $moduleScript ?? 'admin.js';
?>
<!-- 1. mockData.js provee el motor CRUD de datos simulados en localStorage -->
<script src="<?php echo BASE_URL; ?>public/js/mockData.js"></script>
<!-- 2. router.js maneja la navegación SPA controlando el hashchange de la URL -->
<script src="<?php echo BASE_URL; ?>public/js/router.js"></script>
<!-- 3. Módulo de lógica de negocio específico del rol -->
<script src="<?php echo BASE_URL; ?>public/js/<?php echo htmlspecialchars($scriptNombre); ?>"></script>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    // 1. Cargar datos dinámicos de la sesión en los avatares e información de usuario
    const session = window.SchoolAuth ? window.SchoolAuth.getSession() : null;
    if (session) {
      const nameEl1 = document.getElementById('sidebar-user-name');
      const nameEl2 = document.getElementById('navbar-user-name');
      if (nameEl1) nameEl1.textContent = session.name;
      if (nameEl2) nameEl2.textContent = session.name;
      
      const initials = session.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      document.querySelectorAll('.user-avatar, #sidebar-user-avatar').forEach(el => {
        el.textContent = initials;
      });
    }

    // 2. Configuración de eventos interactivos del Sidebar (Colapso y Responsive)
    const layout = document.getElementById('app-layout');
    const deskBtn = document.getElementById('desktop-collapse-btn');
    const mobBtn = document.getElementById('mobile-drawer-btn');
    const overlay = document.getElementById('sidebar-overlay');

    if (deskBtn && layout) {
      deskBtn.addEventListener('click', function() {
        layout.classList.toggle('collapsed');
      });
    }

    if (mobBtn && layout) {
      mobBtn.addEventListener('click', function() {
        layout.classList.add('mobile-active');
      });
    }

    if (overlay && layout) {
      overlay.addEventListener('click', function() {
        layout.classList.remove('mobile-active');
      });
    }

    // La campana abre el módulo de mensajería correspondiente al rol.
    const notificationBell = document.querySelector('.notification-bell');
    if (notificationBell) {
      notificationBell.style.cursor = 'pointer';
      notificationBell.addEventListener('click', function() {
        window.location.hash = <?php echo $scriptNombre === 'docente.js' ? "'#info-personal'" : "'#mensajeria'"; ?>;
      });
    }

    // 3. Definición y asociación de Rutas SPA
    <?php if ($scriptNombre === 'docente.js'): ?>
      const routes = {
        '#info-personal': window.DocenteModule ? window.DocenteModule.renderInfoPersonal : null,
        '#cursos': window.DocenteModule ? window.DocenteModule.renderCursos : null,
        '#actividades': window.DocenteModule ? window.DocenteModule.renderActividades : null,
        '#asistencia': window.DocenteModule ? window.DocenteModule.renderAsistencia : null,
        '#incidencias': window.DocenteModule ? window.DocenteModule.renderIncidencias : null,
        '#reportes': window.DocenteModule ? window.DocenteModule.renderReportes : null
      };
    <?php else: ?>
      const routes = {
        '#info-personal': window.AdminModule ? window.AdminModule.renderInfoPersonal : null,
        '#incidencias': window.AdminModule ? window.AdminModule.renderIncidencias : null,
        '#docentes': window.AdminModule ? window.AdminModule.renderDocentes : null,
        '#add-docentes': window.AdminModule ? window.AdminModule.renderAddDocentes : null,
        '#cursos': window.AdminModule ? window.AdminModule.renderCursos : null,
        '#mensajeria': window.AdminModule ? window.AdminModule.renderMensajeria : null,
        '#plantillas': window.AdminModule ? window.AdminModule.renderPlantillas : null,
        '#economia': window.AdminModule ? window.AdminModule.renderEconomia : null,
        '#reportes': window.DocenteModule ? window.DocenteModule.renderReportes : null
      };
    <?php endif; ?>

    if (window.SchoolRouter) {
      window.SchoolRouter.init(routes, '#info-personal');
    }
  });
</script>
