/**
 * Módulo de Docente (DocenteModule)
 * 
 * Este archivo actúa como el Controlador principal para la vista del Docente.
 * Organiza e inyecta dinámicamente las interfaces necesarias para que el docente pueda:
 * 1. Gestionar su información personal e interactuar en el chat directo con Dirección.
 * 2. Visualizar y evaluar a los alumnos de sus cursos (Matemática, Ciencia, etc.), guardando notas.
 * 3. Revisar su calendario, registrar la asistencia diaria (Presente, Tarde, Falta).
 * 4. Redactar reportes de incidencias disciplinarias de los estudiantes.
 * 5. Consultar estadísticas de rendimiento general, aprobados, desaprobados y promedios.
 * 
 * Se basa en una arquitectura SPA (Single Page Application) manipulando el DOM
 * mediante Template Literals e interactuando directamente con el motor de persistencia SchoolDB.
 */
(function() {

  // Función auxiliar para actualizar el título de la página en la barra superior
  function setPageTitle(title) {
    const el = document.getElementById('navbar-page-title');
    if (el) el.textContent = title;
  }

  function getCursosApiUrl() {
    return (typeof BASE_URL !== 'undefined' ? BASE_URL : '') + 'public/api/cursos.php';
  }

  function getIncidenciasApiUrl() {
    return (typeof BASE_URL !== 'undefined' ? BASE_URL : '') + 'public/api/incidencias.php';
  }


  function getMensajesApiUrl() {
    return (typeof BASE_URL !== 'undefined' ? BASE_URL : '') + 'public/api/mensajes.php';
  }


  function getActividadesApiUrl() {
    return (typeof BASE_URL !== 'undefined' ? BASE_URL : '') + 'public/api/actividades.php';
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

  function getCsrfToken() {
    return window.currentSession && window.currentSession.csrfToken
      ? window.currentSession.csrfToken
      : '';
  }

  /* ==========================================================================
     1. INFORMACIÓN PERSONAL & MENSAJERÍA CON DIRECCIÓN
     ========================================================================== */
  function renderInfoPersonal(container) {
    setPageTitle('Información Personal y Mensajería');

    const session = window.SchoolAuth.getSession() || { name: 'Docente', email: '' };
    let director = null;

    container.innerHTML = `
      <div class="dashboard-grid" style="grid-template-columns: 1fr 1.2fr;">
        <div class="card card-accent">
          <div class="card-header">
            <h3 class="card-title">
              <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Actualizar Datos de Docente
            </h3>
          </div>
          <form id="docent-info-form" class="form-layout" style="display:flex; flex-direction:column; gap:14px;">
            <div class="form-group">
              <label class="form-label-desc">Nombre Completo</label>
              <input type="text" class="control-input" value="${escapeHtml(session.name)}" disabled>
            </div>
            <div class="form-group">
              <label class="form-label-desc">Usuario</label>
              <input type="text" class="control-input" value="${escapeHtml(session.email)}" disabled>
            </div>
            <div class="form-group">
              <label class="form-label-desc">Teléfono de Contacto</label>
              <input type="text" id="docent-phone" class="control-input" placeholder="Ingrese teléfono">
            </div>
            <div class="form-group">
              <label class="form-label-desc">Dirección de Domicilio</label>
              <input type="text" id="docent-address" class="control-input" placeholder="Ingrese dirección">
            </div>
            <div id="form-alert-container"></div>
            <button type="submit" class="btn btn-primary" style="margin-top:10px; width:100%;">Guardar Cambios</button>
          </form>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              Mensajería Interna con Dirección
            </h3>
            <span class="badge badge-info" id="docent-director-label">Cargando...</span>
          </div>
          <div id="docent-chat-alert" style="display:none; padding:10px; border-radius:6px; text-align:center; margin-bottom:12px;"></div>
          <div class="chat-messages-panel" style="border:1px solid var(--neutral-light); border-radius:var(--radius-md); overflow:hidden;">
            <div class="messages-scroller" id="docent-chat-scroller" style="height:300px;">
              <div style="padding:28px; text-align:center; color:var(--neutral-medium);">Cargando conversación...</div>
            </div>
            <div class="chat-input-panel">
              <input type="text" id="docent-chat-input" maxlength="2000" class="chat-text-input" placeholder="Escriba un mensaje a Dirección..." disabled>
              <button class="btn btn-primary" id="docent-chat-send-btn" disabled>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const profileForm = document.getElementById('docent-info-form');
    const chatInput = document.getElementById('docent-chat-input');
    const sendBtn = document.getElementById('docent-chat-send-btn');
    const chatScroller = document.getElementById('docent-chat-scroller');
    const chatAlert = document.getElementById('docent-chat-alert');
    const directorLabel = document.getElementById('docent-director-label');

    profileForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const alertContainer = document.getElementById('form-alert-container');
      alertContainer.innerHTML = '<div class="badge badge-info" style="padding:10px; width:100%; text-align:center;">La edición del perfil pertenece al módulo de usuarios.</div>';
      window.setTimeout(() => { alertContainer.innerHTML = ''; }, 3500);
    });

    function showChatAlert(message, success) {
      chatAlert.className = `badge ${success ? 'badge-success' : 'badge-danger'}`;
      chatAlert.textContent = message;
      chatAlert.style.display = 'block';
      window.setTimeout(() => { chatAlert.style.display = 'none'; }, 3500);
    }

    async function fetchJson(url, options = {}) {
      const response = await fetch(url, {
        cache: 'no-store',
        credentials: 'same-origin',
        ...options
      });
      const result = await response.json().catch(() => ({ success:false, message:'Respuesta inválida del servidor.' }));
      if (!response.ok || !result.success) {
        throw new Error(result.message || `Error HTTP ${response.status}`);
      }
      return result;
    }

    function renderMessages(messages) {
      if (!messages.length) {
        chatScroller.innerHTML = '<div style="padding:28px; text-align:center; color:var(--neutral-medium);">No hay mensajes. Puede iniciar la conversación.</div>';
      } else {
        const currentUsername = window.currentSession?.email || '';
        chatScroller.innerHTML = messages.map(message => {
          const sent = message.emisor === currentUsername;
          return `
            <div class="msg-bubble ${sent ? 'msg-sent' : 'msg-received'}">
              <strong>${escapeHtml(sent ? session.name : director?.nombre_completo || 'Dirección')}</strong>
              <div>${escapeHtml(message.mensaje)}</div>
              <div class="msg-time">${escapeHtml(message.fecha_envio)}</div>
            </div>
          `;
        }).join('');
      }
      chatScroller.scrollTop = chatScroller.scrollHeight;
    }

    async function loadConversation() {
      const directorResult = await fetchJson(`${getMensajesApiUrl()}?action=director`);
      director = directorResult.data;
      directorLabel.textContent = director?.nombre_completo || 'Dirección';
      const conversationResult = await fetchJson(`${getMensajesApiUrl()}?action=conversation&with=${encodeURIComponent(director.username)}`);
      renderMessages(Array.isArray(conversationResult.data?.mensajes) ? conversationResult.data.mensajes : []);
      chatInput.disabled = false;
      sendBtn.disabled = false;
      updateNotificationBadge();
    }

    async function sendMessage() {
      if (!director) return;
      const text = chatInput.value.trim();
      if (!text) return;

      chatInput.disabled = true;
      sendBtn.disabled = true;
      try {
        await fetchJson(getMensajesApiUrl(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken()
          },
          body: JSON.stringify({
            destinatario: director.username,
            mensaje: text
          })
        });
        chatInput.value = '';
        const result = await fetchJson(`${getMensajesApiUrl()}?action=conversation&with=${encodeURIComponent(director.username)}`);
        renderMessages(Array.isArray(result.data?.mensajes) ? result.data.mensajes : []);
      } catch (error) {
        showChatAlert(error.message, false);
      } finally {
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();
      }
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    loadConversation().catch(error => {
      showChatAlert(error.message, false);
      directorLabel.textContent = 'No disponible';
      chatScroller.innerHTML = '<div style="padding:28px; text-align:center; color:var(--danger);">No se pudo cargar la conversación.</div>';
    });
  }

  /* ==========================================================================
     2. CURSOS: ELEGIR CURSO, MATERIAL DE CLASE & REGISTRAR NOTAS
     ========================================================================== */
  function renderCursos(container) {
    setPageTitle('Gestión de Cursos');

    const db = window.SchoolDB.getData();
    let assignedCourses = [];

    container.innerHTML = `
      <!-- selector top panel -->
      <div class="selector-panel">
        <label class="selector-label" for="course-picker">Seleccione Curso:</label>
        <select id="course-picker" class="control-select" style="max-width: 320px;">
          <option value="" disabled selected>-- Cargando cursos asignados... --</option>
        </select>
      </div>

      <p id="assigned-courses-message" style="color: var(--neutral-medium); margin: 0 0 16px;"></p>

      <div id="course-content-area" style="display: none;">
        <div class="tabs-container">
          <button class="tab-btn active" id="tab-materials">Material de Clase</button>
          <button class="tab-btn" id="tab-grades">Registrar Notas</button>
        </div>

        <div id="tab-view-container">
          <!-- view content injected dynamically -->
        </div>
      </div>
    `;

    const coursePicker = document.getElementById('course-picker');
    const contentArea = document.getElementById('course-content-area');
    const tabMaterials = document.getElementById('tab-materials');
    const tabGrades = document.getElementById('tab-grades');
    let activeCourseId = '';
    let currentTab = 'materials'; // materials | grades

    loadAssignedTeacherCourses();

    coursePicker.addEventListener('change', function() {
      activeCourseId = this.value;
      contentArea.style.display = 'block';
      renderActiveTab();
    });

    tabMaterials.addEventListener('click', function() {
      tabMaterials.classList.add('active');
      tabGrades.classList.remove('active');
      currentTab = 'materials';
      renderActiveTab();
    });

    tabGrades.addEventListener('click', function() {
      tabGrades.classList.add('active');
      tabMaterials.classList.remove('active');
      currentTab = 'grades';
      renderActiveTab();
    });

    function renderActiveTab() {
      const tabContainer = document.getElementById('tab-view-container');
      const course = (window.assignedTeacherCourses || assignedCourses).find(c => String(c.id_curso) === activeCourseId);
      if (!course) return;
      
      if (currentTab === 'materials') {
        tabContainer.innerHTML = `
          <div class="card card-accent" style="max-width: 600px;">
            <div class="card-header">
              <h3 class="card-title">Descarga de Material Docente - ${course.nombre}</h3>
            </div>
            <p style="font-size: 13.5px; color: var(--neutral-medium); margin-bottom: 20px;">
              Descargue los documentos base para el desarrollo del plan curricular académico vigente homologados por el Minedu.
            </p>

            <div class="download-item">
              <div class="download-info">
                <div class="download-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <div class="download-text">
                  <h4>Currículo Nacional 2026</h4>
                  <span>Documento oficial curricular del Ministerio de Educación (PDF, 240 KB)</span>
                </div>
              </div>
              <a href="docs/curriculo.pdf" download="Curriculo_Nacional_2026.pdf" class="btn btn-primary btn-sm">Descargar</a>
            </div>

            <div class="download-item">
              <div class="download-info">
                <div class="download-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <div class="download-text">
                  <h4>Sílabo Escolar de Asignatura</h4>
                  <span>Dosificación y plan de actividades por bimestre (PDF, 150 KB)</span>
                </div>
              </div>
              <a href="docs/syllabus.pdf" download="Silabo_Curso.pdf" class="btn btn-primary btn-sm">Descargar</a>
            </div>
          </div>
        `;
      } else {
        // Grades Entry View
        // Map courseId to db subject key (MAT5P -> matematica, COM5P -> comunicacion, etc)
        let subjectKey = 'matematica';
        if (activeCourseId === 'MAT5P' || activeCourseId === 'INI5A') subjectKey = 'matematica';
        if (activeCourseId === 'COM5P') subjectKey = 'comunicacion';
        if (activeCourseId === 'CIEN5P') subjectKey = 'ciencia';

        // Filter students according to course level (Primaria or Inicial)
        const relevantStudents = db.students;
        
        let tableRows = '';
        relevantStudents.forEach(st => {
          const currentGrade = st.grades[subjectKey] !== undefined ? st.grades[subjectKey] : '';
          const classColor = currentGrade !== '' && currentGrade < 11 ? 'fail' : 'pass';

          tableRows += `
            <tr data-student-id="${st.id}">
              <td style="font-weight: 600;">${st.id}</td>
              <td>${st.name}</td>
              <td>${st.grado}</td>
              <td style="text-align: center;">
                <input type="number" min="0" max="20" class="grade-input ${classColor}" value="${currentGrade}" data-student="${st.id}" data-subject="${subjectKey}">
              </td>
              <td style="text-align: center;" class="row-status">
                <span style="font-size: 11px; color: var(--neutral-medium);">Cargado</span>
              </td>
            </tr>
          `;
        });

        tabContainer.innerHTML = `
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Registro de Calificaciones: ${course.nombre}</h3>
              <div id="grades-save-indicator" class="badge badge-success" style="display:none;">¡Notas guardadas automáticamente!</div>
            </div>
            
            <div class="table-responsive">
              <table class="school-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Apellidos y Nombres</th>
                    <th>Nivel / Grado</th>
                    <th style="width: 120px; text-align: center;">Nota (0 - 20)</th>
                    <th style="width: 150px; text-align: center;">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>

            <div class="btn-container" style="justify-content: flex-end; margin-top: 20px;">
              <button class="btn btn-secondary" id="btn-revert-grades">Reestablecer</button>
              <button class="btn btn-primary" id="btn-save-grades-manually">Guardar Registro</button>
            </div>
          </div>
        `;

        // Handle auto color adjustments and auto-save indicators
        const gradeInputs = tabContainer.querySelectorAll('.grade-input');
        gradeInputs.forEach(input => {
          input.addEventListener('input', function() {
            const val = parseInt(this.value);
            const statusCell = this.closest('tr').querySelector('.row-status');
            
            // Adjust colors based on grade value
            if (!isNaN(val)) {
              if (val < 11) {
                this.className = 'grade-input fail';
              } else {
                this.className = 'grade-input pass';
              }
              statusCell.innerHTML = `<span style="font-size: 11px; color: var(--accent-orange); font-weight: 600;">Modificado</span>`;
            } else {
              this.className = 'grade-input';
              statusCell.innerHTML = ``;
            }
          });
        });

        // Save actions
        const saveBtn = document.getElementById('btn-save-grades-manually');
        const revertBtn = document.getElementById('btn-revert-grades');
        const indicator = document.getElementById('grades-save-indicator');

        saveBtn.addEventListener('click', function() {
          gradeInputs.forEach(input => {
            const stId = input.getAttribute('data-student');
            const sub = input.getAttribute('data-subject');
            const val = input.value;
            window.SchoolDB.saveGrade(stId, sub, val);
            
            const statusCell = input.closest('tr').querySelector('.row-status');
            statusCell.innerHTML = `<span style="font-size: 11px; color: var(--success); font-weight: 600;">Guardado ✓</span>`;
          });
          
          indicator.style.display = 'block';
          setTimeout(() => { indicator.style.display = 'none'; }, 3000);
        });

        revertBtn.addEventListener('click', function() {
          renderActiveTab(); // simply re-render view from database values
        });
      }
    }
  }

  /* ==========================================================================
     3. ACTIVIDADES, CALENDARIO INSTITUCIONAL Y HORARIO DOCENTE
     ========================================================================== */
  function loadAssignedTeacherCourses() {
    const coursePicker = document.getElementById('course-picker');
    const message = document.getElementById('assigned-courses-message');
    if (!coursePicker || !message) return;

    fetch(`${getCursosApiUrl()}?scope=mine`, { cache: 'no-store', credentials: 'same-origin' })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(result => {
        if (!result.success) throw new Error(result.message);
        window.assignedTeacherCourses = result.data || [];
        if (!window.assignedTeacherCourses.length) {
          coursePicker.innerHTML = '<option value="" selected>No tiene cursos asignados</option>';
          message.textContent = 'Cuando Dirección le asigne un curso, aparecerá únicamente aquí.';
          return;
        }
        coursePicker.innerHTML = '<option value="" disabled selected>-- Elija un curso asignado --</option>' + window.assignedTeacherCourses.map(course =>
          `<option value="${course.id_curso}">${course.nombre} - ${course.nombre_grado} ${course.seccion}</option>`
        ).join('');
        message.textContent = 'Solo se muestran los cursos asignados a su cuenta.';
      })
      .catch(() => {
        coursePicker.innerHTML = '<option value="" selected>No fue posible cargar sus cursos</option>';
        message.textContent = 'Intente recargar la página.';
      });
  }

  function renderActividades(container) {
    setPageTitle('Actividades, Calendario y Horario');

    const today = new Date();
    let currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
    let activeTab = 'calendar';
    let agenda = { cursos: [], horario: [], actividades: [], eventos: [] };

    container.innerHTML = `
      <div class="tabs-container" style="margin-bottom:20px;">
        <button class="tab-btn active" data-agenda-tab="calendar">Calendario Institucional</button>
        <button class="tab-btn" data-agenda-tab="schedule">Mi Horario</button>
        <button class="tab-btn" data-agenda-tab="activities">Actividades Académicas</button>
      </div>
      <div id="agenda-alert" style="display:none; padding:10px; border-radius:6px; text-align:center; margin-bottom:14px;"></div>
      <div id="agenda-view"><div class="card" style="text-align:center;">Cargando agenda...</div></div>
    `;

    const view = document.getElementById('agenda-view');
    const alertBox = document.getElementById('agenda-alert');
    const tabButtons = Array.from(container.querySelectorAll('[data-agenda-tab]'));

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
      const result = await response.json().catch(() => ({ success:false, message:'Respuesta inválida del servidor.' }));
      if (!response.ok || !result.success) {
        throw new Error(result.message || `Error HTTP ${response.status}`);
      }
      return result;
    }

    function formatMonth(date) {
      const value = new Intl.DateTimeFormat('es-PE', { month:'long', year:'numeric' }).format(date);
      return value.charAt(0).toUpperCase() + value.slice(1);
    }

    function parseServerDate(value) {
      if (!value) return null;
      const normalized = String(value).replace(' ', 'T');
      const date = new Date(normalized);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    function renderCalendar() {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const offset = (firstDay.getDay() + 6) % 7;
      const daysInMonth = lastDay.getDate();
      const cellsNeeded = Math.ceil((offset + daysInMonth) / 7) * 7;
      const eventsByDay = {};

      (agenda.eventos || []).forEach(event => {
        const start = parseServerDate(event.fecha_inicio);
        const end = parseServerDate(event.fecha_fin);
        if (!start || !end) return;

        const cursor = new Date(Math.max(start.getTime(), firstDay.getTime()));
        cursor.setHours(0, 0, 0, 0);
        const limit = new Date(Math.min(end.getTime(), lastDay.getTime()));
        limit.setHours(23, 59, 59, 999);

        while (cursor <= limit) {
          const day = cursor.getDate();
          if (!eventsByDay[day]) eventsByDay[day] = [];
          eventsByDay[day].push(event);
          cursor.setDate(cursor.getDate() + 1);
        }
      });

      const labels = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
        .map(label => `<div class="calendar-day-name">${label}</div>`).join('');
      let cells = '';

      for (let i = 0; i < cellsNeeded; i++) {
        const dayNumber = i - offset + 1;
        if (dayNumber < 1 || dayNumber > daysInMonth) {
          cells += '<div class="calendar-day-cell other-month"><div class="calendar-event-list"></div></div>';
          continue;
        }

        const isToday = dayNumber === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const dayEvents = eventsByDay[dayNumber] || [];
        const eventsHtml = dayEvents.map(event => {
          const start = parseServerDate(event.fecha_inicio);
          const time = start && start.getDate() === dayNumber
            ? new Intl.DateTimeFormat('es-PE', { hour:'2-digit', minute:'2-digit' }).format(start)
            : '';
          return `<div class="calendar-event-item event-admin" title="${escapeHtml(event.nombre)}">${time ? `${escapeHtml(time)} · ` : ''}${escapeHtml(event.nombre)}</div>`;
        }).join('');

        cells += `
          <div class="calendar-day-cell ${isToday ? 'today' : ''}">
            <span class="calendar-day-number">${dayNumber}</span>
            <div class="calendar-event-list">${eventsHtml}</div>
          </div>
        `;
      }

      view.innerHTML = `
        <div class="calendar-wrapper">
          <div class="calendar-header-actions">
            <div>
              <h3 class="calendar-month-title">${escapeHtml(formatMonth(currentDate))}</h3>
              <p style="font-size:12.5px; color:var(--neutral-medium); margin-top:4px;">Eventos institucionales registrados por Dirección.</p>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="calendar-nav-btn" id="calendar-prev" aria-label="Mes anterior">&lt;</button>
              <button class="calendar-nav-btn" id="calendar-today">Hoy</button>
              <button class="calendar-nav-btn" id="calendar-next" aria-label="Mes siguiente">&gt;</button>
            </div>
          </div>
          <div class="calendar-grid">${labels}${cells}</div>
          ${(agenda.eventos || []).length === 0 ? '<div style="margin-top:16px; text-align:center; color:var(--neutral-medium); font-size:13px;">No hay eventos institucionales registrados para este mes.</div>' : ''}
        </div>
      `;

      async function changeMonth(nextDate) {
        const previousDate = currentDate;
        currentDate = nextDate;
        try {
          await loadAgenda();
        } catch (error) {
          currentDate = previousDate;
          showAlert(error.message, false);
          renderCalendar();
        }
      }

      document.getElementById('calendar-prev').addEventListener('click', () => {
        changeMonth(new Date(year, month - 1, 1));
      });
      document.getElementById('calendar-next').addEventListener('click', () => {
        changeMonth(new Date(year, month + 1, 1));
      });
      document.getElementById('calendar-today').addEventListener('click', () => {
        changeMonth(new Date(today.getFullYear(), today.getMonth(), 1));
      });
    }

    function renderSchedule() {
      const rows = agenda.horario || [];
      view.innerHTML = `
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Horario Semanal Asignado</h3>
              <p style="font-size:12.5px; color:var(--neutral-medium); margin-top:4px;">Información obtenida de ASIGNACION_CURSO.</p>
            </div>
          </div>
          <div class="table-responsive">
            <table class="school-table">
              <thead><tr><th>Día</th><th>Hora</th><th>Curso</th><th>Grado y Sección</th><th>Año</th></tr></thead>
              <tbody>
                ${rows.length ? rows.map(item => `
                  <tr>
                    <td style="font-weight:700;">${escapeHtml(item.dia_horario)}</td>
                    <td>${escapeHtml(item.hora_inicio)} – ${escapeHtml(item.hora_fin)}</td>
                    <td>${escapeHtml(item.curso)}</td>
                    <td>${escapeHtml(item.grado)}</td>
                    <td>${escapeHtml(item.anio)}</td>
                  </tr>
                `).join('') : '<tr><td colspan="5" style="text-align:center; color:var(--neutral-medium);">No tiene horarios activos asignados.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    function renderActivities() {
      const courses = agenda.cursos || [];
      const activities = agenda.actividades || [];
      const courseOptions = courses.map(item => `
        <option value="${escapeHtml(item.id_gradoCurso)}">${escapeHtml(item.curso)} — ${escapeHtml(item.grado)} (${escapeHtml(item.anio)})</option>
      `).join('');

      view.innerHTML = `
        <div class="dashboard-grid" style="grid-template-columns:minmax(300px,0.85fr) minmax(520px,1.65fr);">
          <div class="card card-accent">
            <div class="card-header"><h3 class="card-title" id="activity-form-title">Registrar Actividad</h3></div>
            <form id="activity-form" style="display:flex; flex-direction:column; gap:15px;">
              <input type="hidden" id="activity-id">
              <div class="form-group">
                <label class="form-label-desc" for="activity-course">Curso y Grado</label>
                <select id="activity-course" class="control-select" required ${courses.length ? '' : 'disabled'}>
                  <option value="" disabled selected>-- Seleccione --</option>${courseOptions}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label-desc" for="activity-name">Nombre</label>
                <input type="text" id="activity-name" class="control-input" maxlength="100" placeholder="Ej.: Práctica calificada 2" required>
              </div>
              <div class="form-group">
                <label class="form-label-desc" for="activity-weight">Peso porcentual</label>
                <input type="number" id="activity-weight" class="control-input" min="0.01" max="100" step="0.01" placeholder="Ej.: 20" required>
              </div>
              <div style="display:flex; gap:8px;">
                <button type="submit" id="activity-submit" class="btn btn-primary" style="flex:1;" ${courses.length ? '' : 'disabled'}>Guardar Actividad</button>
                <button type="button" id="activity-cancel" class="btn btn-secondary" style="display:none;">Cancelar</button>
              </div>
              ${courses.length ? '' : '<div class="badge badge-warning" style="padding:10px; text-align:center;">No tiene cursos asignados.</div>'}
            </form>
          </div>

          <div class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title">Actividades Registradas</h3>
                <p style="font-size:12.5px; color:var(--neutral-medium); margin-top:4px;">ACTIVIDADES no posee fecha en la base actual; por eso se administra como lista académica.</p>
              </div>
            </div>
            <div class="table-responsive">
              <table class="school-table">
                <thead><tr><th>ID</th><th>Actividad</th><th>Curso</th><th>Grado</th><th>Peso</th><th style="text-align:center;">Acciones</th></tr></thead>
                <tbody id="activities-tbody">
                  ${activities.length ? activities.map(item => `
                    <tr>
                      <td style="font-weight:600;">${escapeHtml(item.id_actividad)}</td>
                      <td>${escapeHtml(item.nombre)}</td>
                      <td>${escapeHtml(item.curso)}</td>
                      <td>${escapeHtml(item.grado)}</td>
                      <td><span class="badge badge-primary">${escapeHtml(Number(item.peso).toFixed(2))}%</span></td>
                      <td style="text-align:center; white-space:nowrap;">
                        <button type="button" class="btn btn-secondary btn-sm activity-edit" data-id="${escapeHtml(item.id_actividad)}">Editar</button>
                        <button type="button" class="btn btn-secondary btn-sm activity-delete" data-id="${escapeHtml(item.id_actividad)}" style="border-color:#dc2626; color:#dc2626;">Eliminar</button>
                      </td>
                    </tr>
                  `).join('') : '<tr><td colspan="6" style="text-align:center; color:var(--neutral-medium);">No hay actividades registradas para sus cursos.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      const form = document.getElementById('activity-form');
      const idInput = document.getElementById('activity-id');
      const courseInput = document.getElementById('activity-course');
      const nameInput = document.getElementById('activity-name');
      const weightInput = document.getElementById('activity-weight');
      const submitBtn = document.getElementById('activity-submit');
      const cancelBtn = document.getElementById('activity-cancel');
      const formTitle = document.getElementById('activity-form-title');
      const tbody = document.getElementById('activities-tbody');

      function resetForm() {
        form.reset();
        idInput.value = '';
        formTitle.textContent = 'Registrar Actividad';
        submitBtn.textContent = 'Guardar Actividad';
        cancelBtn.style.display = 'none';
      }

      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = Number(idInput.value || 0);
        submitBtn.disabled = true;
        try {
          await fetchJson(getActividadesApiUrl(), {
            method: id ? 'PATCH' : 'POST',
            headers: {
              'Content-Type':'application/json',
              'X-CSRF-Token':getCsrfToken()
            },
            body:JSON.stringify({
              id_actividad:id || undefined,
              id_gradoCurso:Number(courseInput.value),
              nombre:nameInput.value.trim(),
              peso:Number(weightInput.value)
            })
          });
          showAlert(id ? '✓ Actividad actualizada correctamente.' : '✓ Actividad registrada correctamente.', true);
          resetForm();
          await loadAgenda();
        } catch (error) {
          showAlert(error.message, false);
        } finally {
          submitBtn.disabled = false;
        }
      });

      cancelBtn.addEventListener('click', resetForm);

      tbody.addEventListener('click', async function(e) {
        const editButton = e.target.closest('.activity-edit');
        const deleteButton = e.target.closest('.activity-delete');

        if (editButton) {
          const item = activities.find(row => Number(row.id_actividad) === Number(editButton.dataset.id));
          if (!item) return;
          idInput.value = item.id_actividad;
          courseInput.value = item.id_gradoCurso;
          nameInput.value = item.nombre;
          weightInput.value = Number(item.peso);
          formTitle.textContent = 'Editar Actividad';
          submitBtn.textContent = 'Actualizar Actividad';
          cancelBtn.style.display = '';
          nameInput.focus();
          return;
        }

        if (deleteButton) {
          const id = Number(deleteButton.dataset.id);
          const item = activities.find(row => Number(row.id_actividad) === id);
          if (!window.confirm(`¿Eliminar la actividad ${item ? item.nombre : ''}?`)) return;
          deleteButton.disabled = true;
          try {
            await fetchJson(getActividadesApiUrl(), {
              method:'DELETE',
              headers:{
                'Content-Type':'application/json',
                'X-CSRF-Token':getCsrfToken()
              },
              body:JSON.stringify({ id_actividad:id })
            });
            showAlert('✓ Actividad eliminada correctamente.', true);
            await loadAgenda();
          } catch (error) {
            deleteButton.disabled = false;
            showAlert(error.message, false);
          }
        }
      });
    }

    function renderActiveView() {
      tabButtons.forEach(button => button.classList.toggle('active', button.dataset.agendaTab === activeTab));
      if (activeTab === 'calendar') renderCalendar();
      if (activeTab === 'schedule') renderSchedule();
      if (activeTab === 'activities') renderActivities();
    }

    async function loadAgenda() {
      view.innerHTML = '<div class="card" style="text-align:center;">Cargando agenda...</div>';
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const result = await fetchJson(`${getActividadesApiUrl()}?year=${year}&month=${month}`);
      agenda = result.data || { cursos:[], horario:[], actividades:[], eventos:[] };
      renderActiveView();
    }

    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        activeTab = this.dataset.agendaTab;
        renderActiveView();
      });
    });

    loadAgenda().catch(error => {
      showAlert(error.message, false);
      view.innerHTML = '<div class="card" style="text-align:center; color:var(--danger);">No se pudo cargar la agenda docente.</div>';
    });
  }

  /* ==========================================================================
     4. REGISTRAR ASISTENCIA: SECTOR DE CURSO, ASISTENCIA GENERAL & FILTROS
     ========================================================================== */
  function renderAsistencia(container) {
    setPageTitle('Registrar Asistencia');

    let selectedDate = new Date().toISOString().split('T')[0];
    // Mapa de asignaciones cargadas desde la BD: key = "id_curso-id_grado"
    let asignacionesMap = {};

    container.innerHTML = `
      <div class="selector-panel" style="display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-end; padding: 20px; background: var(--white); border-radius: var(--radius-lg); border: 1px solid var(--neutral-light); box-shadow: var(--shadow-sm); margin-bottom: 24px;">
        <div class="form-group" style="margin-bottom: 0; flex: 1.5; min-width: 280px;">
          <label class="selector-label" for="asist-course-picker" style="font-weight: 600; margin-bottom: 8px; color: var(--primary-dark); display: block;">Seleccione Curso:</label>
          <select id="asist-course-picker" class="control-select" style="width: 100%;">
            <option value="" disabled selected>Cargando cursos...</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 0; flex: 1; min-width: 180px;">
          <label class="selector-label" for="asist-date-picker" style="font-weight: 600; margin-bottom: 8px; color: var(--primary-dark); display: block;">Fecha de Asistencia:</label>
          <input type="date" id="asist-date-picker" class="control-input" value="${selectedDate}" style="width: 100%;">
        </div>
      </div>

      <div id="asist-content-area" style="display: none;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 15px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1; max-width: 350px; background: var(--white); border: 1px solid var(--neutral-light); padding: 8px 12px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
            <svg style="width: 18px; height: 18px; color: var(--neutral-medium);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" id="asist-search-student" placeholder="Buscar alumno por nombre o código..." style="border: none; outline: none; width: 100%; font-size: 14px; background: transparent; margin: 0; padding: 0;">
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" id="btn-mark-all-present" style="display: flex; align-items: center; gap: 6px; padding: 8px 14px; font-weight: 600;">
              <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Marcar todos Presente
            </button>
          </div>
        </div>

        <div class="card">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <h3 class="card-title" id="asist-card-title">Control de Asistencia</h3>
            <div id="asist-save-indicator" class="badge badge-success" style="display:none; padding: 6px 12px; border-radius: var(--radius-sm);">Asistencia registrada correctamente</div>
          </div>

          <div class="table-responsive">
            <table class="school-table">
              <thead>
                <tr>
                  <th style="width: 100px;">Código</th>
                  <th>Alumno</th>
                  <th style="width: 150px;">Grado</th>
                  <th style="text-align: center; width: 280px;">Registro de Estado</th>
                </tr>
              </thead>
              <tbody id="asistencia-tbody">
                <!-- Rows load here dynamically -->
              </tbody>
            </table>
          </div>

          <div class="btn-container" style="justify-content: flex-end; margin-top: 20px;">
            <button class="btn btn-primary" id="btn-save-asist" style="padding: 10px 24px; font-weight: 700;">Confirmar Asistencia</button>
          </div>
        </div>
      </div>
    `;

    const picker = document.getElementById('asist-course-picker');
    const datePicker = document.getElementById('asist-date-picker');
    const area = document.getElementById('asist-content-area');
    const searchInput = document.getElementById('asist-search-student');
    const markAllPresentBtn = document.getElementById('btn-mark-all-present');
    const saveBtn = document.getElementById('btn-save-asist');

    // ── Cargar cursos asignados al docente logueado desde la API ──────────
    const misCursosUrl = new URL(getApiUrl('public/api/cursos.php'));
    misCursosUrl.searchParams.set('action', 'get-mis-cursos');
    fetch(misCursosUrl.toString(), {
      headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      cache: 'no-store',
      credentials: 'include'
    })
      .then(r => r.json())
      .then(res => {
        if (!res.success || !res.data || !Array.isArray(res.data.assignments)) {
          picker.innerHTML = '<option value="" disabled selected>No hay cursos disponibles</option>';
          return;
        }

        const assignments = res.data.assignments;

        // Eliminar duplicados: mismo curso + grado
        const seen = new Set();
        const unique = assignments.filter(a => {
          const key = `${a.id_curso}-${a.id_grado}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        if (unique.length === 0) {
          picker.innerHTML = '<option value="" disabled selected>No hay asignaciones registradas</option>';
          return;
        }

        // Construir el mapa y las opciones del combobox
        asignacionesMap = {};
        let optionsHtml = '<option value="" disabled selected>-- Elija un curso --</option>';
        unique.forEach(a => {
          const key = `${a.id_curso}-${a.id_grado}`;
          asignacionesMap[key] = a;
          optionsHtml += `<option value="${key}">${a.nombre_curso} &ndash; ${a.nombre_grado} ${a.seccion || ''}</option>`;
        });

        picker.innerHTML = optionsHtml;
      })
      .catch(() => {
        picker.innerHTML = '<option value="" disabled selected>Error al cargar cursos</option>';
      });

    picker.addEventListener('change', function() {
      area.style.display = 'block';
      loadAttendanceTable();
    });

    datePicker.addEventListener('change', function() {
      selectedDate = this.value;
      if (picker.value) {
        loadAttendanceTable();
      }
    });

    searchInput.addEventListener('input', function() {
      loadAttendanceTable();
    });

    markAllPresentBtn.addEventListener('click', function() {
      const radios = document.querySelectorAll('#asistencia-tbody input[value="P"]');
      radios.forEach(radio => {
        radio.checked = true;
        updateRowHighlight(radio.closest('tr'), 'P');
      });
    });

    function updateRowHighlight(row, status) {
      row.classList.remove('status-row-p', 'status-row-t', 'status-row-f');
      if (status === 'P') {
        row.style.backgroundColor = 'rgba(40, 167, 69, 0.04)';
      } else if (status === 'T') {
        row.style.backgroundColor = 'rgba(255, 193, 7, 0.06)';
      } else if (status === 'F') {
        row.style.backgroundColor = 'rgba(220, 53, 69, 0.05)';
      }
    }

    function loadAttendanceTable() {
      const tbody = document.getElementById('asistencia-tbody');
      const key = picker.value;
      const asig = asignacionesMap[key];

      if (!asig) return;

      document.getElementById('asist-card-title').textContent =
        `Asistencia - ${asig.nombre_curso} \u2013 ${asig.nombre_grado} ${asig.seccion || ''} (${selectedDate})`;

      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;
        color: var(--neutral-medium); padding: 24px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:6px;">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>Cargando estudiantes...</td></tr>`;

      // Filtramos alumnos por id_grado de la asignación seleccionada
      const apiUrl = new URL(getApiUrl('public/api/asistencia.php'));
      apiUrl.searchParams.set('fecha', selectedDate);
      apiUrl.searchParams.set('id_grado', asig.id_grado);

      fetch(apiUrl.toString(), {
        headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        cache: 'no-store'
      })
        .then(r => r.json())
        .then(res => {
          if (!res.success) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;
              color:var(--danger);padding:24px;">Error: ${res.message}</td></tr>`;
            return;
          }

          let students = Array.isArray(res.data) ? res.data : [];

          // Filtro por búsqueda local
          const query = searchInput.value.trim().toLowerCase();
          if (query) {
            students = students.filter(s =>
              s.nombre_completo.toLowerCase().includes(query) ||
              s.cod_alumno.toLowerCase().includes(query)
            );
          }

          if (students.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;
              color:var(--neutral-medium);padding:24px;">
              No se encontraron estudiantes para este grado.</td></tr>`;
            return;
          }

          let rows = '';
          students.forEach(st => {
            const currentStatus = st.tipo || 'P';
            let rowBg = '';
            if (currentStatus === 'P') rowBg = 'background-color:rgba(40,167,69,0.04);';
            if (currentStatus === 'T') rowBg = 'background-color:rgba(255,193,7,0.06);';
            if (currentStatus === 'F') rowBg = 'background-color:rgba(220,53,69,0.05);';

            rows += `
              <tr data-st-id="${st.id_alumno}" style="${rowBg} transition:background-color var(--transition-fast);">
                <td style="font-weight:600;">${st.cod_alumno}</td>
                <td style="font-weight:500;">${st.nombre_completo}</td>
                <td>${st.nombre_grado}${st.seccion ? ' &ndash; ' + st.seccion : ''}</td>
                <td style="text-align:center;">
                  <div style="display:flex;gap:20px;justify-content:center;">
                    <label style="cursor:pointer;display:flex;align-items:center;gap:6px;font-weight:600;color:var(--success);">
                      <input type="radio" name="att-${st.id_alumno}" value="P"
                        ${currentStatus === 'P' ? 'checked' : ''}
                        style="accent-color:var(--success);width:16px;height:16px;"> P
                    </label>
                    <label style="cursor:pointer;display:flex;align-items:center;gap:6px;font-weight:600;color:var(--warning);">
                      <input type="radio" name="att-${st.id_alumno}" value="T"
                        ${currentStatus === 'T' ? 'checked' : ''}
                        style="accent-color:var(--warning);width:16px;height:16px;"> T
                    </label>
                    <label style="cursor:pointer;display:flex;align-items:center;gap:6px;font-weight:600;color:var(--danger);">
                      <input type="radio" name="att-${st.id_alumno}" value="F"
                        ${currentStatus === 'F' ? 'checked' : ''}
                        style="accent-color:var(--danger);width:16px;height:16px;"> F
                    </label>
                  </div>
                </td>
              </tr>
            `;
          });
          tbody.innerHTML = rows;

          // Highlight dinámico al cambiar radio
          tbody.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', function() {
              if (this.checked) updateRowHighlight(this.closest('tr'), this.value);
            });
          });
        })
        .catch(() => {
          tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;
            color:var(--danger);padding:24px;">
            Error de conexión con el servidor.</td></tr>`;
        });
    }

    // Confirmar Asistencia → persiste en la BD vía API
    saveBtn.addEventListener('click', function() {
      const rows = document.querySelectorAll('#asistencia-tbody tr');
      const registros = [];

      rows.forEach(tr => {
        const stId = parseInt(tr.getAttribute('data-st-id'), 10);
        if (!stId) return;
        const radio = tr.querySelector(`input[name="att-${stId}"]:checked`);
        if (radio) registros.push({ id_alumno: stId, tipo: radio.value });
      });

      if (registros.length === 0) return;

      const indicator = document.getElementById('asist-save-indicator');

      fetch(getApiUrl('public/api/asistencia.php'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ fecha: selectedDate, registros: registros })
      })
        .then(r => r.json())
        .then(res => {
          if (indicator) {
            indicator.textContent = res.success
              ? `\u2713 ${res.message}`
              : `\u2717 ${res.message}`;
            indicator.className = 'badge ' + (res.success ? 'badge-success' : 'badge-danger');
            indicator.style.display = 'block';
            setTimeout(() => { indicator.style.display = 'none'; }, 3000);
          }
        })
        .catch(() => {
          if (indicator) {
            indicator.textContent = '\u2717 Error de conexi\u00f3n con el servidor.';
            indicator.className = 'badge badge-danger';
            indicator.style.display = 'block';
            setTimeout(() => { indicator.style.display = 'none'; }, 3000);
          }
        });
    });

  }

  /* ==========================================================================
     5. INCIDENCIAS: REDACCIÓN DOCENTE CON PERSISTENCIA MYSQL
     ========================================================================== */
  function renderIncidencias(container) {
    setPageTitle('Registro de Incidencias');

    let incidencias = [];

    container.innerHTML = `
      <div class="dashboard-grid" style="grid-template-columns: minmax(300px, 0.9fr) minmax(520px, 1.6fr);">
        <div class="card card-accent">
          <div class="card-header">
            <h3 class="card-title">Redactar Nueva Incidencia</h3>
          </div>
          <form id="incident-form" class="form-layout" style="display: flex; flex-direction: column; gap: 16px;">
            <div class="form-group">
              <label class="form-label-desc" for="inc-student">Alumno Relacionado</label>
              <select id="inc-student" class="control-select" required disabled>
                <option value="">Cargando alumnos...</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label-desc" for="inc-priority">Prioridad</label>
              <select id="inc-priority" class="control-select" required>
                <option value="Baja">Baja</option>
                <option value="Media" selected>Media</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label-desc" for="inc-detail">Detalle del Suceso</label>
              <textarea id="inc-detail" class="control-textarea" minlength="10" maxlength="3000" placeholder="Describa lo ocurrido de manera clara y objetiva..." required></textarea>
              <small style="display:block; margin-top:6px; color:var(--neutral-medium);">Mínimo 10 caracteres.</small>
            </div>
            <div id="inc-alert" style="display:none; padding:10px; border-radius:6px; text-align:center;"></div>
            <button type="submit" id="inc-submit-btn" class="btn btn-primary" style="width: 100%;" disabled>
              Reportar a Dirección
            </button>
          </form>
        </div>

        <div class="card">
          <div class="card-header" style="display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap;">
            <h3 class="card-title">Mis Incidencias Reportadas</h3>
            <button type="button" class="btn btn-secondary btn-sm" id="inc-refresh-btn">Actualizar</button>
          </div>
          <div class="table-responsive">
            <table class="school-table">
              <thead>
                <tr>
                  <th style="width:70px;">ID</th>
                  <th style="width:105px;">Fecha</th>
                  <th style="width:190px;">Alumno</th>
                  <th>Detalle</th>
                  <th style="width:105px;">Prioridad</th>
                </tr>
              </thead>
              <tbody id="incidents-list-tbody">
                <tr><td colspan="5" style="text-align:center;">Cargando incidencias...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const form = document.getElementById('incident-form');
    const studentSelect = document.getElementById('inc-student');
    const prioritySelect = document.getElementById('inc-priority');
    const detailInput = document.getElementById('inc-detail');
    const tableBody = document.getElementById('incidents-list-tbody');
    const alertBox = document.getElementById('inc-alert');
    const submitBtn = document.getElementById('inc-submit-btn');
    const refreshBtn = document.getElementById('inc-refresh-btn');

    function badgePrioridad(prioridad) {
      if (prioridad === 'Alta') return 'badge-danger';
      if (prioridad === 'Baja') return 'badge-success';
      return 'badge-warning';
    }

    function renderRows() {
      if (!incidencias.length) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--neutral-medium);">Aún no ha registrado incidencias.</td></tr>';
        return;
      }

      tableBody.innerHTML = incidencias.map(inc => `
        <tr>
          <td style="font-weight:600;">${escapeHtml(inc.id_incidencia)}</td>
          <td>${escapeHtml(inc.fecha)}</td>
          <td>
            <strong>${escapeHtml(inc.alumno)}</strong>
            <div style="font-size:11.5px; color:var(--neutral-medium);">${escapeHtml(inc.grado)}</div>
          </td>
          <td style="white-space:normal; line-height:1.45;">${escapeHtml(inc.texto)}</td>
          <td><span class="badge ${badgePrioridad(inc.prioridad)}">${escapeHtml(inc.prioridad)}</span></td>
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

    async function loadStudents() {
      studentSelect.disabled = true;
      submitBtn.disabled = true;
      const result = await fetchJson(`${getIncidenciasApiUrl()}?action=students`);
      const alumnos = Array.isArray(result.data) ? result.data : [];

      if (!alumnos.length) {
        studentSelect.innerHTML = '<option value="">No tiene alumnos asignados en cursos activos</option>';
        return;
      }

      studentSelect.innerHTML = '<option value="" disabled selected>-- Seleccione Alumno --</option>' + alumnos.map(alumno => `
        <option value="${escapeHtml(alumno.id_alumno)}">${escapeHtml(alumno.nombre_completo)} (${escapeHtml(alumno.grado)})</option>
      `).join('');
      studentSelect.disabled = false;
      submitBtn.disabled = false;
    }

    async function loadIncidents() {
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando incidencias...</td></tr>';
      const result = await fetchJson(getIncidenciasApiUrl());
      incidencias = Array.isArray(result.data) ? result.data : [];
      renderRows();
    }

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';

      try {
        await fetchJson(getIncidenciasApiUrl(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken()
          },
          body: JSON.stringify({
            id_alumno: Number(studentSelect.value),
            prioridad: prioritySelect.value,
            texto: detailInput.value.trim()
          })
        });

        form.reset();
        prioritySelect.value = 'Media';
        showAlert('✓ Incidencia registrada y enviada a Dirección.', true);
        await loadIncidents();
      } catch (error) {
        showAlert(error.message, false);
      } finally {
        submitBtn.disabled = studentSelect.options.length <= 1;
        submitBtn.textContent = 'Reportar a Dirección';
      }
    });

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

    Promise.all([loadStudents(), loadIncidents()]).catch(error => {
      showAlert(error.message, false);
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--danger);">No se pudo cargar el módulo.</td></tr>';
    });
  }

  /* ==========================================================================
     6. REPORTES: NOTAS, ASISTENCIAS & ALUMNOS CON FILTROS
     ========================================================================== */
  function renderReportes(container) {
    setPageTitle('Reportes Generales');

    container.innerHTML = `
      <div class="tabs-container" style="margin-bottom: 20px;">
        <button class="tab-btn active" id="rep-tab-grades">Reporte de Notas</button>
        <button class="tab-btn" id="rep-tab-attendance">Reporte de Asistencias</button>
        <button class="tab-btn" id="rep-tab-filters">Alumnos con Filtros</button>
      </div>

      <div id="report-view-content">
        <!-- Rendered view -->
      </div>
    `;

    const btnGrades     = document.getElementById('rep-tab-grades');
    const btnAttendance = document.getElementById('rep-tab-attendance');
    const btnFilters    = document.getElementById('rep-tab-filters');

    btnGrades.addEventListener('click', function() { switchTab('grades'); });
    btnAttendance.addEventListener('click', function() { switchTab('attendance'); });
    btnFilters.addEventListener('click', function() { switchTab('filters'); });

    // Helper para cargar niveles y grados dinámicos de la BD
    function loadFilterOptions(levelSelect, gradeSelect, callback) {
      fetch(getApiUrl('public/api/reportes.php?tipo=filtros'), {
        headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        cache: 'no-store'
      })
        .then(r => r.json())
        .then(res => {
          if (res.success && res.data) {
            const data = res.data;
            if (levelSelect && Array.isArray(data.niveles) && data.niveles.length > 0) {
              const currentLevel = levelSelect.value;
              levelSelect.innerHTML = '<option value="todos">Todos los Niveles</option>';
              data.niveles.forEach(n => {
                levelSelect.innerHTML += `<option value="${n}">${n}</option>`;
              });
              if (currentLevel) levelSelect.value = currentLevel;
            }
            if (gradeSelect && Array.isArray(data.grados) && data.grados.length > 0) {
              const currentGrade = gradeSelect.value;
              gradeSelect.innerHTML = '<option value="todos">Todos los Grados</option>';
              data.grados.forEach(g => {
                gradeSelect.innerHTML += `<option value="${g.nombre}">${g.nombre}</option>`;
              });
              if (currentGrade) gradeSelect.value = currentGrade;
            }
          }
          if (callback) callback();
        })
        .catch(err => {
          console.warn('Error cargando opciones de filtros de la BD:', err);
          if (callback) callback();
        });
    }

    // Pestaña inicial
    switchTab('grades');

    function switchTab(tabName) {
      const content = document.getElementById('report-view-content');

      btnGrades.classList.remove('active');
      btnAttendance.classList.remove('active');
      btnFilters.classList.remove('active');

      if (tabName === 'grades') {
        btnGrades.classList.add('active');

        content.innerHTML = `
          <div class="card" style="margin-bottom: 24px; padding: 20px;">
            <div class="card-header" style="padding-bottom: 12px; margin-bottom: 16px;">
              <h3 class="card-title">Filtros Combinados - Reporte de Notas</h3>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
              <div class="form-group" style="margin: 0;">
                <label class="form-label-desc" style="font-weight:600; margin-bottom: 6px;">Buscar Alumno:</label>
                <input type="text" id="grades-search" class="control-input" placeholder="Nombre o código...">
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label-desc" style="font-weight:600; margin-bottom: 6px;">Nivel de Educación:</label>
                <select id="grades-filter-level" class="control-select">
                  <option value="todos">Todos los Niveles</option>
                  <option value="Primaria">Primaria</option>
                  <option value="Secundaria">Secundaria</option>
                  <option value="Inicial">Inicial</option>
                </select>
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label-desc" style="font-weight:600; margin-bottom: 6px;">Grado:</label>
                <select id="grades-filter-grade" class="control-select">
                  <option value="todos">Todos los Grados</option>
                </select>
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label-desc" style="font-weight:600; margin-bottom: 6px;">Rendimiento:</label>
                <select id="grades-filter-performance" class="control-select">
                  <option value="todos">Todos los Rendimientos</option>
                  <option value="excelente">Excelente (>= 17)</option>
                  <option value="aprobado">Aprobado (11 - 16)</option>
                  <option value="desaprobado">En Alerta (< 11)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Metricas dinámicas -->
          <div class="financial-metrics" id="grades-metrics-row" style="margin-bottom: 24px;"></div>

          <div class="charts-container" style="margin-bottom: 24px;">
            <div class="chart-card" style="grid-column: 1 / -1;">
              <div class="card-header">
                <h3 class="card-title">Promedio General por Asignatura (Filtrado)</h3>
              </div>
              <div class="chart-body" id="grades-chart-body" style="min-height: 180px;">
                <!-- Barras del gráfico -->
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
              <h3 class="card-title">Consolidado General de Calificaciones</h3>
              <span class="badge badge-primary" id="grades-count-badge">0 Alumnos</span>
            </div>
            <div class="table-responsive">
              <table class="school-table" id="grades-table">
                <thead id="grades-thead">
                  <tr>
                    <th>Código</th>
                    <th>Apellidos y Nombres</th>
                    <th>Grado</th>
                    <th style="text-align: center;">Matemática</th>
                    <th style="text-align: center;">Comunicación</th>
                    <th style="text-align: center;">Ciencia y Tec.</th>
                    <th style="text-align: center;">Promedio</th>
                  </tr>
                </thead>
                <tbody id="grades-tbody">
                  <tr><td colspan="7" style="text-align:center; padding: 24px; color: var(--neutral-medium);">Cargando reporte de notas de la Base de Datos...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        `;

        const searchInput        = document.getElementById('grades-search');
        const levelSelect        = document.getElementById('grades-filter-level');
        const gradeSelect        = document.getElementById('grades-filter-grade');
        const performanceSelect  = document.getElementById('grades-filter-performance');

        loadFilterOptions(levelSelect, gradeSelect, function() {
          fetchGradesReport();
        });

        function fetchGradesReport() {
          const q    = encodeURIComponent(searchInput.value.trim());
          const lev  = encodeURIComponent(levelSelect.value);
          const grd  = encodeURIComponent(gradeSelect.value);
          const perf = encodeURIComponent(performanceSelect.value);

          const url = getApiUrl(`public/api/reportes.php?tipo=notas&search=${q}&nivel=${lev}&grado=${grd}&rendimiento=${perf}`);

          fetch(url, {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            cache: 'no-store'
          })
            .then(r => r.json())
            .then(res => {
              if (!res.success || !res.data) {
                document.getElementById('grades-tbody').innerHTML =
                  `<tr><td colspan="7" style="text-align:center; color: var(--danger); padding:24px;">No se pudo cargar el reporte de la base de datos.</td></tr>`;
                return;
              }

              const data       = res.data;
              const alumnos    = data.alumnos || [];
              const cursos     = data.cursos || [];
              const metricas   = data.metricas || {};
              const promediosA = data.promedios_asignatura || [];

              // Render Metric Cards
              const metricsRow = document.getElementById('grades-metrics-row');
              metricsRow.innerHTML = `
                <div class="metric-card">
                  <div class="metric-icon-box" style="background-color: var(--success-bg); color: var(--success);">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <div class="metric-details">
                    <span class="metric-lbl">Promedio General</span>
                    <span class="metric-val" style="color: ${metricas.promedio_general >= 11 ? 'var(--success)' : 'var(--danger)'};">${metricas.promedio_general || 0}</span>
                  </div>
                </div>
                <div class="metric-card">
                  <div class="metric-icon-box" style="background-color: var(--warning-bg); color: var(--warning);">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                  <div class="metric-details">
                    <span class="metric-lbl">Tasa de Aprobación</span>
                    <span class="metric-val">${metricas.tasa_aprobacion || 0}%</span>
                  </div>
                </div>
                <div class="metric-card">
                  <div class="metric-icon-box" style="background-color: var(--primary-bg); color: var(--primary);">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  </div>
                  <div class="metric-details">
                    <span class="metric-lbl">Destacado (Nota: ${metricas.destacado_nota || '-'})</span>
                    <span class="metric-val" style="font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 170px;">${metricas.destacado_nombre || 'Ninguno'}</span>
                  </div>
                </div>
              `;

              // Render Bar Chart
              const chartBody = document.getElementById('grades-chart-body');
              let chartHtml = `
                <div class="chart-axis-lines">
                  <div class="chart-grid-line"><span>20</span></div>
                  <div class="chart-grid-line"><span>15</span></div>
                  <div class="chart-grid-line"><span>10</span></div>
                  <div class="chart-grid-line"><span>05</span></div>
                </div>
              `;

              const colors = ['var(--primary-dark)', 'var(--primary-orange)', 'var(--accent-orange)', 'var(--success)', 'var(--warning)'];

              promediosA.forEach((item, idx) => {
                const avg = item.promedio || 0;
                const col = colors[idx % colors.length];
                chartHtml += `
                  <div class="chart-bar-col">
                    <div class="chart-bar-fill" style="height: ${(avg / 20) * 100}%; background-color: ${col};">
                      <div class="chart-bar-tooltip">${avg}</div>
                    </div>
                    <span class="chart-bar-label">${item.nombre} (${avg})</span>
                  </div>
                `;
              });

              chartBody.innerHTML = chartHtml;

              // Render Table Header & Rows
              const thead = document.getElementById('grades-thead');
              let headHtml = `
                <tr>
                  <th>Código</th>
                  <th>Apellidos y Nombres</th>
                  <th>Grado</th>
              `;
              cursos.forEach(c => {
                headHtml += `<th style="text-align: center;">${c.nombre}</th>`;
              });
              headHtml += `<th style="text-align: center;">Promedio</th></tr>`;
              thead.innerHTML = headHtml;

              const tbody = document.getElementById('grades-tbody');
              if (alumnos.length === 0) {
                const colSpan = 4 + cursos.length;
                tbody.innerHTML = `<tr><td colspan="${colSpan}" style="text-align:center; color: var(--neutral-medium); padding: 24px;">No se encontraron calificaciones con los filtros seleccionados.</td></tr>`;
              } else {
                let tableRows = '';
                alumnos.forEach(s => {
                  const average  = parseFloat(s.promedio) || 0;
                  const avgClass = average < 11 ? 'color: var(--danger); font-weight:700;' : 'color: var(--success); font-weight:700;';

                  tableRows += `
                    <tr>
                      <td style="font-weight:600;">${s.cod_alumno}</td>
                      <td>${s.nombre_completo}</td>
                      <td>${s.nombre_grado}${s.seccion ? ' ' + s.seccion : ''}</td>
                  `;

                  cursos.forEach(c => {
                    const gradeVal = s.notas_por_curso && s.notas_por_curso[c.id_curso] !== null
                      ? s.notas_por_curso[c.id_curso]
                      : '-';
                    tableRows += `<td style="text-align: center;">${gradeVal !== null && gradeVal !== undefined ? gradeVal : '-'}</td>`;
                  });

                  tableRows += `
                      <td style="text-align: center; ${avgClass}">${average > 0 ? average : '-'}</td>
                    </tr>
                  `;
                });
                tbody.innerHTML = tableRows;
              }

              document.getElementById('grades-count-badge').textContent = `${alumnos.length} Alumnos`;
            })
            .catch(err => {
              console.error('Error al cargar reporte de notas:', err);
              document.getElementById('grades-tbody').innerHTML =
                `<tr><td colspan="7" style="text-align:center; color: var(--danger); padding:24px;">Error de conexión con el servidor.</td></tr>`;
            });
        }

        let debounceTimer;
        function onGradesFilterChange() {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(fetchGradesReport, 250);
        }

        searchInput.addEventListener('input', onGradesFilterChange);
        levelSelect.addEventListener('change', fetchGradesReport);
        gradeSelect.addEventListener('change', fetchGradesReport);
        performanceSelect.addEventListener('change', fetchGradesReport);
      }
      else if (tabName === 'attendance') {
        btnAttendance.classList.add('active');

        content.innerHTML = `
          <div class="card" style="margin-bottom: 24px; padding: 20px;">
            <div class="card-header" style="padding-bottom: 12px; margin-bottom: 16px;">
              <h3 class="card-title">Filtros Combinados - Reporte de Asistencias</h3>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
              <div class="form-group" style="margin: 0;">
                <label class="form-label-desc" style="font-weight:600; margin-bottom: 6px;">Buscar Alumno:</label>
                <input type="text" id="att-search" class="control-input" placeholder="Nombre o código...">
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label-desc" style="font-weight:600; margin-bottom: 6px;">Nivel de Educación:</label>
                <select id="att-filter-level" class="control-select">
                  <option value="todos">Todos los Niveles</option>
                  <option value="Primaria">Primaria</option>
                  <option value="Secundaria">Secundaria</option>
                  <option value="Inicial">Inicial</option>
                </select>
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label-desc" style="font-weight:600; margin-bottom: 6px;">Grado:</label>
                <select id="att-filter-grade" class="control-select">
                  <option value="todos">Todos los Grados</option>
                </select>
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label-desc" style="font-weight:600; margin-bottom: 6px;">Rango de Asistencias:</label>
                <select id="att-filter-range" class="control-select">
                  <option value="todos">Todos los Rangos</option>
                  <option value="perfecta">Perfecta (100%)</option>
                  <option value="regular">Regular (80% - 99%)</option>
                  <option value="critica">En Riesgo (< 80%)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="financial-metrics" id="att-metrics-row" style="margin-bottom: 24px;"></div>

          <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
              <h3 class="card-title">Resumen Escolar de Asistencias</h3>
              <span class="badge badge-primary" id="att-count-badge">0 Alumnos</span>
            </div>
            <div class="table-responsive">
              <table class="school-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Apellidos y Nombres</th>
                    <th>Grado</th>
                    <th style="text-align: center;">Asistencias (P)</th>
                    <th style="text-align: center;">Tardanzas (T)</th>
                    <th style="text-align: center;">Faltas (F)</th>
                    <th style="text-align: center;">Porcentaje Asist.</th>
                  </tr>
                </thead>
                <tbody id="att-tbody">
                  <tr><td colspan="7" style="text-align:center; padding:24px; color:var(--neutral-medium);">Cargando reporte de asistencias de la BD...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        `;

        const searchInput = document.getElementById('att-search');
        const levelSelect = document.getElementById('att-filter-level');
        const gradeSelect = document.getElementById('att-filter-grade');
        const rangeSelect = document.getElementById('att-filter-range');

        loadFilterOptions(levelSelect, gradeSelect, function() {
          fetchAttendanceReport();
        });

        function fetchAttendanceReport() {
          const q   = encodeURIComponent(searchInput.value.trim());
          const lev = encodeURIComponent(levelSelect.value);
          const grd = encodeURIComponent(gradeSelect.value);
          const rng = encodeURIComponent(rangeSelect.value);

          const url = getApiUrl(`public/api/reportes.php?tipo=asistencia&search=${q}&nivel=${lev}&grado=${grd}&range=${rng}`);

          fetch(url, {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            cache: 'no-store'
          })
            .then(r => r.json())
            .then(res => {
              if (!res.success || !Array.isArray(res.data)) {
                document.getElementById('att-tbody').innerHTML =
                  `<tr><td colspan="7" style="text-align:center;color:var(--danger);padding:24px;">Error al cargar asistencias de la BD.</td></tr>`;
                return;
              }

              let attData = res.data;

              // Filtrado adicional local si es necesario
              const query      = searchInput.value.trim().toLowerCase();
              const levelVal   = levelSelect.value;
              const gradeVal   = gradeSelect.value;
              const rangeVal   = rangeSelect.value;

              const filtered = attData.filter(s => {
                const matchesText  = (s.nombre_completo && s.nombre_completo.toLowerCase().includes(query)) ||
                                     (s.cod_alumno && s.cod_alumno.toLowerCase().includes(query));
                const matchesLevel = levelVal === 'todos' || s.nivel === levelVal;
                const matchesGrade = gradeVal === 'todos' || s.nombre_grado === gradeVal || (s.nombre_grado + ' ' + (s.seccion||'')).trim() === gradeVal;
                const pct = parseFloat(s.pct_asistencia) || 100;
                let matchesRange = true;
                if (rangeVal === 'perfecta') matchesRange = pct === 100;
                else if (rangeVal === 'regular') matchesRange = pct >= 80 && pct < 100;
                else if (rangeVal === 'critica') matchesRange = pct < 80;
                return matchesText && matchesLevel && matchesGrade && matchesRange;
              });

              let presentCount = 0, lateCount = 0, absentCount = 0, totalAtt = 0;
              let tableRows = '';

              filtered.forEach(s => {
                const p   = parseInt(s.presentes)  || 0;
                const t   = parseInt(s.tardanzas)  || 0;
                const f   = parseInt(s.faltas)     || 0;
                const pct = parseFloat(s.pct_asistencia) || 100;
                presentCount += p; lateCount += t; absentCount += f;
                totalAtt += p + t + f;

                const badCell = pct < 80
                  ? 'background-color:var(--danger-bg);color:var(--danger);font-weight:700;'
                  : '';

                tableRows += `
                  <tr>
                    <td style="font-weight:600;">${s.cod_alumno}</td>
                    <td>${s.nombre_completo}</td>
                    <td>${s.nombre_grado}${s.seccion ? ' ' + s.seccion : ''}</td>
                    <td style="text-align:center;color:var(--success);font-weight:600;">${p}</td>
                    <td style="text-align:center;color:var(--warning);font-weight:600;">${t}</td>
                    <td style="text-align:center;color:var(--danger);font-weight:600;">${f}</td>
                    <td style="text-align:center;${badCell}">${pct}%</td>
                  </tr>
                `;
              });

              const ratePresent = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 100;
              const rateLate    = totalAtt > 0 ? Math.round((lateCount    / totalAtt) * 100) : 0;
              const rateAbsent  = totalAtt > 0 ? Math.round((absentCount  / totalAtt) * 100) : 0;

              const metricsRow = document.getElementById('att-metrics-row');
              metricsRow.innerHTML = `
                <div class="metric-card">
                  <div class="metric-icon-box" style="background-color:var(--success-bg);color:var(--success);">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <div class="metric-details">
                    <span class="metric-lbl">Tasa de Asistencia</span>
                    <span class="metric-val" style="color:var(--success);">${ratePresent}%</span>
                  </div>
                </div>
                <div class="metric-card">
                  <div class="metric-icon-box" style="background-color:var(--warning-bg);color:var(--warning);">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                  <div class="metric-details">
                    <span class="metric-lbl">Tardanzas Totales</span>
                    <span class="metric-val" style="color:var(--warning);">${rateLate}%</span>
                  </div>
                </div>
                <div class="metric-card">
                  <div class="metric-icon-box" style="background-color:var(--danger-bg);color:var(--danger);">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                  </div>
                  <div class="metric-details">
                    <span class="metric-lbl">Inasistencias Totales</span>
                    <span class="metric-val" style="color:var(--danger);">${rateAbsent}%</span>
                  </div>
                </div>
              `;

              const tbody = document.getElementById('att-tbody');
              tbody.innerHTML = filtered.length === 0
                ? `<tr><td colspan="7" style="text-align:center;color:var(--neutral-medium);padding:24px;">No se encontraron registros con los filtros seleccionados.</td></tr>`
                : tableRows;

              document.getElementById('att-count-badge').textContent = `${filtered.length} Alumno(s)`;
            })
            .catch(err => {
              console.error('Error al cargar reporte de asistencias:', err);
              document.getElementById('att-tbody').innerHTML =
                `<tr><td colspan="7" style="text-align:center;color:var(--danger);padding:24px;">Error de conexión con el servidor.</td></tr>`;
            });
        }

        searchInput.addEventListener('input', fetchAttendanceReport);
        levelSelect.addEventListener('change', fetchAttendanceReport);
        gradeSelect.addEventListener('change', fetchAttendanceReport);
        rangeSelect.addEventListener('change', fetchAttendanceReport);

      } 
      else if (tabName === 'filters') {
        btnFilters.classList.add('active');

        content.innerHTML = `
          <div class="card" style="margin-bottom: 24px; padding: 20px;">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; margin-bottom: 16px;">
              <h3 class="card-title">Filtros Dinámicos Combinados</h3>
              <button class="btn btn-secondary" id="btn-export-csv" style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; font-size: 13px; font-weight: 600;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Exportar Reporte
              </button>
            </div>
            <div id="export-success-indicator" class="badge badge-success" style="display:none; margin-bottom: 16px; width: 100%; text-align: center; padding: 8px;">¡Reporte exportado exitosamente en formato CSV!</div>
            
            <div class="form-layout" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 0;">
              <div class="form-group" style="margin: 0;">
                <label class="form-label-desc" style="font-weight:600; margin-bottom: 6px;">Buscar Alumno:</label>
                <input type="text" id="filter-search" class="control-input" placeholder="Nombre, apellido o código...">
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label-desc" style="font-weight:600; margin-bottom: 6px;">Nivel de Educación:</label>
                <select id="filter-level" class="control-select">
                  <option value="todos">Todos los Niveles</option>
                  <option value="Primaria">Primaria</option>
                  <option value="Secundaria">Secundaria</option>
                  <option value="Inicial">Inicial</option>
                </select>
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label-desc" style="font-weight:600; margin-bottom: 6px;">Grado Escolar:</label>
                <select id="filter-grade" class="control-select">
                  <option value="todos">Todos los Grados</option>
                </select>
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label-desc" style="font-weight:600; margin-bottom: 6px;">Rendimiento Académico:</label>
                <select id="filter-performance" class="control-select">
                  <option value="todos">Todos los Rendimientos</option>
                  <option value="aprobado">Aprobado (Promedio >= 11)</option>
                  <option value="desaprobado">En Alerta (Promedio < 11)</option>
                </select>
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label-desc" style="font-weight:600; margin-bottom: 6px;">Estado Asistencias:</label>
                <select id="filter-attendance" class="control-select">
                  <option value="todos">Todos los Estados</option>
                  <option value="regular">Asistencia Regular (>= 80%)</option>
                  <option value="critico">Asistencia Crítica (< 80%)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
              <h3 class="card-title">Lista de Alumnos Coincidentes</h3>
              <span class="badge badge-primary" id="filter-result-count">0 Alumnos</span>
            </div>
            <div class="table-responsive">
              <table class="school-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Apellidos y Nombres</th>
                    <th>Grado</th>
                    <th>Nivel</th>
                    <th style="text-align: center;">Promedio General</th>
                    <th style="text-align: center;">Tasa Asistencia</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody id="filter-table-body">
                  <tr><td colspan="7" style="text-align:center; padding:24px; color:var(--neutral-medium);">Cargando consolidado desde la BD...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        `;

        const filterSearch      = document.getElementById('filter-search');
        const filterLevel       = document.getElementById('filter-level');
        const filterGrade       = document.getElementById('filter-grade');
        const filterPerformance = document.getElementById('filter-performance');
        const filterAttendance  = document.getElementById('filter-attendance');
        const filterTableBody   = document.getElementById('filter-table-body');
        const countBadge        = document.getElementById('filter-result-count');
        const btnExport         = document.getElementById('btn-export-csv');

        let lastFilteredDataset = [];

        loadFilterOptions(filterLevel, filterGrade, function() {
          fetchConsolidadoReport();
        });

        function fetchConsolidadoReport() {
          const q    = encodeURIComponent(filterSearch.value.trim());
          const lev  = encodeURIComponent(filterLevel.value);
          const grd  = encodeURIComponent(filterGrade.value);
          const perf = encodeURIComponent(filterPerformance.value);
          const att  = encodeURIComponent(filterAttendance.value);

          const url = getApiUrl(`public/api/reportes.php?tipo=consolidado&search=${q}&nivel=${lev}&grado=${grd}&rendimiento=${perf}&asistencia=${att}`);

          fetch(url, {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            cache: 'no-store'
          })
            .then(r => r.json())
            .then(res => {
              if (!res.success || !res.data) {
                filterTableBody.innerHTML =
                  `<tr><td colspan="7" style="text-align:center; color: var(--danger); padding:24px;">No se pudo cargar la lista consolidada de la BD.</td></tr>`;
                return;
              }

              lastFilteredDataset = res.data.alumnos || [];

              if (lastFilteredDataset.length === 0) {
                filterTableBody.innerHTML =
                  `<tr><td colspan="7" style="text-align:center; color: var(--neutral-medium); padding: 24px;">No se encontraron alumnos con los filtros combinados seleccionados.</td></tr>`;
                countBadge.textContent = '0 Alumno(s)';
                return;
              }

              let rowsHtml = '';
              lastFilteredDataset.forEach(s => {
                const average   = parseFloat(s.promedio) || 0;
                const isPassing = average >= 11;
                const attInfo   = s.asistencia || {};
                const attRate   = parseFloat(attInfo.pct_asistencia) || 100;
                const attColor  = attRate < 80 ? 'color: var(--danger); font-weight: 700;' : 'color: var(--success);';

                rowsHtml += `
                  <tr>
                    <td style="font-weight:600;">${s.cod_alumno}</td>
                    <td>${s.nombre_completo}</td>
                    <td>${s.nombre_grado}${s.seccion ? ' ' + s.seccion : ''}</td>
                    <td>${s.nivel}</td>
                    <td style="text-align: center; font-weight:700; color: ${isPassing ? 'var(--success)' : 'var(--danger)'};">${average > 0 ? average : '-'}</td>
                    <td style="text-align: center; ${attColor}">${attRate}%</td>
                    <td>
                      <span class="badge ${isPassing ? 'badge-success' : 'badge-danger'}">
                        ${isPassing ? 'Aprobado' : 'En Alerta'}
                      </span>
                    </td>
                  </tr>
                `;
              });

              filterTableBody.innerHTML = rowsHtml;
              countBadge.textContent = `${lastFilteredDataset.length} Alumno(s)`;
            })
            .catch(err => {
              console.error('Error al cargar reporte consolidado:', err);
              filterTableBody.innerHTML =
                `<tr><td colspan="7" style="text-align:center; color: var(--danger); padding:24px;">Error de conexión con el servidor.</td></tr>`;
            });
        }

        filterSearch.addEventListener('input', fetchConsolidadoReport);
        filterLevel.addEventListener('change', fetchConsolidadoReport);
        filterGrade.addEventListener('change', fetchConsolidadoReport);
        filterPerformance.addEventListener('change', fetchConsolidadoReport);
        filterAttendance.addEventListener('change', fetchConsolidadoReport);

        btnExport.addEventListener('click', function() {
          if (lastFilteredDataset.length === 0) {
            alert('No hay datos para exportar con los filtros actuales.');
            return;
          }

          let csvContent = 'data:text/csv;charset=utf-8,';
          csvContent += 'Codigo,Apellidos y Nombres,Grado,Nivel,Promedio General,Tasa Asistencia,Estado\n';

          lastFilteredDataset.forEach(s => {
            const avg = parseFloat(s.promedio) || 0;
            const att = s.asistencia ? (s.asistencia.pct_asistencia || 100) : 100;
            const est = avg >= 11 ? 'Aprobado' : 'En Alerta';
            csvContent += `"${s.cod_alumno}","${s.nombre_completo}","${s.nombre_grado}","${s.nivel}",${avg},${att}%,${est}\n`;
          });

          const encodedUri = encodeURI(csvContent);
          const link = document.createElement('a');
          link.setAttribute('href', encodedUri);
          link.setAttribute('download', `Reporte_Alumnos_IEP_Corazon_de_Jesus_${new Date().toISOString().slice(0,10)}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          const indicator = document.getElementById('export-success-indicator');
          if (indicator) {
            indicator.style.display = 'block';
            setTimeout(() => { indicator.style.display = 'none'; }, 4000);
          }
        });
      }
    }
  }

  updateNotificationBadge();
  window.setInterval(updateNotificationBadge, 30000);

  // Expose methods globally for Router config in docente.html
  window.DocenteModule = {
    renderInfoPersonal: renderInfoPersonal,
    renderCursos: renderCursos,
    renderActividades: renderActividades,
    renderAsistencia: renderAsistencia,
    renderIncidencias: renderIncidencias,
    renderReportes: renderReportes
  };

})();
