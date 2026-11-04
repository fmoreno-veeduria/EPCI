-- Ajustes para que los datos publicados sean fieles al Informe de Análisis de Resultados EPCI 2025 (Veeduría Distrital).
-- Solo UPDATE sobre datos ya cargados; son idempotentes (se calculan desde respuesta_original / opcion_original).
-- Se ejecuta antes de 06_vistas_explora.sql para que los conteos por segmento ya partan de estas categorías.
SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------------------------
-- 1. Categorías del informe en las preguntas de perfil: se conserva el texto original de cada respuesta
--    (3 vive en Bogotá, 6 edad, 7 género, 8 educación, 9 ocupación, 10 discapacidad, 11 grupo étnico,
--     12 ingresos, 13 lugar de nacimiento, 14 cultura política, 123 tema prioritario)
-- ---------------------------------------------------------------------------------------------
UPDATE respuestas SET respuesta_homologada = respuesta_original
WHERE id_pregunta IN (3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 123);

-- 5 municipio: Tabla 4 del informe agrupa siete municipios de la sabana en una sola fila
UPDATE respuestas SET respuesta_homologada = CASE
    WHEN respuesta_original IN ('Cota', 'Fusagasugá', 'Silvania', 'Sopó', 'Tabio', 'Tenjo', 'Tocancipá')
      THEN 'Otros municipios de la sabana de Bogotá (Cota, Fusagasugá, Silvania, Sopó, Tabio, Tenjo, Tocancipá)'
    ELSE respuesta_original END
WHERE id_pregunta = 5;

-- 106 razón para no participar en control social: Fig. 33 = 7 opciones + «otras respuestas abiertas»
UPDATE respuestas SET respuesta_homologada = CASE
    WHEN respuesta_original IN ('No tengo información al respecto', 'No tengo tiempo para esas actividades', 'Por riesgos a mi seguridad',
                                'No sirve para nada', 'Hay personas que lo hacen mejor que yo', 'No me interesa participar',
                                'Por temor a ser desacreditado/a') THEN respuesta_original
    ELSE 'Otras respuestas abiertas (incompatibilidad como servidor, roscas, salud, etc.)' END
WHERE id_pregunta = 106;

-- Diccionario de homologación coherente con lo anterior
UPDATE homologacion SET valor_homologado = valor_original
WHERE tipo_homologacion IN ('VIVE_BOGOTA', 'EDAD', 'GENERO', 'EDUCACION', 'OCUPACION', 'DISCAPACIDAD', 'ETNIA', 'INGRESOS',
                            'LUGAR_NACIMIENTO', 'AUTOPERCEPCION_CIUDADANA', 'TEMA_PRIORITARIO');
UPDATE homologacion SET valor_homologado = CASE
    WHEN valor_original IN ('Cota', 'Fusagasugá', 'Silvania', 'Sopó', 'Tabio', 'Tenjo', 'Tocancipá')
      THEN 'Otros municipios de la sabana de Bogotá (Cota, Fusagasugá, Silvania, Sopó, Tabio, Tenjo, Tocancipá)'
    ELSE valor_original END
WHERE tipo_homologacion = 'MUNICIPIO';
UPDATE homologacion SET valor_homologado = CASE
    WHEN valor_original IN ('No tengo información al respecto', 'No tengo tiempo para esas actividades', 'Por riesgos a mi seguridad',
                            'No sirve para nada', 'Hay personas que lo hacen mejor que yo', 'No me interesa participar',
                            'Por temor a ser desacreditado/a') THEN valor_original
    ELSE 'Otras respuestas abiertas (incompatibilidad como servidor, roscas, salud, etc.)' END
WHERE tipo_homologacion = 'RAZON_NO_CONTROL_SOCIAL';

-- Orden de las categorías, el mismo de las figuras del informe
UPDATE homologacion SET orden = CASE valor_homologado
    WHEN 'Femenino' THEN 1 WHEN 'Masculino' THEN 2 WHEN 'No binario' THEN 3 WHEN 'Prefiero no responder' THEN 4
    WHEN 'Transfemenino' THEN 5 WHEN 'Transmasculino' THEN 6 END
WHERE tipo_homologacion = 'GENERO';
UPDATE homologacion SET orden = CASE
    WHEN valor_homologado LIKE 'Entre 18%' THEN 1 WHEN valor_homologado LIKE 'Entre 26%' THEN 2 WHEN valor_homologado LIKE 'Entre 36%' THEN 3
    WHEN valor_homologado LIKE 'Entre 46%' THEN 4 WHEN valor_homologado LIKE '56%' THEN 5 END
WHERE tipo_homologacion = 'EDAD';
UPDATE homologacion SET orden = CASE
    WHEN valor_homologado LIKE '%primaria%' THEN 1 WHEN valor_homologado LIKE '%secundaria%' THEN 2 WHEN valor_homologado LIKE '%técnica%' THEN 3
    WHEN valor_homologado LIKE '%universitaria%' THEN 4 WHEN valor_homologado LIKE 'Postgrado%' THEN 5 WHEN valor_homologado LIKE 'Sin educación%' THEN 6 END
WHERE tipo_homologacion = 'EDUCACION';
UPDATE homologacion SET orden = CASE
    WHEN valor_homologado = 'Empleado (a) en el sector público distrital' THEN 1
    WHEN valor_homologado = 'Trabajador (a) independiente y/o contratista del sector público distrital' THEN 2
    WHEN valor_homologado = 'Empleado (a) en el sector público nacional' THEN 3
    WHEN valor_homologado = 'Trabajador (a) independiente y/o contratista del sector público nacional' THEN 4
    WHEN valor_homologado = 'Empleado (a) en el sector privado' THEN 5
    WHEN valor_homologado = 'Trabajador (a) independiente y/o contratista del sector privado' THEN 6
    WHEN valor_homologado = 'Empleado (a) en el sector multilateral' THEN 7
    WHEN valor_homologado = 'Trabajos del cuidado o del hogar' THEN 8
    WHEN valor_homologado = 'Trabajador (a) rural' THEN 9
    WHEN valor_homologado LIKE 'Desempleado%' THEN 10
    WHEN valor_homologado LIKE 'Jubilado%' THEN 11
    WHEN valor_homologado = 'Estudiante' THEN 12 END
WHERE tipo_homologacion = 'OCUPACION';
UPDATE homologacion SET orden = CASE
    WHEN valor_homologado LIKE 'Menos de 1%' THEN 1 WHEN valor_homologado LIKE 'Entre 1 y%' THEN 2 WHEN valor_homologado LIKE 'Entre 2 y%' THEN 3
    WHEN valor_homologado LIKE 'Entre 3 y%' THEN 4 WHEN valor_homologado LIKE 'Entre 4 y%' THEN 5 WHEN valor_homologado LIKE 'Más de 5%' THEN 6 END
WHERE tipo_homologacion = 'INGRESOS';

-- ---------------------------------------------------------------------------------------------
-- 2. Causas de inseguridad (128): el informe separa las 6 causas del cuestionario de «Otro (respuestas ciudadanas abiertas)»
-- ---------------------------------------------------------------------------------------------
UPDATE respuestas_opciones SET opcion_homologada = 'Otro (respuestas ciudadanas abiertas)'
WHERE id_pregunta = 128
  AND opcion_homologada NOT IN ('Falta de estrategias más efectivas', 'Falta de articulación interinstitucional', 'Falta de capacidades operativas',
                                'Falta de inteligencia estratégica', 'Falta de personal', 'Escasez de recursos técnicos y tecnológicos');
UPDATE homologacion SET valor_homologado = 'Otro (respuestas ciudadanas abiertas)'
WHERE tipo_homologacion = 'CAUSAS_INSEGURIDAD'
  AND valor_homologado NOT IN ('Falta de estrategias más efectivas', 'Falta de articulación interinstitucional', 'Falta de capacidades operativas',
                               'Falta de inteligencia estratégica', 'Falta de personal', 'Escasez de recursos técnicos y tecnológicos');
-- Quien marcó una causa y además escribió texto libre se cuenta también en «Otro» (el informe suma 60 personas = 11,43 %)
INSERT INTO respuestas_opciones (id_opcion, id_respuesta, id_encuestado, id_pregunta, opcion_original, opcion_homologada)
SELECT (SELECT MAX(id_opcion) FROM respuestas_opciones) + ROW_NUMBER() OVER (ORDER BY o.id_opcion),
       o.id_respuesta, o.id_encuestado, o.id_pregunta, o.opcion_original, 'Otro (respuestas ciudadanas abiertas)'
FROM respuestas_opciones o
WHERE o.id_pregunta = 128
  AND o.opcion_homologada <> 'Otro (respuestas ciudadanas abiertas)'
  AND CHAR_LENGTH(o.opcion_original) > CHAR_LENGTH(o.opcion_homologada) + 1
  AND NOT EXISTS (SELECT 1 FROM respuestas_opciones x WHERE x.id_respuesta = o.id_respuesta AND x.opcion_original = o.opcion_original
                    AND x.opcion_homologada = 'Otro (respuestas ciudadanas abiertas)');
UPDATE respuestas r
JOIN (SELECT id_respuesta, GROUP_CONCAT(DISTINCT opcion_homologada ORDER BY opcion_homologada SEPARATOR ' | ') AS s
      FROM respuestas_opciones WHERE id_pregunta = 128 GROUP BY id_respuesta) x ON x.id_respuesta = r.id_respuesta
SET r.respuesta_homologada = x.s
WHERE r.id_pregunta = 128;
