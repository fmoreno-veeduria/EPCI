-- Edición de valores de las gráficas de /explora por un administrador (Fase 4).
-- Los valores originales siguen en las tablas base; lo editado queda en EF_VALOR_EDITADO y se superpone al leer el dataset.
-- La clave del administrador se guarda como hash scrypt (sal$hash), nunca en texto plano.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS EF_ADMIN_USUARIO (
  usuario VARCHAR(40) NOT NULL PRIMARY KEY,
  clave_hash VARCHAR(200) NOT NULL COMMENT 'scrypt$sal$hash',
  creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Administradores que pueden editar valores de las gráficas de /explora';

CREATE TABLE IF NOT EXISTS EF_VALOR_EDITADO (
  anio SMALLINT UNSIGNED NOT NULL DEFAULT 2025,
  clave VARCHAR(40) NOT NULL COMMENT 'pregunta (EF_PREGUNTA.clave) o ci_alcalde_localidad',
  item_orden TINYINT UNSIGNED NOT NULL DEFAULT 1,
  categoria VARCHAR(250) NOT NULL COMMENT 'categoría de la barra o localidad',
  n INT UNSIGNED NOT NULL,
  base INT UNSIGNED NOT NULL,
  porcentaje DECIMAL(9,4) NOT NULL,
  promedio DECIMAL(6,3) NULL COMMENT 'solo ranking de localidades',
  motivo VARCHAR(400) NULL,
  usuario VARCHAR(40) NOT NULL,
  actualizado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (anio, clave, item_orden, categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Valores de gráfica editados por un administrador; sustituyen a los calculados';

CREATE TABLE IF NOT EXISTS EF_VALOR_EDITADO_LOG (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  anio SMALLINT UNSIGNED NOT NULL DEFAULT 2025,
  clave VARCHAR(40) NOT NULL, item_orden TINYINT UNSIGNED NOT NULL, categoria VARCHAR(250) NOT NULL,
  accion ENUM('editar','restaurar') NOT NULL,
  n_anterior INT UNSIGNED NULL, n_nuevo INT UNSIGNED NULL, base_anterior INT UNSIGNED NULL, base_nuevo INT UNSIGNED NULL,
  motivo VARCHAR(400) NULL, usuario VARCHAR(40) NOT NULL, fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Historial de cambios de valores editados';

CREATE OR REPLACE VIEW EF_GRAFICA_VALORES_EDITADOS AS
SELECT anio, clave, item_orden, categoria, n, base, porcentaje, promedio, motivo, actualizado FROM EF_VALOR_EDITADO;

INSERT INTO EF_ADMIN_USUARIO (usuario, clave_hash) VALUES ('admin', 'scrypt$ef86f20679f4618c658311adb64f11f9$d7f60a1177d7f247515ff53ee3f4202f66bebf7b6529c0ef0e893123689f87e9')
ON DUPLICATE KEY UPDATE clave_hash = VALUES(clave_hash);

CREATE USER IF NOT EXISTS 'web_admin'@'%' IDENTIFIED BY 'web_admin';
GRANT SELECT ON eficiencia.EF_ADMIN_USUARIO TO 'web_admin'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON eficiencia.EF_VALOR_EDITADO TO 'web_admin'@'%';
GRANT SELECT, INSERT ON eficiencia.EF_VALOR_EDITADO_LOG TO 'web_admin'@'%';
GRANT SELECT ON eficiencia.EF_GRAFICA_VALORES_EDITADOS TO 'web_publico'@'%';
FLUSH PRIVILEGES;
