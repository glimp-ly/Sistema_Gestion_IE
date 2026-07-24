/**
 * Módulo de Administración (AdminModule)
 * 
 * Este archivo actúa como el Controlador de la interfaz del personal administrativo (Director).
 * Funciona bajo una arquitectura de Single Page Application (SPA), donde en lugar de recargar
 * la página completa, se definen funciones JavaScript que renderizan dinámicamente el HTML
 * dentro del elemento contenedor principal (#main-content).
 * 
 * Características clave:
 * 1. Comunicación Local con SchoolDB: Consume y persiste información del estado del colegio.
 * 2. Renderizado Reactivo del DOM: Modifica el DOM mediante plantillas de texto dinámicas (Template Literals).
 * 3. Escuchadores de Eventos: Asigna manejadores a formularios, botones de cambio de estado y modales.
 * 4. Integración de Componentes: Renderiza indicadores clave de rendimiento (KPIs), tablas interactivas y gráficos CSS.
 */
(function() {

  // Función auxiliar para actualizar el título de la página en la barra de navegación superior
  function setPageTitle(title) {
    const el = document.getElementById('navbar-page-title');
    if (el) el.textContent = title;
  }

  function getDocentesApiUrl() {
    return (typeof BASE_URL !== 'undefined' ? BASE_URL : '') + 'public/api/docentes.php';
  }

  function getCursosApiUrl() {
    return (typeof BASE_URL !== 'undefined' ? BASE_URL : '') + 'public/api/cursos.php';
  }

  function getCsrfToken() {
    if (window.currentSession && window.currentSession.csrfToken) {
      return window.currentSession.csrfToken;
    }
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
  }

  function csrfHeaders() {
    return { 'X-CSRF-Token': getCsrfToken() };
  }

  function getIncidenciasApiUrl() {
    return (typeof BASE_URL !== 'undefined' ? BASE_URL : '') + 'public/api/incidencias.php';
  }

  function getMensajesApiUrl() {
    return (typeof BASE_URL !== 'undefined' ? BASE_URL : '') + 'public/api/mensajes.php';
  }

  function getPlantillasApiUrl() {
    return (typeof BASE_URL !== 'undefined' ? BASE_URL : '') + 'public/api/plantillas.php';
  }

  async function updateNotificationBadge() {
    const badge = document.getElementById('navbar-notification-count');
    if (!badge) return;
    try {
      const response = await fetch(`${getMensajesApiUrl()}?action=notifications`, {
        cache: 'no-store',
        credentials: 'same-origin'
      });
      const result = await response.json();
      if (response.ok && result.success) {
        const count = Number(result.data?.no_leidos || 0);
        badge.textContent = count;
        badge.style.display = count > 0 ? '' : 'none';
      }
    } catch (error) {
      console.error('No se pudo actualizar la campana de notificaciones:', error);
    }
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  /* ==========================================================================
     1. INFORMACIÓN PERSONAL
     ========================================================================== */
  function renderInfoPersonal(container) {
    setPageTitle('Información Personal');
    const session = window.SchoolAuth.getSession() || { name: 'Lic. Jose Perez', roleLabel: 'Director Administrativo' };

    container.innerHTML = `
      <div class="card card-accent" style="max-width: 650px; margin: 0 auto;">
        <div class="card-header">
          <h3 class="card-title">
            <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Perfil del Director
          </h3>
        </div>
        <form id="admin-info-form" class="form-layout" style="display: flex; flex-direction: column; gap: 14px;">
          <div class="form-group">
            <label class="form-label-desc">Nombre y Apellidos</label>
            <input type="text" class="control-input" value="${session.name}" disabled>
          </div>
          <div class="form-group">
            <label class="form-label-desc">Cargo Institucional</label>
            <input type="text" class="control-input" value="${session.roleLabel}" disabled>
          </div>
          <div class="form-group">
            <label class="form-label-desc">Correo Electrónico de Dirección</label>
            <input type="email" id="admin-email" class="control-input" value="direccion.corazon@colegio.edu.pe">
          </div>
          <div class="form-group">
            <label class="form-label-desc">Teléfono Celular</label>
            <input type="text" class="control-input" value="999 888 777">
          </div>
          <div class="form-group">
            <label class="form-label-desc">Dirección Residencia</label>
            <input type="text" class="control-input" value="Av. San Martin 120, Magdalena">
          </div>
          <div id="admin-form-alert"></div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">Guardar Datos de Contacto</button>
        </form>
      </div>
      <div id="password-change-section" style="max-width: 650px; margin: 0 auto;"></div>
    `;

    const form = document.getElementById('admin-info-form');
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const alert = document.getElementById('admin-form-alert');
      alert.innerHTML = `<div class="badge badge-success" style="padding: 10px; width: 100%; border-radius: 6px; text-align: center; margin-bottom: 10px;">✓ Datos actualizados correctamente.</div>`;
      setTimeout(() => { alert.innerHTML = ''; }, 3000);
    });

    if (window.PasswordModule) {
      window.PasswordModule.renderChangePasswordForm(document.getElementById('password-change-section'));
    }
  }

  /* ==========================================================================
     2. INCIDENCIAS: GESTIÓN ADMINISTRATIVA CON PERSISTENCIA MYSQL
     ========================================================================== */
  function renderIncidencias(container) {
    setPageTitle('Gestión Global de Incidencias');

    let incidencias = [];

    container.innerHTML = `
      <div class="financial-metrics" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:14px; margin-bottom:20px;">
        <div class="metric-card"><div class="metric-details"><span class="metric-lbl">Total</span><span class="metric-val" id="inc-total">0</span></div></div>
        <div class="metric-card"><div class="metric-details"><span class="metric-lbl">Prioridad alta</span><span class="metric-val" id="inc-alta">0</span></div></div>
        <div class="metric-card"><div class="metric-details"><span class="metric-lbl">Prioridad media</span><span class="metric-val" id="inc-media">0</span></div></div>
        <div class="metric-card"><div class="metric-details"><span class="metric-lbl">Prioridad baja</span><span class="metric-val" id="inc-baja">0</span></div></div>
      </div>

      <div class="card">
        <div class="card-header" style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
          <div>
            <h3 class="card-title">Incidencias enviadas por los docentes</h3>
            <p style="font-size:12.5px; color:var(--neutral-medium); margin-top:4px;">Dirección puede revisar, reclasificar la prioridad o retirar registros incorrectos.</p>
          </div>
          <button type="button" id="admin-inc-refresh" class="btn btn-secondary btn-sm">Actualizar</button>
        </div>

        <div style="display:grid; grid-template-columns:minmax(220px,1fr) 190px; gap:12px; margin-bottom:18px;">
          <input type="search" id="admin-inc-search" class="control-input" placeholder="Buscar por alumno, docente o detalle...">
          <select id="admin-inc-filter" class="control-select">
            <option value="Todas">Todas las prioridades</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>
        </div>

        <div id="admin-inc-alert" style="display:none; padding:10px; border-radius:6px; text-align:center; margin-bottom:14px;"></div>

        <div class="table-responsive">
          <table class="school-table">
            <thead>
              <tr>
                <th style="width:65px;">ID</th>
                <th style="width:105px;">Fecha</th>
                <th style="width:175px;">Alumno</th>
                <th style="width:165px;">Reportado por</th>
                <th>Detalle</th>
                <th style="width:130px;">Prioridad</th>
                <th style="width:95px; text-align:center;">Acción</th>
              </tr>
            </thead>
            <tbody id="admin-inc-tbody">
              <tr><td colspan="7" style="text-align:center;">Cargando incidencias...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    const tbody = document.getElementById('admin-inc-tbody');
    const searchInput = document.getElementById('admin-inc-search');
    const priorityFilter = document.getElementById('admin-inc-filter');
    const refreshBtn = document.getElementById('admin-inc-refresh');
    const alertBox = document.getElementById('admin-inc-alert');

    function updateCounters() {
      document.getElementById('inc-total').textContent = incidencias.length;
      document.getElementById('inc-alta').textContent = incidencias.filter(i => i.prioridad === 'Alta').length;
      document.getElementById('inc-media').textContent = incidencias.filter(i => i.prioridad === 'Media').length;
      document.getElementById('inc-baja').textContent = incidencias.filter(i => i.prioridad === 'Baja').length;
    }

    function filteredIncidents() {
      const term = searchInput.value.trim().toLowerCase();
      const priority = priorityFilter.value;

      return incidencias.filter(inc => {
        const matchesPriority = priority === 'Todas' || inc.prioridad === priority;
        const haystack = `${inc.alumno} ${inc.docente} ${inc.texto} ${inc.grado}`.toLowerCase();
        return matchesPriority && (!term || haystack.includes(term));
      });
    }

    function renderRows() {
      const rows = filteredIncidents();
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--neutral-medium);">No se encontraron incidencias.</td></tr>';
        return;
      }

      tbody.innerHTML = rows.map(inc => `
        <tr>
          <td style="font-weight:600;">${escapeHtml(inc.id_incidencia)}</td>
          <td>${escapeHtml(inc.fecha)}</td>
          <td>
            <strong>${escapeHtml(inc.alumno)}</strong>
            <div style="font-size:11.5px; color:var(--neutral-medium);">${escapeHtml(inc.grado)}</div>
          </td>
          <td>${escapeHtml(inc.docente)}</td>
          <td style="white-space:normal; line-height:1.45;">${escapeHtml(inc.texto)}</td>
          <td>
            <select class="control-select incident-priority-select" data-id="${escapeHtml(inc.id_incidencia)}" style="padding:5px 8px; font-size:12px; font-weight:600;">
              <option value="Alta" ${inc.prioridad === 'Alta' ? 'selected' : ''}>Alta</option>
              <option value="Media" ${inc.prioridad === 'Media' ? 'selected' : ''}>Media</option>
              <option value="Baja" ${inc.prioridad === 'Baja' ? 'selected' : ''}>Baja</option>
            </select>
          </td>
          <td style="text-align:center;">
            <button type="button" class="btn btn-secondary btn-sm incident-delete-btn" style="border-color:#dc2626; color:#dc2626;" data-id="${escapeHtml(inc.id_incidencia)}" title="Eliminar incidencia">Eliminar</button>
          </td>
        </tr>
      `).join('');
    }

    function showAlert(message, success) {
      alertBox.className = `badge ${success ? 'badge-success' : 'badge-danger'}`;
      alertBox.textContent = message;
      alertBox.style.display = 'block';
      window.setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
    }

    async function fetchJson(url, options = {}) {
      const response = await fetch(url, {
        cache: 'no-store',
        credentials: 'same-origin',
        ...options
      });
      const result = await response.json().catch(() => ({ success: false, message: 'Respuesta inválida del servidor.' }));
      if (!response.ok || !result.success) {
        throw new Error(result.message || `Error HTTP ${response.status}`);
      }
      return result;
    }

    async function loadIncidents() {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Cargando incidencias...</td></tr>';
      const result = await fetchJson(getIncidenciasApiUrl());
      incidencias = Array.isArray(result.data) ? result.data : [];
      updateCounters();
      renderRows();
    }

    searchInput.addEventListener('input', renderRows);
    priorityFilter.addEventListener('change', renderRows);

    refreshBtn.addEventListener('click', async function() {
      refreshBtn.disabled = true;
      try {
        await loadIncidents();
      } catch (error) {
        showAlert(error.message, false);
      } finally {
        refreshBtn.disabled = false;
      }
    });

    tbody.addEventListener('change', async function(e) {
      const select = e.target.closest('.incident-priority-select');
      if (!select) return;

      const previous = incidencias.find(item => String(item.id_incidencia) === String(select.dataset.id));
      const previousPriority = previous ? previous.prioridad : 'Media';
      select.disabled = true;

      try {
        const result = await fetchJson(getIncidenciasApiUrl(), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken()
          },
          body: JSON.stringify({
            id_incidencia: Number(select.dataset.id),
            prioridad: select.value
          })
        });

        if (previous && result.data) {
          previous.prioridad = result.data.prioridad;
        }
        updateCounters();
        renderRows();
        showAlert('✓ Prioridad actualizada correctamente.', true);
      } catch (error) {
        select.value = previousPriority;
        showAlert(error.message, false);
      } finally {
        select.disabled = false;
      }
    });

    tbody.addEventListener('click', async function(e) {
      const button = e.target.closest('.incident-delete-btn');
      if (!button) return;

      const id = Number(button.dataset.id);
      const record = incidencias.find(item => Number(item.id_incidencia) === id);
      const label = record ? ` de ${record.alumno}` : '';
      if (!window.confirm(`¿Eliminar la incidencia${label}? Esta acción no se puede deshacer.`)) return;

      button.disabled = true;
      try {
        await fetchJson(getIncidenciasApiUrl(), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken()
          },
          body: JSON.stringify({ id_incidencia: id })
        });

        incidencias = incidencias.filter(item => Number(item.id_incidencia) !== id);
        updateCounters();
        renderRows();
        showAlert('✓ Incidencia eliminada correctamente.', true);
      } catch (error) {
        button.disabled = false;
        showAlert(error.message, false);
      }
    });

    loadIncidents().catch(error => {
      showAlert(error.message, false);
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--danger);">No se pudo cargar el módulo.</td></tr>';
    });
  }

  /* ==========================================================================
     3. DOCENTES: REPORTE & ACCIÓN PARA CALIFICAR
     ========================================================================== */
  function renderDocentes(container) {
    setPageTitle('Gestión de Docentes');

    container.innerHTML = `
      <div class="dashboard-grid" style="grid-template-columns: 1fr 1.6fr;">
        <!-- Rating panel -->
        <div class="card card-accent">
          <div class="card-header">
            <h3 class="card-title">Calificar Desempeño Docente</h3>
          </div>
          <form id="rate-teacher-form" class="form-layout" style="display: flex; flex-direction: column; gap: 16px;">
            <div class="form-group">
              <label class="form-label-desc">Docente</label>
              <select id="rate-teacher-id" class="control-select" required>
                <option value="" disabled selected>-- Cargando docentes... --</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label-desc">Calificación (Escala 1 - 5)</label>
              <div style="display: flex; gap: 12px; align-items: center;">
                <input type="range" id="rate-val" min="1" max="5" step="0.1" class="range-slider" value="5" style="flex-grow:1;">
                <span id="rate-val-lbl" style="font-weight: 700; color: var(--primary-orange); font-size:16px;">5.0 ★</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label-desc">Retroalimentación / Comentarios</label>
              <textarea id="rate-comment" class="control-textarea" placeholder="Escriba comentarios sobre el desempeño académico..." required></textarea>
            </div>
            <div id="rate-alert" class="badge badge-success" style="display:none; text-align: center; width: 100%;">✓ Calificación registrada.</div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Registrar Calificación</button>
          </form>
        </div>

        <!-- Teacher list -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Reporte de Desempeño Docente</h3>
          </div>
          <div class="table-responsive">
            <table class="school-table">
              <thead>
                <tr>
                  <th style="width: 80px;">Código</th>
                  <th style="width: 180px;">Nombre Docente</th>
                  <th style="width: 180px;">Cursos a Cargo</th>
                  <th>Correo</th>
                  <th style="width: 90px; text-align: center;">Calificación</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody id="teacher-list-tbody">
                <tr><td colspan="6">Cargando docentes...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const slider = document.getElementById('rate-val');
    const label = document.getElementById('rate-val-lbl');
    const selectDocente = document.getElementById('rate-teacher-id');
    const form = document.getElementById('rate-teacher-form');
    const tableBody = document.getElementById('teacher-list-tbody');
    const alertBox = document.getElementById('rate-alert');

    slider.addEventListener('input', function() {
      label.textContent = `${parseFloat(this.value).toFixed(1)} ★`;
    });

    function loadDocentesReport() {
      fetch(getDocentesApiUrl(), {
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin'
      })
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then(result => {
          if (!result.success || !Array.isArray(result.data) || result.data.length === 0) {
            selectDocente.innerHTML = '<option value="" disabled selected>-- No hay docentes registrados --</option>';
            tableBody.innerHTML = '<tr><td colspan="6">No se encontraron docentes registrados en la base de datos.</td></tr>';
            return;
          }

          const currentSelectVal = selectDocente.value;
          selectDocente.innerHTML = '<option value="" disabled selected>-- Seleccione Docente --</option>';

          let rowsHtml = '';
          result.data.forEach(t => {
            selectDocente.innerHTML += `<option value="${t.id_docente}">${t.nombre_completo} (${t.cod_docente})</option>`;

            const ratingVal = t.calificacion ? parseFloat(t.calificacion).toFixed(1) : '5.0';
            const cursos = t.cursos_a_cargo || 'Sin asignación';
            const correo = t.email || t.direccion || '-';
            const obs = t.observaciones || 'Sin comentarios.';

            rowsHtml += `
              <tr>
                <td style="font-weight: 600;">${t.cod_docente}</td>
                <td><strong>${t.nombre_completo}</strong></td>
                <td>${cursos}</td>
                <td>${correo}</td>
                <td style="text-align: center; font-weight: 700; color: var(--primary-orange);">${ratingVal} ★</td>
                <td><em style="font-size: 12.5px; color: var(--neutral-medium);">${obs}</em></td>
              </tr>
            `;
          });

          if (currentSelectVal) {
            selectDocente.value = currentSelectVal;
          }

          tableBody.innerHTML = rowsHtml;
        })
        .catch(err => {
          console.error('Error cargando reporte de docentes:', err);
          selectDocente.innerHTML = '<option value="" disabled selected>-- Error al cargar --</option>';
          tableBody.innerHTML = '<tr><td colspan="6">Error de conexión al cargar los docentes.</td></tr>';
        });
    }

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const teacherId = selectDocente.value;
      const rate = slider.value;
      const comment = document.getElementById('rate-comment').value.trim();

      if (!teacherId) {
        alertBox.textContent = 'Seleccione un docente.';
        alertBox.className = 'badge badge-warning';
        alertBox.style.display = 'block';
        return;
      }

      fetch(getDocentesApiUrl(), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify({
          action: 'rate',
          id_docente: teacherId,
          calificacion: rate,
          observaciones: comment
        }),
        cache: 'no-store',
        credentials: 'same-origin'
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(resData => {
          if (!resData || !resData.success) {
            alertBox.textContent = resData?.message || 'No fue posible guardar la calificación.';
            alertBox.className = 'badge badge-warning';
            alertBox.style.display = 'block';
            return;
          }

          form.reset();
          label.textContent = '5.0 ★';
          alertBox.textContent = '✓ Calificación registrada en base de datos.';
          alertBox.className = 'badge badge-success';
          alertBox.style.display = 'block';
          loadDocentesReport();
          setTimeout(() => { alertBox.style.display = 'none'; }, 3000);
        })
        .catch(error => {
          console.error('Error al guardar calificación:', error);
          alertBox.textContent = 'Error de conexión al registrar la calificación.';
          alertBox.className = 'badge badge-warning';
          alertBox.style.display = 'block';
        });
    });

    loadDocentesReport();
  }

  /* ==========================================================================
     4. AÑADIR DOCENTES: FORMULARIO Y REGISTRO EN BD
     ========================================================================== */
  function renderAddDocentes(container) {
    setPageTitle('Añadir Docentes');

    container.innerHTML = `
      <div class="card card-accent" style="max-width: 900px; margin: 0 auto;">
        <div class="card-header">
          <h3 class="card-title">Registrar Nuevo Docente</h3>
        </div>
        <form id="add-docente-form" class="form-layout" style="display: flex; flex-direction: column; gap: 20px;">
          
          <h4 style="margin-bottom: 4px; font-size: 1.05rem; color: var(--primary-color, #2563eb); border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">1. Datos de Persona Natural</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
            <div class="form-group">
              <label class="form-label-desc">DNI / Documento</label>
              <input type="text" id="docente-dni" class="control-input" placeholder="Ej. 74859612" maxlength="15" required>
            </div>
            <div class="form-group">
              <label class="form-label-desc">Nombres</label>
              <input type="text" id="docente-nombre" class="control-input" placeholder="Ej. María Elena" required>
            </div>
            <div class="form-group">
              <label class="form-label-desc">Apellido Paterno</label>
              <input type="text" id="docente-ap-paterno" class="control-input" placeholder="Ej. Pérez" required>
            </div>
            <div class="form-group">
              <label class="form-label-desc">Apellido Materno</label>
              <input type="text" id="docente-ap-materno" class="control-input" placeholder="Ej. López" required>
            </div>
            <div class="form-group">
              <label class="form-label-desc">Fecha de Nacimiento</label>
              <input type="date" id="docente-fechana" class="control-input" required>
            </div>
            <div class="form-group">
              <label class="form-label-desc">Correo Electrónico (Dirección)</label>
              <input type="email" id="docente-direccion" class="control-input" placeholder="Ej. maria.perez@colegio.edu.pe" required>
            </div>
          </div>

          <h4 style="margin-top: 8px; margin-bottom: 4px; font-size: 1.05rem; color: var(--primary-color, #2563eb); border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">2. Datos del Docente</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
            <div class="form-group">
              <label class="form-label-desc">Tipo de contrato</label>
              <select id="docente-contrato" class="control-select" required>
                <option value="">-- Seleccione --</option>
                <option value="Nombrado">Nombrado</option>
                <option value="Contratado">Contratado</option>
                <option value="Temporal">Temporal</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label-desc">Grado académico</label>
              <input type="text" id="docente-grado" class="control-input" placeholder="Ej. Magíster en Educación" required>
            </div>
            <div class="form-group">
              <label class="form-label-desc">Especialidad</label>
              <input type="text" id="docente-especialidad" class="control-input" placeholder="Ej. Matemática" required>
            </div>
            <div class="form-group">
              <label class="form-label-desc">Estado</label>
              <select id="docente-estado" class="control-select">
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>

          <div id="docente-alert" class="badge badge-success" style="display:none; width:100%; text-align:center;">✓ Docente registrado correctamente.</div>
          <button type="submit" class="btn btn-primary" style="width:100%; margin-top: 8px;">Guardar Docente</button>
        </form>
      </div>

      <div class="card" style="margin-top: 24px;">
        <div class="card-header">
          <h3 class="card-title">Docentes registrados</h3>
          <button type="button" class="btn btn-secondary btn-sm" id="show-teacher-credentials">Credenciales</button>
        </div>
        <div class="table-responsive">
          <table class="school-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>DNI</th>
                <th>Nombre Completo</th>
                <th>Correo Electrónico</th>
                <th>Contrato</th>
                <th>Grado</th>
                <th>Especialidad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody id="docentes-registrados-tbody"></tbody>
          </table>
        </div>
      </div>

      <div class="card" id="teacher-credentials-card" style="margin-top: 16px; display: none;">
        <div class="card-header">
          <h3 class="card-title">Credenciales de docentes</h3>
          <span class="badge badge-warning">Contraseña inicial = usuario</span>
        </div>
        <div class="table-responsive">
          <table class="school-table">
            <thead><tr><th>Código</th><th>Docente</th><th>Usuario</th><th>Contraseña inicial</th><th>Rol</th></tr></thead>
            <tbody id="teacher-credentials-tbody"></tbody>
          </table>
        </div>
      </div>
    `;

    const form = document.getElementById('add-docente-form');
    const alertBox = document.getElementById('docente-alert');
    const tbody = document.getElementById('docentes-registrados-tbody');
    const credentialsButton = document.getElementById('show-teacher-credentials');
    const credentialsCard = document.getElementById('teacher-credentials-card');
    const credentialsTbody = document.getElementById('teacher-credentials-tbody');

    function renderRegisteredTeachers() {
      fetch(getDocentesApiUrl(), {
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin'
      })
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then(result => {
          if (!result.success) {
            tbody.innerHTML = `<tr><td colspan="8">${result.message}</td></tr>`;
            return;
          }

          tbody.innerHTML = '';
          result.data.forEach(teacher => {
            tbody.innerHTML += `
              <tr>
                <td style="font-weight: 600;">${teacher.cod_docente}</td>
                <td>${teacher.dni || '-'}</td>
                <td>${teacher.nombre_completo}</td>
                <td>${teacher.email || teacher.direccion || '-'}</td>
                <td>${teacher.tipo_contrato}</td>
                <td>${teacher.grado_academico}</td>
                <td>${teacher.especialidad}</td>
                <td>
                  <button class="btn btn-sm ${teacher.es_activo ? 'btn-primary' : 'btn-secondary'}" data-id="${teacher.id_docente}" data-active="${teacher.es_activo}" data-action="toggle-status">
                    ${teacher.es_activo ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
              </tr>
            `;
          });
        })
        .catch(() => {
          tbody.innerHTML = `<tr><td colspan="8">No fue posible cargar los docentes.</td></tr>`;
        });
    }

    function renderTeacherCredentials() {
      credentialsTbody.innerHTML = '<tr><td colspan="5">Cargando credenciales...</td></tr>';
      fetch(`${getDocentesApiUrl()}?action=credentials`, { cache: 'no-store', credentials: 'same-origin' })
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then(result => {
          if (!result.success || !result.data.length) {
            credentialsTbody.innerHTML = '<tr><td colspan="5">No hay credenciales de docentes registradas.</td></tr>';
            return;
          }
          credentialsTbody.innerHTML = result.data.map(credential => `
            <tr>
              <td style="font-weight:600;">${credential.cod_docente}</td>
              <td>${credential.nombre_completo}</td>
              <td>${credential.username}</td>
              <td>${credential.password_temporal}</td>
              <td>${credential.rol}</td>
            </tr>
          `).join('');
        })
        .catch(() => { credentialsTbody.innerHTML = '<tr><td colspan="5">No fue posible cargar las credenciales.</td></tr>'; });
    }

    credentialsButton.addEventListener('click', function() {
      const willShow = credentialsCard.style.display === 'none';
      credentialsCard.style.display = willShow ? 'block' : 'none';
      credentialsButton.textContent = willShow ? 'Ocultar credenciales' : 'Credenciales';
      if (willShow) renderTeacherCredentials();
    });

    tbody.addEventListener('click', function(e) {
      const btn = e.target.closest('[data-action="toggle-status"]');
      if (!btn) return;

      const idDocente = btn.getAttribute('data-id');
      const currentState = btn.getAttribute('data-active') === '1';
      fetch(getDocentesApiUrl(), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify({ id_docente: idDocente, es_activo: !currentState }),
        cache: 'no-store',
        credentials: 'same-origin'
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(() => renderRegisteredTeachers())
        .catch(() => {});
    });

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const payload = {
        dni: document.getElementById('docente-dni').value.trim(),
        nombre: document.getElementById('docente-nombre').value.trim(),
        ap_paterno: document.getElementById('docente-ap-paterno').value.trim(),
        ap_materno: document.getElementById('docente-ap-materno').value.trim(),
        fechaNa: document.getElementById('docente-fechana').value,
        direccion: document.getElementById('docente-direccion').value.trim(),
        tipo_contrato: document.getElementById('docente-contrato').value,
        grado_academico: document.getElementById('docente-grado').value.trim(),
        especialidad: document.getElementById('docente-especialidad').value.trim(),
        es_activo: document.getElementById('docente-estado').value === 'true'
      };

      const formData = new URLSearchParams();
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, value === true ? '1' : value === false ? '0' : String(value));
      });

      fetch(getDocentesApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...csrfHeaders()
        },
        body: formData.toString(),
        cache: 'no-store',
        credentials: 'same-origin'
      })
        .then(async response => {
          const rawText = await response.text();
          let result = null;
          try {
            result = rawText ? JSON.parse(rawText) : null;
          } catch (parseError) {
            console.error('Respuesta inválida del API', parseError, rawText);
            throw new Error(rawText || `HTTP ${response.status}`);
          }

          if (!response.ok) {
            throw new Error(result?.message || `HTTP ${response.status}`);
          }

          return result;
        })
        .then(result => {
          if (!result || !result.success) {
            alertBox.textContent = result?.message || 'No fue posible guardar el docente.';
            alertBox.className = 'badge badge-warning';
            alertBox.style.display = 'block';
            return;
          }

          form.reset();
          alertBox.textContent = '✓ Docente registrado correctamente.';
          alertBox.className = 'badge badge-success';
          alertBox.style.display = 'block';
          renderRegisteredTeachers();
          if (credentialsCard.style.display !== 'none') renderTeacherCredentials();
          setTimeout(() => { alertBox.style.display = 'none'; }, 3000);
        })
        .catch(error => {
          console.error('Error guardando docente', error);
          alertBox.textContent = error?.message || 'No fue posible guardar el docente.';
          alertBox.className = 'badge badge-warning';
          alertBox.style.display = 'block';
        });
    });

    renderRegisteredTeachers();
  }

  /* ==========================================================================
     5. GESTIÓN DE CURSOS: CREAR CURSO Y ASIGNAR DOCENTE
     ========================================================================== */
  function renderCursos(container) {
    setPageTitle('Gestión de Cursos');

    container.innerHTML = `
      <div class="card card-accent" style="max-width: 1180px; margin: 0 auto;">
        <div class="card-header">
          <h3 class="card-title">Gestión de cursos y asignaciones</h3>
        </div>

        <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr; gap: 20px; align-items: start;">
          <div class="card" style="border: 1px solid var(--neutral-light);">
            <div class="card-header">
              <h3 class="card-title">Crear curso</h3>
            </div>
            <form id="curso-form" class="form-layout" style="display: flex; flex-direction: column; gap: 16px;">
              <div class="form-group">
                <label class="form-label-desc">Nombre del curso</label>
                <input type="text" id="curso-nombre" class="control-input" placeholder="Ej. Matemática" required>
              </div>
              <div class="form-group">
                <label class="form-label-desc">Descripción</label>
                <textarea id="curso-descripcion" class="control-textarea" placeholder="Descripción breve del curso" required></textarea>
              </div>
              <div class="dashboard-grid" style="grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;">
                <div class="form-group">
                  <label class="form-label-desc">Grado</label>
                  <select id="curso-grado" class="control-select"></select>
                </div>
                <div class="form-group">
                  <label class="form-label-desc">Año</label>
                  <input type="number" id="curso-anio" class="control-input" min="2020" max="2100" value="${new Date().getFullYear()}">
                </div>
              </div>
              <div id="curso-alert" class="badge badge-success" style="display:none; width:100%; text-align:center;">✓ Curso registrado correctamente.</div>
              <button type="submit" class="btn btn-primary" style="width:100%;">Guardar curso</button>
            </form>
          </div>

          <div class="card" style="border: 1px solid var(--neutral-light);">
            <div class="card-header">
              <h3 class="card-title">Asignar curso existente</h3>
            </div>
            <form id="asignacion-form" class="form-layout" style="display: flex; flex-direction: column; gap: 16px;">
              <div class="form-group">
                <label class="form-label-desc">Curso existente</label>
                <select id="asignacion-curso" class="control-select" required></select>
              </div>
              <div class="form-group">
                <label class="form-label-desc">Docente</label>
                <select id="asignacion-docente" class="control-select" required></select>
              </div>
              <div class="form-group">
                <label class="form-label-desc">Día / horario</label>
                <input type="text" id="asignacion-dia" class="control-input" placeholder="Lunes - Miércoles" required>
              </div>
              <div class="dashboard-grid" style="grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;">
                <div class="form-group">
                  <label class="form-label-desc">Hora inicio</label>
                  <input type="time" id="asignacion-hora-inicio" class="control-input" required>
                </div>
                <div class="form-group">
                  <label class="form-label-desc">Hora fin</label>
                  <input type="time" id="asignacion-hora-fin" class="control-input" required>
                </div>
              </div>
              <div class="dashboard-grid" style="grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;">
                <div class="form-group">
                  <label class="form-label-desc">Fecha de asignación</label>
                  <input type="date" id="asignacion-fecha" class="control-input" required>
                </div>
                <div class="form-group">
                  <label class="form-label-desc">Fecha de fin</label>
                  <input type="date" id="asignacion-fecha-fin" class="control-input">
                </div>
              </div>
              <div id="asignacion-alert" class="badge badge-success" style="display:none; width:100%; text-align:center;">✓ Asignación registrada correctamente.</div>
              <button type="submit" class="btn btn-secondary" style="width:100%;">Guardar asignación</button>
            </form>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top: 24px;">
        <div class="card-header">
          <h3 class="card-title">Cursos y docentes asignados</h3>
        </div>
        <div class="table-responsive">
          <table class="school-table">
            <thead>
              <tr>
                <th>Curso</th>
                <th>Grado</th>
                <th>Docente</th>
                <th>Día / horario</th>
                <th>Fecha inicio</th>
                <th>Fecha fin</th>
              </tr>
            </thead>
            <tbody id="cursos-registrados-tbody"></tbody>
          </table>
        </div>
      </div>
    `;

    const cursoForm = document.getElementById('curso-form');
    const asignacionForm = document.getElementById('asignacion-form');
    const cursoAlert = document.getElementById('curso-alert');
    const asignacionAlert = document.getElementById('asignacion-alert');
    const tbody = document.getElementById('cursos-registrados-tbody');
    const gradoSelect = document.getElementById('curso-grado');
    const cursoSelect = document.getElementById('asignacion-curso');
    const docenteSelect = document.getElementById('asignacion-docente');
    const fechaInput = document.getElementById('asignacion-fecha');
    const fechaFinInput = document.getElementById('asignacion-fecha-fin');

    if (fechaInput) {
      fechaInput.value = new Date().toISOString().slice(0, 10);
    }

    function renderReferenceOptions(data) {
      gradoSelect.innerHTML = '<option value="0">Crear grado predeterminado</option>';
      data.grades.forEach(grado => {
        const label = `${grado.nombre} ${grado.seccion} · ${grado.turno || 'Sin turno'}`;
        gradoSelect.innerHTML += `<option value="${grado.id_grado}">${label}</option>`;
      });

      cursoSelect.innerHTML = '<option value="">-- Seleccione un curso --</option>';
      data.courses.forEach(curso => {
        cursoSelect.innerHTML += `<option value="${curso.id_curso}">${curso.nombre}</option>`;
      });

      docenteSelect.innerHTML = '<option value="">-- Seleccione un docente --</option>';
      data.teachers.forEach(docente => {
        docenteSelect.innerHTML += `<option value="${docente.id_docente}">${docente.nombre_completo} (${docente.cod_docente})</option>`;
      });
    }

    function renderAssignments(data) {
      tbody.innerHTML = '';
      if (!data.assignments || data.assignments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No hay asignaciones registradas aún.</td></tr>';
        return;
      }

      data.assignments.forEach(item => {
        tbody.innerHTML += `
          <tr>
            <td>${item.nombre_curso}</td>
            <td>${item.nombre_grado} ${item.seccion}</td>
            <td>${item.nombre_completo} (${item.cod_docente})</td>
            <td>${item.dia_horario} · ${item.hora_inicio.slice(0, 5)} - ${item.hora_fin.slice(0, 5)}</td>
            <td>${item.fecha_asignacion}</td>
            <td>${item.fecha_finAsig || '—'}</td>
          </tr>
        `;
      });
    }

    function loadData() {
      fetch(getCursosApiUrl(), {
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin'
      })
        .then(response => response.json())
        .then(result => {
          if (!result.success) {
            throw new Error(result.message || 'No se pudieron cargar los datos');
          }
          renderReferenceOptions(result.data);
          renderAssignments(result.data);
        })
        .catch(() => {
          gradoSelect.innerHTML = '<option value="">No hay grados disponibles</option>';
          cursoSelect.innerHTML = '<option value="">No hay cursos disponibles</option>';
          docenteSelect.innerHTML = '<option value="">No hay docentes disponibles</option>';
          tbody.innerHTML = '<tr><td colspan="6">No fue posible cargar la información.</td></tr>';
        });
    }

    cursoForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const payload = {
        action: 'create-course',
        nombre: document.getElementById('curso-nombre').value.trim(),
        descripcion: document.getElementById('curso-descripcion').value.trim(),
        id_grado: document.getElementById('curso-grado').value,
        anio: document.getElementById('curso-anio').value
      };

      fetch(getCursosApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...csrfHeaders()
        },
        body: new URLSearchParams(payload).toString(),
        cache: 'no-store',
        credentials: 'same-origin'
      })
        .then(async response => {
          const rawText = await response.text();
          let result = null;
          try {
            result = rawText ? JSON.parse(rawText) : null;
          } catch (parseError) {
            throw new Error(rawText || `HTTP ${response.status}`);
          }

          if (!response.ok) {
            throw new Error(result?.message || `HTTP ${response.status}`);
          }
          return result;
        })
        .then(result => {
          if (!result || !result.success) {
            cursoAlert.textContent = result?.message || 'No fue posible guardar el curso.';
            cursoAlert.className = 'badge badge-warning';
            cursoAlert.style.display = 'block';
            return;
          }

          cursoForm.reset();
          cursoAlert.textContent = '✓ Curso registrado correctamente.';
          cursoAlert.className = 'badge badge-success';
          cursoAlert.style.display = 'block';
          loadData();
          setTimeout(() => { cursoAlert.style.display = 'none'; }, 3000);
        })
        .catch(error => {
          cursoAlert.textContent = error?.message || 'No fue posible guardar el curso.';
          cursoAlert.className = 'badge badge-warning';
          cursoAlert.style.display = 'block';
        });
    });

    asignacionForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const payload = {
        action: 'assign-course',
        id_curso: document.getElementById('asignacion-curso').value,
        id_docente: document.getElementById('asignacion-docente').value,
        dia_horario: document.getElementById('asignacion-dia').value.trim(),
        hora_inicio: document.getElementById('asignacion-hora-inicio').value,
        hora_fin: document.getElementById('asignacion-hora-fin').value,
        fecha_asignacion: document.getElementById('asignacion-fecha').value,
        fecha_finAsig: document.getElementById('asignacion-fecha-fin').value
      };

      fetch(getCursosApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...csrfHeaders()
        },
        body: new URLSearchParams(payload).toString(),
        cache: 'no-store',
        credentials: 'same-origin'
      })
        .then(async response => {
          const rawText = await response.text();
          let result = null;
          try {
            result = rawText ? JSON.parse(rawText) : null;
          } catch (parseError) {
            throw new Error(rawText || `HTTP ${response.status}`);
          }

          if (!response.ok) {
            throw new Error(result?.message || `HTTP ${response.status}`);
          }
          return result;
        })
        .then(result => {
          if (!result || !result.success) {
            asignacionAlert.textContent = result?.message || 'No fue posible guardar la asignación.';
            asignacionAlert.className = 'badge badge-warning';
            asignacionAlert.style.display = 'block';
            return;
          }

          asignacionForm.reset();
          if (fechaInput) fechaInput.value = new Date().toISOString().slice(0, 10);
          if (fechaFinInput) fechaFinInput.value = '';
          asignacionAlert.textContent = '✓ Asignación registrada correctamente.';
          asignacionAlert.className = 'badge badge-success';
          asignacionAlert.style.display = 'block';
          loadData();
          setTimeout(() => { asignacionAlert.style.display = 'none'; }, 3000);
        })
        .catch(error => {
          asignacionAlert.textContent = error?.message || 'No fue posible guardar la asignación.';
          asignacionAlert.className = 'badge badge-warning';
          asignacionAlert.style.display = 'block';
        });
    });

    loadData();
  }

  /* ==========================================================================
     6. MENSAJERÍA / NOTIFICACIONES (ADMINISTRACIÓN)
     ========================================================================== */
  function renderMensajeria(container) {
    setPageTitle('Mensajería y Comunicados');

    let contactos = [];
    let contactoActivo = null;

    container.innerHTML = `
      <div class="tabs-container">
        <button class="tab-btn active" id="msg-tab-docentes">Mensajes con Docentes</button>
        <button class="tab-btn" id="msg-tab-ugel">Comunicaciones UGEL</button>
      </div>
      <div id="msg-alert" style="display:none; padding:10px; border-radius:6px; text-align:center; margin-bottom:14px;"></div>
      <div id="msg-subview-container"><div class="card" style="text-align:center;">Cargando mensajería...</div></div>
    `;

    const btnDocentes = document.getElementById('msg-tab-docentes');
    const btnUgel = document.getElementById('msg-tab-ugel');
    const sub = document.getElementById('msg-subview-container');
    const alertBox = document.getElementById('msg-alert');

    function showAlert(message, success) {
      alertBox.className = `badge ${success ? 'badge-success' : 'badge-danger'}`;
      alertBox.textContent = message;
      alertBox.style.display = 'block';
      window.setTimeout(() => { alertBox.style.display = 'none'; }, 3500);
    }

    async function fetchJson(url, options = {}) {
      const response = await fetch(url, {
        cache: 'no-store',
        credentials: 'same-origin',
        ...options
      });
      const result = await response.json().catch(() => ({ success: false, message: 'Respuesta inválida del servidor.' }));
      if (!response.ok || !result.success) {
        throw new Error(result.message || `Error HTTP ${response.status}`);
      }
      return result;
    }

    function initials(name) {
      return String(name || 'D')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join('');
    }

    function renderContacts() {
      const list = document.getElementById('admin-msg-contact-list');
      if (!list) return;

      if (!contactos.length) {
        list.innerHTML = '<li style="padding:18px; color:var(--neutral-medium); font-size:13px;">No hay docentes activos.</li>';
        return;
      }

      list.innerHTML = contactos.map(contacto => `
        <li class="contact-item ${contactoActivo?.username === contacto.username ? 'active' : ''}" data-username="${escapeHtml(contacto.username)}">
          <div class="contact-avatar">${escapeHtml(initials(contacto.nombre_completo))}</div>
          <div class="contact-details" style="min-width:0; flex:1;">
            <div class="contact-name">${escapeHtml(contacto.nombre_completo)}</div>
            <div class="contact-status">${escapeHtml(contacto.especialidad || contacto.cod_docente || 'Docente')}</div>
          </div>
          ${Number(contacto.no_leidos || 0) > 0 ? `<span class="badge badge-danger">${escapeHtml(contacto.no_leidos)}</span>` : ''}
        </li>
      `).join('');
    }

    function renderConversationShell() {
      sub.innerHTML = `
        <div class="chat-container">
          <div class="chat-contacts-panel">
            <div class="chat-contacts-header">Docentes Activos</div>
            <ul class="contacts-list" id="admin-msg-contact-list"></ul>
          </div>
          <div class="chat-messages-panel">
            <div class="chat-panel-header" id="admin-msg-header">
              <span style="font-weight:700; font-size:14px; color:var(--primary-dark);">Seleccione un docente</span>
            </div>
            <div class="messages-scroller" id="admin-chat-scroller">
              <div style="padding:28px; text-align:center; color:var(--neutral-medium);">Seleccione un contacto para abrir la conversación.</div>
            </div>
            <div class="chat-input-panel">
              <input type="text" id="admin-chat-input" class="chat-text-input" maxlength="2000" placeholder="Escriba un mensaje..." disabled>
              <button class="btn btn-primary" id="admin-chat-send-btn" disabled>Enviar</button>
            </div>
          </div>
        </div>
      `;
      renderContacts();

      document.getElementById('admin-msg-contact-list').addEventListener('click', async function(e) {
        const item = e.target.closest('.contact-item');
        if (!item) return;
        const contacto = contactos.find(c => c.username === item.dataset.username);
        if (!contacto) return;
        contactoActivo = contacto;
        renderContacts();
        try {
          await loadConversation(contacto.username);
        } catch (error) {
          showAlert(error.message, false);
          const scroller = document.getElementById('admin-chat-scroller');
          if (scroller) {
            scroller.innerHTML = '<div style="padding:28px; text-align:center; color:var(--danger);">No se pudo cargar la conversación.</div>';
          }
        }
      });

      const input = document.getElementById('admin-chat-input');
      const sendBtn = document.getElementById('admin-chat-send-btn');
      sendBtn.addEventListener('click', sendMessage);
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    function renderMessages(messages, contacto) {
      const scroller = document.getElementById('admin-chat-scroller');
      const header = document.getElementById('admin-msg-header');
      const input = document.getElementById('admin-chat-input');
      const sendBtn = document.getElementById('admin-chat-send-btn');
      if (!scroller || !header || !input || !sendBtn) return;

      header.innerHTML = `
        <div class="chat-active-user">
          <div class="contact-avatar" style="width:32px; height:32px; font-size:12px;">${escapeHtml(initials(contacto.nombre_completo))}</div>
          <div>
            <div style="font-weight:700; font-size:14px; color:var(--primary-dark);">${escapeHtml(contacto.nombre_completo)}</div>
            <div style="font-size:11.5px; color:var(--neutral-medium);">${escapeHtml(contacto.especialidad || contacto.cod_docente || 'Docente')}</div>
          </div>
        </div>
        <span class="badge badge-success">Activo</span>
      `;

      if (!messages.length) {
        scroller.innerHTML = '<div style="padding:28px; text-align:center; color:var(--neutral-medium);">No hay mensajes. Inicie la conversación.</div>';
      } else {
        const currentUsername = window.currentSession?.email || '';
        scroller.innerHTML = messages.map(message => {
          const sent = message.emisor === currentUsername;
          return `
            <div class="msg-bubble ${sent ? 'msg-sent' : 'msg-received'}">
              <strong>${escapeHtml(sent ? 'Dirección' : contacto.nombre_completo)}</strong>
              <div>${escapeHtml(message.mensaje)}</div>
              <div class="msg-time">${escapeHtml(message.fecha_envio)}</div>
            </div>
          `;
        }).join('');
      }
      input.disabled = false;
      sendBtn.disabled = false;
      scroller.scrollTop = scroller.scrollHeight;
    }

    async function loadContacts() {
      const result = await fetchJson(`${getMensajesApiUrl()}?action=contacts`);
      contactos = Array.isArray(result.data) ? result.data : [];
      renderContacts();

      if (contactos.length) {
        const preferred = contactoActivo
          ? contactos.find(c => c.username === contactoActivo.username)
          : contactos[0];
        contactoActivo = preferred || contactos[0];
        renderContacts();
        await loadConversation(contactoActivo.username);
      }
    }

    async function loadConversation(username) {
      const scroller = document.getElementById('admin-chat-scroller');
      if (scroller) scroller.innerHTML = '<div style="padding:28px; text-align:center;">Cargando conversación...</div>';
      const result = await fetchJson(`${getMensajesApiUrl()}?action=conversation&with=${encodeURIComponent(username)}`);
      renderMessages(Array.isArray(result.data?.mensajes) ? result.data.mensajes : [], contactoActivo);
      if (contactoActivo) contactoActivo.no_leidos = 0;
      renderContacts();
      updateNotificationBadge();
    }

    async function sendMessage() {
      if (!contactoActivo) return;
      const input = document.getElementById('admin-chat-input');
      const sendBtn = document.getElementById('admin-chat-send-btn');
      const text = input.value.trim();
      if (!text) return;

      input.disabled = true;
      sendBtn.disabled = true;
      try {
        await fetchJson(getMensajesApiUrl(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken()
          },
          body: JSON.stringify({
            destinatario: contactoActivo.username,
            mensaje: text
          })
        });
        input.value = '';
        await loadConversation(contactoActivo.username);
      } catch (error) {
        showAlert(error.message, false);
      } finally {
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
      }
    }

    async function showDocentes() {
      btnDocentes.classList.add('active');
      btnUgel.classList.remove('active');
      renderConversationShell();
      try {
        await loadContacts();
      } catch (error) {
        showAlert(error.message, false);
        sub.innerHTML = '<div class="card" style="text-align:center; color:var(--danger);">No se pudo cargar la mensajería.</div>';
      }
    }

    async function showUgel() {
      btnUgel.classList.add('active');
      btnDocentes.classList.remove('active');
      sub.innerHTML = '<div class="card" style="text-align:center;">Cargando comunicaciones UGEL...</div>';
      try {
        const result = await fetchJson(`${getMensajesApiUrl()}?action=ugel`);
        const messages = Array.isArray(result.data) ? result.data : [];
        sub.innerHTML = `
          <div style="max-width:850px; margin:0 auto;">
            <div class="badge badge-info" style="display:flex; align-items:center; gap:8px; padding:12px; margin-bottom:20px; font-size:13px;">
              Buzón de comunicaciones oficiales registradas en la base de datos.
            </div>
            ${messages.length ? messages.map(msg => `
              <div class="card" style="margin-bottom:16px;">
                <div class="card-header">
                  <h4 style="font-weight:700; color:var(--primary-dark);">Comunicado de ${escapeHtml(msg.emisor)}</h4>
                  <span style="font-size:11px; color:var(--neutral-medium);">${escapeHtml(msg.fecha_envio)}</span>
                </div>
                <div style="font-size:13.5px; line-height:1.6; white-space:pre-wrap;">${escapeHtml(msg.mensaje)}</div>
              </div>
            `).join('') : '<div class="card" style="text-align:center; color:var(--neutral-medium);">No existen comunicaciones UGEL registradas.</div>'}
          </div>
        `;
      } catch (error) {
        showAlert(error.message, false);
        sub.innerHTML = '<div class="card" style="text-align:center; color:var(--danger);">No se pudieron cargar las comunicaciones.</div>';
      }
    }

    btnDocentes.addEventListener('click', showDocentes);
    btnUgel.addEventListener('click', showUgel);
    showDocentes();
  }

  /* ==========================================================================
     5. PLANTILLAS OFICIALES ALMACENADAS EN MYSQL
     ========================================================================== */
  function renderPlantillas(container) {
    setPageTitle('Gestor de Plantillas UGEL');

    let plantillas = [];

    container.innerHTML = `
      <div class="dashboard-grid" style="grid-template-columns:minmax(300px,0.8fr) minmax(520px,1.7fr);">
        <div class="card card-accent">
          <div class="card-header">
            <h3 class="card-title">Cargar Plantilla Oficial</h3>
          </div>
          <form id="template-upload-form" style="display:flex; flex-direction:column; gap:16px;">
            <div class="form-group">
              <label class="form-label-desc" for="template-category">Categoría</label>
              <select id="template-category" name="categoria" class="control-select" required>
                <option value="" disabled selected>-- Seleccione categoría --</option>
                <option value="Académica">Académica</option>
                <option value="Asistencia">Asistencia</option>
                <option value="Administrativa">Administrativa</option>
                <option value="Económica">Económica</option>
                <option value="UGEL">UGEL</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label-desc" for="template-file">Archivo</label>
              <input id="template-file" name="archivo" type="file" class="control-input" accept=".pdf,.doc,.docx,.xls,.xlsx" required>
              <small style="display:block; margin-top:7px; color:var(--neutral-medium); line-height:1.4;">PDF, Word o Excel. Máximo 64 KB por el tipo BLOB definido en la base y nombre de hasta 50 caracteres.</small>
            </div>
            <div id="template-progress-wrap" style="display:none;">
              <div style="height:8px; background:var(--neutral-light); border-radius:6px; overflow:hidden;">
                <div id="template-progress-bar" style="height:100%; width:0%; background:var(--primary-orange); transition:width .15s;"></div>
              </div>
              <div id="template-progress-text" style="font-size:12px; text-align:center; margin-top:6px;">0%</div>
            </div>
            <div id="template-alert" style="display:none; padding:10px; border-radius:6px; text-align:center;"></div>
            <button type="submit" id="template-submit-btn" class="btn btn-primary">Subir a la Base de Datos</button>
          </form>
        </div>

        <div class="card">
          <div class="card-header" style="display:flex; justify-content:space-between; gap:12px; align-items:center; flex-wrap:wrap;">
            <div>
              <h3 class="card-title">Plantillas y Documentos Oficiales</h3>
              <p style="font-size:12.5px; color:var(--neutral-medium); margin-top:4px;">Los archivos se descargan directamente desde la base de datos.</p>
            </div>
            <button type="button" id="template-refresh-btn" class="btn btn-secondary btn-sm">Actualizar</button>
          </div>
          <div style="display:grid; grid-template-columns:1fr 190px; gap:12px; margin-bottom:18px;">
            <input type="search" id="template-search" class="control-input" placeholder="Buscar plantilla...">
            <select id="template-filter" class="control-select">
              <option value="Todas">Todas las categorías</option>
              <option value="Académica">Académica</option>
              <option value="Asistencia">Asistencia</option>
              <option value="Administrativa">Administrativa</option>
              <option value="Económica">Económica</option>
              <option value="UGEL">UGEL</option>
            </select>
          </div>
          <div class="table-responsive">
            <table class="school-table">
              <thead>
                <tr>
                  <th style="width:70px;">ID</th>
                  <th>Nombre del Archivo</th>
                  <th style="width:150px;">Categoría</th>
                  <th style="width:100px;">Tamaño</th>
                  <th style="width:190px; text-align:center;">Acciones</th>
                </tr>
              </thead>
              <tbody id="template-tbody">
                <tr><td colspan="5" style="text-align:center;">Cargando plantillas...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const form = document.getElementById('template-upload-form');
    const fileInput = document.getElementById('template-file');
    const categoryInput = document.getElementById('template-category');
    const submitBtn = document.getElementById('template-submit-btn');
    const refreshBtn = document.getElementById('template-refresh-btn');
    const tbody = document.getElementById('template-tbody');
    const searchInput = document.getElementById('template-search');
    const filterInput = document.getElementById('template-filter');
    const alertBox = document.getElementById('template-alert');
    const progressWrap = document.getElementById('template-progress-wrap');
    const progressBar = document.getElementById('template-progress-bar');
    const progressText = document.getElementById('template-progress-text');

    function formatBytes(bytes) {
      const value = Number(bytes || 0);
      if (value < 1024) return `${value} B`;
      if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
      return `${(value / (1024 * 1024)).toFixed(2)} MB`;
    }

    function extensionBadge(name) {
      const ext = String(name || '').split('.').pop().toUpperCase();
      if (ext === 'PDF') return 'badge-danger';
      if (ext === 'XLS' || ext === 'XLSX') return 'badge-success';
      return 'badge-primary';
    }

    function filteredTemplates() {
      const term = searchInput.value.trim().toLowerCase();
      const category = filterInput.value;
      return plantillas.filter(item => {
        const matchesCategory = category === 'Todas' || item.categoria === category;
        const matchesTerm = !term || `${item.nombre} ${item.categoria}`.toLowerCase().includes(term);
        return matchesCategory && matchesTerm;
      });
    }

    function renderRows() {
      const rows = filteredTemplates();
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--neutral-medium);">No existen plantillas para mostrar.</td></tr>';
        return;
      }

      tbody.innerHTML = rows.map(item => {
        const ext = String(item.nombre || '').split('.').pop().toUpperCase();
        const downloadUrl = `${getPlantillasApiUrl()}?action=download&id=${encodeURIComponent(item.id_plantilla)}`;
        return `
          <tr>
            <td style="font-weight:600;">${escapeHtml(item.id_plantilla)}</td>
            <td>
              <strong>${escapeHtml(item.nombre)}</strong>
              <span class="badge ${extensionBadge(item.nombre)}" style="margin-left:7px;">${escapeHtml(ext)}</span>
            </td>
            <td>${escapeHtml(item.categoria)}</td>
            <td>${escapeHtml(formatBytes(item.tamano_bytes))}</td>
            <td style="text-align:center; white-space:nowrap;">
              <a class="btn btn-primary btn-sm" href="${downloadUrl}">Descargar</a>
              <button type="button" class="btn btn-secondary btn-sm template-delete-btn" data-id="${escapeHtml(item.id_plantilla)}" style="border-color:#dc2626; color:#dc2626;">Eliminar</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    function showAlert(message, success) {
      alertBox.className = `badge ${success ? 'badge-success' : 'badge-danger'}`;
      alertBox.textContent = message;
      alertBox.style.display = 'block';
      window.setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
    }

    async function fetchJson(url, options = {}) {
      const response = await fetch(url, { cache:'no-store', credentials:'same-origin', ...options });
      const result = await response.json().catch(() => ({ success:false, message:'Respuesta inválida del servidor.' }));
      if (!response.ok || !result.success) throw new Error(result.message || `Error HTTP ${response.status}`);
      return result;
    }

    async function loadTemplates() {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando plantillas...</td></tr>';
      const result = await fetchJson(getPlantillasApiUrl());
      plantillas = Array.isArray(result.data) ? result.data : [];
      renderRows();
    }

    function uploadTemplate(formData) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', getPlantillasApiUrl(), true);
        xhr.withCredentials = true;
        xhr.setRequestHeader('X-CSRF-Token', getCsrfToken());

        xhr.upload.addEventListener('progress', event => {
          if (!event.lengthComputable) return;
          const pct = Math.round((event.loaded / event.total) * 100);
          progressBar.style.width = `${pct}%`;
          progressText.textContent = `${pct}%`;
        });

        xhr.addEventListener('load', () => {
          let result;
          try {
            result = JSON.parse(xhr.responseText);
          } catch (error) {
            reject(new Error('Respuesta inválida del servidor.'));
            return;
          }
          if (xhr.status < 200 || xhr.status >= 300 || !result.success) {
            reject(new Error(result.message || `Error HTTP ${xhr.status}`));
            return;
          }
          resolve(result);
        });
        xhr.addEventListener('error', () => reject(new Error('No fue posible conectar con el servidor.')));
        xhr.send(formData);
      });
    }

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const file = fileInput.files[0];
      if (!file) {
        showAlert('Seleccione un archivo.', false);
        return;
      }
      if (file.size > 65535) {
        showAlert('El archivo supera 64 KB, límite de la columna BLOB de la base de datos.', false);
        return;
      }
      if (file.name.length > 50) {
        showAlert('El nombre del archivo no puede superar 50 caracteres.', false);
        return;
      }

      submitBtn.disabled = true;
      progressWrap.style.display = 'block';
      progressBar.style.width = '0%';
      progressText.textContent = '0%';

      const formData = new FormData();
      formData.append('categoria', categoryInput.value);
      formData.append('archivo', file);

      try {
        await uploadTemplate(formData);
        progressBar.style.width = '100%';
        progressText.textContent = '100%';
        form.reset();
        showAlert('✓ Plantilla almacenada correctamente en MySQL.', true);
        await loadTemplates();
      } catch (error) {
        showAlert(error.message, false);
      } finally {
        submitBtn.disabled = false;
        window.setTimeout(() => { progressWrap.style.display = 'none'; }, 700);
      }
    });

    refreshBtn.addEventListener('click', async function() {
      refreshBtn.disabled = true;
      try { await loadTemplates(); }
      catch (error) { showAlert(error.message, false); }
      finally { refreshBtn.disabled = false; }
    });

    searchInput.addEventListener('input', renderRows);
    filterInput.addEventListener('change', renderRows);

    tbody.addEventListener('click', async function(e) {
      const button = e.target.closest('.template-delete-btn');
      if (!button) return;
      const id = Number(button.dataset.id);
      const item = plantillas.find(row => Number(row.id_plantilla) === id);
      if (!window.confirm(`¿Eliminar la plantilla ${item ? item.nombre : ''}?`)) return;

      button.disabled = true;
      try {
        await fetchJson(getPlantillasApiUrl(), {
          method:'DELETE',
          headers:{
            'Content-Type':'application/json',
            'X-CSRF-Token':getCsrfToken()
          },
          body:JSON.stringify({ id_plantilla:id })
        });
        plantillas = plantillas.filter(row => Number(row.id_plantilla) !== id);
        renderRows();
        showAlert('✓ Plantilla eliminada correctamente.', true);
      } catch (error) {
        button.disabled = false;
        showAlert(error.message, false);
      }
    });

    loadTemplates().catch(error => {
      showAlert(error.message, false);
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--danger);">No se pudo cargar el módulo.</td></tr>';
    });
  }

  /* ==========================================================================
     6. GESTIÓN ECONÓMICA: DASHBOARD VISUAL REACTIVO CON AJUSTES
     ========================================================================== */
  function getEconomiaApiUrl() {
    return (typeof BASE_URL !== 'undefined' ? BASE_URL : '') + 'public/api/economia.php';
  }

  /* ==========================================================================
     8. GESTIÓN ECONÓMICA Y SIMULADOR FINANCIERO
     ========================================================================== */
  function renderEconomia(container) {
    setPageTitle('Gestión Económica Escolar');

    container.innerHTML = `
      <!-- Financial Health Header Badge -->
      <div id="eco-health-banner" style="margin-bottom: 20px; padding: 14px 20px; border-radius: 10px; font-weight: 600; display: flex; align-items: center; justify-content: space-between; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;">
        <span>Cargando análisis económico...</span>
        <button id="btn-save-economics" class="btn btn-primary" style="padding: 6px 14px; font-size: 13px;">💾 Guardar Parámetros en BD</button>
      </div>

      <!-- Financial Metrics Grid (8 KPI cards) -->
      <div class="financial-metrics" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="metric-card">
          <div class="metric-icon-box" style="background-color: var(--success-bg); color: var(--success);">S/</div>
          <div class="metric-details">
            <span class="metric-lbl">Recaudación Teórica</span>
            <span class="metric-val" id="val-recaudacion-teorica">S/ 0</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box" style="background-color: #dcfce7; color: #15803d;">S/</div>
          <div class="metric-details">
            <span class="metric-lbl">Recaudación Efectiva (Real)</span>
            <span class="metric-val" id="val-recaudacion-efectiva">S/ 0</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box" style="background-color: var(--warning-bg); color: var(--warning);">%</div>
          <div class="metric-details">
            <span class="metric-lbl">Pérdida por Morosidad</span>
            <span class="metric-val" id="val-morosidad-monto">S/ 0</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box" style="background-color: #ede9fe; color: #6d28d9;">👥</div>
          <div class="metric-details">
            <span class="metric-lbl">Planilla Docente (Nómina)</span>
            <span class="metric-val" id="val-planilla-docente">S/ 0</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box" style="background-color: var(--danger-bg); color: var(--danger);">-</div>
          <div class="metric-details">
            <span class="metric-lbl">Gastos Operativos (OPEX)</span>
            <span class="metric-val" id="val-gastos-opex">S/ 0</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box" style="background-color: #fef3c7; color: #b45309;">🛡️</div>
          <div class="metric-details">
            <span class="metric-lbl">Fondo de Reserva</span>
            <span class="metric-val" id="val-fondo-reserva">S/ 0</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box" style="background-color: rgba(217, 98, 54, 0.12); color: var(--primary-orange);">=</div>
          <div class="metric-details">
            <span class="metric-lbl">Balance / Resultado Neto</span>
            <span class="metric-val" id="val-balance">S/ 0</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box" style="background-color: #e0e7ff; color: #4338ca;">⚖️</div>
          <div class="metric-details">
            <span class="metric-lbl">Punto de Equilibrio</span>
            <span class="metric-val" id="val-break-even">0 alumnos</span>
          </div>
        </div>
      </div>

      <!-- Financial Chart visual -->
      <div class="charts-container" style="grid-template-columns: 1fr; margin-bottom: 24px;">
        <div class="chart-card">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <h3 class="card-title">Balance Financiero Comparativo</h3>
            <span id="chart-margen-badge" style="font-size: 13px; font-weight: 700; padding: 4px 10px; border-radius: 6px; background: #f3f4f6;">Margen: 0%</span>
          </div>
          <div class="chart-body" style="height: 260px; display: flex; align-items: flex-end; justify-content: space-around; padding-top: 30px;">
            <div class="chart-bar-col" style="width: 130px;">
              <div class="chart-bar-fill" id="bar-fill-teorica" style="background-color: #818cf8; height: 0%;">
                <div class="chart-bar-tooltip">S/ 0</div>
              </div>
              <span class="chart-bar-label">Ingreso Bruto</span>
            </div>

            <div class="chart-bar-col" style="width: 130px;">
              <div class="chart-bar-fill" id="bar-fill-efectiva" style="background-color: #10b981; height: 0%;">
                <div class="chart-bar-tooltip">S/ 0</div>
              </div>
              <span class="chart-bar-label">Ingreso Real</span>
            </div>

            <div class="chart-bar-col" style="width: 130px;">
              <div class="chart-bar-fill" id="bar-fill-egresos" style="background-color: #ef4444; height: 0%;">
                <div class="chart-bar-tooltip">S/ 0</div>
              </div>
              <span class="chart-bar-label">Egresos Totales</span>
            </div>

            <div class="chart-bar-col" style="width: 130px;">
              <div class="chart-bar-fill" id="bar-fill-balance" style="background-color: #f59e0b; height: 0%;">
                <div class="chart-bar-tooltip">S/ 0</div>
              </div>
              <span class="chart-bar-label">Resultado Neto</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Financial Breakdown Progress Bar -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <h3 class="card-title">Distribución del Presupuesto de Egresos</h3>
        </div>
        <div style="padding: 12px 0;">
          <div style="display: flex; height: 24px; border-radius: 6px; overflow: hidden; background: #e2e8f0; font-size: 11px; font-weight: 700; color: #fff;">
            <div id="breakdown-bar-nomina" style="background: #8b5cf6; width: 50%; display: flex; align-items: center; justify-content: center;" title="Nómina Docente">Nómina</div>
            <div id="breakdown-bar-opex" style="background: #f97316; width: 35%; display: flex; align-items: center; justify-content: center;" title="Gastos Operativos">OPEX</div>
            <div id="breakdown-bar-reserva" style="background: #eab308; width: 15%; display: flex; align-items: center; justify-content: center;" title="Fondo Reserva">Reserva</div>
          </div>
          <div style="display: flex; justify-content: space-around; margin-top: 10px; font-size: 12px; color: var(--neutral-dark);">
            <span><strong style="color: #8b5cf6;">■</strong> Nómina: <span id="txt-pct-nomina">0%</span></span>
            <span><strong style="color: #f97316;">■</strong> OPEX: <span id="txt-pct-opex">0%</span></span>
            <span><strong style="color: #eab308;">■</strong> Reserva: <span id="txt-pct-reserva">0%</span></span>
          </div>
        </div>
      </div>

      <!-- Adjustments manual panel -->
      <div class="card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <h3 class="card-title">Simulador Financiero y Ajustes Manuales</h3>
          <span style="font-size: 12px; color: var(--neutral-medium);">Ajuste los controles para simular escenarios en tiempo real</span>
        </div>

        <div id="eco-alert" class="badge badge-success" style="display:none; width:100%; text-align:center; margin-bottom:16px;">✓ Parámetros actualizados.</div>

        <div class="adjustments-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
          <!-- 1. Pensión Promedio -->
          <div class="adjustment-control">
            <div class="adjustment-title-row" style="display:flex; justify-content:space-between; font-weight:600; margin-bottom:4px;">
              <span>Pensión Mensual por Alumno</span>
              <span class="adjustment-val" id="slide-pension-lbl" style="color: var(--primary-color);">S/ 350</span>
            </div>
            <input type="range" class="range-slider economy-slide" id="slide-pension" min="100" max="1200" step="25" value="350">
          </div>

          <!-- 2. N° Alumnos -->
          <div class="adjustment-control">
            <div class="adjustment-title-row" style="display:flex; justify-content:space-between; font-weight:600; margin-bottom:4px;">
              <span>N° Alumnos Matriculados</span>
              <span class="adjustment-val" id="slide-alumnos-lbl" style="color: var(--primary-color);">120</span>
            </div>
            <input type="range" class="range-slider economy-slide" id="slide-alumnos" min="20" max="500" step="5" value="120">
          </div>

          <!-- 3. Morosidad % -->
          <div class="adjustment-control">
            <div class="adjustment-title-row" style="display:flex; justify-content:space-between; font-weight:600; margin-bottom:4px;">
              <span>Porcentaje de Morosidad</span>
              <span class="adjustment-val" id="slide-moro-lbl" style="color: var(--warning);">15%</span>
            </div>
            <input type="range" class="range-slider economy-slide" id="slide-moro" min="0" max="50" step="1" value="15">
          </div>

          <!-- 4. Sueldo Docente Promedio -->
          <div class="adjustment-control">
            <div class="adjustment-title-row" style="display:flex; justify-content:space-between; font-weight:600; margin-bottom:4px;">
              <span>Sueldo Promedio Docente</span>
              <span class="adjustment-val" id="slide-sueldo-docente-lbl" style="color: #6d28d9;">S/ 1,800</span>
            </div>
            <input type="range" class="range-slider economy-slide" id="slide-sueldo-docente" min="800" max="4500" step="50" value="1800">
          </div>

          <!-- 5. Mantenimiento -->
          <div class="adjustment-control">
            <div class="adjustment-title-row" style="display:flex; justify-content:space-between; font-weight:600; margin-bottom:4px;">
              <span>Gastos Mantenimiento Escolar</span>
              <span class="adjustment-val" id="slide-gastos-lbl">S/ 2,500</span>
            </div>
            <input type="range" class="range-slider economy-slide" id="slide-gastos" min="200" max="8000" step="100" value="2500">
          </div>

          <!-- 6. Internet -->
          <div class="adjustment-control">
            <div class="adjustment-title-row" style="display:flex; justify-content:space-between; font-weight:600; margin-bottom:4px;">
              <span>Servicio de Internet y Telef.</span>
              <span class="adjustment-val" id="slide-internet-lbl">S/ 320</span>
            </div>
            <input type="range" class="range-slider economy-slide" id="slide-internet" min="50" max="1000" step="10" value="320">
          </div>

          <!-- 7. Agua -->
          <div class="adjustment-control">
            <div class="adjustment-title-row" style="display:flex; justify-content:space-between; font-weight:600; margin-bottom:4px;">
              <span>Servicio de Agua Potable</span>
              <span class="adjustment-val" id="slide-agua-lbl">S/ 250</span>
            </div>
            <input type="range" class="range-slider economy-slide" id="slide-agua" min="50" max="1000" step="10" value="250">
          </div>

          <!-- 8. Luz -->
          <div class="adjustment-control">
            <div class="adjustment-title-row" style="display:flex; justify-content:space-between; font-weight:600; margin-bottom:4px;">
              <span>Servicio de Energía Eléctrica</span>
              <span class="adjustment-val" id="slide-luz-lbl">S/ 450</span>
            </div>
            <input type="range" class="range-slider economy-slide" id="slide-luz" min="100" max="2000" step="25" value="450">
          </div>

          <!-- 9. Impuestos -->
          <div class="adjustment-control">
            <div class="adjustment-title-row" style="display:flex; justify-content:space-between; font-weight:600; margin-bottom:4px;">
              <span>Impuestos y Arbitrios</span>
              <span class="adjustment-val" id="slide-impuestos-lbl">S/ 1,800</span>
            </div>
            <input type="range" class="range-slider economy-slide" id="slide-impuestos" min="200" max="5000" step="50" value="1800">
          </div>

          <!-- 10. Fondo Reserva % -->
          <div class="adjustment-control">
            <div class="adjustment-title-row" style="display:flex; justify-content:space-between; font-weight:600; margin-bottom:4px;">
              <span>Fondo de Reserva (%)</span>
              <span class="adjustment-val" id="slide-reserva-pct-lbl">5%</span>
            </div>
            <input type="range" class="range-slider economy-slide" id="slide-reserva-pct" min="0" max="25" step="1" value="5">
          </div>
        </div>
      </div>
    `;

    const alertBox = document.getElementById('eco-alert');
    const saveBtn = document.getElementById('btn-save-economics');
    let numDocentesActivos = 6;

    function calculateEconomicsAndDraw() {
      const pension = parseInt(document.getElementById('slide-pension').value) || 0;
      const alumnos = parseInt(document.getElementById('slide-alumnos').value) || 0;
      const morosidadPct = parseInt(document.getElementById('slide-moro').value) || 0;
      const sueldoDocente = parseInt(document.getElementById('slide-sueldo-docente').value) || 0;
      const mantenimiento = parseInt(document.getElementById('slide-gastos').value) || 0;
      const internet = parseInt(document.getElementById('slide-internet').value) || 0;
      const agua = parseInt(document.getElementById('slide-agua').value) || 0;
      const luz = parseInt(document.getElementById('slide-luz').value) || 0;
      const impuestos = parseInt(document.getElementById('slide-impuestos').value) || 0;
      const reservaPct = parseInt(document.getElementById('slide-reserva-pct').value) || 0;

      // Labels update
      document.getElementById('slide-pension-lbl').textContent = `S/ ${pension.toLocaleString()}`;
      document.getElementById('slide-alumnos-lbl').textContent = `${alumnos} alumnos`;
      document.getElementById('slide-moro-lbl').textContent = `${morosidadPct}%`;
      document.getElementById('slide-sueldo-docente-lbl').textContent = `S/ ${sueldoDocente.toLocaleString()}`;
      document.getElementById('slide-gastos-lbl').textContent = `S/ ${mantenimiento.toLocaleString()}`;
      document.getElementById('slide-internet-lbl').textContent = `S/ ${internet.toLocaleString()}`;
      document.getElementById('slide-agua-lbl').textContent = `S/ ${agua.toLocaleString()}`;
      document.getElementById('slide-luz-lbl').textContent = `S/ ${luz.toLocaleString()}`;
      document.getElementById('slide-impuestos-lbl').textContent = `S/ ${impuestos.toLocaleString()}`;
      document.getElementById('slide-reserva-pct-lbl').textContent = `${reservaPct}%`;

      // Financial Engine Formulas
      const recaudacionTeorica = pension * alumnos;
      const montoMorosidad = Math.round(recaudacionTeorica * (morosidadPct / 100));
      const recaudacionEfectiva = recaudacionTeorica - montoMorosidad;

      const planillaDocente = numDocentesActivos * sueldoDocente;
      const opex = mantenimiento + internet + agua + luz + impuestos;
      const fondoReservaMonto = Math.round(recaudacionTeorica * (reservaPct / 100));
      const totalEgresos = planillaDocente + opex + fondoReservaMonto;

      const netBalance = recaudacionEfectiva - totalEgresos;
      const margenPct = recaudacionEfectiva > 0 ? ((netBalance / recaudacionEfectiva) * 100).toFixed(1) : '0.0';
      const breakEvenAlumnos = pension > 0 ? Math.ceil(totalEgresos / pension) : 0;

      // Draw Values in KPI Cards
      document.getElementById('val-recaudacion-teorica').textContent = `S/ ${recaudacionTeorica.toLocaleString()}`;
      document.getElementById('val-recaudacion-efectiva').textContent = `S/ ${recaudacionEfectiva.toLocaleString()}`;
      document.getElementById('val-morosidad-monto').textContent = `S/ ${montoMorosidad.toLocaleString()} (${morosidadPct}%)`;
      document.getElementById('val-planilla-docente').textContent = `S/ ${planillaDocente.toLocaleString()} (${numDocentesActivos} doc.)`;
      document.getElementById('val-gastos-opex').textContent = `S/ ${opex.toLocaleString()}`;
      document.getElementById('val-fondo-reserva').textContent = `S/ ${fondoReservaMonto.toLocaleString()} (${reservaPct}%)`;

      const balanceEl = document.getElementById('val-balance');
      balanceEl.textContent = `S/ ${netBalance.toLocaleString()} (${margenPct}%)`;
      balanceEl.style.color = netBalance >= 0 ? '#10b981' : '#ef4444';

      document.getElementById('val-break-even').textContent = `${breakEvenAlumnos} alumnos min.`;

      // Health Banner
      const healthBanner = document.getElementById('eco-health-banner');
      const healthSpan = healthBanner.querySelector('span');
      if (netBalance >= 0 && parseFloat(margenPct) >= 15) {
        healthBanner.style.background = '#dcfce7';
        healthBanner.style.color = '#15803d';
        healthBanner.style.borderColor = '#86efac';
        healthSpan.innerHTML = `💚 <strong>Salud Financiera Excelente</strong> — Superávit mensual de S/ ${netBalance.toLocaleString()} (Margen: ${margenPct}%)`;
      } else if (netBalance >= 0) {
        healthBanner.style.background = '#fef3c7';
        healthBanner.style.color = '#b45309';
        healthBanner.style.borderColor = '#fde68a';
        healthSpan.innerHTML = `⚠️ <strong>Salud Financiera Estable</strong> — Superávit ajustado de S/ ${netBalance.toLocaleString()} (Margen: ${margenPct}%)`;
      } else {
        healthBanner.style.background = '#fee2e2';
        healthBanner.style.color = '#b91c1c';
        healthBanner.style.borderColor = '#fca5a5';
        healthSpan.innerHTML = `🚨 <strong>Alerta Financiera (Déficit Operativo)</strong> — Pérdida mensual estimada de S/ ${Math.abs(netBalance).toLocaleString()}`;
      }

      // Chart Badge
      const margenBadge = document.getElementById('chart-margen-badge');
      margenBadge.textContent = `Margen Neto: ${margenPct}%`;
      margenBadge.style.color = netBalance >= 0 ? '#10b981' : '#ef4444';

      // Bar Chart Scaling
      const maxVal = Math.max(recaudacionTeorica, recaudacionEfectiva, totalEgresos, Math.abs(netBalance), 10000);
      const fillTeorica = document.getElementById('bar-fill-teorica');
      const fillEfectiva = document.getElementById('bar-fill-efectiva');
      const fillEgresos = document.getElementById('bar-fill-egresos');
      const fillBalance = document.getElementById('bar-fill-balance');

      fillTeorica.style.height = `${(recaudacionTeorica / maxVal) * 100}%`;
      fillTeorica.querySelector('.chart-bar-tooltip').textContent = `S/ ${recaudacionTeorica.toLocaleString()}`;

      fillEfectiva.style.height = `${(recaudacionEfectiva / maxVal) * 100}%`;
      fillEfectiva.querySelector('.chart-bar-tooltip').textContent = `S/ ${recaudacionEfectiva.toLocaleString()}`;

      fillEgresos.style.height = `${(totalEgresos / maxVal) * 100}%`;
      fillEgresos.querySelector('.chart-bar-tooltip').textContent = `S/ ${totalEgresos.toLocaleString()}`;

      fillBalance.style.height = `${(Math.abs(netBalance) / maxVal) * 100}%`;
      fillBalance.querySelector('.chart-bar-tooltip').textContent = `S/ ${netBalance.toLocaleString()}`;
      fillBalance.style.backgroundColor = netBalance >= 0 ? '#10b981' : '#ef4444';

      // Expenses Breakdown Bar
      const totalBudget = totalEgresos > 0 ? totalEgresos : 1;
      const pctNomina = ((planillaDocente / totalBudget) * 100).toFixed(1);
      const pctOpex = ((opex / totalBudget) * 100).toFixed(1);
      const pctReserva = ((fondoReservaMonto / totalBudget) * 100).toFixed(1);

      document.getElementById('breakdown-bar-nomina').style.width = `${pctNomina}%`;
      document.getElementById('breakdown-bar-opex').style.width = `${pctOpex}%`;
      document.getElementById('breakdown-bar-reserva').style.width = `${pctReserva}%`;

      document.getElementById('txt-pct-nomina').textContent = `${pctNomina}% (S/ ${planillaDocente.toLocaleString()})`;
      document.getElementById('txt-pct-opex').textContent = `${pctOpex}% (S/ ${opex.toLocaleString()})`;
      document.getElementById('txt-pct-reserva').textContent = `${pctReserva}% (S/ ${fondoReservaMonto.toLocaleString()})`;
    }

    function loadEconomicsData() {
      fetch(getEconomiaApiUrl(), {
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin'
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(result => {
          if (!result || !result.success || !result.data) return;

          const data = result.data;
          numDocentesActivos = parseInt(data.num_docentes_activos) || 6;

          document.getElementById('slide-pension').value = data.pension_promedio ?? 350;
          document.getElementById('slide-alumnos').value = data.num_alumnos ?? 120;
          document.getElementById('slide-moro').value = data.morosidad_pct ?? 15;
          document.getElementById('slide-sueldo-docente').value = data.sueldo_docente_prom ?? 1800;
          document.getElementById('slide-gastos').value = data.gastos_mantenimiento ?? 2500;
          document.getElementById('slide-internet').value = data.gasto_internet ?? 320;
          document.getElementById('slide-agua').value = data.gasto_agua ?? 250;
          document.getElementById('slide-luz').value = data.gasto_luz ?? 450;
          document.getElementById('slide-impuestos').value = data.gasto_impuestos ?? 1800;
          document.getElementById('slide-reserva-pct').value = data.fondo_reserva_pct ?? 5;

          calculateEconomicsAndDraw();
        })
        .catch(err => {
          console.error('Error al cargar datos económicos del API:', err);
          calculateEconomicsAndDraw();
        });
    }

    function saveEconomicsData() {
      const payload = {
        pension_promedio: parseInt(document.getElementById('slide-pension').value),
        num_alumnos: parseInt(document.getElementById('slide-alumnos').value),
        morosidad_pct: parseInt(document.getElementById('slide-moro').value),
        sueldo_docente_prom: parseInt(document.getElementById('slide-sueldo-docente').value),
        gastos_mantenimiento: parseInt(document.getElementById('slide-gastos').value),
        gasto_internet: parseInt(document.getElementById('slide-internet').value),
        gasto_agua: parseInt(document.getElementById('slide-agua').value),
        gasto_luz: parseInt(document.getElementById('slide-luz').value),
        gasto_impuestos: parseInt(document.getElementById('slide-impuestos').value),
        fondo_reserva_pct: parseInt(document.getElementById('slide-reserva-pct').value)
      };

      fetch(getEconomiaApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify(payload),
        cache: 'no-store',
        credentials: 'same-origin'
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(resData => {
          if (!resData || !resData.success) {
            alertBox.textContent = resData?.message || 'Error al guardar los datos económicos.';
            alertBox.className = 'badge badge-warning';
            alertBox.style.display = 'block';
            return;
          }

          alertBox.textContent = '✓ Parámetros económicos guardados correctamente en la base de datos.';
          alertBox.className = 'badge badge-success';
          alertBox.style.display = 'block';
          setTimeout(() => { alertBox.style.display = 'none'; }, 3500);
        })
        .catch(err => {
          console.error('Error guardando parámetros económicos:', err);
          alertBox.textContent = 'No fue posible conectar con el servidor para guardar los parámetros.';
          alertBox.className = 'badge badge-warning';
          alertBox.style.display = 'block';
        });
    }

    // Bind slider input events for real-time calculations
    const slides = container.querySelectorAll('.economy-slide');
    slides.forEach(slide => {
      slide.addEventListener('input', calculateEconomicsAndDraw);
    });

    saveBtn.addEventListener('click', saveEconomicsData);

    // Initial loading from database
    loadEconomicsData();
  }

  updateNotificationBadge();
  window.setInterval(updateNotificationBadge, 30000);

  // Expose methods globally for Router config in admin.html
  window.AdminModule = {
    renderInfoPersonal: renderInfoPersonal,
    renderIncidencias: renderIncidencias,
    renderDocentes: renderDocentes,
    renderAddDocentes: renderAddDocentes,
    renderCursos: renderCursos,
    renderMensajeria: renderMensajeria,
    renderPlantillas: renderPlantillas,
    renderEconomia: renderEconomia
  };

})();
