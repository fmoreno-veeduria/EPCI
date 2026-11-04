-- Vistas v_pub_*: única superficie que lee la aplicación pública (módulos «Aprende con Tula» y «Explora la encuesta»).
-- Solo entregan datos agregados (conteos) o metadatos de preguntas; nunca el id del encuestado.
-- Excepción: v_pub_abiertas devuelve el texto libre sin id, para calcular nubes de palabras en el servidor (no se publica tal cual).
SET NAMES utf8mb4;

-- Reglas de base: preguntas cuyo universo es menor que el de las personas que dejaron respuesta (Informe EPCI 2025).
--   solo_si   : se cuentan solo quienes respondieron valor_ref en la pregunta id_ref (p. ej. «¿denunció?» solo entre víctimas)
--   solo_con  : se cuentan solo quienes respondieron la pregunta id_ref
--   excluir   : se excluyen las respuestas cuyo texto original cumple LIKE valor_ref
CREATE TABLE IF NOT EXISTS EF_REGLA_BASE (
  id_pregunta SMALLINT UNSIGNED NOT NULL PRIMARY KEY,
  tipo ENUM('solo_si', 'solo_con', 'excluir') NOT NULL,
  id_ref SMALLINT UNSIGNED NULL,
  valor_ref VARCHAR(255) NULL,
  motivo VARCHAR(300) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Base de cálculo de preguntas condicionadas, según el informe';
INSERT IGNORE INTO EF_REGLA_BASE (id_pregunta, tipo, id_ref, valor_ref, motivo) VALUES
  (132, 'solo_si', 131, 'Sí', 'Informe, Fig. 46: «¿denunció?» se calcula sobre las 218 víctimas de un delito'),
  (3, 'excluir', NULL, 'No vivo en Bogotá ni en sus alrededores%', 'Informe, módulo sociodemográfico: base de 3.684 respuestas efectivas (se excluyen las 24 sin vínculo con Bogotá)'),
  (2, 'solo_con', 15, NULL, 'Informe, p. 18: la pregunta de control 2024 se reporta sobre las 3.684 respuestas efectivas');

-- Grupos demográficos usados por los filtros del explorador (género, edad, ocupación).
-- Ocupación (como el informe): «Servidores distritales» = empleados y contratistas del sector público distrital (1.833); el resto es «Ciudadanía».
CREATE OR REPLACE VIEW v_pub_demografia AS
SELECT e.id_encuestado, e.anio,
  CASE WHEN g.id_respuesta IS NULL THEN 'Sin dato'
       WHEN g.respuesta_original IN ('Femenino', 'Masculino') THEN g.respuesta_original
       ELSE 'Otro' END AS genero_grupo,
  CASE WHEN a.respuesta_original LIKE 'Entre 18%' THEN '18-25' WHEN a.respuesta_original LIKE 'Entre 26%' THEN '26-35'
       WHEN a.respuesta_original LIKE 'Entre 36%' THEN '36-45' WHEN a.respuesta_original LIKE 'Entre 46%' THEN '46-55'
       WHEN a.respuesta_original LIKE '56%' THEN '56+' ELSE 'Sin dato' END AS edad_grupo,
  CASE WHEN o.id_respuesta IS NULL THEN 'Sin dato'
       WHEN o.respuesta_original LIKE '%sector público distrital%' THEN 'Servidores distritales'
       ELSE 'Ciudadanía' END AS ocupacion_grupo
FROM encuestados e
LEFT JOIN respuestas g ON g.id_encuestado = e.id_encuestado AND g.id_pregunta = 7
LEFT JOIN respuestas a ON a.id_encuestado = e.id_encuestado AND a.id_pregunta = 6
LEFT JOIN respuestas o ON o.id_encuestado = e.id_encuestado AND o.id_pregunta = 9;

CREATE OR REPLACE VIEW v_pub_preguntas AS
SELECT id_pregunta, codigo, columna_excel, modulo, numero_pregunta, enunciado, subitem, subitem_corto,
       tipo_respuesta, tipo_homologacion, grupo_pregunta, encabezado_truncado, n_respuestas
FROM preguntas;

-- Distribución de respuestas homologadas por pregunta y por grupo demográfico.
-- n = personas (cada persona cuenta una vez por categoría, también en selección múltiple).
CREATE OR REPLACE VIEW v_pub_distribucion AS
SELECT d.anio, r.id_pregunta, r.respuesta_homologada AS categoria, d.genero_grupo, d.edad_grupo, d.ocupacion_grupo,
       MIN(r.valor_numerico) AS valor_numerico, COUNT(*) AS n
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta AND p.tipo_respuesta IN ('escala', 'si_no', 'categorica')
JOIN v_pub_demografia d ON d.id_encuestado = r.id_encuestado
LEFT JOIN EF_REGLA_BASE g ON g.id_pregunta = r.id_pregunta
LEFT JOIN respuestas pr ON pr.id_encuestado = r.id_encuestado AND pr.id_pregunta = g.id_ref
WHERE r.respuesta_homologada IS NOT NULL
  AND (g.id_pregunta IS NULL
       OR (g.tipo = 'solo_si' AND pr.respuesta_original = g.valor_ref)
       OR (g.tipo = 'solo_con' AND pr.id_respuesta IS NOT NULL)
       OR (g.tipo = 'excluir' AND r.respuesta_original NOT LIKE g.valor_ref))
GROUP BY d.anio, r.id_pregunta, r.respuesta_homologada, d.genero_grupo, d.edad_grupo, d.ocupacion_grupo
UNION ALL
SELECT d.anio, o.id_pregunta, o.opcion_homologada, d.genero_grupo, d.edad_grupo, d.ocupacion_grupo,
       NULL, COUNT(DISTINCT o.id_encuestado)
FROM respuestas_opciones o
JOIN v_pub_demografia d ON d.id_encuestado = o.id_encuestado
GROUP BY d.anio, o.id_pregunta, o.opcion_homologada, d.genero_grupo, d.edad_grupo, d.ocupacion_grupo;

-- Personas que respondieron cada pregunta (base para porcentajes en selección múltiple).
CREATE OR REPLACE VIEW v_pub_encuestados AS
SELECT d.anio, r.id_pregunta, d.genero_grupo, d.edad_grupo, d.ocupacion_grupo, COUNT(*) AS n
FROM respuestas r
JOIN v_pub_demografia d ON d.id_encuestado = r.id_encuestado
LEFT JOIN EF_REGLA_BASE g ON g.id_pregunta = r.id_pregunta
LEFT JOIN respuestas pr ON pr.id_encuestado = r.id_encuestado AND pr.id_pregunta = g.id_ref
WHERE g.id_pregunta IS NULL
   OR (g.tipo = 'solo_si' AND pr.respuesta_original = g.valor_ref)
   OR (g.tipo = 'solo_con' AND pr.id_respuesta IS NOT NULL)
   OR (g.tipo = 'excluir' AND r.respuesta_original NOT LIKE g.valor_ref)
GROUP BY d.anio, r.id_pregunta, d.genero_grupo, d.edad_grupo, d.ocupacion_grupo;

-- Satisfacción con el trámite (p119) por sector del trámite (p117, selección múltiple).
CREATE OR REPLACE VIEW v_pub_sector_satisfaccion AS
SELECT e.anio, t.sector, COUNT(*) AS n, ROUND(CAST(SUM(s.valor_numerico) AS DECIMAL(24,8)) / COUNT(*), 2) AS promedio,
       ROUND(100 * SUM(s.valor_numerico >= 4) / COUNT(*), 1) AS satisfaccion,
       ROUND(100 * SUM(s.valor_numerico = 3) / COUNT(*), 1) AS neutro,
       ROUND(100 * SUM(s.valor_numerico <= 2) / COUNT(*), 1) AS insatisfaccion
FROM (SELECT DISTINCT id_encuestado, opcion_homologada AS sector FROM respuestas_opciones WHERE id_pregunta = 117) t
JOIN encuestados e ON e.id_encuestado = t.id_encuestado
JOIN respuestas s ON s.id_encuestado = t.id_encuestado AND s.id_pregunta = 119 AND s.valor_numerico IS NOT NULL
GROUP BY e.anio, t.sector;

-- Estadísticas de la clasificación por temas de la pregunta abierta p076.
CREATE OR REPLACE VIEW v_pub_temas_stats AS
SELECT anio, COUNT(*) AS respondientes,
       SUM(temas >= 1) AS con_tema,
       SUM(temas >= 2) AS multitema,
       SUM(temas = 0) AS sin_tema_asignado
FROM (SELECT e.anio, r.id_respuesta,
             (SELECT COUNT(DISTINCT o.opcion_homologada) FROM respuestas_opciones o
              WHERE o.id_respuesta = r.id_respuesta
                AND o.opcion_homologada NOT IN ('Otros temas', 'Sin tema / no responde')) AS temas
      FROM respuestas r JOIN encuestados e ON e.id_encuestado = r.id_encuestado WHERE r.id_pregunta = 76) x
GROUP BY anio;

-- Texto libre de las preguntas abiertas, sin identificador. Solo para nubes de palabras agregadas.
CREATE OR REPLACE VIEW v_pub_abiertas AS
SELECT e.anio, r.id_pregunta, r.respuesta_original AS texto
FROM respuestas r
JOIN encuestados e ON e.id_encuestado = r.id_encuestado
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
WHERE p.tipo_respuesta = 'abierta';

-- Cifras de la base que se muestran en la portada y en el Aula, por año de encuesta.
CREATE OR REPLACE VIEW v_pub_resumen AS
SELECT a.anio, x.clave, x.valor FROM EF_ANIO a JOIN (
  SELECT 'filas_excel' AS clave, e.anio, COUNT(*) AS valor FROM encuestados e GROUP BY e.anio
  UNION ALL SELECT 'autorizaron_datos', e.anio, COUNT(*) FROM respuestas r JOIN encuestados e ON e.id_encuestado = r.id_encuestado WHERE r.id_pregunta = 1 AND r.respuesta_homologada = 'Sí' GROUP BY e.anio
  UNION ALL SELECT 'no_autorizaron_datos', e.anio, COUNT(*) FROM respuestas r JOIN encuestados e ON e.id_encuestado = r.id_encuestado WHERE r.id_pregunta = 1 AND r.respuesta_homologada = 'No' GROUP BY e.anio
  UNION ALL SELECT 'sin_vinculo_bogota', e.anio, COUNT(*) FROM respuestas r JOIN encuestados e ON e.id_encuestado = r.id_encuestado WHERE r.id_pregunta = 3 AND r.respuesta_original LIKE 'No vivo en Bogotá ni en sus alrededores%' GROUP BY e.anio
  UNION ALL SELECT 'efectivas_confianza', e.anio, COUNT(*) FROM respuestas r JOIN encuestados e ON e.id_encuestado = r.id_encuestado WHERE r.id_pregunta = 15 GROUP BY e.anio
  UNION ALL SELECT 'efectivas_modulos_obligatorios', e.anio, COUNT(*) FROM respuestas r JOIN encuestados e ON e.id_encuestado = r.id_encuestado WHERE r.id_pregunta = 44 GROUP BY e.anio
  UNION ALL SELECT 'localidades_con_respuestas', e.anio, COUNT(DISTINCT r.respuesta_homologada) FROM respuestas r JOIN encuestados e ON e.id_encuestado = r.id_encuestado WHERE r.id_pregunta = 4 GROUP BY e.anio
  UNION ALL SELECT 'respondieron_epci_2024', e.anio, COUNT(*) FROM respuestas r JOIN encuestados e ON e.id_encuestado = r.id_encuestado WHERE r.id_pregunta = 2 AND r.respuesta_homologada = 'Sí' GROUP BY e.anio
) x ON x.anio = a.anio
UNION ALL SELECT anio, 'columnas_excel', (SELECT COUNT(*) FROM preguntas) FROM EF_ANIO;

-- Calificación de la gestión del Alcalde (p015, 1 a 10) por localidad de residencia (p004).
CREATE OR REPLACE VIEW v_pub_localidad_alcalde AS
SELECT e.anio, l.respuesta_homologada AS localidad, COUNT(*) AS n, ROUND(CAST(SUM(a.valor_numerico) AS DECIMAL(24,8)) / COUNT(*), 2) AS promedio
FROM respuestas l
JOIN encuestados e ON e.id_encuestado = l.id_encuestado
JOIN respuestas a ON a.id_encuestado = l.id_encuestado AND a.id_pregunta = 15 AND a.valor_numerico IS NOT NULL
WHERE l.id_pregunta = 4
GROUP BY e.anio, l.respuesta_homologada;
