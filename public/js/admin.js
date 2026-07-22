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
    try {
      return new URL('../public/api/docentes.php', window.location.href).toString();
    } catch (error) {
      return '../public/api/docentes.php';
    }
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
    `;

    const form = document.getElementById('admin-info-form');
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const alert = document.getElementById('admin-form-alert');
      alert.innerHTML = `<div class="badge badge-success" style="padding: 10px; width: 100%; border-radius: 6px; text-align: center; margin-bottom: 10px;">✓ Datos actualizados correctamente.</div>`;
      setTimeout(() => { alert.innerHTML = ''; }, 3000);
    });
  }

  /* ==========================================================================
     2. INCIDENCIAS: LISTA GLOBAL & REDACCIÓN
     ========================================================================== */
  function renderIncidencias(container) {
    setPageTitle('Gestión Global de Incidencias');
    const db = window.SchoolDB.getData();

    function buildIncidentRows() {
      let rows = '';
      db.incidents.forEach(inc => {
        const isResolved = inc.status === 'Resuelto';
        rows += `
          <tr>
            <td style="font-weight: 600;">${inc.id}</td>
            <td>${inc.date}</td>
            <td>${inc.studentName}</td>
            <td><strong>${inc.docentName}</strong></td>
            <td>${inc.detail}</td>
            <td>
              <select class="control-select incident-status-select" data-id="${inc.id}" style="padding: 4px 8px; font-size: 12px; font-weight: 600;">
                <option value="En Revisión" ${inc.status === 'En Revisión' ? 'selected' : ''}>En Revisión</option>
                <option value="Resuelto" ${inc.status === 'Resuelto' ? 'selected' : ''}>Resuelto</option>
              </select>
            </td>
          </tr>
        `;
      });
      return rows;
    }

    let studentOptions = '';
    db.students.forEach(st => {
      studentOptions += `<option value="${st.name}">${st.name} (${st.grado})</option>`;
    });

    container.innerHTML = `
      <div class="dashboard-grid" style="grid-template-columns: 1fr 1.8fr;">
        <!-- write panel -->
        <div class="card card-accent">
          <div class="card-header">
            <h3 class="card-title">Redactar Incidencia Administrativa</h3>
          </div>
          <form id="admin-inc-form" class="form-layout" style="display: flex; flex-direction: column; gap: 16px;">
            <div class="form-group">
              <label class="form-label-desc">Alumno Vinculado</label>
              <select id="admin-inc-student" class="control-select" required>
                <option value="" disabled selected>-- Elija un alumno --</option>
                ${studentOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label-desc">Descripción del Incidente</label>
              <textarea id="admin-inc-detail" class="control-textarea" placeholder="Describa el hecho y las acciones tomadas..." required></textarea>
            </div>
            <div id="admin-inc-alert" class="badge badge-success" style="display:none; width: 100%; text-align: center;">✓ Incidencia registrada exitosamente.</div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Registrar Incidencia</button>
          </form>
        </div>

        <!-- list panel -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Historial Global de Incidencias</h3>
          </div>
          <div class="table-responsive">
            <table class="school-table">
              <thead>
                <tr>
                  <th style="width: 70px;">ID</th>
                  <th style="width: 90px;">Fecha</th>
                  <th style="width: 150px;">Alumno</th>
                  <th style="width: 130px;">Reportado por</th>
                  <th>Detalles</th>
                  <th style="width: 120px;">Estado</th>
                </tr>
              </thead>
              <tbody id="admin-inc-tbody">
                ${buildIncidentRows()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Handle status change
    const tbody = document.getElementById('admin-inc-tbody');
    tbody.addEventListener('change', function(e) {
      if (e.target && e.target.classList.contains('incident-status-select')) {
        const incId = e.target.getAttribute('data-id');
        const status = e.target.value;
        window.SchoolDB.updateIncidentStatus(incId, status);
        
        // Re-read DB
        const updatedDb = window.SchoolDB.getData();
        tbody.innerHTML = buildIncidentRows();
      }
    });

    // Form Submission
    const form = document.getElementById('admin-inc-form');
    const alertBox = document.getElementById('admin-inc-alert');
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const student = document.getElementById('admin-inc-student').value;
      const detail = document.getElementById('admin-inc-detail').value;

      window.SchoolDB.addIncident(student, 'Director Administrativo', detail);
      
      // Update view
      const updatedDb = window.SchoolDB.getData();
      tbody.innerHTML = buildIncidentRows();

      form.reset();
      alertBox.style.display = 'block';
      setTimeout(() => { alertBox.style.display = 'none'; }, 3000);
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
        headers: { 'Content-Type': 'application/json' },
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
    `;

    const form = document.getElementById('add-docente-form');
    const alertBox = document.getElementById('docente-alert');
    const tbody = document.getElementById('docentes-registrados-tbody');

    fetch(getDocentesApiUrl(), {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin'
    })
      .then(response => response.text())
      .then(text => {
        console.log('Prueba de conexión al API:', text.slice(0, 200));
      })
      .catch(error => {
        console.error('Error de conexión al API:', error);
      });

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

    tbody.addEventListener('click', function(e) {
      const btn = e.target.closest('[data-action="toggle-status"]');
      if (!btn) return;

      const idDocente = btn.getAttribute('data-id');
      const currentState = btn.getAttribute('data-active') === '1';
      fetch(getDocentesApiUrl(), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
          'X-Requested-With': 'XMLHttpRequest'
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
      fetch('../public/api/cursos.php', {
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
        año: document.getElementById('curso-anio').value
      };

      fetch('../public/api/cursos.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
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

      fetch('../public/api/cursos.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
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
     6. MENSAJERÍA / NOTIFICACIONES (UGEL & DOCENTES TABS)
     ========================================================================== */
  function renderMensajeria(container) {
    setPageTitle('Mensajería y Comunicados');
    const db = window.SchoolDB.getData();

    container.innerHTML = `
      <div class="tabs-container">
        <button class="tab-btn active" id="msg-tab-docentes">Mensajes con Docentes</button>
        <button class="tab-btn" id="msg-tab-ugel">Comunicaciones UGEL</button>
      </div>

      <div id="msg-subview-container">
        <!-- view loaded here -->
      </div>
    `;

    const btnDocentes = document.getElementById('msg-tab-docentes');
    const btnUgel = document.getElementById('msg-tab-ugel');

    btnDocentes.addEventListener('click', function() {
      switchMsgTab('docentes');
    });
    btnUgel.addEventListener('click', function() {
      switchMsgTab('ugel');
    });

    switchMsgTab('docentes');

    function switchMsgTab(tabName) {
      const activeTab = document.querySelector('.tabs-container .active');
      if (activeTab) activeTab.classList.remove('active');
      
      const sub = document.getElementById('msg-subview-container');

      if (tabName === 'docentes') {
        btnDocentes.classList.add('active');
        
        let messagesHtml = '';
        db.messages.docentes.forEach(m => {
          const isDirector = m.from === 'Director';
          messagesHtml += `
            <div class="msg-bubble ${isDirector ? 'msg-sent' : 'msg-received'}">
              <strong>${m.from}</strong>
              <div>${m.content}</div>
              <div class="msg-time">${m.timestamp}</div>
            </div>
          `;
        });

        sub.innerHTML = `
          <div class="chat-container">
            <div class="chat-contacts-panel">
              <div class="chat-contacts-header">Docentes Activos</div>
              <ul class="contacts-list">
                <li class="contact-item active">
                  <div class="contact-avatar">CR</div>
                  <div class="contact-details">
                    <div class="contact-name">Prof. Carlos Rivas</div>
                    <div class="contact-status">Matemática y Ciencia</div>
                  </div>
                </li>
                <li class="contact-item" style="opacity: 0.6; cursor: not-allowed;">
                  <div class="contact-avatar">AM</div>
                  <div class="contact-details">
                    <div class="contact-name">Prof. Ana Medina</div>
                    <div class="contact-status">Desconectado</div>
                  </div>
                </li>
                <li class="contact-item" style="opacity: 0.6; cursor: not-allowed;">
                  <div class="contact-avatar">LL</div>
                  <div class="contact-details">
                    <div class="contact-name">Prof. Luis Lazo</div>
                    <div class="contact-status">Desconectado</div>
                  </div>
                </li>
              </ul>
            </div>
            
            <div class="chat-messages-panel">
              <div class="chat-panel-header">
                <div class="chat-active-user">
                  <div class="contact-avatar" style="width: 32px; height:32px; font-size:12px;">CR</div>
                  <span style="font-weight:700; font-size:14px; color: var(--primary-dark);">Prof. Carlos Rivas</span>
                </div>
                <span class="badge badge-success">En Línea</span>
              </div>
              <div class="messages-scroller" id="admin-chat-scroller">
                ${messagesHtml}
              </div>
              <div class="chat-input-panel">
                <input type="text" id="admin-chat-input" class="chat-text-input" placeholder="Responder al docente...">
                <button class="btn btn-primary" id="admin-chat-send-btn">Enviar</button>
              </div>
            </div>
          </div>
        `;

        const chatScroller = document.getElementById('admin-chat-scroller');
        const chatInput = document.getElementById('admin-chat-input');
        const sendBtn = document.getElementById('admin-chat-send-btn');
        
        chatScroller.scrollTop = chatScroller.scrollHeight;

        function sendMsg() {
          const text = chatInput.value.trim();
          if (!text) return;

          const newM = window.SchoolDB.sendDocentMessage('Director', text);
          
          const bubble = document.createElement('div');
          bubble.className = 'msg-bubble msg-sent';
          bubble.innerHTML = `
            <strong>${newM.from}</strong>
            <div>${newM.content}</div>
            <div class="msg-time">${newM.timestamp}</div>
          `;
          chatScroller.appendChild(bubble);
          chatInput.value = '';
          chatScroller.scrollTop = chatScroller.scrollHeight;
        }

        sendBtn.addEventListener('click', sendMsg);
        chatInput.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') sendMsg();
        });

      } else {
        btnUgel.classList.add('active');

        let ugelHtml = '';
        db.messages.ugel.forEach(msg => {
          ugelHtml += `
            <div class="card" style="margin-bottom:16px;">
              <div class="card-header" style="border:none; padding-bottom:0;">
                <h4 style="font-weight:700; color:var(--primary-dark);">${msg.title}</h4>
                <span style="font-size:11px; color:var(--neutral-medium);">${msg.date}</span>
              </div>
              <div style="padding:16px; font-size: 13.5px; line-height: 1.5;">
                <p style="margin-bottom:10px;"><strong>Remitente:</strong> ${msg.sender}</p>
                <div style="background-color: var(--neutral-bg-hover); padding: 12px; border-radius: var(--radius-md); border:1px solid var(--neutral-light);">
                  ${msg.content}
                </div>
              </div>
            </div>
          `;
        });

        sub.innerHTML = `
          <div style="max-width: 800px; margin: 0 auto;">
            <div class="badge badge-info" style="display:flex; align-items:center; gap:8px; padding:12px; margin-bottom:20px; font-size:13px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              Buzón oficial conectado con la Mesa de Partes Virtual de la UGEL 03 - Minedu.
            </div>
            ${ugelHtml}
          </div>
        `;
      }
    }
  }

  /* ==========================================================================
     5. PLANTILLAS DE DOCUMENTOS (GESTOR PARA UGEL)
     ========================================================================== */
  function renderPlantillas(container) {
    setPageTitle('Gestor de Plantillas UGEL');

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Plantillas y Documentos Oficiales</h3>
        </div>
        <p style="font-size: 13.5px; color: var(--neutral-medium); margin-bottom: 20px;">
          Descargue o genere automáticamente los documentos oficiales listos para reportar a la UGEL.
        </p>

        <div class="table-responsive">
          <table class="school-table">
            <thead>
              <tr>
                <th>Código Documental</th>
                <th>Nombre del Formato</th>
                <th>Frecuencia</th>
                <th>Formato</th>
                <th style="text-align: center; width: 220px;">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight:600;">UGEL-F01</td>
                <td>Consolidado Semestral de Calificaciones Académicas</td>
                <td>Bimestral</td>
                <td><span class="badge badge-primary">Excel (XLSX)</span></td>
                <td style="text-align: center;">
                  <button class="btn btn-secondary btn-sm btn-generate-doc" data-doc="Consolidado Semestral">Generar Reporte</button>
                </td>
              </tr>
              <tr>
                <td style="font-weight:600;">UGEL-F02</td>
                <td>Rendimiento de Gastos por Mantenimiento de Infraestructura</td>
                <td>Trimestral</td>
                <td><span class="badge badge-warning">Word (DOCX)</span></td>
                <td style="text-align: center;">
                  <button class="btn btn-secondary btn-sm btn-generate-doc" data-doc="Rendimiento de Gastos">Generar Reporte</button>
                </td>
              </tr>
              <tr>
                <td style="font-weight:600;">UGEL-F03</td>
                <td>Reporte Consolidado de Asistencia y Deserción Escolar</td>
                <td>Mensual</td>
                <td><span class="badge badge-danger">PDF</span></td>
                <td style="text-align: center;">
                  <button class="btn btn-secondary btn-sm btn-generate-doc" data-doc="Consolidado de Asistencia">Generar Reporte</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- modal or progress indicator overlay -->
      <div id="progress-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:200; align-items:center; justify-content:center;">
        <div class="card" style="width: 320px; text-align: center;">
          <h3 id="progress-title" style="margin-bottom:12px;">Generando Archivo...</h3>
          <div style="background-color: var(--neutral-light); height: 8px; border-radius: 4px; overflow:hidden; margin-bottom:16px;">
            <div id="progress-bar-fill" style="background-color: var(--primary-orange); height:100%; width:0%; transition: width 0.1s linear;"></div>
          </div>
          <span id="progress-pct" style="font-weight: 700; color: var(--primary-dark);">0%</span>
        </div>
      </div>
    `;

    const btns = container.querySelectorAll('.btn-generate-doc');
    const overlay = document.getElementById('progress-overlay');
    const fill = document.getElementById('progress-bar-fill');
    const pct = document.getElementById('progress-pct');
    const title = document.getElementById('progress-title');

    btns.forEach(btn => {
      btn.addEventListener('click', function() {
        const docName = this.getAttribute('data-doc');
        
        overlay.style.display = 'flex';
        fill.style.width = '0%';
        pct.textContent = '0%';
        title.textContent = `Generando ${docName}...`;

        let currentPct = 0;
        const interval = setInterval(() => {
          currentPct += 5;
          fill.style.width = `${currentPct}%`;
          pct.textContent = `${currentPct}%`;
          
          if (currentPct >= 100) {
            clearInterval(interval);
            title.textContent = '✓ ¡Generado con Éxito!';
            
            // Simular descarga
            setTimeout(() => {
              overlay.style.display = 'none';
              
              // Trigger simple text file download to simulate generated report
              const blob = new Blob([`Reporte UGEL IEP Corazon de Jesus - ${docName} - Generado el ${new Date().toLocaleDateString()}`], {type: "text/plain;charset=utf-8"});
              const dlAnchor = document.createElement('a');
              dlAnchor.href = URL.createObjectURL(blob);
              dlAnchor.download = `${docName.replace(/\s+/g, '_')}_UGEL_Reporte.txt`;
              document.body.appendChild(dlAnchor);
              dlAnchor.click();
              document.body.removeChild(dlAnchor);
            }, 1000);
          }
        }, 100);
      });
    });
  }

  /* ==========================================================================
     6. GESTIÓN ECONÓMICA: DASHBOARD VISUAL REACTIVO CON AJUSTES
     ========================================================================== */
  function getEconomiaApiUrl() {
    try {
      return new URL('../public/api/economia.php', window.location.href).toString();
    } catch (error) {
      return '../public/api/economia.php';
    }
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
        headers: { 'Content-Type': 'application/json' },
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
