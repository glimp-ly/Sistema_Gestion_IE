<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acceso al Sistema - IEP Corazón de Jesús College</title>
  
  <!-- Hojas de estilo CSS del sistema -->
  <!-- variables.css define los colores corporativos, tamaños y tokens de diseño globales -->
  <link rel="stylesheet" href="public/css/variables.css">
  <!-- login.css define los estilos específicos del formulario, animaciones y contenedor de login -->
  <link rel="stylesheet" href="public/css/login.css">
</head>
<body>

  <!-- Contenedor principal centrado de la pantalla de Login -->
  <div class="login-container">
    <div class="login-card">
      <div class="login-logo">
        <img src="public/img/logo_ie.jpg" alt="Logo Sagrado Corazón de Jesús" width="80rem" height="80rem">
      </div>

      <!-- Cabecera del formulario con el nombre del colegio -->
      <div class="login-header">
        <h2>Corazón de Jesús College</h2>
        <p>Sistema de Administración Académica</p>
      </div>

      <!-- Caja de alertas oculta por defecto. Se usará para mostrar mensajes de éxito o error al intentar acceder -->
      <div id="login-alert-box" style="display: none;"></div>

      <!-- Formulario de acceso -->
      <form id="login-form" class="login-form">
        <div class="form-group">
          <label class="form-label" for="username">Nombre de Usuario</label>
          <div class="input-wrapper">
            <!-- Campo de entrada para el usuario. Requerido y con autocompletado desactivado -->
            <input type="text" id="username" class="form-input" placeholder="Ingrese su usuario..." autocomplete="off" required>
            <span class="input-icon">
              <!-- Icono de usuario SVG dentro del campo -->
              <svg viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </span>
          </div>
          <br>
          <label class="form-label" for="pass">Contraseña</label>
          <div class="input-wrapper">
            <!-- Campo de entrada para la  contraseña. Requerido y con autocompletado desactivado -->
            <input type="password" id="pass" class="form-input" placeholder="Ingrese su Contraseña" autocomplete="off" required>
            <span class="input-icon">
              <!-- Icono de candado SVG dentro del campo -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </span>
          </div>
        </div>

        <!-- Botón de envío del formulario -->
        <button type="submit" class="btn-submit" id="btn-login">
          Ingresar al Sistema
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </form>
    </div>
  </div>

  <!-- Carga del script de autenticación para realizar la validación del usuario en cliente -->
  <script src="../public/js/auth.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Guardia de seguridad (Guard Check): si el usuario ya tiene sesión iniciada,
      // se le redirige directamente a su dashboard correspondiente sin pasar por el login.
      const session = window.SchoolAuth.getSession();
      if (session) {
        if (session.role === 'docente') {
          window.location.replace('docente.html?u=docen');
        } else if (session.role === 'administrativo') {
          window.location.replace('admin.html?u=dire');
        }
      }

      // Elementos del DOM manipulados
      const form = document.getElementById('login-form');
      const input = document.getElementById('username');
      const alertBox = document.getElementById('login-alert-box');

      // Escuchador de envío del formulario
      form.addEventListener('submit', function(e) {
        e.preventDefault(); // Evitamos la recarga completa de la página por el envío HTML tradicional
        
        const usernameVal = input.value;
        // Invocamos la función del módulo auth.js para validar las credenciales ingresadas
        const res = window.SchoolAuth.login(usernameVal);

        if (res.success) {
          // Retroalimentación de Éxito: configuramos la alerta informativa en color verde/azul y mostramos un check icon
          alertBox.className = 'login-alert info';
          alertBox.innerHTML = `
            <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <span>✓ Credenciales validadas. Redirigiendo...</span>
          `;
          alertBox.style.display = 'flex';
          
          // Esperamos un breve instante (800ms) para dar feedback visual y realizamos la redirección
          setTimeout(() => {
            if (res.session.role === 'docente') {
              window.location.replace('docente.html?u=docen');
            } else {
              window.location.replace('admin.html?u=dire');
            }
          }, 800);
        } else {
          // Retroalimentación de Error: configuramos la alerta con colores rojizos y mostramos el mensaje de error
          alertBox.className = 'login-alert error';
          alertBox.innerHTML = `
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>${res.error}</span>
          `;
          alertBox.style.display = 'flex';
        }
      });
    });
  </script>
</body>
</html>
