-- Usuario de solo lectura para la aplicación pública: únicamente las vistas v_pub_*, ninguna tabla base.
CREATE USER IF NOT EXISTS 'web_publico'@'%' IDENTIFIED BY 'web_publico';
GRANT SELECT ON eficiencia.v_pub_demografia TO 'web_publico'@'%';
GRANT SELECT ON eficiencia.v_pub_preguntas TO 'web_publico'@'%';
GRANT SELECT ON eficiencia.v_pub_distribucion TO 'web_publico'@'%';
GRANT SELECT ON eficiencia.v_pub_encuestados TO 'web_publico'@'%';
GRANT SELECT ON eficiencia.v_pub_sector_satisfaccion TO 'web_publico'@'%';
GRANT SELECT ON eficiencia.v_pub_temas_stats TO 'web_publico'@'%';
GRANT SELECT ON eficiencia.v_pub_abiertas TO 'web_publico'@'%';
GRANT SELECT ON eficiencia.v_pub_resumen TO 'web_publico'@'%';
GRANT SELECT ON eficiencia.v_pub_localidad_alcalde TO 'web_publico'@'%';
