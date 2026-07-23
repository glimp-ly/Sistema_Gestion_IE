<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portal Administrativo - IEP Corazón de Jesús College</title>
  
  <!-- Hojas de estilo CSS que componen la interfaz del portal administrativo -->
  <link rel="stylesheet" href="<?php echo BASE_URL; ?>public/css/variables.css">
  <link rel="stylesheet" href="<?php echo BASE_URL; ?>public/css/common.css">
  <link rel="stylesheet" href="<?php echo BASE_URL; ?>public/css/dashboard.css">
  <link rel="stylesheet" href="<?php echo BASE_URL; ?>public/css/components.css">

  <!-- Guardia de Seguridad: Bloquea la renderización de la página si el usuario no cuenta con sesión de rol 'administrativo' -->
  <script src="<?php echo BASE_URL; ?>public/js/auth.js"></script>
  <script>
    if (window.SchoolAuth) {
      window.SchoolAuth.checkGuard('administrativo');
    }
  </script>
</head>
<body>

  <div id="app-layout">
    <!-- Capa de fondo oscura para móviles cuando el panel lateral (Sidebar) se despliega -->
    <div class="sidebar-overlay" id="sidebar-overlay"></div>

    <!-- Menú de Navegación Lateral (Sidebar) -->
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

      <!-- Menú principal con enlaces basados en Hash ('#') para enrutamiento SPA en frontend -->
      <ul class="sidebar-menu">
        <li class="menu-item">
          <a href="#info-personal" class="menu-link">
            <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span>Información Personal</span>
          </a>
        </li>
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
            <!-- UserPlus Icon -->
            <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="17" y1="11" x2="23" y2="11"></line></svg>
            <span>Añadir Docentes</span>
          </a>
        </li>
        <li class="menu-item">
          <a href="#cursos" class="menu-link">
            <!-- BookOpen Icon -->
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
      </ul>

      <!-- Footer del Sidebar con datos de la sesión del usuario administrativo -->
      <div class="sidebar-footer">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="user-avatar" id="sidebar-user-avatar">JP</div>
          <div style="display: flex; flex-direction: column; overflow: hidden;">
            <strong style="font-size: 13px; text-overflow: ellipsis; overflow: hidden;" id="sidebar-user-name">Lic. Jose Perez</strong>
            <span style="font-size: 10px; opacity: 0.7;">IEP Corazón de Jesús</span>
          </div>
        </div>
      </div>
    </</aside>

    <!-- Contenedor Principal de la Página -->
    <div class="main-wrapper">
      <header class="top-navbar">
        <div class="navbar-left">
          <!-- Botón hamburguesa: Abre el sidebar móvil (drawer) -->
          <button class="mobile-hamburger" id="mobile-drawer-btn">
            <svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          
          <!-- Botón de colapso: Oculta/Muestra el sidebar en pantallas grandes de escritorio -->
          <button class="toggle-sidebar-btn" id="desktop-collapse-btn">
            <svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>

          <!-- Título dinámico que cambia de acuerdo a la ruta activa -->
          <h2 class="page-title" id="navbar-page-title">Cargando...</h2>
        </div>

        <div class="navbar-right">
          <!-- Campana de Notificaciones -->
          <div class="notification-bell">
            <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            <span class="bell-badge">3</span>
          </div>

          <!-- Información del perfil logueado -->
          <div class="user-profile">
            <div class="user-avatar">JP</div>
            <div class="user-info">
              <span class="user-name" id="navbar-user-name">Lic. Jose Perez</span>
              <span class="user-role">Director</span>
            </div>
          </div>

          <!-- Botón de cierre de sesión (invoca a la función SchoolAuth.logout de auth.js) -->
          <button class="logout-btn" id="logout-btn" onclick="window.SchoolAuth.logout()">
            <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span>Salir</span>
          </button>
        </div>
      </header>

      <!-- Espacio dinámico donde el Router JS inyectará las vistas HTML de forma asíncrona -->
      <main class="main-content" id="main-content"></main>
    </div>
  </div>

  <!-- Carga de Módulos Javascript -->
  <!-- 1. mockData.js provee el motor CRUD de base de datos simulada en localStorage -->
  <script src="<?php echo BASE_URL; ?>public/js/mockData.js"></script>
  <!-- 2. router.js maneja la navegación SPA controlando el hashchange de la URL -->
  <script src="<?php echo BASE_URL; ?>public/js/router.js"></script>
  <!-- 3. admin.js contiene la lógica del negocio administrativo y renderizado de interfaces -->
  <script src="<?php echo BASE_URL; ?>public/js/admin.js"></script>
  
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Cargamos dinámicamente los datos del usuario logueado en la cabecera y el pie de página
      const session = window.SchoolAuth.getSession();
      if (session) {
        document.getElementById('sidebar-user-name').textContent = session.name;
        document.getElementById('navbar-user-name').textContent = session.name;
        
        // Calculamos las iniciales para los avatares
        const initials = session.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        document.querySelectorAll('.user-avatar, #sidebar-user-avatar').forEach(el => {
          el.textContent = initials;
        });
      }

      // Configuración de los eventos interactivos del Sidebar (Colapso y Responsive)
      const layout = document.getElementById('app-layout');
      const deskBtn = document.getElementById('desktop-collapse-btn');
      const mobBtn = document.getElementById('mobile-drawer-btn');
      const overlay = document.getElementById('sidebar-overlay');

      // Colapso de menú en escritorio
      deskBtn.addEventListener('click', function() {
        layout.classList.toggle('collapsed');
      });

      // Apertura de menú móvil (Drawer)
      mobBtn.addEventListener('click', function() {
        layout.classList.add('mobile-active');
      });

      // Cierre de menú móvil al hacer clic fuera del panel (sobre la capa overlay)
      overlay.addEventListener('click', function() {
        layout.classList.remove('mobile-active');
      });

      // Definición de las Rutas Administrativas
      // Cada hash se asocia con un método renderizador expuesto por 'AdminModule' en admin.js
      const adminRoutes = {
        '#info-personal': window.AdminModule.renderInfoPersonal,
        '#incidencias': window.AdminModule.renderIncidencias,
        '#docentes': window.AdminModule.renderDocentes,
        '#add-docentes': window.AdminModule.renderAddDocentes,
        '#cursos': window.AdminModule.renderCursos,
        '#mensajeria': window.AdminModule.renderMensajeria,
        '#plantillas': window.AdminModule.renderPlantillas,
        '#economia': window.AdminModule.renderEconomia
      };

      // Inicialización del Enrutador, cargando '#info-personal' como vista predeterminada
      window.SchoolRouter.init(adminRoutes, '#info-personal');
    });
  </script>
</body>
</html>