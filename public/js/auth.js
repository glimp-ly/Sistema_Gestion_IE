// Administrador de Autenticación para la I.E.P. Corazón de Jesús
(function() {
  // Clave utilizada para guardar y recuperar la sesión persistente del usuario en el navegador (LocalStorage)
  const SESSION_KEY = 'colegio_corazon_jesus_session';

  window.SchoolAuth = {
    /**
     * Intenta iniciar sesión con un nombre de usuario
     * @param {string} username - Nombre de usuario ingresado en el login
     * @returns {Object} Resultado del login con banderas de éxito y la sesión correspondiente
     */
    login: function(username) {
      username = username.trim().toLowerCase();
      let session = null;

      // Validación simulada de credenciales (Mock login)
      // Si ingresa 'docen', le asignamos el rol de docente
      if (username === 'docen') {
        session = {
          username: 'docen',
          role: 'docente',
          name: 'Prof. Carlos Rivas',
          roleLabel: 'Docente de Primaria'
        };
      } 
      // Si ingresa 'dire', le asignamos el rol de administrativo (director/administrador)
      else if (username === 'dire') {
        session = {
          username: 'dire',
          role: 'administrativo',
          name: 'Lic. Jose Perez',
          roleLabel: 'Director Administrativo'
        };
      }

      // Si las credenciales coincidieron, se guardan en el LocalStorage del navegador
      if (session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return { success: true, session: session };
      }
      // Si no coincide, retornamos un mensaje indicando cómo acceder
      return { success: false, error: 'Usuario no reconocido. Utilice "docen" para docente o "dire" para director.' };
    },

    /**
     * Obtiene la sesión activa del usuario
     * @returns {Object|null} Objeto con la información del usuario logueado o null si no se encuentra
     */
    getSession: function() {
      // Método 1: Intentar leer del almacenamiento local (LocalStorage)
      try {
        const data = localStorage.getItem(SESSION_KEY);
        if (data) {
          return JSON.parse(data);
        }
      } catch (e) {
        console.warn('LocalStorage no disponible. Usando fallback de URL.', e);
      }

      // Método 2: Fallback utilizando parámetros URL (muy útil en entornos locales donde
      // el almacenamiento compartido puede estar deshabilitado o aislado debido al protocolo file://)
      const urlParams = new URLSearchParams(window.location.search);
      const u = urlParams.get('u');
      if (u === 'docen') {
        const session = {
          username: 'docen',
          role: 'docente',
          name: 'Prof. Carlos Rivas',
          roleLabel: 'Docente de Primaria'
        };
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        } catch (e) {}
        return session;
      } else if (u === 'dire') {
        const session = {
          username: 'dire',
          role: 'administrativo',
          name: 'Lic. Jose Perez',
          roleLabel: 'Director Administrativo'
        };
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        } catch (e) {}
        return session;
      }
      return null;
    },

    /**
     * Protector de Rutas (Guard): Verifica si existe una sesión válida y si posee el rol esperado.
     * Si no cumple los requisitos, redirige automáticamente.
     * @param {string} expectedRole - Rol esperado ('docente' o 'administrativo')
     * @returns {boolean} True si pasa el protector, False si es redirigido
     */
    checkGuard: function(expectedRole) {
      const session = this.getSession();
      
      // Si no existe sesión, redirige al login
      if (!session) {
        window.location.href = 'login.html?u=';
        return false;
      }
      
      // Si la sesión existe pero no tiene el rol autorizado para la vista actual,
      // se le redirige a la vista correcta según su rol
      if (session.role !== expectedRole) {
        if (session.role === 'docente') {
          window.location.href = 'docente.html?u=docen';
        } else {
          window.location.href = 'admin.html?u=dire';
        }
        return false;
      }
      return true;
    },

    /**
     * Cierra la sesión activa y elimina las credenciales locales
     */
    logout: function() {
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch (e) {}
      // Redirige al login limpiando parámetros de URL
      window.location.href = 'login.html?u=';
    }
  };
})();
