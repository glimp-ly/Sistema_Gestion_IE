-- =====================================================================
-- SISTEMA DE GESTION DE COLEGIO - CORAZON DE JESUS
-- Script unificado (script_createBD + correcciones RBAC)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `colegio_DB`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `colegio_DB`;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================
-- 0. LIMPIEZA DE TABLAS EXISTENTES (orden inverso de dependencias)
-- =====================================================================
DROP TABLE IF EXISTS `ASIGNACION_SUELDO_ADMI`;
DROP TABLE IF EXISTS `SUELDO_ADMI`;
DROP TABLE IF EXISTS `SUELDO_ASIGNACION`;
DROP TABLE IF EXISTS `SUELDO`;
DROP TABLE IF EXISTS `ASIGNACION_PENSION`;
DROP TABLE IF EXISTS `PAGOS`;
DROP TABLE IF EXISTS `GASTO`;
DROP TABLE IF EXISTS `CATEGORIA_GASTOS`;
DROP TABLE IF EXISTS `EVENTOS`;
DROP TABLE IF EXISTS `DATOS_IE`;
DROP TABLE IF EXISTS `ASIGNACION_PLANTILLAS`;
DROP TABLE IF EXISTS `PLANTILLAS`;
DROP TABLE IF EXISTS `ALUMNOS_INCIDENCIA`;
DROP TABLE IF EXISTS `INCIDENCIA`;
DROP TABLE IF EXISTS `ARCHIVO`;
DROP TABLE IF EXISTS `MENSAJE`;
DROP TABLE IF EXISTS `ASIGNACION_RECURSO`;
DROP TABLE IF EXISTS `ASISTENCIA`;
DROP TABLE IF EXISTS `NOTAS`;
DROP TABLE IF EXISTS `ACTIVIDADES`;
DROP TABLE IF EXISTS `SESION`;
DROP TABLE IF EXISTS `ASIGNACION_CURSO`;
DROP TABLE IF EXISTS `GRADO_CURSO`;
DROP TABLE IF EXISTS `GRADO_CARGO`;
DROP TABLE IF EXISTS `ALUMNOS`;
DROP TABLE IF EXISTS `APODERADO`;
DROP TABLE IF EXISTS `USUARIO_ROL`;
DROP TABLE IF EXISTS `ASIGNACION_ROL`;
DROP TABLE IF EXISTS `CREDENCIALES`;
DROP TABLE IF EXISTS `EVALUACION`;
DROP TABLE IF EXISTS `RECURSO`;
DROP TABLE IF EXISTS `DOCENTES`;
DROP TABLE IF EXISTS `ADMINISTRATIVO`;
DROP TABLE IF EXISTS `EXTRA_PERSONA`;
DROP TABLE IF EXISTS `PERSONAS`;
DROP TABLE IF EXISTS `ROL`;
DROP TABLE IF EXISTS `BUZON`;
DROP TABLE IF EXISTS `CURSO`;
DROP TABLE IF EXISTS `GRADO`;

-- =====================================================================
-- 1. TABLAS
-- =====================================================================

CREATE TABLE IF NOT EXISTS `PERSONAS` (
	`id_persona` INT NOT NULL AUTO_INCREMENT,
	`dni` VARCHAR(8) NOT NULL,
	`nombre` VARCHAR(50) NOT NULL,
	`ap_paterno` VARCHAR(30) NOT NULL,
	`ap_materno` VARCHAR(30) NOT NULL,
	`fechaNa` DATE NOT NULL,
	`direccion` VARCHAR(255) NOT NULL,
	PRIMARY KEY (`id_persona`),
	UNIQUE KEY `uq_personas_dni` (`dni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `EXTRA_PERSONA` (
	`id_persona` INT NOT NULL,
	`telefono` VARCHAR(9) NOT NULL,
	`correo` VARCHAR(50) NOT NULL,
	PRIMARY KEY (`id_persona`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Atributos extra de PERSONAS. Comparte la misma PK (relacion 1:1), por eso NO lleva AUTO_INCREMENT propio.';


CREATE TABLE IF NOT EXISTS `DOCENTES` (
	`id_docente` INT NOT NULL AUTO_INCREMENT,
	`id_persona` INT NOT NULL,
	`cod_docente` VARCHAR(10) NOT NULL,
	`tipo_contrato` VARCHAR(100) NOT NULL,
	`es_activo` BOOLEAN NOT NULL,
	`grado_academico` VARCHAR(100) NOT NULL,
	`especialidad` VARCHAR(100) NOT NULL,
	`id_buzon` INT NOT NULL,
	PRIMARY KEY (`id_docente`),
	UNIQUE KEY `uq_docentes_persona` (`id_persona`),
	UNIQUE KEY `uq_docentes_cod` (`cod_docente`),
	UNIQUE KEY `uq_docentes_buzon` (`id_buzon`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `ADMINISTRATIVO` (
	`id_administrativo` INT NOT NULL AUTO_INCREMENT,
	`id_persona` INT NOT NULL,
	`es_activo` BOOLEAN NOT NULL,
	`grado_academico` VARCHAR(100) NOT NULL,
	`especialidad` VARCHAR(100) NOT NULL,
	`id_buzon` INT NOT NULL,
	PRIMARY KEY (`id_administrativo`),
	UNIQUE KEY `uq_administrativo_persona` (`id_persona`),
	UNIQUE KEY `uq_administrativo_buzon` (`id_buzon`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `CURSO` (
	`id_curso` INT NOT NULL AUTO_INCREMENT,
	`nombre` VARCHAR(50) NOT NULL,
	`descripcion` TEXT NOT NULL,
	PRIMARY KEY (`id_curso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `GRADO` (
	`id_grado` INT NOT NULL AUTO_INCREMENT,
	`nombre` VARCHAR(10) NOT NULL,
	`seccion` CHAR(1) NOT NULL,
	`turno` VARCHAR(10),
	PRIMARY KEY (`id_grado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `GRADO_CARGO` (
	`id_gradoCargo` INT NOT NULL AUTO_INCREMENT,
	`id_grado` INT NOT NULL,
	`id_docente` INT NOT NULL,
	`es_activo` BOOLEAN NOT NULL,
	`fecha_inicio` DATE NOT NULL,
	`fecha_fin` DATE,
	PRIMARY KEY (`id_gradoCargo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `APODERADO` (
	`id_apoderado` INT NOT NULL AUTO_INCREMENT,
	`id_persona` INT NOT NULL,
	`es_moroso` BOOLEAN NOT NULL,
	PRIMARY KEY (`id_apoderado`),
	UNIQUE KEY `uq_apoderado_persona` (`id_persona`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `ALUMNOS` (
	`id_alumno` INT NOT NULL AUTO_INCREMENT,
	`id_persona` INT NOT NULL,
	`cod_alumn` VARCHAR(10) NOT NULL,
	`id_apoderado` INT NOT NULL,
	`id_grado` INT NOT NULL,
	PRIMARY KEY (`id_alumno`),
	UNIQUE KEY `uq_alumnos_persona` (`id_persona`),
	UNIQUE KEY `uq_alumnos_cod` (`cod_alumn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `GRADO_CURSO` (
	`id_gradoCurso` INT NOT NULL AUTO_INCREMENT,
	`id_curso` INT NOT NULL,
	`id_grado` INT NOT NULL,
	`año` YEAR NOT NULL,
	PRIMARY KEY (`id_gradoCurso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `SESION` (
	`id_sesion` INT NOT NULL AUTO_INCREMENT,
	`nombre` VARCHAR(50) NOT NULL,
	`descripcion` TEXT NOT NULL,
	`id_gradoCurso` INT NOT NULL,
	PRIMARY KEY (`id_sesion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `RECURSO` (
	`id_recurso` INT NOT NULL AUTO_INCREMENT,
	`nombre` VARCHAR(100) NOT NULL,
	`archivo` BLOB NOT NULL,
	`fecha_actu` DATETIME NOT NULL,
	PRIMARY KEY (`id_recurso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `ASIGNACION_CURSO` (
	`id_asignacionCurso` INT NOT NULL AUTO_INCREMENT,
	`id_docente` INT NOT NULL,
	`id_gradoCurso` INT NOT NULL,
	`dia_horario` VARCHAR(10) NOT NULL,
	`hora_inicio` TIME NOT NULL,
	`hora_fin` TIME NOT NULL,
	`fecha_asignacion` DATE NOT NULL,
	`fecha_finAsig` DATE,
	PRIMARY KEY (`id_asignacionCurso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `ASIGNACION_RECURSO` (
	`id_sesionRecurso` INT NOT NULL AUTO_INCREMENT,
	`id_sesion` INT NOT NULL,
	`id_recurso` INT NOT NULL,
	PRIMARY KEY (`id_sesionRecurso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `ACTIVIDADES` (
	`id_actividad` INT NOT NULL AUTO_INCREMENT,
	`nombre` VARCHAR(100) NOT NULL,
	`peso` DECIMAL(5,2) NOT NULL,
	`id_gradoCurso` INT NOT NULL,
	PRIMARY KEY (`id_actividad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `NOTAS` (
	`id_nota` INT NOT NULL AUTO_INCREMENT,
	`nota` DECIMAL(5,2) NOT NULL,
	`id_actividad` INT NOT NULL,
	`id_alumno` INT NOT NULL,
	PRIMARY KEY (`id_nota`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `ASISTENCIA` (
	`id_asistencia` INT NOT NULL AUTO_INCREMENT,
	`fecha` DATE NOT NULL,
	`tipo` VARCHAR(2) NOT NULL,
	`id_alumno` INT NOT NULL,
	PRIMARY KEY (`id_asistencia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `EVALUACION` (
	`id_evaluacion` INT NOT NULL AUTO_INCREMENT,
	`id_administrativo` INT NOT NULL,
	`id_docente` INT NOT NULL,
	`puntaje` DECIMAL(5,2) NOT NULL,
	`fecha` DATE NOT NULL,
	`observaciones` TEXT NOT NULL,
	PRIMARY KEY (`id_evaluacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `CREDENCIALES` (
	`id_credenciales` INT NOT NULL AUTO_INCREMENT,
	`username` VARCHAR(255) NOT NULL,
	`password_hash` VARCHAR(255) NOT NULL,
	`id_persona` INT NOT NULL,
	PRIMARY KEY (`id_credenciales`),
	UNIQUE KEY `uq_credenciales_username` (`username`),
	UNIQUE KEY `uq_credenciales_persona` (`id_persona`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `ROL` (
	`id_rol` INT NOT NULL AUTO_INCREMENT,
	`nombre` VARCHAR(30) NOT NULL,
	PRIMARY KEY (`id_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- [CORRECCION] Se reemplaza ASIGNACION_ROL (acoplada solo a administrativos)
-- por USUARIO_ROL (RBAC unificado conectado a CREDENCIALES)
CREATE TABLE IF NOT EXISTS `USUARIO_ROL` (
    `id_usuario_rol` INT NOT NULL AUTO_INCREMENT,
    `id_credenciales` INT NOT NULL,
    `id_rol` INT NOT NULL,
    `fecha_asignacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_usuario_rol`),
    -- Evita que a un mismo usuario se le asigne el mismo rol mas de una vez
    UNIQUE KEY `uq_usuario_rol` (`id_credenciales`, `id_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `BUZON` (
	`id_buzon` INT NOT NULL AUTO_INCREMENT,
	`no_leidos` INT NOT NULL DEFAULT 0,
	PRIMARY KEY (`id_buzon`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `MENSAJE` (
	`id_mensaje` INT NOT NULL AUTO_INCREMENT,
	`mensaje` TEXT NOT NULL,
	`fecha_envio` DATETIME NOT NULL,
	`leido` BOOLEAN NOT NULL DEFAULT FALSE,
	`emisor` VARCHAR(100) NOT NULL,
	`destinatario` VARCHAR(100) NOT NULL,
	`id_buzon` INT NOT NULL,
	PRIMARY KEY (`id_mensaje`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `ARCHIVO` (
	`id_archivo` INT NOT NULL AUTO_INCREMENT,
	`nombre` VARCHAR(100) NOT NULL,
	`archivo` BLOB NOT NULL,
	`fecha` DATETIME NOT NULL,
	`id_mensaje` INT NOT NULL,
	PRIMARY KEY (`id_archivo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `INCIDENCIA` (
	`id_incidencia` INT NOT NULL AUTO_INCREMENT,
	`texto` TEXT NOT NULL,
	`prioridad` VARCHAR(10) NOT NULL,
	`id_docente` INT NOT NULL,
	`fecha` DATE NOT NULL,
	PRIMARY KEY (`id_incidencia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `ALUMNOS_INCIDENCIA` (
	`id_alumno` INT NOT NULL,
	`id_incidencia` INT NOT NULL,
	PRIMARY KEY (`id_alumno`, `id_incidencia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `PLANTILLAS` (
	`id_plantilla` INT NOT NULL AUTO_INCREMENT,
	`nombre` VARCHAR(50) NOT NULL,
	`categoria` VARCHAR(50) NOT NULL,
	`archivo` BLOB NOT NULL,
	PRIMARY KEY (`id_plantilla`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `ASIGNACION_PLANTILLAS` (
	`id_asignacionPlantillas` INT NOT NULL AUTO_INCREMENT,
	`id_administrativo` INT NOT NULL,
	`id_plantilla` INT NOT NULL,
	PRIMARY KEY (`id_asignacionPlantillas`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `PAGOS` (
	`id_pagos` INT NOT NULL AUTO_INCREMENT,
	`fecha_emision` DATE NOT NULL,
	`fecha_vence` DATE NOT NULL,
	`monto` DECIMAL(10,2) NOT NULL,
	`tipo` VARCHAR(20) NOT NULL,
	PRIMARY KEY (`id_pagos`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `ASIGNACION_PENSION` (
	`id_asignacionPension` INT NOT NULL AUTO_INCREMENT,
	`descuento` DECIMAL(10,2) NOT NULL DEFAULT 0,
	`recibo` BLOB,
	`fecha_pago` DATETIME,
	`id_pagos` INT NOT NULL,
	`id_apoderado` INT NOT NULL,
	PRIMARY KEY (`id_asignacionPension`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `SUELDO` (
	`id_sueldo` INT NOT NULL AUTO_INCREMENT,
	`nivel` VARCHAR(20) NOT NULL,
	`monto` DECIMAL(10,2) NOT NULL,
	`mes_pago` DATE NOT NULL,
	`fecha_limite` DATE NOT NULL,
	`bono` DECIMAL(10,2) NOT NULL DEFAULT 0,
	PRIMARY KEY (`id_sueldo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `SUELDO_ASIGNACION` (
	`id_sueldoAsignacion` INT NOT NULL AUTO_INCREMENT,
	`bono_personal` DECIMAL(10,2) NOT NULL DEFAULT 0,
	`fecha_pago` DATETIME,
	`id_sueldo` INT NOT NULL,
	`id_docente` INT NOT NULL,
	PRIMARY KEY (`id_sueldoAsignacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `SUELDO_ADMI` (
	`id_sueldoAdmi` INT NOT NULL AUTO_INCREMENT,
	`monto` DECIMAL(10,2) NOT NULL,
	`mes` DATE NOT NULL,
	`fecha_limite` DATE NOT NULL,
	`bono` DECIMAL(10,2) NOT NULL DEFAULT 0,
	`id_rol` INT NOT NULL,
	PRIMARY KEY (`id_sueldoAdmi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `ASIGNACION_SUELDO_ADMI` (
	`id_asingSueldoAdmi` INT NOT NULL AUTO_INCREMENT,
	`bono_personal` DECIMAL(10,2) NOT NULL DEFAULT 0,
	`fecha_pago` DATE,
	`id_sueldoAdmi` INT NOT NULL,
	`id_administrativo` INT NOT NULL,
	PRIMARY KEY (`id_asingSueldoAdmi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `DATOS_IE` (
	`id_ie` INT NOT NULL AUTO_INCREMENT,
	`nombre` VARCHAR(255) NOT NULL,
	`ruc` VARCHAR(255) NOT NULL,
	`direccion` VARCHAR(255) NOT NULL,
	`logo` BLOB,
	`año` YEAR NOT NULL,
	PRIMARY KEY (`id_ie`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `EVENTOS` (
	`id_evento` INT NOT NULL AUTO_INCREMENT,
	`nombre` VARCHAR(255) NOT NULL,
	`fecha_inicio` DATETIME NOT NULL,
	`fecha_fin` DATETIME NOT NULL,
	`creado_por` INT NOT NULL,
	PRIMARY KEY (`id_evento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `CATEGORIA_GASTOS` (
	`id_categoriaGasto` INT NOT NULL AUTO_INCREMENT,
	`nombre` VARCHAR(100) NOT NULL,
	PRIMARY KEY (`id_categoriaGasto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `GASTO` (
	`id_gasto` INT NOT NULL AUTO_INCREMENT,
	`id_categoriaGasto` INT NOT NULL,
	`monto` DECIMAL(10,2) NOT NULL,
	`fecha_emision` DATE NOT NULL,
	`fecha_pago` DATE NOT NULL,
	`descripcion` TEXT NOT NULL,
	`num_operacion` VARCHAR(255) NOT NULL,
	`comprobante` BLOB,
	`creado_por` INT NOT NULL,
	`actualizado_por` INT,
	PRIMARY KEY (`id_gasto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 2. LLAVES FORANEAS
-- =====================================================================

ALTER TABLE `EXTRA_PERSONA`
	ADD CONSTRAINT `fk_extrapersona_persona` FOREIGN KEY (`id_persona`) REFERENCES `PERSONAS`(`id_persona`)
	ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `DOCENTES`
	ADD CONSTRAINT `fk_docentes_persona` FOREIGN KEY (`id_persona`) REFERENCES `PERSONAS`(`id_persona`)
	ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `ADMINISTRATIVO`
	ADD CONSTRAINT `fk_administrativo_persona` FOREIGN KEY (`id_persona`) REFERENCES `PERSONAS`(`id_persona`)
	ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `APODERADO`
	ADD CONSTRAINT `fk_apoderado_persona` FOREIGN KEY (`id_persona`) REFERENCES `PERSONAS`(`id_persona`)
	ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `ALUMNOS`
	ADD CONSTRAINT `fk_alumnos_persona` FOREIGN KEY (`id_persona`) REFERENCES `PERSONAS`(`id_persona`)
	ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `CREDENCIALES`
	ADD CONSTRAINT `fk_credenciales_persona` FOREIGN KEY (`id_persona`) REFERENCES `PERSONAS`(`id_persona`)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- ---- Buzon (1:1 con DOCENTES / ADMINISTRATIVO) -------------------------
ALTER TABLE `DOCENTES`
	ADD CONSTRAINT `fk_docentes_buzon` FOREIGN KEY (`id_buzon`) REFERENCES `BUZON`(`id_buzon`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ADMINISTRATIVO`
	ADD CONSTRAINT `fk_administrativo_buzon` FOREIGN KEY (`id_buzon`) REFERENCES `BUZON`(`id_buzon`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

-- ---- Estructura academica ----------------------------------------------
ALTER TABLE `GRADO_CARGO`
	ADD CONSTRAINT `fk_gradocargo_grado` FOREIGN KEY (`id_grado`) REFERENCES `GRADO`(`id_grado`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `GRADO_CARGO`
	ADD CONSTRAINT `fk_gradocargo_docente` FOREIGN KEY (`id_docente`) REFERENCES `DOCENTES`(`id_docente`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `GRADO_CURSO`
	ADD CONSTRAINT `fk_gradocurso_grado` FOREIGN KEY (`id_grado`) REFERENCES `GRADO`(`id_grado`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `GRADO_CURSO`
	ADD CONSTRAINT `fk_gradocurso_curso` FOREIGN KEY (`id_curso`) REFERENCES `CURSO`(`id_curso`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ASIGNACION_CURSO`
	ADD CONSTRAINT `fk_asigcurso_docente` FOREIGN KEY (`id_docente`) REFERENCES `DOCENTES`(`id_docente`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ASIGNACION_CURSO`
	ADD CONSTRAINT `fk_asigcurso_gradocurso` FOREIGN KEY (`id_gradoCurso`) REFERENCES `GRADO_CURSO`(`id_gradoCurso`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ALUMNOS`
	ADD CONSTRAINT `fk_alumnos_apoderado` FOREIGN KEY (`id_apoderado`) REFERENCES `APODERADO`(`id_apoderado`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ALUMNOS`
	ADD CONSTRAINT `fk_alumnos_grado` FOREIGN KEY (`id_grado`) REFERENCES `GRADO`(`id_grado`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `SESION`
	ADD CONSTRAINT `fk_sesion_gradocurso` FOREIGN KEY (`id_gradoCurso`) REFERENCES `GRADO_CURSO`(`id_gradoCurso`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ASIGNACION_RECURSO`
	ADD CONSTRAINT `fk_asigrecurso_sesion` FOREIGN KEY (`id_sesion`) REFERENCES `SESION`(`id_sesion`)
	ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `ASIGNACION_RECURSO`
	ADD CONSTRAINT `fk_asigrecurso_recurso` FOREIGN KEY (`id_recurso`) REFERENCES `RECURSO`(`id_recurso`)
	ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `ACTIVIDADES`
	ADD CONSTRAINT `fk_actividades_gradocurso` FOREIGN KEY (`id_gradoCurso`) REFERENCES `GRADO_CURSO`(`id_gradoCurso`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

-- ---- Notas y asistencia -------------------------------------------------
ALTER TABLE `NOTAS`
	ADD CONSTRAINT `fk_notas_alumno` FOREIGN KEY (`id_alumno`) REFERENCES `ALUMNOS`(`id_alumno`)
	ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `NOTAS`
	ADD CONSTRAINT `fk_notas_actividad` FOREIGN KEY (`id_actividad`) REFERENCES `ACTIVIDADES`(`id_actividad`)
	ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `ASISTENCIA`
	ADD CONSTRAINT `fk_asistencia_alumno` FOREIGN KEY (`id_alumno`) REFERENCES `ALUMNOS`(`id_alumno`)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- ---- Evaluacion de personal ---------------------------------------------
ALTER TABLE `EVALUACION`
	ADD CONSTRAINT `fk_evaluacion_administrativo` FOREIGN KEY (`id_administrativo`) REFERENCES `ADMINISTRATIVO`(`id_administrativo`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `EVALUACION`
	ADD CONSTRAINT `fk_evaluacion_docente` FOREIGN KEY (`id_docente`) REFERENCES `DOCENTES`(`id_docente`)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- ---- Roles (CORRECCION: RBAC unificado via CREDENCIALES) ----------------
ALTER TABLE `USUARIO_ROL`
    ADD CONSTRAINT `fk_usuariorol_credenciales`
    FOREIGN KEY (`id_credenciales`) REFERENCES `CREDENCIALES`(`id_credenciales`)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `USUARIO_ROL`
    ADD CONSTRAINT `fk_usuariorol_rol`
    FOREIGN KEY (`id_rol`) REFERENCES `ROL`(`id_rol`)
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- ---- Mensajeria ------------------------------------------------------------
ALTER TABLE `MENSAJE`
	ADD CONSTRAINT `fk_mensaje_buzon` FOREIGN KEY (`id_buzon`) REFERENCES `BUZON`(`id_buzon`)
	ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `ARCHIVO`
	ADD CONSTRAINT `fk_archivo_mensaje` FOREIGN KEY (`id_mensaje`) REFERENCES `MENSAJE`(`id_mensaje`)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- ---- Incidencias -----------------------------------------------------------
ALTER TABLE `INCIDENCIA`
	ADD CONSTRAINT `fk_incidencia_docente` FOREIGN KEY (`id_docente`) REFERENCES `DOCENTES`(`id_docente`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ALUMNOS_INCIDENCIA`
	ADD CONSTRAINT `fk_alumincid_alumno` FOREIGN KEY (`id_alumno`) REFERENCES `ALUMNOS`(`id_alumno`)
	ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `ALUMNOS_INCIDENCIA`
	ADD CONSTRAINT `fk_alumincid_incidencia` FOREIGN KEY (`id_incidencia`) REFERENCES `INCIDENCIA`(`id_incidencia`)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- ---- Plantillas ------------------------------------------------------------
ALTER TABLE `ASIGNACION_PLANTILLAS`
	ADD CONSTRAINT `fk_asigplant_administrativo` FOREIGN KEY (`id_administrativo`) REFERENCES `ADMINISTRATIVO`(`id_administrativo`)
	ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `ASIGNACION_PLANTILLAS`
	ADD CONSTRAINT `fk_asigplant_plantilla` FOREIGN KEY (`id_plantilla`) REFERENCES `PLANTILLAS`(`id_plantilla`)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- ---- Pensiones / pagos -------------------------------------------------------
ALTER TABLE `ASIGNACION_PENSION`
	ADD CONSTRAINT `fk_asigpension_pagos` FOREIGN KEY (`id_pagos`) REFERENCES `PAGOS`(`id_pagos`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ASIGNACION_PENSION`
	ADD CONSTRAINT `fk_asigpension_apoderado` FOREIGN KEY (`id_apoderado`) REFERENCES `APODERADO`(`id_apoderado`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

-- ---- Sueldos docentes -----------------------------------------------------
ALTER TABLE `SUELDO_ASIGNACION`
	ADD CONSTRAINT `fk_sueldoasig_sueldo` FOREIGN KEY (`id_sueldo`) REFERENCES `SUELDO`(`id_sueldo`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `SUELDO_ASIGNACION`
	ADD CONSTRAINT `fk_sueldoasig_docente` FOREIGN KEY (`id_docente`) REFERENCES `DOCENTES`(`id_docente`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

-- ---- Sueldos administrativos ------------------------------------------------
ALTER TABLE `SUELDO_ADMI`
	ADD CONSTRAINT `fk_sueldoadmi_rol` FOREIGN KEY (`id_rol`) REFERENCES `ROL`(`id_rol`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ASIGNACION_SUELDO_ADMI`
	ADD CONSTRAINT `fk_asigsueldoadmi_sueldoadmi` FOREIGN KEY (`id_sueldoAdmi`) REFERENCES `SUELDO_ADMI`(`id_sueldoAdmi`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ASIGNACION_SUELDO_ADMI`
	ADD CONSTRAINT `fk_asigsueldoadmi_administrativo` FOREIGN KEY (`id_administrativo`) REFERENCES `ADMINISTRATIVO`(`id_administrativo`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

-- ---- Eventos y gastos ---------------------------------------------------------
ALTER TABLE `EVENTOS`
	ADD CONSTRAINT `fk_eventos_creadopor` FOREIGN KEY (`creado_por`) REFERENCES `ADMINISTRATIVO`(`id_administrativo`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `GASTO`
	ADD CONSTRAINT `fk_gasto_categoria` FOREIGN KEY (`id_categoriaGasto`) REFERENCES `CATEGORIA_GASTOS`(`id_categoriaGasto`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `GASTO`
	ADD CONSTRAINT `fk_gasto_creadopor` FOREIGN KEY (`creado_por`) REFERENCES `ADMINISTRATIVO`(`id_administrativo`)
	ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `GASTO`
	ADD CONSTRAINT `fk_gasto_actualizadopor` FOREIGN KEY (`actualizado_por`) REFERENCES `ADMINISTRATIVO`(`id_administrativo`)
	ON UPDATE CASCADE ON DELETE SET NULL;


-- =====================================================================
-- 3. DATOS INICIALES
-- =====================================================================

-- Roles base del sistema
INSERT INTO `ROL` (`nombre`) VALUES
('Director'),
('Docente');

SET FOREIGN_KEY_CHECKS = 1;
