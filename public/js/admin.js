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
    const db = window.SchoolDB.getData();

    function buildTeacherRows() {
      let rows = '';
      db.teachers.forEach(t => {
        rows += `
          <tr>
            <td style="font-weight: 600;">${t.id}</td>
            <td><strong>${t.name}</strong></td>
            <td>${t.subjects}</td>
            <td>${t.email}</td>
            <td style="text-align: center; font-weight: 700; color: var(--primary-orange);">${t.rating} ★</td>
            <td><em style="font-size: 12.5px; color: var(--neutral-medium);">${t.comments || 'Sin comentarios.'}</em></td>
          </tr>
        `;
      });
      return rows;
    }

    let teacherOptions = '';
    db.teachers.forEach(t => {
      teacherOptions += `<option value="${t.id}">${t.name}</option>`;
    });

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
                <option value="" disabled selected>-- Seleccione Docente --</option>
                ${teacherOptions}
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
                ${buildTeacherRows()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const slider = document.getElementById('rate-val');
    const label = document.getElementById('rate-val-lbl');
    slider.addEventListener('input', function() {
      label.textContent = `${parseFloat(this.value).toFixed(1)} ★`;
    });

    const form = document.getElementById('rate-teacher-form');
    const tableBody = document.getElementById('teacher-list-tbody');
    const alertBox = document.getElementById('rate-alert');

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const teacherId = document.getElementById('rate-teacher-id').value;
      const rate = slider.value;
      const comment = document.getElementById('rate-comment').value;

      window.SchoolDB.rateTeacher(teacherId, rate, comment);
      
      // Update list
      tableBody.innerHTML = buildTeacherRows();
      
      form.reset();
      label.textContent = '5.0 ★';
      alertBox.style.display = 'block';
      setTimeout(() => { alertBox.style.display = 'none'; }, 3000);
    });
  }

  /* ==========================================================================
     4. MENSAJERÍA / NOTIFICACIONES (UGEL & DOCENTES TABS)
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
  function renderEconomia(container) {
    setPageTitle('Gestión Económica Escolar');

    function calculateEconomicsAndDraw() {
      const db = window.SchoolDB.getData();
      const m = db.economics.metrics;

      // Calculations
      const totalRevenues = m.recaudacion;
      const payroll = m.pagoDocentes;
      const maintenance = m.gastosEpoca;
      
      const utilityExpenses = m.internet + m.agua + m.luz;
      const taxes = m.impuestos;
      const totalExpenses = payroll + maintenance + utilityExpenses + taxes;

      // Net Income
      const netBalance = totalRevenues - totalExpenses;
      
      // Calculate morosidad in currency terms
      const unpaidAmount = Math.round(totalRevenues * (m.morosidadPadres / 100));

      // Draw values in UI
      document.getElementById('val-recaudacion').textContent = `S/ ${totalRevenues.toLocaleString()}`;
      document.getElementById('val-egresos').textContent = `S/ ${totalExpenses.toLocaleString()}`;
      
      const balanceEl = document.getElementById('val-balance');
      balanceEl.textContent = `S/ ${netBalance.toLocaleString()}`;
      if (netBalance < 0) {
        balanceEl.style.color = 'var(--danger)';
      } else {
        balanceEl.style.color = 'var(--success)';
      }

      document.getElementById('val-morosidad').textContent = `S/ ${unpaidAmount.toLocaleString()} (${m.morosidadPadres}%)`;

      // Update manual sliders display text labels
      document.getElementById('slide-pago-lbl').textContent = `S/ ${m.pagoDocentes.toLocaleString()}`;
      document.getElementById('slide-moro-lbl').textContent = `${m.morosidadPadres}%`;
      document.getElementById('slide-gastos-lbl').textContent = `S/ ${m.gastosEpoca.toLocaleString()}`;
      
      document.getElementById('slide-recaud-lbl').textContent = `S/ ${m.recaudacion.toLocaleString()}`;
      document.getElementById('slide-internet-lbl').textContent = `S/ ${m.internet}`;
      document.getElementById('slide-agua-lbl').textContent = `S/ ${m.agua}`;
      document.getElementById('slide-luz-lbl').textContent = `S/ ${m.luz}`;
      document.getElementById('slide-impuestos-lbl').textContent = `S/ ${m.impuestos}`;

      // Animate Chart heights
      // Max height value for scaling
      const maxVal = Math.max(totalRevenues, totalExpenses, Math.abs(netBalance), 30000);
      
      const fillRec = document.getElementById('bar-fill-recaudacion');
      const fillEgr = document.getElementById('bar-fill-egresos');
      const fillBal = document.getElementById('bar-fill-balance');

      fillRec.style.height = `${(totalRevenues / maxVal) * 100}%`;
      fillRec.querySelector('.chart-bar-tooltip').textContent = `S/ ${totalRevenues.toLocaleString()}`;

      fillEgr.style.height = `${(totalExpenses / maxVal) * 100}%`;
      fillEgr.querySelector('.chart-bar-tooltip').textContent = `S/ ${totalExpenses.toLocaleString()}`;

      const absBalance = Math.abs(netBalance);
      fillBal.style.height = `${(absBalance / maxVal) * 100}%`;
      fillBal.querySelector('.chart-bar-tooltip').textContent = `S/ ${netBalance.toLocaleString()}`;
      fillBal.style.backgroundColor = netBalance >= 0 ? 'var(--success)' : 'var(--danger)';
    }

    const db = window.SchoolDB.getData();
    const m = db.economics.metrics;

    container.innerHTML = `
      <!-- Metrics overview -->
      <div class="financial-metrics">
        <div class="metric-card">
          <div class="metric-icon-box" style="background-color: var(--success-bg); color: var(--success);">
            S/
          </div>
          <div class="metric-details">
            <span class="metric-lbl">Recaudación Teórica</span>
            <span class="metric-val" id="val-recaudacion">S/ 0</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box" style="background-color: var(--danger-bg); color: var(--danger);">
            -
          </div>
          <div class="metric-details">
            <span class="metric-lbl">Total Egresos</span>
            <span class="metric-val" id="val-egresos">S/ 0</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box" style="background-color: rgba(217, 98, 54, 0.12); color: var(--primary-orange);">
            =
          </div>
          <div class="metric-details">
            <span class="metric-lbl">Balance Neto Mensual</span>
            <span class="metric-val" id="val-balance">S/ 0</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box" style="background-color: var(--warning-bg); color: var(--warning);">
            %
          </div>
          <div class="metric-details">
            <span class="metric-lbl">Morosidad Estimada</span>
            <span class="metric-val" id="val-morosidad">S/ 0</span>
          </div>
        </div>
      </div>

      <!-- Financial Chart visual -->
      <div class="charts-container" style="grid-template-columns: 1fr;">
        <div class="chart-card">
          <div class="card-header">
            <h3 class="card-title">Balance Financiero Comparativo</h3>
          </div>
          <div class="chart-body" style="height: 250px;">
            <div class="chart-axis-lines">
              <div class="chart-grid-line"><span>30K</span></div>
              <div class="chart-grid-line"><span>20K</span></div>
              <div class="chart-grid-line"><span>10K</span></div>
              <div class="chart-grid-line"><span>0</span></div>
            </div>
            
            <div class="chart-bar-col" style="width: 120px;">
              <div class="chart-bar-fill" id="bar-fill-recaudacion" style="background-color: var(--success); height: 0%;">
                <div class="chart-bar-tooltip">S/ 0</div>
              </div>
              <span class="chart-bar-label">Recaudación Total</span>
            </div>

            <div class="chart-bar-col" style="width: 120px;">
              <div class="chart-bar-fill" id="bar-fill-egresos" style="background-color: var(--danger); height: 0%;">
                <div class="chart-bar-tooltip">S/ 0</div>
              </div>
              <span class="chart-bar-label">Gastos Totales</span>
            </div>

            <div class="chart-bar-col" style="width: 120px;">
              <div class="chart-bar-fill" id="bar-fill-balance" style="background-color: var(--primary-orange); height: 0%;">
                <div class="chart-bar-tooltip">S/ 0</div>
              </div>
              <span class="chart-bar-label">Resultado Neto</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Adjustments manual panel -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Ajustes Manuales de Parámetros Económicos</h3>
        </div>
        <div class="adjustments-grid">
          <!-- 1 -->
          <div class="adjustment-control">
            <div class="adjustment-title-row">
              <span>Recaudación Escolar</span>
              <span class="adjustment-val" id="slide-recaud-lbl">S/ 0</span>
            </div>
            <input type="range" class="range-slider economy-slide" id="slide-recaud" min="15000" max="45000" step="500" value="${m.recaudacion}">
          </div>
          <!-- 2 -->
          <div class="adjustment-control">
            <div class="adjustment-title-row">
              <span>Monto Pago Docentes</span>
              <span class="adjustment-val" id="slide-pago-lbl">S/ 0</span>
            </div>
            <input type="range" class="range-slider economy-slide" id="slide-pago" min="5000" max="20000" step="500" value="${m.pagoDocentes}">
          </div>
          <!-- 3 -->
          <div class="adjustment-control">
            <div class="adjustment-title-row">
              <span>Porcentaje Morosidad</span>
              <span class="adjustment-val" id="slide-moro-lbl">0%</span>
            </div>
            <input type="range" class="range-slider economy-slide" id="slide-moro" min="0" max="50" step="1" value="${m.morosidadPadres}">
          </div>
          <!-- 4 -->
          <div class="adjustment-control">
            <div class="adjustment-title-row">
              <span>Gastos Mantenimiento</span>
              <span class="adjustment-val" id="slide-gastos-lbl">S/ 0</span>
            </div>
            <input type="range" class="range-slider economy-slide" id="slide-gastos" min="500" max="8000" step="100" value="${m.gastosEpoca}">
          </div>
          <!-- 5 (Internet) -->
          <div class="adjustment-control">
            <div class="adjustment-title-row">
              <span>Gasto Internet</span>
              <span class="adjustment-val" id="slide-internet-lbl">S/ 0</span>
            </div>
            <input type="range" class="range-slider economy-slide" id="slide-internet" min="100" max="1000" step="20" value="${m.internet}">
          </div>
          <!-- 6 (Agua) -->
          <div class="adjustment-control">
            <div class="adjustment-title-row">
              <span>Gasto Agua</span>
              <span class="adjustment-val" id="slide-agua-lbl">S/ 0</span>
            </div>
            <input type="range" class="range-slider economy-slide" id="slide-agua" min="50" max="1000" step="10" value="${m.agua}">
          </div>
          <!-- 7 (Luz) -->
          <div class="adjustment-control">
            <div class="adjustment-title-row">
              <span>Gasto Luz</span>
              <span class="adjustment-val" id="slide-luz-lbl">S/ 0</span>
            </div>
            <input type="range" class="range-slider economy-slide" id="slide-luz" min="100" max="1500" step="50" value="${m.luz}">
          </div>
          <!-- 8 (Impuestos) -->
          <div class="adjustment-control">
            <div class="adjustment-title-row">
              <span>Gasto Impuestos</span>
              <span class="adjustment-val" id="slide-impuestos-lbl">S/ 0</span>
            </div>
            <input type="range" class="range-slider economy-slide" id="slide-impuestos" min="500" max="5000" step="100" value="${m.impuestos}">
          </div>
        </div>
      </div>
    `;

    // Sliders bindings
    const slides = container.querySelectorAll('.economy-slide');
    slides.forEach(slide => {
      slide.addEventListener('input', function() {
        // Collect all sliders values and save to Db
        const metrics = {
          recaudacion: parseInt(document.getElementById('slide-recaud').value),
          pagoDocentes: parseInt(document.getElementById('slide-pago').value),
          morosidadPadres: parseInt(document.getElementById('slide-moro').value),
          gastosEpoca: parseInt(document.getElementById('slide-gastos').value),
          internet: parseInt(document.getElementById('slide-internet').value),
          agua: parseInt(document.getElementById('slide-agua').value),
          luz: parseInt(document.getElementById('slide-luz').value),
          impuestos: parseInt(document.getElementById('slide-impuestos').value),
        };

        window.SchoolDB.updateEconomics(metrics);
        calculateEconomicsAndDraw();
      });
    });

    // Run initial rendering
    calculateEconomicsAndDraw();
  }

  // Expose methods globally for Router config in admin.html
  window.AdminModule = {
    renderInfoPersonal: renderInfoPersonal,
    renderIncidencias: renderIncidencias,
    renderDocentes: renderDocentes,
    renderMensajeria: renderMensajeria,
    renderPlantillas: renderPlantillas,
    renderEconomia: renderEconomia
  };

})();
