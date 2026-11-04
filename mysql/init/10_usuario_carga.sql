-- Permisos de la Fase 5 (varios años). Se ejecuta DESPUÉS de 06_vistas_explora.sql, que recrea tablas y procedimientos.
SET NAMES utf8mb4;
CREATE USER IF NOT EXISTS 'web_carga'@'%' IDENTIFIED BY 'web_carga';

-- Cargador de Excel: lee preguntas y homologación, escribe solo los datos de un año y los conteos derivados.
GRANT SELECT ON eficiencia.preguntas TO 'web_carga'@'%';
GRANT SELECT ON eficiencia.homologacion TO 'web_carga'@'%';
GRANT INSERT ON eficiencia.homologacion TO 'web_carga'@'%';
GRANT SELECT, INSERT, DELETE ON eficiencia.encuestados TO 'web_carga'@'%';
GRANT SELECT, INSERT, DELETE ON eficiencia.respuestas TO 'web_carga'@'%';
GRANT SELECT, INSERT, DELETE ON eficiencia.respuestas_opciones TO 'web_carga'@'%';
GRANT SELECT ON eficiencia.EF_PREGUNTA TO 'web_carga'@'%';
GRANT SELECT ON eficiencia.EF_PREGUNTA_ITEM TO 'web_carga'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON eficiencia.EF_ANIO TO 'web_carga'@'%';
GRANT SELECT, INSERT, DELETE ON eficiencia.EF_NUBE_PALABRAS_DATOS TO 'web_carga'@'%';
GRANT SELECT, DELETE ON eficiencia.EF_VALOR_EDITADO TO 'web_carga'@'%';
GRANT INSERT ON eficiencia.EF_CARGA_LOG TO 'web_carga'@'%';
GRANT EXECUTE ON PROCEDURE eficiencia.EF_REFRESCAR_CONTEOS_ANIO TO 'web_carga'@'%';

-- La web pública lista los años y el administrador consulta el historial.
GRANT SELECT ON eficiencia.EF_ANIO TO 'web_publico'@'%';
GRANT SELECT ON eficiencia.EF_CARGA_LOG TO 'web_admin'@'%';
GRANT SELECT ON eficiencia.EF_ANIO TO 'web_admin'@'%';
FLUSH PRIVILEGES;
