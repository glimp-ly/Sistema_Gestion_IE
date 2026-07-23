// Modulo reutilizable de cambio de contraseña
(function() {

  function renderChangePasswordForm(container) {
    if (!container) return;

    const csrfToken = document.querySelector('input[name="csrf_token"]');
    const tokenValue = csrfToken ? csrfToken.value : '';

    container.innerHTML = `
      <div class="card card-accent" style="margin-top: 24px;">
        <div class="card-header">
          <h3 class="card-title">
            <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            Cambiar Contraseña
          </h3>
        </div>
        <form id="change-password-form" class="form-layout" style="display: flex; flex-direction: column; gap: 14px;">
          <div class="form-group">
            <label class="form-label-desc">Contraseña Actual</label>
            <input type="password" id="pwd-actual" class="control-input" placeholder="Ingrese su contraseña actual" required>
          </div>
          <div class="form-group">
            <label class="form-label-desc">Nueva Contraseña</label>
            <input type="password" id="pwd-nueva" class="control-input" placeholder="Mínimo 4 caracteres" required>
          </div>
          <div class="form-group">
            <label class="form-label-desc">Confirmar Nueva Contraseña</label>
            <input type="password" id="pwd-confirmar" class="control-input" placeholder="Repita la nueva contraseña" required>
          </div>
          <div id="pwd-alert" style="display:none; padding: 10px; border-radius: 6px; font-size: 14px; text-align: center;"></div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">Actualizar Contraseña</button>
        </form>
      </div>
    `;

    const form = document.getElementById('change-password-form');
    const alertBox = document.getElementById('pwd-alert');

    function showAlert(type, msg) {
      if (type === 'success') {
        alertBox.style.backgroundColor = '#D1FAE5';
        alertBox.style.color = '#065F46';
        alertBox.style.border = '1px solid #A7F3D0';
      } else {
        alertBox.style.backgroundColor = '#FEE2E2';
        alertBox.style.color = '#991B1B';
        alertBox.style.border = '1px solid #FECACA';
      }
      alertBox.textContent = msg;
      alertBox.style.display = 'block';
    }

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      alertBox.style.display = 'none';

      var actual = document.getElementById('pwd-actual').value;
      var nueva = document.getElementById('pwd-nueva').value;
      var confirmar = document.getElementById('pwd-confirmar').value;

      if (!actual || !nueva || !confirmar) {
        showAlert('error', 'Todos los campos son obligatorios.');
        return;
      }
      if (nueva.length < 4) {
        showAlert('error', 'La contraseña debe tener al menos 4 caracteres.');
        return;
      }
      if (nueva !== confirmar) {
        showAlert('error', 'Las contraseñas nuevas no coinciden.');
        return;
      }

      var url = (typeof BASE_URL !== 'undefined' ? BASE_URL : '') + 'auth/cambiarPassword';
      var body = new URLSearchParams();
      body.append('csrf_token', tokenValue);
      body.append('password_actual', actual);
      body.append('password_nueva', nueva);
      body.append('password_confirmar', confirmar);

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        credentials: 'same-origin'
      })
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data.success) {
            showAlert('success', data.mensaje);
            form.reset();
          } else {
            showAlert('error', data.mensaje || 'Error al cambiar la contraseña.');
          }
        })
        .catch(function() {
          showAlert('error', 'Error de conexión con el servidor.');
        });
    });
  }

  window.PasswordModule = {
    renderChangePasswordForm: renderChangePasswordForm
  };

})();
