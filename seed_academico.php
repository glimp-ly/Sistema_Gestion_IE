<?php
/**
 * =====================================================================
 * SEED ACADÉMICO COMPLETO - Sistema de Gestión IE Corazón de Jesús
 * =====================================================================
 * 
 * Este script genera la estructura académica completa:
 *  1. Roles base ('Director', 'Docente')
 *  2. Usuarios principales ('director', 'docente', 'prof.matematica', 'prof.comunicacion', 'prof.ciencias')
 *  3. Grados escolares (1° al 3° Primaria, 1° y 2° Secundaria)
 *  4. Cursos (Matemáticas, Comunicación, Ciencias, Historia, Inglés)
 *  5. Relación Grado-Curso (Año 2026)
 *  6. Asignación de Cursos a Docentes con Horarios
 *  7. Sesiones de Clase y Actividades con Pesos
 *  8. Apoderados y Alumnos de Prueba
 *  9. Registro de Notas y Asistencias
 * 10. Registro de Incidencias Disciplinarias
 * 
 * Ejecución desde CLI:     php seed_academico.php
 * Ejecución desde Browser: http://localhost:7070/seed_academico.php
 * =====================================================================
 */

require_once __DIR__ . '/core/database.php';
require_once __DIR__ . '/core/security.php';

echo "<pre>\n";
echo "=============================================================\n";
echo "  INICIANDO POBLADO DE DATOS ACADÉMICOS (SEEDER COMPLETO)\n";
echo "=============================================================\n\n";

try {
    $conn = Conexion::connection();

    // FIX: Detect and repair corrupted `año` column name (mojibake: aÃ±o)
    // Must run BEFORE beginTransaction() because DDL causes implicit COMMIT
    try {
        $cols = $conn->query("SHOW COLUMNS FROM GRADO_CURSO")->fetchAll(PDO::FETCH_COLUMN);
        $hasCorrupted = false;
        $hasAnio = false;
        foreach ($cols as $col) {
            if ($col === 'anio') $hasAnio = true;
            if (strlen($col) > 3 && ord($col[1]) === 0xC3) $hasCorrupted = true;
        }
        if ($hasCorrupted && !$hasAnio) {
            $conn->exec("SET FOREIGN_KEY_CHECKS=0");
            $conn->exec("DROP TABLE IF EXISTS ASIGNACION_CURSO, SESION, ACTIVIDADES, GRADO_CURSO");
            $conn->exec("
                CREATE TABLE GRADO_CURSO (
                    id_gradoCurso INT NOT NULL AUTO_INCREMENT,
                    id_curso INT NOT NULL,
                    id_grado INT NOT NULL,
                    anio YEAR NOT NULL,
                    PRIMARY KEY (id_gradoCurso)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
            $conn->exec("ALTER TABLE GRADO_CURSO ADD CONSTRAINT fk_gc_grado FOREIGN KEY (id_grado) REFERENCES GRADO(id_grado) ON UPDATE CASCADE ON DELETE RESTRICT");
            $conn->exec("ALTER TABLE GRADO_CURSO ADD CONSTRAINT fk_gc_curso FOREIGN KEY (id_curso) REFERENCES CURSO(id_curso) ON UPDATE CASCADE ON DELETE RESTRICT");
            $conn->exec("
                CREATE TABLE IF NOT EXISTS SESION (
                    id_sesion INT NOT NULL AUTO_INCREMENT,
                    nombre VARCHAR(50) NOT NULL,
                    descripcion TEXT NOT NULL,
                    id_gradoCurso INT NOT NULL,
                    PRIMARY KEY (id_sesion)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
            $conn->exec("ALTER TABLE SESION ADD CONSTRAINT fk_sesion_gc FOREIGN KEY (id_gradoCurso) REFERENCES GRADO_CURSO(id_gradoCurso) ON UPDATE CASCADE ON DELETE RESTRICT");
            $conn->exec("
                CREATE TABLE IF NOT EXISTS ACTIVIDADES (
                    id_actividad INT NOT NULL AUTO_INCREMENT,
                    nombre VARCHAR(100) NOT NULL,
                    peso DECIMAL(5,2) NOT NULL,
                    id_gradoCurso INT NOT NULL,
                    PRIMARY KEY (id_actividad)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
            $conn->exec("ALTER TABLE ACTIVIDADES ADD CONSTRAINT fk_act_gc FOREIGN KEY (id_gradoCurso) REFERENCES GRADO_CURSO(id_gradoCurso) ON UPDATE CASCADE ON DELETE RESTRICT");
            $conn->exec("
                CREATE TABLE IF NOT EXISTS ASIGNACION_CURSO (
                    id_asignacionCurso INT NOT NULL AUTO_INCREMENT,
                    id_docente INT NOT NULL,
                    id_gradoCurso INT NOT NULL,
                    dia_horario VARCHAR(10) NOT NULL,
                    hora_inicio TIME NOT NULL,
                    hora_fin TIME NOT NULL,
                    fecha_asignacion DATE NOT NULL,
                    fecha_finAsig DATE,
                    PRIMARY KEY (id_asignacionCurso)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
            $conn->exec("ALTER TABLE ASIGNACION_CURSO ADD CONSTRAINT fk_ac_docente FOREIGN KEY (id_docente) REFERENCES DOCENTES(id_docente) ON UPDATE CASCADE ON DELETE RESTRICT");
            $conn->exec("ALTER TABLE ASIGNACION_CURSO ADD CONSTRAINT fk_ac_gc FOREIGN KEY (id_gradoCurso) REFERENCES GRADO_CURSO(id_gradoCurso) ON UPDATE CASCADE ON DELETE RESTRICT");
            $conn->exec("SET FOREIGN_KEY_CHECKS=1");
            echo "   ✔ Columna 'año' corrupta detectada y reparada a 'anio'.\n\n";
        }
    } catch (Throwable $e) {
        echo "   ⚠ No se pudo verificar columna anio: " . $e->getMessage() . "\n";
    }

    $conn->beginTransaction();

    // -----------------------------------------------------------------
    // 1. ROLES BASE
    // -----------------------------------------------------------------
    echo "1. Creando / verificando roles base...\n";
    $rolesDefinidos = ['Director', 'Administrador', 'Docente', 'Contador'];
    $rolesIds = [];

    foreach ($rolesDefinidos as $rNombre) {
        $stmt = $conn->prepare("SELECT id_rol FROM ROL WHERE nombre = :nombre");
        $stmt->execute([':nombre' => $rNombre]);
        $row = $stmt->fetch();
        if ($row) {
            $rolesIds[$rNombre] = $row['id_rol'];
        } else {
            $stmt = $conn->prepare("INSERT INTO ROL (nombre) VALUES (:nombre)");
            $stmt->execute([':nombre' => $rNombre]);
            $rolesIds[$rNombre] = $conn->lastInsertId();
        }
    }
    echo "   ✔ Roles listos: Director (ID {$rolesIds['Director']}), Administrador (ID {$rolesIds['Administrador']}), Docente (ID {$rolesIds['Docente']}), Contador (ID {$rolesIds['Contador']}).\n\n";

    // -----------------------------------------------------------------
    // 2. CREACIÓN DE USUARIOS BASE (DIRECTOR Y DOCENTES)
    // -----------------------------------------------------------------
    echo "2. Registrando usuarios y personal de la institución...\n";
    
    $listaUsuarios = [
        [
            'rol'             => 'Director',
            'username'        => 'director',
            'password'        => 'director123',
            'dni'             => '70000001',
            'nombre'          => 'Carlos',
            'ap_paterno'      => 'Ramirez',
            'ap_materno'      => 'Torres',
            'fechaNa'         => '1980-05-15',
            'direccion'       => 'Av. Principal 123, Lima',
            'telefono'        => '987654321',
            'correo'          => 'director@corazonjesus.edu.pe',
            'tipo'            => 'administrativo',
            'grado_academico' => 'Magíster en Gestión Educativa',
            'especialidad'    => 'Administración Institucional'
        ],
        [
            'rol'             => 'Docente',
            'username'        => 'docente',
            'password'        => 'docente123',
            'dni'             => '70000002',
            'nombre'          => 'María',
            'ap_paterno'      => 'López',
            'ap_materno'      => 'Gutiérrez',
            'fechaNa'         => '1990-08-22',
            'direccion'       => 'Jr. Los Olivos 456, Lima',
            'telefono'        => '912345678',
            'correo'          => 'm.lopez@corazonjesus.edu.pe',
            'tipo'            => 'docente',
            'cod_docente'     => 'DOC-0001',
            'tipo_contrato'   => 'Tiempo Completo',
            'grado_academico' => 'Licenciada en Educación',
            'especialidad'    => 'Educación Primaria'
        ],
        [
            'rol'             => 'Docente',
            'username'        => 'prof.matematica',
            'password'        => 'matematica123',
            'dni'             => '70000003',
            'nombre'          => 'Carlos',
            'ap_paterno'      => 'Rivas',
            'ap_materno'      => 'Mendoza',
            'fechaNa'         => '1985-03-10',
            'direccion'       => 'Av. Brasil 789, Pueblo Libre',
            'telefono'        => '923456789',
            'correo'          => 'c.rivas@corazonjesus.edu.pe',
            'tipo'            => 'docente',
            'cod_docente'     => 'DOC-0002',
            'tipo_contrato'   => 'Tiempo Completo',
            'grado_academico' => 'Licenciado en Matemáticas y Física',
            'especialidad'    => 'Matemática y Estadística'
        ],
        [
            'rol'             => 'Docente',
            'username'        => 'prof.comunicacion',
            'password'        => 'comunicacion123',
            'dni'             => '70000004',
            'nombre'          => 'Ana',
            'ap_paterno'      => 'Gómez',
            'ap_materno'      => 'Salazar',
            'fechaNa'         => '1988-11-05',
            'direccion'       => 'Calle Las Flores 321, Miraflores',
            'telefono'        => '934567890',
            'correo'          => 'a.gomez@corazonjesus.edu.pe',
            'tipo'            => 'docente',
            'cod_docente'     => 'DOC-0003',
            'tipo_contrato'   => 'Contratado',
            'grado_academico' => 'Licenciada en Lengua y Literatura',
            'especialidad'    => 'Comunicación e Idiomas'
        ],
        [
            'rol'             => 'Docente',
            'username'        => 'prof.ciencias',
            'password'        => 'ciencias123',
            'dni'             => '70000005',
            'nombre'          => 'Luis',
            'ap_paterno'      => 'Fernández',
            'ap_materno'      => 'Vargas',
            'fechaNa'         => '1992-07-18',
            'direccion'       => 'Av. Arequipa 1500, Lince',
            'telefono'        => '945678901',
            'correo'          => 'l.fernandez@corazonjesus.edu.pe',
            'tipo'            => 'docente',
            'cod_docente'     => 'DOC-0004',
            'tipo_contrato'   => 'Tiempo Completo',
            'grado_academico' => 'Ingeniero Biológico / Docente',
            'especialidad'    => 'Ciencia, Tecnología y Ambiente'
        ],
        [
            'rol'             => 'Docente',
            'username'        => 'prof.historia',
            'password'        => 'historia123',
            'dni'             => '70000007',
            'nombre'          => 'Roberto',
            'ap_paterno'      => 'Sánchez',
            'ap_materno'      => 'Paredes',
            'fechaNa'         => '1987-12-01',
            'direccion'       => 'Calle Las Camelias 450, Surco',
            'telefono'        => '967890123',
            'correo'          => 'r.sanchez@corazonjesus.edu.pe',
            'tipo'            => 'docente',
            'cod_docente'     => 'DOC-0005',
            'tipo_contrato'   => 'Tiempo Completo',
            'grado_academico' => 'Licenciado en Historia y Geografía',
            'especialidad'    => 'Ciencias Sociales'
        ],
        [
            'rol'             => 'Docente',
            'username'        => 'prof.arte',
            'password'        => 'arte123',
            'dni'             => '70000008',
            'nombre'          => 'Diana',
            'ap_paterno'      => 'Torres',
            'ap_materno'      => 'Quiroz',
            'fechaNa'         => '1991-04-20',
            'direccion'       => 'Jr. Cusco 210, Breña',
            'telefono'        => '978901234',
            'correo'          => 'd.torres@corazonjesus.edu.pe',
            'tipo'            => 'docente',
            'cod_docente'     => 'DOC-0006',
            'tipo_contrato'   => 'Contratado',
            'grado_academico' => 'Licenciada en Arte y Diseño',
            'especialidad'    => 'Arte y Visual'
        ],
        [
            'rol'             => 'Docente',
            'username'        => 'prof.edfisica',
            'password'        => 'edfisica123',
            'dni'             => '70000009',
            'nombre'          => 'Manuel',
            'ap_paterno'      => 'Castillo',
            'ap_materno'      => 'Ramos',
            'fechaNa'         => '1986-06-15',
            'direccion'       => 'Av. Angamos 800, Surquillo',
            'telefono'        => '989012345',
            'correo'          => 'm.castillo@corazonjesus.edu.pe',
            'tipo'            => 'docente',
            'cod_docente'     => 'DOC-0007',
            'tipo_contrato'   => 'Tiempo Completo',
            'grado_academico' => 'Licenciado en Educación Física',
            'especialidad'    => 'Deporte y Recreación'
        ],
        [
            'rol'             => 'Docente',
            'username'        => 'prof.computacion',
            'password'        => 'computacion123',
            'dni'             => '70000010',
            'nombre'          => 'Laura',
            'ap_paterno'      => 'Ramos',
            'ap_materno'      => 'Huamán',
            'fechaNa'         => '1993-11-28',
            'direccion'       => 'Calle Aviación 333, San Borja',
            'telefono'        => '900123456',
            'correo'          => 'l.ramos@corazonjesus.edu.pe',
            'tipo'            => 'docente',
            'cod_docente'     => 'DOC-0008',
            'tipo_contrato'   => 'Contratado',
            'grado_academico' => 'Ingeniera de Sistemas',
            'especialidad'    => 'Computación e Informática'
        ],
        [
            'rol'             => 'Contador',
            'username'        => 'contador',
            'password'        => 'contador123',
            'dni'             => '70000006',
            'nombre'          => 'Jorge',
            'ap_paterno'      => 'Mendoza',
            'ap_materno'      => 'Villa',
            'fechaNa'         => '1984-09-12',
            'direccion'       => 'Av. La Marina 2000, San Miguel',
            'telefono'        => '956789012',
            'correo'          => 'j.mendoza@corazonjesus.edu.pe',
            'tipo'            => 'administrativo',
            'grado_academico' => 'Contador Público',
            'especialidad'    => 'Contabilidad y Finanzas'
        ],
    ];

    $docentesIds = [];

    foreach ($listaUsuarios as $u) {
        // Verificar si la credencial ya existe
        $stmt = $conn->prepare("SELECT id_credenciales FROM CREDENCIALES WHERE username = :username");
        $stmt->execute([':username' => $u['username']]);
        if ($stmt->fetch()) {
            echo "   • Usuario '{$u['username']}' ya existía, omitiendo inserción de credencial.\n";
            // Still collect IDs for later use (assignments)
            if ($u['tipo'] === 'docente') {
                $stmtD = $conn->prepare("SELECT d.id_docente FROM DOCENTES d INNER JOIN PERSONAS p ON d.id_persona = p.id_persona WHERE p.dni = :dni LIMIT 1");
                $stmtD->execute([':dni' => $u['dni']]);
                $rowD = $stmtD->fetch(PDO::FETCH_ASSOC);
                if ($rowD) {
                    $docentesIds[$u['username']] = $rowD['id_docente'];
                }
            }
            continue;
        }

        // Check if person already exists by DNI (idempotent re-run)
        $stmt = $conn->prepare("SELECT id_persona FROM PERSONAS WHERE dni = :dni");
        $stmt->execute([':dni' => $u['dni']]);
        $existingPersona = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existingPersona) {
            $idPersona = $existingPersona['id_persona'];
        } else {
            // Insertar PERSONAS
            $stmt = $conn->prepare("
                INSERT INTO PERSONAS (dni, nombre, ap_paterno, ap_materno, fechaNa, direccion)
                VALUES (:dni, :nombre, :ap_paterno, :ap_materno, :fechaNa, :direccion)
            ");
            $stmt->execute([
                ':dni'        => $u['dni'],
                ':nombre'     => $u['nombre'],
                ':ap_paterno' => $u['ap_paterno'],
                ':ap_materno' => $u['ap_materno'],
                ':fechaNa'    => $u['fechaNa'],
                ':direccion'  => $u['direccion']
            ]);
            $idPersona = $conn->lastInsertId();

            // Insertar EXTRA_PERSONA
            $stmt = $conn->prepare("INSERT INTO EXTRA_PERSONA (id_persona, telefono, correo) VALUES (:id, :tel, :correo)");
            $stmt->execute([':id' => $idPersona, ':tel' => $u['telefono'], ':correo' => $u['correo']]);

            // Crear BUZON
            $stmt = $conn->prepare("INSERT INTO BUZON (no_leidos) VALUES (0)");
            $stmt->execute();
            $idBuzon = $conn->lastInsertId();
        }

        // Insertar en tabla de cargo específico (skip if already exists)
        if ($u['tipo'] === 'administrativo') {
            $stmt = $conn->prepare("SELECT id_administrativo FROM ADMINISTRATIVO WHERE id_persona = :id");
            $stmt->execute([':id' => $idPersona]);
            if (!$stmt->fetch()) {
                $stmt = $conn->prepare("
                    INSERT INTO ADMINISTRATIVO (id_persona, es_activo, grado_academico, especialidad, id_buzon)
                    VALUES (:id_persona, 1, :grado, :esp, :buzon)
                ");
                $stmt->execute([':id_persona' => $idPersona, ':grado' => $u['grado_academico'], ':esp' => $u['especialidad'], ':buzon' => $idBuzon]);
            }
        } else {
            $stmt = $conn->prepare("SELECT id_docente FROM DOCENTES WHERE id_persona = :id");
            $stmt->execute([':id' => $idPersona]);
            $existingDoc = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existingDoc) {
                $docentesIds[$u['username']] = $existingDoc['id_docente'];
            } else {
                $stmt = $conn->prepare("
                    INSERT INTO DOCENTES (id_persona, cod_docente, tipo_contrato, es_activo, grado_academico, especialidad, id_buzon)
                    VALUES (:id_persona, :cod, :contrato, 1, :grado, :esp, :buzon)
                ");
                $stmt->execute([
                    ':id_persona' => $idPersona,
                    ':cod'        => $u['cod_docente'],
                    ':contrato'   => $u['tipo_contrato'],
                    ':grado'      => $u['grado_academico'],
                    ':esp'        => $u['especialidad'],
                    ':buzon'      => $idBuzon ?? 0
                ]);
                $docentesIds[$u['username']] = $conn->lastInsertId();
            }
        }

        // Insertar CREDENCIALES
        $hashPass = Security::encriptarPassword($u['password']);
        $stmt = $conn->prepare("INSERT INTO CREDENCIALES (username, password_hash, id_persona) VALUES (:u, :p, :id)");
        $stmt->execute([':u' => $u['username'], ':p' => $hashPass, ':id' => $idPersona]);
        $idCred = $conn->lastInsertId();

        // Asignar Rol en USUARIO_ROL
        $idRol = $rolesIds[$u['rol']];
        $stmt = $conn->prepare("INSERT INTO USUARIO_ROL (id_credenciales, id_rol) VALUES (:c, :r)");
        $stmt->execute([':c' => $idCred, ':r' => $idRol]);

        echo "   ✔ Usuario '{$u['username']}' ({$u['nombre']} {$u['ap_paterno']}) registrado.\n";
    }
    echo "\n";

    // -----------------------------------------------------------------
    // 3. GRADOS ESCOLARES (GRADO)
    // -----------------------------------------------------------------
    echo "3. Insertando grados académicos...\n";
    $gradosDefinidos = [
        ['nombre' => '1° Primaria',   'seccion' => 'A', 'turno' => 'Mañana'],
        ['nombre' => '2° Primaria',   'seccion' => 'A', 'turno' => 'Mañana'],
        ['nombre' => '3° Primaria',   'seccion' => 'A', 'turno' => 'Mañana'],
        ['nombre' => '1° Secundaria', 'seccion' => 'A', 'turno' => 'Mañana'],
        ['nombre' => '2° Secundaria', 'seccion' => 'A', 'turno' => 'Mañana'],
    ];

    $gradosIds = [];
    foreach ($gradosDefinidos as $g) {
        $stmt = $conn->prepare("SELECT id_grado FROM GRADO WHERE nombre = :nombre AND seccion = :seccion");
        $stmt->execute([':nombre' => $g['nombre'], ':seccion' => $g['seccion']]);
        $row = $stmt->fetch();
        if ($row) {
            $gradosIds[$g['nombre']] = $row['id_grado'];
        } else {
            $stmt = $conn->prepare("INSERT INTO GRADO (nombre, seccion, turno) VALUES (:n, :s, :t)");
            $stmt->execute([':n' => $g['nombre'], ':s' => $g['seccion'], ':t' => $g['turno']]);
            $gradosIds[$g['nombre']] = $conn->lastInsertId();
        }
    }
    echo "   ✔ 5 Grados registrados correctamente.\n\n";

    // -----------------------------------------------------------------
    // 4. CURSOS (CURSO)
    // -----------------------------------------------------------------
    echo "4. Registrando materias y cursos académicos...\n";
    $cursosDefinidos = [
        ['nombre' => 'Matemáticas',             'descripcion' => 'Desarrollo del razonamiento lógico-matemático, álgebra y geometría.'],
        ['nombre' => 'Comunicación',            'descripcion' => 'Comprensión lectora, gramática, ortografía y expresión oral.'],
        ['nombre' => 'Ciencia y Tecnología',   'descripcion' => 'Estudio de las ciencias naturales, biología, física y química elemental.'],
        ['nombre' => 'Historia y Geografía',    'descripcion' => 'Conocimiento histórico nacional, mundial y geografía descriptiva.'],
        ['nombre' => 'Inglés Técnico',          'descripcion' => 'Desarrollo de competencias lingüísticas en idioma extranjero.'],
        ['nombre' => 'Arte y Visual',           'descripcion' => 'Expresión artística, pintura, dibujo técnico y apreciación estética.'],
        ['nombre' => 'Educación Física',        'descripcion' => 'Desarrollo psicomotor, deporte, recreación y hábitos saludables.'],
        ['nombre' => 'Computación e Informática', 'descripcion' => 'Fundamentos de informática, programación básica y uso de herramientas digitales.'],
    ];

    $cursosIds = [];
    foreach ($cursosDefinidos as $c) {
        $stmt = $conn->prepare("SELECT id_curso FROM CURSO WHERE nombre = :nombre");
        $stmt->execute([':nombre' => $c['nombre']]);
        $row = $stmt->fetch();
        if ($row) {
            $cursosIds[$c['nombre']] = $row['id_curso'];
        } else {
            $stmt = $conn->prepare("INSERT INTO CURSO (nombre, descripcion) VALUES (:n, :d)");
            $stmt->execute([':n' => $c['nombre'], ':d' => $c['descripcion']]);
            $cursosIds[$c['nombre']] = $conn->lastInsertId();
        }
    }
    echo "   ✔ 8 Cursos académicos registrados.\n\n";

    // -----------------------------------------------------------------
    // 5. ASOCIACIÓN GRADO - CURSO (GRADO_CURSO)
    // -----------------------------------------------------------------
    echo "5. Creando malla curricular Grado-Curso (Año 2026)...\n";

    $gradoCursoMap = []; // Key: "Grado|Curso" => id_gradoCurso

    foreach ($gradosIds as $nombreGrado => $idGrado) {
        foreach ($cursosIds as $nombreCurso => $idCurso) {
            $stmt = $conn->prepare("SELECT id_gradoCurso FROM GRADO_CURSO WHERE id_grado = :g AND id_curso = :c AND anio = 2026");
            $stmt->execute([':g' => $idGrado, ':c' => $idCurso]);
            $row = $stmt->fetch();
            if ($row) {
                $gradoCursoMap["{$nombreGrado}|{$nombreCurso}"] = $row['id_gradoCurso'];
            } else {
                $stmt = $conn->prepare("INSERT INTO GRADO_CURSO (id_grado, id_curso, anio) VALUES (:g, :c, 2026)");
                $stmt->execute([':g' => $idGrado, ':c' => $idCurso]);
                $gradoCursoMap["{$nombreGrado}|{$nombreCurso}"] = $conn->lastInsertId();
            }
        }
    }
    echo "   ✔ Malla curricular del año 2026 generada exitosamente.\n\n";

    // -----------------------------------------------------------------
    // 6. ASIGNACIÓN DE CURSOS A DOCENTES CON HORARIOS (ASIGNACION_CURSO)
    // -----------------------------------------------------------------
    echo "6. Asignando carga horaria a docentes...\n";
    
    // Asignaciones
    $asignacionesConfig = [
        ['docente' => 'docente',           'grado' => '1° Primaria',   'curso' => 'Matemáticas',             'dia' => 'Lunes',     'inicio' => '10:15:00', 'fin' => '11:45:00'],
        ['docente' => 'docente',           'grado' => '3° Primaria',   'curso' => 'Comunicación',            'dia' => 'Martes',    'inicio' => '08:00:00', 'fin' => '09:30:00'],
        ['docente' => 'prof.matematica',   'grado' => '1° Secundaria', 'curso' => 'Matemáticas',             'dia' => 'Lunes',     'inicio' => '08:00:00', 'fin' => '10:00:00'],
        ['docente' => 'prof.matematica',   'grado' => '2° Secundaria', 'curso' => 'Matemáticas',             'dia' => 'Martes',    'inicio' => '10:15:00', 'fin' => '12:15:00'],
        ['docente' => 'prof.comunicacion', 'grado' => '1° Secundaria', 'curso' => 'Comunicación',            'dia' => 'Miércoles', 'inicio' => '08:00:00', 'fin' => '10:00:00'],
        ['docente' => 'prof.comunicacion', 'grado' => '2° Secundaria', 'curso' => 'Comunicación',            'dia' => 'Jueves',    'inicio' => '10:15:00', 'fin' => '12:15:00'],
        ['docente' => 'prof.ciencias',     'grado' => '1° Secundaria', 'curso' => 'Ciencia y Tecnología',    'dia' => 'Viernes',   'inicio' => '08:00:00', 'fin' => '10:00:00'],
        ['docente' => 'prof.historia',     'grado' => '2° Secundaria', 'curso' => 'Historia y Geografía',    'dia' => 'Viernes',   'inicio' => '10:15:00', 'fin' => '12:15:00'],
        ['docente' => 'prof.arte',         'grado' => '3° Primaria',   'curso' => 'Arte y Visual',           'dia' => 'Miércoles', 'inicio' => '10:00:00', 'fin' => '11:30:00'],
        ['docente' => 'prof.arte',         'grado' => '1° Secundaria', 'curso' => 'Arte y Visual',           'dia' => 'Jueves',    'inicio' => '08:00:00', 'fin' => '09:30:00'],
        ['docente' => 'prof.edfisica',     'grado' => '1° Primaria',   'curso' => 'Educación Física',        'dia' => 'Miércoles', 'inicio' => '08:00:00', 'fin' => '09:30:00'],
        ['docente' => 'prof.edfisica',     'grado' => '2° Secundaria', 'curso' => 'Educación Física',        'dia' => 'Lunes',     'inicio' => '14:00:00', 'fin' => '15:30:00'],
        ['docente' => 'prof.computacion',  'grado' => '3° Primaria',   'curso' => 'Computación e Informática','dia' => 'Jueves',   'inicio' => '10:00:00', 'fin' => '11:30:00'],
        ['docente' => 'prof.computacion',  'grado' => '2° Secundaria', 'curso' => 'Computación e Informática','dia' => 'Martes',  'inicio' => '14:00:00', 'fin' => '15:30:00'],
    ];

    foreach ($asignacionesConfig as $asig) {
        $idDocente = $docentesIds[$asig['docente']] ?? null;
        $keyGC = "{$asig['grado']}|{$asig['curso']}";
        $idGC = $gradoCursoMap[$keyGC] ?? null;

        if ($idDocente && $idGC) {
            $stmt = $conn->prepare("
                SELECT id_asignacionCurso FROM ASIGNACION_CURSO 
                WHERE id_docente = :d AND id_gradoCurso = :gc
            ");
            $stmt->execute([':d' => $idDocente, ':gc' => $idGC]);
            if (!$stmt->fetch()) {
                $stmt = $conn->prepare("
                    INSERT INTO ASIGNACION_CURSO (id_docente, id_gradoCurso, dia_horario, hora_inicio, hora_fin, fecha_asignacion)
                    VALUES (:d, :gc, :dia, :hi, :hf, CURDATE())
                ");
                $stmt->execute([
                    ':d'   => $idDocente,
                    ':gc'  => $idGC,
                    ':dia' => $asig['dia'],
                    ':hi'  => $asig['inicio'],
                    ':hf'  => $asig['fin']
                ]);
            }
        }
    }
    echo "   ✔ Carga horaria de profesores asignada.\n\n";

    // -----------------------------------------------------------------
    // 7. SESIONES Y ACTIVIDADES EVALUATIVAS (SESION, ACTIVIDADES)
    // -----------------------------------------------------------------
    echo "7. Registrando sesiones de clase y actividades evaluativas...\n";

    $gcMat1Sec = $gradoCursoMap['1° Secundaria|Matemáticas'] ?? null;
    $actividadesIds = [];

    if ($gcMat1Sec) {
        // Sesiones
        $sesionesList = [
            ['nombre' => 'Sesión 1: Ecuaciones de Primer Grado', 'desc' => 'Introducción a despeje de variables y métodos de resolución.'],
            ['nombre' => 'Sesión 2: Sistemas de Ecuaciones 2x2',  'desc' => 'Métodos de sustitución e igualación.'],
        ];

        foreach ($sesionesList as $s) {
            $stmt = $conn->prepare("SELECT id_sesion FROM SESION WHERE id_gradoCurso = :gc AND nombre = :n");
            $stmt->execute([':gc' => $gcMat1Sec, ':n' => $s['nombre']]);
            if (!$stmt->fetch()) {
                $stmt = $conn->prepare("INSERT INTO SESION (nombre, descripcion, id_gradoCurso) VALUES (:n, :d, :gc)");
                $stmt->execute([':n' => $s['nombre'], ':d' => $s['desc'], ':gc' => $gcMat1Sec]);
            }
        }

        // Actividades Evaluativas (Exámenes / Prácticas)
        $actividadesList = [
            ['nombre' => 'Examen Parcial 1',        'peso' => 40.00],
            ['nombre' => 'Práctica Calificada 1',   'peso' => 30.00],
            ['nombre' => 'Trabajo de Investigación','peso' => 30.00],
        ];

        foreach ($actividadesList as $act) {
            $stmt = $conn->prepare("SELECT id_actividad FROM ACTIVIDADES WHERE id_gradoCurso = :gc AND nombre = :n");
            $stmt->execute([':gc' => $gcMat1Sec, ':n' => $act['nombre']]);
            $row = $stmt->fetch();
            if ($row) {
                $actividadesIds[$act['nombre']] = $row['id_actividad'];
            } else {
                $stmt = $conn->prepare("INSERT INTO ACTIVIDADES (nombre, peso, id_gradoCurso) VALUES (:n, :p, :gc)");
                $stmt->execute([':n' => $act['nombre'], ':p' => $act['peso'], ':gc' => $gcMat1Sec]);
                $actividadesIds[$act['nombre']] = $conn->lastInsertId();
            }
        }
    }
    echo "   ✔ Sesiones de aprendizaje y rúbricas creadas.\n\n";

    // -----------------------------------------------------------------
    // 8. APODERADOS Y ALUMNOS (APODERADO, ALUMNOS)
    // -----------------------------------------------------------------
    echo "8. Insertando alumnos y apoderados de prueba...\n";

    // Crear Apoderado de Prueba
    $stmt = $conn->prepare("SELECT id_apoderado FROM APODERADO a JOIN PERSONAS p ON a.id_persona = p.id_persona WHERE p.dni = '78888888'");
    $stmt->execute();
    $rowApod = $stmt->fetch();

    if ($rowApod) {
        $idApoderado = $rowApod['id_apoderado'];
    } else {
        $stmt = $conn->prepare("INSERT INTO PERSONAS (dni, nombre, ap_paterno, ap_materno, fechaNa, direccion) VALUES ('78888888', 'Juan', 'Pérez', 'Soto', '1975-04-12', 'Calle Los Alisos 123')");
        $stmt->execute();
        $idPersApod = $conn->lastInsertId();

        $stmt = $conn->prepare("INSERT INTO EXTRA_PERSONA (id_persona, telefono, correo) VALUES (:id, '999111222', 'j.perez@gmail.com')");
        $stmt->execute([':id' => $idPersApod]);

        $stmt = $conn->prepare("INSERT INTO APODERADO (id_persona, es_moroso) VALUES (:id, 0)");
        $stmt->execute([':id' => $idPersApod]);
        $idApoderado = $conn->lastInsertId();
    }

    // Lista de Alumnos
    $idGrado1Sec = $gradosIds['1° Secundaria'] ?? 1;
    $alumnosList = [
        ['dni' => '80000001', 'nombre' => 'Mateo',   'paterno' => 'Pérez',   'materno' => 'Rojas',   'cod' => 'ALU-0001'],
        ['dni' => '80000002', 'nombre' => 'Sofia',   'paterno' => 'Quispe',  'materno' => 'Huamán',  'cod' => 'ALU-0002'],
        ['dni' => '80000003', 'nombre' => 'Lucas',   'paterno' => 'Mendoza', 'materno' => 'Alvarez', 'cod' => 'ALU-0003'],
    ];

    $alumnosIds = [];

    foreach ($alumnosList as $alu) {
        $stmt = $conn->prepare("SELECT id_alumno FROM ALUMNOS WHERE cod_alumn = :cod");
        $stmt->execute([':cod' => $alu['cod']]);
        $row = $stmt->fetch();
        if ($row) {
            $alumnosIds[] = $row['id_alumno'];
        } else {
            $stmt = $conn->prepare("INSERT INTO PERSONAS (dni, nombre, ap_paterno, ap_materno, fechaNa, direccion) VALUES (:dni, :n, :p, :m, '2012-05-10', 'Av. Solar 456')");
            $stmt->execute([':dni' => $alu['dni'], ':n' => $alu['nombre'], ':p' => $alu['paterno'], ':m' => $alu['materno']]);
            $idPersAlu = $conn->lastInsertId();

            $stmt = $conn->prepare("INSERT INTO ALUMNOS (id_persona, cod_alumn, id_apoderado, id_grado) VALUES (:p, :cod, :apod, :g)");
            $stmt->execute([':p' => $idPersAlu, ':cod' => $alu['cod'], ':apod' => $idApoderado, ':g' => $idGrado1Sec]);
            $alumnosIds[] = $conn->lastInsertId();
        }
    }
    echo "   ✔ 3 Alumnos matriculados en 1° Secundaria.\n\n";

    // -----------------------------------------------------------------
    // 9. NOTAS Y ASISTENCIA (NOTAS, ASISTENCIA)
    // -----------------------------------------------------------------
    echo "9. Calificando actividades y registrando asistencias...\n";

    // Registrar Notas de prueba
    if (!empty($actividadesIds) && !empty($alumnosIds)) {
        $notasMuestra = [18.5, 15.0, 16.5];
        $i = 0;
        foreach ($alumnosIds as $idAlu) {
            foreach ($actividadesIds as $nombreAct => $idAct) {
                $stmt = $conn->prepare("SELECT id_nota FROM NOTAS WHERE id_actividad = :act AND id_alumno = :alu");
                $stmt->execute([':act' => $idAct, ':alu' => $idAlu]);
                if (!$stmt->fetch()) {
                    $notaVal = $notasMuestra[$i % count($notasMuestra)];
                    $stmt = $conn->prepare("INSERT INTO NOTAS (nota, id_actividad, id_alumno) VALUES (:n, :act, :alu)");
                    $stmt->execute([':n' => $notaVal, ':act' => $idAct, ':alu' => $idAlu]);
                }
                $i++;
            }
        }
    }

    // Registrar Asistencias de prueba
    foreach ($alumnosIds as $idAlu) {
        $stmt = $conn->prepare("SELECT id_asistencia FROM ASISTENCIA WHERE id_alumno = :alu AND fecha = CURDATE()");
        $stmt->execute([':alu' => $idAlu]);
        if (!$stmt->fetch()) {
            $stmt = $conn->prepare("INSERT INTO ASISTENCIA (fecha, tipo, id_alumno) VALUES (CURDATE(), 'P', :alu)");
            $stmt->execute([':alu' => $idAlu]);
        }
    }
    echo "   ✔ Registros de notas y asistencias procesados.\n\n";

    // -----------------------------------------------------------------
    // FIN Y CONFIRMACIÓN DE TRANSACCIÓN
    // -----------------------------------------------------------------
    $conn->commit();

    echo "=============================================================\n";
    echo "  ¡POBLADO ACADÉMICO SE COMPLETÓ EXITOSAMENTE!\n";
    echo "=============================================================\n\n";

    echo "Resumen de Usuarios para Pruebas:\n";
    echo "  📌 Director/Admin  -> user: director         | pass: director123\n";
    echo "  📌 Contador        -> user: contador         | pass: contador123\n";
    echo "  📌 Docente Gral    -> user: docente          | pass: docente123\n";
    echo "  📌 Prof. Matemática -> user: prof.matematica  | pass: matematica123\n";
    echo "  📌 Prof. Lenguaje   -> user: prof.comunicacion| pass: comunicacion123\n";
    echo "  📌 Prof. Ciencias   -> user: prof.ciencias    | pass: ciencias123\n";
    echo "  📌 Prof. Historia   -> user: prof.historia    | pass: historia123\n";
    echo "  📌 Prof. Arte       -> user: prof.arte        | pass: arte123\n";
    echo "  📌 Prof. Ed.Física  -> user: prof.edfisica    | pass: edfisica123\n";
    echo "  📌 Prof. Computación -> user: prof.computacion| pass: computacion123\n\n";

} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    echo "❌ ERROR DURANTE EL POBLADO: " . $e->getMessage() . "\n";
    echo "Línea: " . $e->getLine() . "\n";
}

echo "</pre>\n";
