-- Varios años de encuesta (Fase 5). Migración para bases creadas ANTES de esta fase.
-- En instalaciones nuevas, 01_schema.sql y 08_admin_edicion.sql ya traen estas columnas y este script no cambia nada.
-- En una base existente se ejecuta con root ANTES de 04_vistas_publicas.sql y 06_vistas_explora.sql.
-- Todo lo cargado hasta ahora queda como año 2025 (resultados del informe EPCI 2025 publicados en 2026).
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS EF_ANIO (
  anio SMALLINT UNSIGNED NOT NULL PRIMARY KEY,
  etiqueta VARCHAR(60) NOT NULL,
  usa_informe TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = tiene informe oficial; para ese año /explora muestra los valores publicados que la base no recalcula',
  filas INT UNSIGNED NOT NULL DEFAULT 0,
  archivo VARCHAR(255) NULL,
  usuario VARCHAR(40) NULL,
  cargado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Años de encuesta cargados (cada año con las mismas preguntas)';

CREATE TABLE IF NOT EXISTS EF_CARGA_LOG (
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

DROP PROCEDURE IF EXISTS EF_MIGRAR_ANIOS;
DELIMITER $$
CREATE PROCEDURE EF_MIGRAR_ANIOS()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'encuestados' AND column_name = 'anio') THEN
    ALTER TABLE encuestados ADD COLUMN anio SMALLINT UNSIGNED NOT NULL DEFAULT 2025 COMMENT 'año de la encuesta', ADD KEY ix_anio (anio);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'EF_VALOR_EDITADO')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'EF_VALOR_EDITADO' AND column_name = 'anio') THEN
    ALTER TABLE EF_VALOR_EDITADO ADD COLUMN anio SMALLINT UNSIGNED NOT NULL DEFAULT 2025 FIRST, DROP PRIMARY KEY, ADD PRIMARY KEY (anio, clave, item_orden, categoria);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'EF_VALOR_EDITADO_LOG')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'EF_VALOR_EDITADO_LOG' AND column_name = 'anio') THEN
    ALTER TABLE EF_VALOR_EDITADO_LOG ADD COLUMN anio SMALLINT UNSIGNED NOT NULL DEFAULT 2025 AFTER id;
  END IF;
END$$
DELIMITER ;
CALL EF_MIGRAR_ANIOS();
DROP PROCEDURE EF_MIGRAR_ANIOS;

INSERT INTO EF_ANIO (anio, etiqueta, usa_informe, filas, archivo, usuario)
SELECT 2025, 'Encuesta 2025', 1, (SELECT COUNT(*) FROM encuestados WHERE anio = 2025), 'BDD_EPCI_Anon.xlsx', 'inicial'
WHERE NOT EXISTS (SELECT 1 FROM EF_ANIO WHERE anio = 2025);

UPDATE EF_ANIO SET filas = (SELECT COUNT(*) FROM encuestados WHERE anio = EF_ANIO.anio) WHERE filas = 0;
