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
    $conn->beginTransaction();

    // -----------------------------------------------------------------
    // 1. ROLES BASE
    // -----------------------------------------------------------------
    echo "1. Creando / verificando roles base...\n";
    $rolesDefinidos = ['Director', 'Docente'];
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
    echo "   ✔ Roles listos: Director (ID {$rolesIds['Director']}), Docente (ID {$rolesIds['Docente']}).\n\n";

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
    ];

    $docentesIds = [];

    foreach ($listaUsuarios as $u) {
        // Verificar si la credencial ya existe
        $stmt = $conn->prepare("SELECT id_credenciales FROM CREDENCIALES WHERE username = :username");
        $stmt->execute([':username' => $u['username']]);
        if ($stmt->fetch()) {
            echo "   • Usuario '{$u['username']}' ya existía, omitiendo inserción de credencial.\n";
            continue;
        }

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

        // Insertar en tabla de cargo específico
        if ($u['tipo'] === 'administrativo') {
            $stmt = $conn->prepare("
                INSERT INTO ADMINISTRATIVO (id_persona, es_activo, grado_academico, especialidad, id_buzon)
                VALUES (:id_persona, 1, :grado, :esp, :buzon)
            ");
            $stmt->execute([':id_persona' => $idPersona, ':grado' => $u['grado_academico'], ':esp' => $u['especialidad'], ':buzon' => $idBuzon]);
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
                ':buzon'      => $idBuzon
            ]);
            $docentesIds[$u['username']] = $conn->lastInsertId();
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
    echo "   ✔ 5 Cursos académicos registrados.\n\n";

    // -----------------------------------------------------------------
    // 5. ASOCIACIÓN GRADO - CURSO (GRADO_CURSO)
    // -----------------------------------------------------------------
    echo "5. Creando malla curricular Grado-Curso (Año 2026)...\n";
    $gradoCursoMap = []; // Key: "Grado|Curso" => id_gradoCurso

    foreach ($gradosIds as $nombreGrado => $idGrado) {
        foreach ($cursosIds as $nombreCurso => $idCurso) {
            $stmt = $conn->prepare("SELECT id_gradoCurso FROM GRADO_CURSO WHERE id_grado = :g AND id_curso = :c AND año = 2026");
            $stmt->execute([':g' => $idGrado, ':c' => $idCurso]);
            $row = $stmt->fetch();
            if ($row) {
                $gradoCursoMap["{$nombreGrado}|{$nombreCurso}"] = $row['id_gradoCurso'];
            } else {
                $stmt = $conn->prepare("INSERT INTO GRADO_CURSO (id_grado, id_curso, año) VALUES (:g, :c, 2026)");
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
        ['docente' => 'prof.matematica',   'grado' => '1° Secundaria', 'curso' => 'Matemáticas',           'dia' => 'Lunes',     'inicio' => '08:00:00', 'fin' => '10:00:00'],
        ['docente' => 'prof.matematica',   'grado' => '2° Secundaria', 'curso' => 'Matemáticas',           'dia' => 'Martes',    'inicio' => '10:15:00', 'fin' => '12:15:00'],
        ['docente' => 'prof.comunicacion', 'grado' => '1° Secundaria', 'curso' => 'Comunicación',          'dia' => 'Miércoles', 'inicio' => '08:00:00', 'fin' => '10:00:00'],
        ['docente' => 'prof.comunicacion', 'grado' => '2° Secundaria', 'curso' => 'Comunicación',          'dia' => 'Jueves',    'inicio' => '10:15:00', 'fin' => '12:15:00'],
        ['docente' => 'prof.ciencias',     'grado' => '1° Secundaria', 'curso' => 'Ciencia y Tecnología', 'dia' => 'Viernes',   'inicio' => '08:00:00', 'fin' => '10:00:00'],
        ['docente' => 'docente',           'grado' => '1° Primaria',   'curso' => 'Matemáticas',           'dia' => 'Lunes',     'inicio' => '10:15:00', 'fin' => '11:45:00'],
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
    echo "  📌 Director/Admin  -> user: director        | pass: director123\n";
    echo "  📌 Docente Gral    -> user: docente         | pass: docente123\n";
    echo "  📌 Prof. Matemática -> user: prof.matematica  | pass: matematica123\n";
    echo "  📌 Prof. Lenguaje   -> user: prof.comunicacion| pass: comunicacion123\n";
    echo "  📌 Prof. Ciencias   -> user: prof.ciencias    | pass: ciencias123\n\n";

} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    echo "❌ ERROR DURANTE EL POBLADO: " . $e->getMessage() . "\n";
    echo "Línea: " . $e->getLine() . "\n";
}

echo "</pre>\n";
