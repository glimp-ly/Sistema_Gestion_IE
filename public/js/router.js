// Enrutador basado en Hash para la I.E.P. Corazón de Jesús (Mini-framework SPA en JS Puro)
// Encapsulado en una función autoejecutable (IIFE) para evitar contaminar el ámbito global.
(function() {
  window.SchoolRouter = {
    // Mapa donde se asociará cada ruta (ej. '#dashboard') con su función de renderizado de vista
    routes: {},
    // Ruta por defecto en caso de no especificarse ninguna en la URL
    defaultHash: '',
    
    /**
     * Inicializa el enrutador
     * @param {Object} routesConfig - Objeto clave/valor con las rutas y funciones de vista
     * @param {string} defaultHash - Hash inicial por defecto (ej. '#dashboard')
     */
    init: function(routesConfig, defaultHash) {
      this.routes = routesConfig;
      this.defaultHash = defaultHash;
      
      const self = this;
      
      // Escucha el evento 'hashchange' (cuando la URL cambia de #seccion a otra)
      window.addEventListener('hashchange', function() {
        self.handleRoute();
      });
      
      // Ejecuta el enrutador al cargar inicialmente la página completa (DOMContentLoaded)
      window.addEventListener('DOMContentLoaded', function() {
        self.handleRoute();
      });
    },
    
    /**
     * Procesa el cambio de ruta actual y carga la sección del DOM correspondiente
     */
    handleRoute: function() {
      const rawHash = window.location.hash;
      let routeKey = rawHash || this.defaultHash;
      
      // Normaliza la ruta asegurando que contenga el prefijo '#'
      if (routeKey && !routeKey.startsWith('#')) {
        routeKey = '#' + routeKey;
      }

      // Sincronización visual del menú lateral (Sidebar UI):
      // 1. Quitamos la clase 'active' de todos los elementos de menú para limpiarlos
      document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
        item.classList.remove('active');
      });
      
      // 2. Buscamos el enlace <a> que apunte exactamente al hash actual y le añadimos la clase 'active'
      const activeLink = document.querySelector(`.sidebar-menu a[href="${routeKey}"]`);
      if (activeLink) {
        activeLink.closest('.menu-item').classList.add('active');
      }
      
      // Si la interfaz está en móvil y tiene el menú lateral abierto, lo cerramos al navegar
      const layout = document.getElementById('app-layout');
      if (layout) {
        layout.classList.remove('mobile-active');
      }
      
      // Renderizado dinámico de la vista correspondiente
      const renderFn = this.routes[routeKey];
      if (renderFn) {
        const mainContainer = document.getElementById('main-content');
        if (mainContainer) {
          // Limpiamos el contenedor principal de la interfaz para inyectar la nueva vista
          mainContainer.innerHTML = '';
          
          // Ejecutamos la función de renderizado pasándole el contenedor como parámetro
          renderFn(mainContainer);
          
          // Desplazamos la pantalla al inicio de forma suave
          window.scrollTo(0, 0);
        }
      } else {
        // Si el usuario ingresa una ruta inválida o no registrada, lo redirigimos a la ruta por defecto
        console.warn('Ruta no definida: ' + routeKey + '. Redirigiendo a ' + this.defaultHash);
        window.location.hash = this.defaultHash;
      }
    }
  };
})();
