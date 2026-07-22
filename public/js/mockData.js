// Wrapper de Base de Datos Simulada (Mock Database) usando LocalStorage para la I.E.P. Corazón de Jesús
(function() {
  // Clave que contendrá toda la base de datos simulada serializada en JSON
  const STORAGE_KEY = 'colegio_corazon_jesus_db';

  // Datos semilla iniciales (Seed Data) que estructuran nuestra base de datos simulada
  const initialData = {
    // Listado de estudiantes con notas y asistencias por fecha
    students: [
      { id: 'AL001', name: 'Alvarez Quispe, Mateo', nivel: 'Primaria', grado: '5to Primaria', grades: { matematica: 15, comunicacion: 17, ciencia: 14 }, attendance: { '2026-06-25': 'P', '2026-06-24': 'P', '2026-06-23': 'T' } },
      { id: 'AL002', name: 'Barrientos Flores, Camila', nivel: 'Primaria', grado: '5to Primaria', grades: { matematica: 18, comunicacion: 19, ciencia: 17 }, attendance: { '2026-06-25': 'P', '2026-06-24': 'P', '2026-06-23': 'P' } },
      { id: 'AL003', name: 'Calderón Soto, Benjamín', nivel: 'Primaria', grado: '5to Primaria', grades: { matematica: 11, comunicacion: 12, ciencia: 10 }, attendance: { '2026-06-25': 'F', '2026-06-24': 'P', '2026-06-23': 'P' } },
      { id: 'AL004', name: 'Delgado Ruiz, Luana', nivel: 'Primaria', grado: '5to Primaria', grades: { matematica: 8, comunicacion: 13, ciencia: 9 }, attendance: { '2026-06-25': 'T', '2026-06-24': 'F', '2026-06-23': 'P' } },
      { id: 'AL005', name: 'Espinoza Mendoza, Thiago', nivel: 'Primaria', grado: '5to Primaria', grades: { matematica: 14, comunicacion: 15, ciencia: 15 }, attendance: { '2026-06-25': 'P', '2026-06-24': 'P', '2026-06-23': 'P' } },
      
      { id: 'AL101', name: 'Fernández Gomez, Valentina', nivel: 'Inicial', grado: '5 años - Inicial', grades: { matematica: 16, comunicacion: 18, ciencia: 16 }, attendance: { '2026-06-25': 'P', '2026-06-24': 'P', '2026-06-23': 'P' } },
      { id: 'AL102', name: 'Gutierrez Vargas, Liam', nivel: 'Inicial', grado: '5 años - Inicial', grades: { matematica: 14, comunicacion: 13, ciencia: 15 }, attendance: { '2026-06-25': 'P', '2026-06-24': 'T', '2026-06-23': 'P' } },
      { id: 'AL103', name: 'Huamán Rojas, Sophia', nivel: 'Inicial', grado: '5 años - Inicial', grades: { matematica: 10, comunicacion: 11, ciencia: 12 }, attendance: { '2026-06-25': 'F', '2026-06-24': 'F', '2026-06-23': 'T' } },
      { id: 'AL104', name: 'Mamani Cruz, Sebastian', nivel: 'Inicial', grado: '5 años - Inicial', grades: { matematica: 19, comunicacion: 17, ciencia: 18 }, attendance: { '2026-06-25': 'P', '2026-06-24': 'P', '2026-06-23': 'P' } }
    ],
    // Cursos disponibles mapeados por nivel
    courses: [
      { id: 'MAT5P', name: 'Matemática - 5to Primaria', nivel: 'Primaria', docentName: 'Prof. Carlos Rivas' },
      { id: 'COM5P', name: 'Comunicación - 5to Primaria', nivel: 'Primaria', docentName: 'Prof. Carlos Rivas' },
      { id: 'CIEN5P', name: 'Ciencia y Tecnología - 5to Primaria', nivel: 'Primaria', docentName: 'Prof. Carlos Rivas' },
      { id: 'INI5A', name: 'Psicomotricidad - Inicial 5 Años', nivel: 'Inicial', docentName: 'Prof. Carlos Rivas' }
    ],
    // Eventos de calendario que el personal administrativo y los docentes pueden visualizar
    calendarEvents: [
      { date: '2026-06-23', title: 'Reunión de Docentes', type: 'reunion' },
      { date: '2026-06-25', title: 'Examen Mensual Matemática', type: 'docente' },
      { date: '2026-06-26', title: 'Entrega de Informes UGEL', type: 'admin' },
      { date: '2026-06-30', title: 'Día del Papa - Feriado Escolar', type: 'reunion' },
      { date: '2026-07-06', title: 'Día del Maestro - Actuación Central', type: 'reunion' }
    ],
    // Registro de incidencias disciplinarias o de conducta de los alumnos
    incidents: [
      { id: 'INC001', date: '2026-06-24', studentName: 'Delgado Ruiz, Luana', docentName: 'Carlos Rivas', detail: 'La alumna Delgado Ruiz no presentó los materiales solicitados por tercera vez consecutiva en el curso de Matemática.', status: 'Resuelto' },
      { id: 'INC002', date: '2026-06-25', studentName: 'Calderón Soto, Benjamín', docentName: 'Carlos Rivas', detail: 'El alumno generó desorden en clase interrumpiendo a sus compañeros durante la evaluación.', status: 'En Revisión' }
    ],
    // Docentes y personal del colegio
    teachers: [
      { id: 'DOC001', name: 'Prof. Rivas Soto, Carlos', email: 'carlos.rivas@colegio.edu.pe', status: 'Activo', subjects: 'Matemática, Ciencia, Inicial 5A', rating: 4.8, comments: 'Excelente desempeño docente, puntual y muy didáctico.' },
      { id: 'DOC002', name: 'Prof. Medina Paz, Ana', email: 'ana.medina@colegio.edu.pe', status: 'Activo', subjects: 'Comunicación, Arte', rating: 4.5, comments: 'Buena comunicación con padres de familia.' },
      { id: 'DOC003', name: 'Prof. Lazo Guerra, Luis', email: 'luis.lazo@colegio.edu.pe', status: 'Activo', subjects: 'Educación Física', rating: 4.2, comments: 'Fomenta el trabajo en equipo en el área deportiva.' }
    ],
    // Mensajería (mensajes de la UGEL y chat de coordinación interno)
    messages: {
      ugel: [
        { id: 'UG1', date: '2026-06-20 09:30', sender: 'Director UGEL 03', title: 'Directiva de Gestión Escolar 2026-II', content: 'Estimados Directores, se les recuerda que el plazo máximo para la carga del consolidado de notas del primer semestre en el SIAGIE vence improrrogablemente el día 15 de julio de 2026.' },
        { id: 'UG2', date: '2026-06-24 14:15', sender: 'Minedu Oficinas', title: 'Fichas de Monitoreo Semestral', content: 'Adjuntamos las plantillas oficiales para la rendición de gastos por mantenimiento de infraestructura para el periodo invernal.' }
      ],
      docentes: [
        { id: 'MSG1', timestamp: '2026-06-25 08:30', from: 'Prof. Carlos Rivas', to: 'Director', content: 'Estimado Director, le informo que acabo de redactar una incidencia del alumno Benjamín Calderón debido a indisciplina reiterada en clase. Agradezco su revisión.' },
        { id: 'MSG2', timestamp: '2026-06-25 09:00', from: 'Director', to: 'Prof. Carlos Rivas', content: 'Entendido, profesor Carlos. Ya he visualizado la incidencia. Citaremos al padre de familia para el día de mañana a primera hora.' },
        { id: 'MSG3', timestamp: '2026-06-25 15:40', from: 'Prof. Carlos Rivas', to: 'Director', content: 'Muchas gracias por la pronta respuesta. Ya le informé al alumno sobre la citación.' }
      ]
    },
    // Métricas financieras y de recaudación (gastos corrientes, servicios, etc.)
    economics: {
      metrics: {
        pagoDocentes: 12000,
        morosidadPadres: 18, // 18% de morosidad
        gastosEpoca: 2500, // gastos de mantenimiento estacional
        recaudacion: 28500,
        internet: 320,
        agua: 250,
        luz: 450,
        impuestos: 1800
      }
    }
  };

  /**
   * Obtiene los datos actuales de la "base de datos".
   * Si no existe registro en LocalStorage, la inicializa con los datos semilla.
   */
  function getDb() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(data);
  }

  /**
   * Serializa y guarda la estructura completa de datos en el LocalStorage.
   */
  function saveDb(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // API pública expuesta mediante el namespace global 'SchoolDB'
  window.SchoolDB = {
    // Retorna la base de datos completa
    getData: function() {
      return getDb();
    },

    /**
     * Permite actualizar la base de datos ejecutando una función modificadora (callback).
     * Mantiene los datos actualizados y los persiste automáticamente en LocalStorage.
     */
    updateData: function(updaterFn) {
      const db = getDb();
      updaterFn(db);
      saveDb(db);
      return db;
    },

    // --- MÉTODOS CRUD ESPECÍFICOS ---

    // Guarda o actualiza la nota de un estudiante para una materia determinada
    saveGrade: function(studentId, subject, gradeValue) {
      this.updateData(db => {
        const student = db.students.find(s => s.id === studentId);
        if (student) {
          student.grades[subject] = parseInt(gradeValue) || 0;
        }
      });
    },

    // Registra el estado de asistencia de un alumno ('P' = Presente, 'T' = Tarde, 'F' = Falta) en una fecha dada
    saveAttendance: function(studentId, date, status) {
      this.updateData(db => {
        const student = db.students.find(s => s.id === studentId);
        if (student) {
          student.attendance[date] = status;
        }
      });
    },

    // Agrega una incidencia disciplinaria en la parte superior del listado
    addIncident: function(studentName, docentName, detail) {
      const newInc = {
        id: 'INC' + String(Date.now()).slice(-3), // ID único temporal
        date: new Date().toISOString().split('T')[0],
        studentName: studentName,
        docentName: docentName,
        detail: detail,
        status: 'En Revisión'
      };
      this.updateData(db => {
        db.incidents.unshift(newInc);
      });
      return newInc;
    },

    // Actualiza el estado administrativo de una incidencia (Ej. "En Revisión" -> "Resuelto")
    updateIncidentStatus: function(incidentId, status) {
      this.updateData(db => {
        const inc = db.incidents.find(i => i.id === incidentId);
        if (inc) {
          inc.status = status;
        }
      });
    },

    // Registra la evaluación cuantitativa y comentarios de un docente realizada por la administración
    rateTeacher: function(teacherId, rating, comment) {
      this.updateData(db => {
        const t = db.teachers.find(teacher => teacher.id === teacherId);
        if (t) {
          t.rating = parseFloat(rating);
          t.comments = comment;
        }
      });
    },

    // Añade un mensaje al chat interno bidireccional entre Docente y Director
    sendDocentMessage: function(from, content) {
      const newMsg = {
        id: 'MSG' + String(Date.now()).slice(-3),
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        from: from,
        to: from === 'Director' ? 'Prof. Carlos Rivas' : 'Director',
        content: content
      };
      this.updateData(db => {
        db.messages.docentes.push(newMsg);
      });
      return newMsg;
    },

    // Actualiza las métricas financieras (gastos, luz, agua, morosidad)
    updateEconomics: function(metricsObj) {
      this.updateData(db => {
        db.economics.metrics = { ...db.economics.metrics, ...metricsObj };
      });
    }
  };
})();
