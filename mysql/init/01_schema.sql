-- Esquema de la base `eficiencia` (Encuesta de Percepción de Confianza Institucional)
SET NAMES utf8mb4;

-- Una fila por cada columna (cabecera) del Excel.
CREATE TABLE preguntas (
  id_pregunta         SMALLINT UNSIGNED NOT NULL PRIMARY KEY COMMENT 'posición de la columna en el Excel (1 = A)',
  codigo              CHAR(4)      NOT NULL UNIQUE COMMENT 'P001..P220; en las vistas base es la columna p001..p220',
  columna_excel       VARCHAR(3)   NOT NULL,
  modulo              VARCHAR(80)  NOT NULL,
  numero_pregunta     TINYINT UNSIGNED NULL COMMENT 'número que trae la cabecera dentro de su módulo',
  enunciado           TEXT         NOT NULL,
  subitem             VARCHAR(300) NULL COMMENT 'texto entre corchetes de la cabecera (matrices)',
  subitem_corto       VARCHAR(120) NULL COMMENT 'etiqueta corta para gráficas',
  encabezado_original TEXT         NOT NULL,
  tipo_respuesta      ENUM('escala','si_no','categorica','multiple','abierta') NOT NULL,
  tipo_homologacion   VARCHAR(60)  NULL COMMENT 'clave en homologacion',
  grupo_pregunta      SMALLINT UNSIGNED NULL COMMENT 'id de la primera columna del bloque (matriz) al que pertenece',
  encabezado_truncado TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'el Excel corta las cabeceras a 255 caracteres',
  n_respuestas        INT UNSIGNED NOT NULL DEFAULT 0,
  KEY ix_modulo (modulo),
  KEY ix_grupo (grupo_pregunta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Una fila por cada fila del Excel.
CREATE TABLE encuestados (
  id_encuestado   INT UNSIGNED NOT NULL PRIMARY KEY,
  fila_excel      INT UNSIGNED NOT NULL,
  n_respondidas   SMALLINT UNSIGNED NOT NULL,
  anio            SMALLINT UNSIGNED NOT NULL DEFAULT 2025 COMMENT 'año de la encuesta (cada año usa las mismas preguntas)',
  KEY ix_anio (anio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Diccionario de homologación: valor original -> valor homologado para graficar.
CREATE TABLE homologacion (
  id_homologacion   INT UNSIGNED NOT NULL PRIMARY KEY,
  tipo_homologacion VARCHAR(60)  NOT NULL,
  valor_original    TEXT         NOT NULL,
  valor_hash        CHAR(32)     NOT NULL,
  valor_homologado  VARCHAR(255) NOT NULL,
  valor_numerico    DECIMAL(5,1) NULL,
  orden             SMALLINT     NULL,
  n_casos           INT UNSIGNED NOT NULL,
  UNIQUE KEY uq_hom (tipo_homologacion, valor_hash, valor_homologado),
  KEY ix_hom (tipo_homologacion, valor_homologado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Respuestas en formato largo (solo celdas con dato). Se conserva el texto original y el homologado.
CREATE TABLE respuestas (
  id_respuesta        INT UNSIGNED NOT NULL PRIMARY KEY,
  id_encuestado       INT UNSIGNED NOT NULL,
  id_pregunta         SMALLINT UNSIGNED NOT NULL,
  respuesta_original  TEXT         NOT NULL,
  respuesta_homologada VARCHAR(500) NULL,
  valor_numerico      DECIMAL(5,1) NULL COMMENT 'escalas 1-5 / 1-10, Likert y Sí=1/No=0',
  UNIQUE KEY uq_enc_preg (id_encuestado, id_pregunta),
  KEY ix_preg_hom (id_pregunta, respuesta_homologada(100)),
  CONSTRAINT fk_resp_enc  FOREIGN KEY (id_encuestado) REFERENCES encuestados (id_encuestado),
  CONSTRAINT fk_resp_preg FOREIGN KEY (id_pregunta)   REFERENCES preguntas (id_pregunta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Preguntas de selección múltiple (y la abierta de temas): una fila por opción marcada.
CREATE TABLE respuestas_opciones (
  id_opcion          INT UNSIGNED NOT NULL PRIMARY KEY,
  id_respuesta       INT UNSIGNED NOT NULL,
  id_encuestado      INT UNSIGNED NOT NULL,
  id_pregunta        SMALLINT UNSIGNED NOT NULL,
  opcion_original    TEXT         NOT NULL,
  opcion_homologada  VARCHAR(255) NOT NULL,
  KEY ix_opt_preg (id_pregunta, opcion_homologada),
  KEY ix_opt_resp (id_respuesta),
  CONSTRAINT fk_opt_resp FOREIGN KEY (id_respuesta) REFERENCES respuestas (id_respuesta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Años de encuesta cargados (Fase 5). 2025 = resultados del informe EPCI 2025 (publicado en 2026); cada año nuevo se sube desde /explora con una sesión de administrador.
CREATE TABLE EF_ANIO (
  anio SMALLINT UNSIGNED NOT NULL PRIMARY KEY,
  etiqueta VARCHAR(60) NOT NULL,
  usa_informe TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = tiene informe oficial; para ese año /explora muestra los valores publicados que la base no recalcula',
  filas INT UNSIGNED NOT NULL DEFAULT 0,
  archivo VARCHAR(255) NULL,
  usuario VARCHAR(40) NULL,
  cargado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Años de encuesta cargados (cada año con las mismas preguntas)';
INSERT INTO EF_ANIO (anio, etiqueta, usa_informe, filas, archivo, usuario) VALUES (2025, 'Encuesta 2025', 1, 0, 'BDD_EPCI_Anon.xlsx', 'inicial');

CREATE TABLE EF_CARGA_LOG (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  anio SMALLINT UNSIGNED NOT NULL,
  accion ENUM('cargar','reemplazar','eliminar') NOT NULL,
  archivo VARCHAR(255) NULL,
  filas INT UNSIGNED NULL,
  respuestas INT UNSIGNED NULL,
  valores_nuevos INT UNSIGNED NULL COMMENT 'valores no vistos en 2025 que se guardaron sin homologación específica',
  usuario VARCHAR(40) NOT NULL,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Historial de cargas de Excel por año';
