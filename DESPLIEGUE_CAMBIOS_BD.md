# Cambios en la base de datos: sentencias INSERT y UPDATE

Documento para los procedimientos de despliegue. Recoge **solo** las sentencias `INSERT` y `UPDATE` que cambian datos; las tablas y vistas (DDL) están en los scripts de `mysql/init/`. Generado el 2026-11-04 desde esos mismos scripts.

## Por qué existen estos cambios
El informe oficial EPCI 2025 es la referencia. Se aplicaron las decisiones de la Fase 0 de `HALLAZGOS_INFORME_vs_EXPLORA.md`:
1. **Categorías del informe:** las preguntas de perfil vuelven a mostrar las categorías originales (género, educación, ocupación, ingresos, municipios…); solo se unifican redacciones equivalentes («Si» = «Sí»).
2. **Servidores:** el grupo del filtro de ocupación pasa a «servidores y contratistas del sector público distrital» (1.833) frente a «Ciudadanía».
3. **Valores no recalculables** (Tabla 8, análisis PLN, Tablas 10 y 11, Figuras 38 y 39): se guardan tal como los publica el informe en `EF_INFORME_PUBLICADO`.

## Orden de ejecución
- **Instalación nueva:** no hay que hacer nada; MySQL ejecuta `01` … `07` al crear el contenedor con la carpeta `mysql/data/` vacía.
- **Base ya instalada** (en este orden, con el cliente `mysql` sobre la base `eficiencia` y el usuario `root`):
  1. `mysql/init/04_vistas_publicas.sql` (crea `EF_REGLA_BASE`, inserta las reglas y redefine las vistas `v_pub_*`);
  2. `mysql/init/05b_ajustes_informe.sql` (todos los `UPDATE` y el `INSERT` de la sección 2);
  3. `mysql/init/06_vistas_explora.sql` (recrea las tablas y vistas `EF_*`, inserta los datos de las secciones 3 y 4 y llama a `EF_REFRESCAR_CONTEOS()`);
  4. `docker compose restart web`.
- Las sentencias son **idempotentes** salvo los `INSERT` de la sección 3 y 4, que se vuelven a crear con las tablas (el script 06 las elimina antes de recrearlas).
- Tras cualquier cambio de respuestas: `CALL EF_REFRESCAR_CONTEOS();`.

## 1. Reglas de base de preguntas condicionadas (`04_vistas_publicas.sql`)
```sql
INSERT IGNORE INTO EF_REGLA_BASE (id_pregunta, tipo, id_ref, valor_ref, motivo) VALUES
  (132, 'solo_si', 131, 'Sí', 'Informe, Fig. 46: «¿denunció?» se calcula sobre las 218 víctimas de un delito'),
  (3, 'excluir', NULL, 'No vivo en Bogotá ni en sus alrededores%', 'Informe, módulo sociodemográfico: base de 3.684 respuestas efectivas (se excluyen las 24 sin vínculo con Bogotá)'),
  (2, 'solo_con', 15, NULL, 'Informe, p. 18: la pregunta de control 2024 se reporta sobre las 3.684 respuestas efectivas');
```

## 2. Re-homologación fiel al informe (`05b_ajustes_informe.sql`)
Se calculan desde `respuesta_original` / `opcion_original`; no necesitan el Excel.

```sql
UPDATE respuestas SET respuesta_homologada = respuesta_original
WHERE id_pregunta IN (3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 123);
UPDATE respuestas SET respuesta_homologada = CASE
    WHEN respuesta_original IN ('Cota', 'Fusagasugá', 'Silvania', 'Sopó', 'Tabio', 'Tenjo', 'Tocancipá')
      THEN 'Otros municipios de la sabana de Bogotá (Cota, Fusagasugá, Silvania, Sopó, Tabio, Tenjo, Tocancipá)'
    ELSE respuesta_original END
WHERE id_pregunta = 5;
UPDATE respuestas SET respuesta_homologada = CASE
    WHEN respuesta_original IN ('No tengo información al respecto', 'No tengo tiempo para esas actividades', 'Por riesgos a mi seguridad',
                                'No sirve para nada', 'Hay personas que lo hacen mejor que yo', 'No me interesa participar',
                                'Por temor a ser desacreditado/a') THEN respuesta_original
    ELSE 'Otras respuestas abiertas (incompatibilidad como servidor, roscas, salud, etc.)' END
WHERE id_pregunta = 106;
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
UPDATE respuestas_opciones SET opcion_homologada = 'Otro (respuestas ciudadanas abiertas)'
WHERE id_pregunta = 128
  AND opcion_homologada NOT IN ('Falta de estrategias más efectivas', 'Falta de articulación interinstitucional', 'Falta de capacidades operativas',
                                'Falta de inteligencia estratégica', 'Falta de personal', 'Escasez de recursos técnicos y tecnológicos');
UPDATE homologacion SET valor_homologado = 'Otro (respuestas ciudadanas abiertas)'
WHERE tipo_homologacion = 'CAUSAS_INSEGURIDAD'
  AND valor_homologado NOT IN ('Falta de estrategias más efectivas', 'Falta de articulación interinstitucional', 'Falta de capacidades operativas',
                               'Falta de inteligencia estratégica', 'Falta de personal', 'Escasez de recursos técnicos y tecnológicos');
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
```

## 3. Categorías que el informe no grafica (`06_vistas_explora.sql`)
```sql
INSERT INTO EF_CATEGORIA_OCULTA VALUES ('cr_q6','No sabe / no responde','El informe (Fig. 21) grafica 8 canales; esta opción existe en la base pero no se muestra');
INSERT INTO EF_CATEGORIA_OCULTA VALUES ('cr_q6','Partidos políticos','El informe (Fig. 21) grafica 8 canales; esta opción existe en la base pero no se muestra');
```

## 4. Valores publicados por el informe (`06_vistas_explora.sql`)
Tabla 8 (`pa_q4_open`), Tabla 10 (`ri_q6`), Figura 38 y Figura 39 (`ri_q8`), Tabla 11 (`ri_q10`) y las categorías del análisis PLN de las preguntas abiertas. Cada fila lleva la nota «Valor publicado por la Veeduría; no recalculable desde la base de datos».

```sql
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('pa_q4_open','Tabla 8','distribucion',NULL,'Seguridad',NULL,820,3378,24.3,1);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('pa_q4_open','Tabla 8','distribucion',NULL,'Hábitat',NULL,370,3378,11.0,2);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('pa_q4_open','Tabla 8','distribucion',NULL,'Educación',NULL,264,3378,7.8,3);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('pa_q4_open','Tabla 8','distribucion',NULL,'Desarrollo Económico',NULL,257,3378,7.6,4);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('pa_q4_open','Tabla 8','distribucion',NULL,'Ambiente',NULL,160,3378,4.7,5);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('pa_q4_open','Tabla 8','distribucion',NULL,'Movilidad',NULL,158,3378,4.7,6);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('pa_q4_open','Tabla 8','distribucion',NULL,'Gobierno',NULL,154,3378,4.6,7);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('pa_q4_open','Tabla 8','distribucion',NULL,'Cultura, Recreación y Deporte',NULL,153,3378,4.5,8);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('pa_q4_open','Tabla 8','distribucion',NULL,'Integración Social',NULL,140,3378,4.1,9);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('pa_q4_open','Tabla 8','distribucion',NULL,'Salud',NULL,111,3378,3.3,10);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('pa_q4_open','Tabla 8','distribucion',NULL,'Gestión Pública',NULL,65,3378,1.9,11);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('pa_q4_open','Tabla 8','distribucion',NULL,'Planeación',NULL,54,3378,1.6,12);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('pa_q4_open','Tabla 8','distribucion',NULL,'Hacienda',NULL,31,3378,0.9,13);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('pa_q4_open','Tabla 8','distribucion',NULL,'Mujer',NULL,27,3378,0.8,14);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('pa_q4_open','Tabla 8','distribucion',NULL,'Jurídica',NULL,6,3378,0.2,15);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('pa_q4_open','Tabla 8','distribucion',NULL,'Otros temas (no categorizados)',NULL,1278,3378,37.8,16);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('pa_q4_open','Tabla 8','distribucion',NULL,'Sin requerimiento / NSNR',NULL,123,3378,3.6,17);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q6','Tabla 10','distribucion',NULL,'Hacienda',NULL,457,1966,23.25,1);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q6','Tabla 10','distribucion',NULL,'Movilidad',NULL,376,1966,19.13,2);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q6','Tabla 10','distribucion',NULL,'Salud',NULL,182,1966,9.26,3);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q6','Tabla 10','distribucion',NULL,'Servicios Públicos',NULL,153,1966,7.78,4);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q6','Tabla 10','distribucion',NULL,'Planeación',NULL,108,1966,5.49,5);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q6','Tabla 10','distribucion',NULL,'Gobierno',NULL,100,1966,5.09,6);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q6','Tabla 10','distribucion',NULL,'Educación',NULL,93,1966,4.73,7);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q6','Tabla 10','distribucion',NULL,'Seguridad',NULL,87,1966,4.43,8);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q6','Tabla 10','distribucion',NULL,'Integración Social',NULL,86,1966,4.37,9);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q6','Tabla 10','distribucion',NULL,'Hábitat',NULL,72,1966,3.66,10);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q6','Tabla 10','distribucion',NULL,'Cultura',NULL,70,1966,3.56,11);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q6','Tabla 10','distribucion',NULL,'Ambiente',NULL,57,1966,2.9,12);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q6','Tabla 10','distribucion',NULL,'Desarrollo Económico',NULL,49,1966,2.49,13);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q6','Tabla 10','distribucion',NULL,'Comisarías de Familia',NULL,39,1966,1.98,14);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q6','Tabla 10','distribucion',NULL,'Jurídica',NULL,34,1966,1.73,15);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q6','Tabla 10','distribucion',NULL,'Mujer',NULL,31,1966,1.58,16);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q6','Tabla 10','distribucion',NULL,'Gestión Pública',NULL,21,1966,1.07,17);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 38','distribucion',NULL,'1',1.0,421,1966,21.41,1);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 38','distribucion',NULL,'2',2.0,242,1966,12.31,2);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 38','distribucion',NULL,'3',3.0,404,1966,20.55,3);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 38','distribucion',NULL,'4',4.0,482,1966,24.52,4);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 38','distribucion',NULL,'5',5.0,417,1966,21.21,5);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q10','Tabla 11','distribucion',NULL,'Desinformación',NULL,193,523,36.9,1);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q10','Tabla 11','distribucion',NULL,'Falta de transparencia',NULL,189,523,36.1,2);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q10','Tabla 11','distribucion',NULL,'Inacción ante irregularidades',NULL,135,523,25.8,3);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q10','Tabla 11','distribucion',NULL,'Obstrucción al cumplimiento de la ley',NULL,109,523,20.8,4);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q10','Tabla 11','distribucion',NULL,'Mal uso de recursos públicos',NULL,87,523,16.6,5);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q10','Tabla 11','distribucion',NULL,'Nepotismo',NULL,76,523,14.5,6);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q10','Tabla 11','distribucion',NULL,'Uso indebido de información',NULL,63,523,12.0,7);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q10','Tabla 11','distribucion',NULL,'Conflicto de interés',NULL,57,523,10.9,8);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q10','Tabla 11','distribucion',NULL,'Sobornos',NULL,51,523,9.8,9);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q10','Tabla 11','distribucion',NULL,'Fraude',NULL,20,523,3.8,10);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Insatisfechos (1 y 2)','Gobierno',NULL,NULL,NULL,61.0,1);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Satisfechos (4 y 5)','Gobierno',NULL,NULL,NULL,21.0,1);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Insatisfechos (1 y 2)','Ambiente',NULL,NULL,NULL,50.88,2);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Satisfechos (4 y 5)','Ambiente',NULL,NULL,NULL,22.81,2);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Insatisfechos (1 y 2)','Comisarías de Familia',NULL,NULL,NULL,43.59,3);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Satisfechos (4 y 5)','Comisarías de Familia',NULL,NULL,NULL,33.33,3);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Insatisfechos (1 y 2)','Seguridad',NULL,NULL,NULL,47.13,4);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Satisfechos (4 y 5)','Seguridad',NULL,NULL,NULL,34.48,4);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Insatisfechos (1 y 2)','Salud',NULL,NULL,NULL,39.56,5);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Satisfechos (4 y 5)','Salud',NULL,NULL,NULL,36.81,5);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Insatisfechos (1 y 2)','Jurídica',NULL,NULL,NULL,35.29,6);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Satisfechos (4 y 5)','Jurídica',NULL,NULL,NULL,38.24,6);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Insatisfechos (1 y 2)','Hábitat',NULL,NULL,NULL,37.5,7);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Satisfechos (4 y 5)','Hábitat',NULL,NULL,NULL,38.89,7);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Insatisfechos (1 y 2)','Planeación',NULL,NULL,NULL,41.67,8);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Satisfechos (4 y 5)','Planeación',NULL,NULL,NULL,40.74,8);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Insatisfechos (1 y 2)','Educación',NULL,NULL,NULL,36.56,9);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Satisfechos (4 y 5)','Educación',NULL,NULL,NULL,40.86,9);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Insatisfechos (1 y 2)','Movilidad',NULL,NULL,NULL,41.76,10);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Satisfechos (4 y 5)','Movilidad',NULL,NULL,NULL,41.22,10);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Insatisfechos (1 y 2)','Mujer',NULL,NULL,NULL,41.94,11);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Satisfechos (4 y 5)','Mujer',NULL,NULL,NULL,41.94,11);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Insatisfechos (1 y 2)','Integración Social',NULL,NULL,NULL,29.07,12);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Satisfechos (4 y 5)','Integración Social',NULL,NULL,NULL,43.02,12);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Insatisfechos (1 y 2)','Servicios Públicos',NULL,NULL,NULL,30.72,13);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Satisfechos (4 y 5)','Servicios Públicos',NULL,NULL,NULL,48.37,13);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Insatisfechos (1 y 2)','Desarrollo Económico',NULL,NULL,NULL,32.65,14);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Satisfechos (4 y 5)','Desarrollo Económico',NULL,NULL,NULL,48.98,14);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Insatisfechos (1 y 2)','Gestión Pública',NULL,NULL,NULL,23.81,15);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Satisfechos (4 y 5)','Gestión Pública',NULL,NULL,NULL,52.38,15);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Insatisfechos (1 y 2)','Cultura',NULL,NULL,NULL,22.86,16);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Satisfechos (4 y 5)','Cultura',NULL,NULL,NULL,60.0,16);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Insatisfechos (1 y 2)','Hacienda',NULL,NULL,NULL,18.82,17);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('ri_q8','Figura 39','sector','Satisfechos (4 y 5)','Hacienda',NULL,NULL,NULL,61.27,17);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('sg_q7_open','Análisis PLN (texto del informe)','pln',NULL,'Control del delito y acción policial',NULL,197,NULL,42.7,1);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('sg_q7_open','Análisis PLN (texto del informe)','pln',NULL,'Justicia, sanciones y normatividad',NULL,88,NULL,19.1,2);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('sg_q7_open','Análisis PLN (texto del informe)','pln',NULL,'Tecnología e Infraestructura para la seguridad',NULL,18,NULL,3.9,3);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('sg_q7_open','Análisis PLN (texto del informe)','pln',NULL,'Prevención y Convivencia Ciudadana',NULL,NULL,NULL,2.2,4);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('sg_q7_open','Análisis PLN (texto del informe)','pln',NULL,'Depuración Institucional',NULL,NULL,NULL,1.3,5);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('sg_q7_open','Análisis PLN (texto del informe)','pln',NULL,'Recomendaciones genéricas / ambiguas',NULL,142,NULL,30.8,6);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('mv_q9_open','Análisis PLN (texto del informe)','pln',NULL,'Ejecución de obras públicas',NULL,89,NULL,46.4,1);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('mv_q9_open','Análisis PLN (texto del informe)','pln',NULL,'Infraestructura vial y espacio público',NULL,27,NULL,14.1,2);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('mv_q9_open','Análisis PLN (texto del informe)','pln',NULL,'Gestión del tráfico y operación de la movilidad',NULL,16,NULL,8.3,3);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('mv_q9_open','Análisis PLN (texto del informe)','pln',NULL,'Gobernanza, planeación y transparencia',NULL,NULL,NULL,7.8,4);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('mv_q9_open','Análisis PLN (texto del informe)','pln',NULL,'Control, regulación y sanción',NULL,NULL,NULL,4.7,5);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('mv_q9_open','Análisis PLN (texto del informe)','pln',NULL,'Cultura ciudadana y comportamiento vial',NULL,NULL,NULL,2.1,6);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('mv_q9_open','Análisis PLN (texto del informe)','pln',NULL,'Recomendaciones genéricas / ambiguas',NULL,32,NULL,16.7,7);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('de_q11_open','Análisis PLN (texto del informe)','pln',NULL,'Empleo y condiciones laborales',NULL,51,NULL,45.9,1);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('de_q11_open','Análisis PLN (texto del informe)','pln',NULL,'Inclusión y acceso a oportunidades económicas',NULL,7,NULL,6.3,2);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('de_q11_open','Análisis PLN (texto del informe)','pln',NULL,'Regulación, trámites y entorno empresarial',NULL,7,NULL,6.3,3);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('de_q11_open','Análisis PLN (texto del informe)','pln',NULL,'Emprendimiento y fortalecimiento empresarial',NULL,NULL,NULL,5.4,4);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('de_q11_open','Análisis PLN (texto del informe)','pln',NULL,'Información, comunicación y acceso a programas',NULL,NULL,NULL,3.6,5);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('de_q11_open','Análisis PLN (texto del informe)','pln',NULL,'Gobernanza, transparencia y corrupción',NULL,NULL,NULL,3.6,6);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('de_q11_open','Análisis PLN (texto del informe)','pln',NULL,'Modelo de desarrollo económico',NULL,NULL,NULL,1.8,7);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('de_q11_open','Análisis PLN (texto del informe)','pln',NULL,'Recomendaciones genéricas / ambiguas',NULL,30,NULL,27.0,8);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('bie_q8_open','Análisis PLN (texto del informe)','pln',NULL,'Salud y acceso a servicios de salud',NULL,27,NULL,21.6,1);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('bie_q8_open','Análisis PLN (texto del informe)','pln',NULL,'Relación con la ciudadanía y acceso institucional',NULL,22,NULL,17.6,2);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('bie_q8_open','Análisis PLN (texto del informe)','pln',NULL,'Entorno urbano y condiciones de vida',NULL,16,NULL,12.8,3);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('bie_q8_open','Análisis PLN (texto del informe)','pln',NULL,'Servicios sociales y subsidios',NULL,NULL,NULL,8.0,4);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('bie_q8_open','Análisis PLN (texto del informe)','pln',NULL,'Educación y desarrollo humano',NULL,NULL,NULL,7.2,5);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('bie_q8_open','Análisis PLN (texto del informe)','pln',NULL,'Gobernanza, focalización y equidad',NULL,NULL,NULL,5.6,6);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('bie_q8_open','Análisis PLN (texto del informe)','pln',NULL,'Recomendaciones genéricas / ambiguas',NULL,34,NULL,27.2,7);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('gp_q8_open','Análisis PLN (texto del informe)','pln',NULL,'Capacidad Institucional y Talento Humano',NULL,22,NULL,22.4,1);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('gp_q8_open','Análisis PLN (texto del informe)','pln',NULL,'Participación Ciudadana',NULL,20,NULL,20.4,2);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('gp_q8_open','Análisis PLN (texto del informe)','pln',NULL,'Transparencia y Gobierno Abierto',NULL,13,NULL,13.3,3);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('gp_q8_open','Análisis PLN (texto del informe)','pln',NULL,'Planeación, Articulación y Metas',NULL,NULL,NULL,12.2,4);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('gp_q8_open','Análisis PLN (texto del informe)','pln',NULL,'Atención y Servicio al Ciudadano',NULL,NULL,NULL,4.1,5);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('gp_q8_open','Análisis PLN (texto del informe)','pln',NULL,'Recomendaciones genéricas / ambiguas',NULL,27,NULL,27.6,6);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('sp_q8_open','Análisis PLN (texto del informe)','pln',NULL,'Tarifas y Costos del Servicio',NULL,33,NULL,42.9,1);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('sp_q8_open','Análisis PLN (texto del informe)','pln',NULL,'Calidad y Continuidad del Servicio',NULL,16,NULL,20.8,2);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('sp_q8_open','Análisis PLN (texto del informe)','pln',NULL,'Atención al Usuario y Resolución de PQRS',NULL,7,NULL,9.1,3);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('sp_q8_open','Análisis PLN (texto del informe)','pln',NULL,'Regulación, Vigilancia y Control Estatal',NULL,NULL,NULL,3.9,4);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('sp_q8_open','Análisis PLN (texto del informe)','pln',NULL,'Facturación y Cobros Indebidos',NULL,NULL,NULL,1.3,5);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('sp_q8_open','Análisis PLN (texto del informe)','pln',NULL,'Sostenibilidad y Cultura Ambiental',NULL,NULL,NULL,1.3,6);
INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES ('sp_q8_open','Análisis PLN (texto del informe)','pln',NULL,'Recomendaciones genéricas / ambiguas',NULL,16,NULL,20.8,7);
```

## 5. Preguntas nuevas del explorador (`06_vistas_explora.sql`)
Municipio de residencia (Tabla 4) y pregunta de control 2024 se añaden al módulo sociodemográfico.

```sql
INSERT INTO EF_PREGUNTA VALUES ('sd_municipio','sociodemografico',12,'multi_choice',NULL,NULL,NULL);
INSERT INTO EF_PREGUNTA_ITEM VALUES ('sd_municipio',1,5);
INSERT INTO EF_PREGUNTA VALUES ('sd_control_2024','sociodemografico',13,'multi_choice',NULL,NULL,NULL);
INSERT INTO EF_PREGUNTA_ITEM VALUES ('sd_control_2024',1,2);
```

## 6. Rótulos de los ítems de matrices (`06_vistas_explora.sql`)
Redacción exacta del informe para cada ítem (Fase 1.7). En `sp_q6_matrix` y `sp_q7_matrix` el orden se comprobó por coincidencia de valores.

```sql
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ci_q9_matrix',1,'Secretarías Distritales','Informe, Fig. 14');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ci_q9_matrix',2,'Alcaldías Locales','Informe, Fig. 14');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ci_q9_matrix',3,'Policía Metropolitana','Informe, Fig. 14');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ci_q9_matrix',4,'Organismos Distritales de Control (Personería, Veeduría, Contraloría)','Informe, Fig. 14');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ci_q9_matrix',5,'Entidades adscritas e institutos del orden distrital y vinculadas','Informe, Fig. 14');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ci_q9_matrix',6,'Órganos de justicia distritales (Inspecciones de Policías, Casas de Justicia, etc.)','Informe, Fig. 14');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ci_q9_matrix',7,'Comisarías de Familia','Informe, Fig. 14');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ci_q9_matrix',8,'Servidores públicos','Informe, Fig. 14');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ci_q10_matrix',1,'Que la entidad o sus servidores estén involucrados en escándalos de corrupción','Informe, Tabla 6');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ci_q10_matrix',2,'Que se evidencie el resultado de su gestión en la ciudad','Informe, Tabla 6');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ci_q10_matrix',3,'Que cumplan con sus objetivos y su misión','Informe, Tabla 6');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ci_q10_matrix',4,'Que presten un servicio eficiente y atiendan solicitudes rápidamente','Informe, Tabla 6');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ci_q10_matrix',5,'Que cuenten con buenos canales de comunicación y brinden una experiencia satisfactoria','Informe, Tabla 6');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ci_q10_matrix',6,'Que el funcionario a la cabeza de la entidad demuestre su liderazgo','Informe, Tabla 6');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ci_q10_matrix',7,'Que cumplan con sus planes, programas y proyectos','Informe, Tabla 6');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ci_q10_matrix',8,'Que den respuesta a todas las solicitudes de la ciudadanía','Informe, Tabla 6');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ci_q10_matrix',9,'Que cumplan con los compromisos pactados en espacios de participación','Informe, Tabla 6');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ci_q10_matrix',10,'Que publiquen de manera clara, simple y periódica datos sobre su gestión','Informe, Tabla 6');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ci_q10_matrix',11,'Que tengan espacios de interlocución permanente y en territorio con la ciudadanía','Informe, Tabla 6');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ci_q10_matrix',12,'Que dispongan canales y espacios para la proposición de ideas de la ciudadanía','Informe, Tabla 6');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ci_q10_matrix',13,'Que por medio de sus redes sociales comuniquen de forma simple y clara datos sobre su gestión','Informe, Tabla 6');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('cr_q1_matrix',1,'Espacios culturales','Informe, Fig. 16');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('cr_q1_matrix',2,'Jornadas de salud','Informe, Fig. 16');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('cr_q1_matrix',3,'Eventos institucionales','Informe, Fig. 16');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('cr_q1_matrix',4,'Espacios deportivos','Informe, Fig. 16');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('cr_q1_matrix',5,'Jornadas de bienestar','Informe, Fig. 16');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('cr_q1_matrix',6,'Espacios de colaboración','Informe, Fig. 16');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('cr_q3_matrix',1,'Pago de impuestos','Informe, Fig. 18');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('cr_q3_matrix',2,'Respeto por las normas sociales de convivencia','Informe, Fig. 18');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('cr_q3_matrix',3,'Reciclaje activo','Informe, Fig. 18');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('cr_q3_matrix',4,'Pago del pasaje en transporte público','Informe, Fig. 18');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('cr_q3_matrix',5,'Respeto por las normas viales','Informe, Fig. 18');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('cr_q3_matrix',6,'Estacionamiento en Zonas de Parqueo Pago','Informe, Fig. 18');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('cr_q3_matrix',7,'Ahorro de agua','Informe, Fig. 18');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('cr_q3_matrix',8,'Ahorro de energía','Informe, Fig. 18');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('cr_q3_matrix',9,'Cuidado del espacio público','Informe, Fig. 18');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('cr_q3_matrix',10,'Recolección de heces de mascotas','Informe, Fig. 18');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('cr_q3_matrix',11,'Disposición de residuos sólidos en las zonas indicadas','Informe, Fig. 18');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('cr_q3_matrix',12,'Respeto por las filas','Informe, Fig. 18');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('cr_q3_matrix',13,'Respeto por la palabra del otro','Informe, Fig. 18');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q2_matrix',1,'Audiencias Públicas','Informe, Fig. 23');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q2_matrix',2,'Instancias Distritales (Consejos o Comités Distritales)','Informe, Fig. 23');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q2_matrix',3,'Instancias Locales (Consejos Locales, Comités, CPL)','Informe, Fig. 23');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q2_matrix',4,'Presupuestos Participativos','Informe, Fig. 23');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q2_matrix',5,'Ejercicios de control social','Informe, Fig. 23');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q2_matrix',6,'Espacios de participación no formales','Informe, Fig. 23');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q7_matrix',1,'Obtener un beneficio para la comunidad o una solución a un problema colectivo','Informe, Tabla 9');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q7_matrix',2,'Cumplir con un deber ciudadano','Informe, Tabla 9');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q7_matrix',3,'Influir en las decisiones de las autoridades y/o entidades públicas','Informe, Tabla 9');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q7_matrix',4,'Curiosidad por el tema discutido en el espacio','Informe, Tabla 9');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q7_matrix',5,'Conocer y relacionarse con otras personas','Informe, Tabla 9');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q7_matrix',6,'Ser elegido(a) para representar a un grupo o comunidad','Informe, Tabla 9');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q7_matrix',7,'Resolver un problema personal y/o familiar','Informe, Tabla 9');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q10_matrix',1,'Generar mayor colaboración entre distintos sectores','Informe, Fig. 28');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q10_matrix',2,'Reducir la corrupción, el clientelismo y la politiquería','Informe, Fig. 28');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q10_matrix',3,'Promover el diálogo entre instituciones y ciudadanos','Informe, Fig. 28');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q10_matrix',4,'Fortalecer la creación de grupos y organizaciones sociales','Informe, Fig. 28');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q10_matrix',5,'Ampliar el conocimiento sobre la ciudad y sus problemáticas','Informe, Fig. 28');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q10_matrix',6,'Aumentar la confianza en las instituciones públicas','Informe, Fig. 28');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q10_matrix',7,'Empoderar y visibilizar a grupos y comunidades','Informe, Fig. 28');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q10_matrix',8,'Propiciar el sentido de pertenencia por lo público','Informe, Fig. 28');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q10_matrix',9,'Incluir a los ciudadanos en la toma de decisiones','Informe, Fig. 28');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q11_matrix',1,'Presentación de iniciativas normativas','Informe, Fig. 29');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q11_matrix',2,'Firmas para promover un referendo','Informe, Fig. 29');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q11_matrix',3,'Plebiscito','Informe, Fig. 29');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q11_matrix',4,'Consultas populares','Informe, Fig. 29');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q11_matrix',5,'Procesos de revocatoria del mandato','Informe, Fig. 29');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('pa_q11_matrix',6,'Cabildos abiertos','Informe, Fig. 29');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ri_q1_matrix',1,'Es efectivo denunciar a los servidores que actúan de forma poco transparente','Informe, Fig. 34');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ri_q1_matrix',2,'Denunciar disminuye el riesgo de corrupción','Informe, Fig. 34');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ri_q1_matrix',3,'Los servidores públicos actúan en función del interés general de la ciudadanía','Informe, Fig. 34');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ri_q1_matrix',4,'La Administración Distrital actúa de manera ética y transparente','Informe, Fig. 34');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ri_q1_matrix',5,'Los procesos de contratación pública del Distrito son transparentes','Informe, Fig. 34');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('ri_q1_matrix',6,'La Administración Distrital toma medidas efectivas para prevenir la corrupción','Informe, Fig. 34');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('mv_q4_matrix',1,'Secretaría Distrital de Movilidad (SDM)','Informe, Fig. 49');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('mv_q4_matrix',2,'Instituto de Desarrollo Urbano (IDU)','Informe, Fig. 49');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('mv_q4_matrix',3,'Unidad de Mantenimiento Vial (UMV)','Informe, Fig. 49');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('mv_q4_matrix',4,'Transmilenio S.A.','Informe, Fig. 49');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('mv_q4_matrix',5,'Operadora ''La Rolita''','Informe, Fig. 49');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('mv_q4_matrix',6,'Terminal de Transporte S.A.','Informe, Fig. 49');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('mv_q4_matrix',7,'Empresa Metro de Bogotá','Informe, Fig. 49');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('bie_q1_matrix',1,'Educación Preescolar','Informe, Fig. 57');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('bie_q1_matrix',2,'Educación Básica (Primaria/Secundaria)','Informe, Fig. 57');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('bie_q1_matrix',3,'Educación Media (10° y 11°)','Informe, Fig. 57');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('bie_q1_matrix',4,'Educación Superior','Informe, Fig. 57');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('bie_q1_matrix',5,'Servicios de Salud','Informe, Fig. 57');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('bie_q1_matrix',6,'Servicios Culturales','Informe, Fig. 57');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('bie_q1_matrix',7,'Servicios Deportivos','Informe, Fig. 57');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('bie_q7_matrix',1,'Secretaría Distrital de Salud','Informe, Fig. 60');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('bie_q7_matrix',2,'Secretaría de Educación del Distrito','Informe, Fig. 60');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('bie_q7_matrix',3,'Secretaría de Cultura, Recreación y Deporte','Informe, Fig. 60');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('bie_q7_matrix',4,'Secretaría de Integración Social','Informe, Fig. 60');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('gp_q5_matrix',1,'Calidad de los servicios distritales','Informe, Fig. 62');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('gp_q5_matrix',2,'Canales de atención del Distrito (Presencial, telefónico, virtual)','Informe, Fig. 62');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('gp_q5_matrix',3,'Medios de comunicación de la Alcaldía (Vallas, cuñas, pautas)','Informe, Fig. 62');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q5_matrix',1,'"Los recibos y facturas de cobro son claros y comprensibles"','Informe, Fig. 65');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q5_matrix',2,'"Realizar el pago de la factura de cobro de servicios públicos es fácil"','Informe, Fig. 65');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q5_matrix',3,'"La tarifa de los servicios públicos domiciliarios es justa y razonable"','Informe, Fig. 65');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q6_matrix',1,'"Los servicios públicos funcionan mejor que en el año anterior"','Informe, Fig. 67 (orden verificado por coincidencia de valores)');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q6_matrix',2,'"Todas las zonas de Bogotá tienen un acceso equitativo a los servicios públicos"','Informe, Fig. 67 (orden verificado por coincidencia de valores)');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q6_matrix',3,'"Debería existir una entidad distrital que se especialice en evaluar la calidad de los servicios"','Informe, Fig. 67 (orden verificado por coincidencia de valores)');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q6_matrix',4,'"Es necesario acudir a otra entidad diferente a la empresa para dar solución a los reclamos"','Informe, Fig. 67 (orden verificado por coincidencia de valores)');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q7_matrix',1,'"Accesibilidad de los canales para reportar fallas" (teléfono, web, presencial, ChatBot, apps)','Informe, Fig. 66 (orden verificado por coincidencia de valores)');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q7_matrix',2,'"Facilidad para gestionar trámites" (reparaciones, suspensiones, cambio de titular)','Informe, Fig. 66 (orden verificado por coincidencia de valores)');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q7_matrix',3,'"Confianza en que la empresa resuelva rápida y oportunamente"','Informe, Fig. 66 (orden verificado por coincidencia de valores)');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q7_matrix',4,'"Confianza en que atiendan sus reclamos satisfactoriamente"','Informe, Fig. 66 (orden verificado por coincidencia de valores)');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q1_matrix',1,'EAAB · Calidad del servicio','Informe, Tabla 12');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q1_matrix',2,'EAAB · Canales de atención a usuarios','Informe, Tabla 12');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q1_matrix',3,'EAAB · Medios de comunicación','Informe, Tabla 12');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q1_matrix',4,'EAAB · Precio de la tarifa','Informe, Tabla 12');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q1_matrix',5,'EAAB · Continuidad en la prestación del servicio','Informe, Tabla 12');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q2_matrix',1,'VANTI · Calidad del servicio','Informe, Tabla 12');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q2_matrix',2,'VANTI · Canales de atención a usuarios','Informe, Tabla 12');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q2_matrix',3,'VANTI · Medios de comunicación','Informe, Tabla 12');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q2_matrix',4,'VANTI · Precio de la tarifa','Informe, Tabla 12');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q2_matrix',5,'VANTI · Continuidad en la prestación del servicio','Informe, Tabla 12');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q3_matrix',1,'ENEL · Calidad del servicio','Informe, Tabla 12');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q3_matrix',2,'ENEL · Canales de atención a usuarios','Informe, Tabla 12');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q3_matrix',3,'ENEL · Medios de comunicación','Informe, Tabla 12');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q3_matrix',4,'ENEL · Precio de la tarifa','Informe, Tabla 12');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q3_matrix',5,'ENEL · Continuidad en la prestación del servicio','Informe, Tabla 12');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q4_matrix',1,'Operadores de aseo · Calidad del servicio','Informe, Tabla 12');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q4_matrix',2,'Operadores de aseo · Canales de atención a usuarios','Informe, Tabla 12');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q4_matrix',3,'Operadores de aseo · Medios de comunicación','Informe, Tabla 12');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q4_matrix',4,'Operadores de aseo · Precio de la tarifa','Informe, Tabla 12');
INSERT INTO EF_ETIQUETA_ITEM VALUES ('sp_q4_matrix',5,'Operadores de aseo · Continuidad en la prestación del servicio','Informe, Tabla 12');
```

## 7. Extremos, polaridad y rótulos de 3 niveles de las escalas (`06_vistas_explora.sql`)
`polaridad = 'inversa'` marca las escalas donde un valor alto es lo negativo (`sg_q3`, `gp_q4`, `mv_q4_matrix`).

```sql
INSERT INTO EF_ESCALA VALUES ('bie_q1_matrix','Muy insatisfecho (a)','Muy satisfecho (a)',5,'directa','Insatisfechos','Neutros','Satisfechos','Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('bie_q7_matrix','Nada en lo absoluto','Totalmente',5,'directa','Negativo','Neutro','Positivo','Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('ci_q1','muy mala','Excelente',10,'directa','Negativa (1 a 4)','Intermedia (5 y 6)','Positiva (7 a 10)','Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('ci_q10_matrix','no me genera confianza','me genera mucha confianza',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('ci_q3','no confío en absoluto','confío plenamente',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('ci_q5','no confío en absoluto','confío plenamente',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('ci_q6','nada informado','muy informado',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('ci_q7','Muy difícil','Muy fácil',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('ci_q8','Muy insatisfecho (a)','Muy satisfecho (a)',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('ci_q9_matrix','No confío en absoluto','Confío plenamente',5,'directa','No confía','Ni confía, ni desconfía','Confía','Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('cr_q1_matrix','nunca','siempre',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('cr_q3_matrix','nunca','siempre',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('de_q10','Muy difícil','Muy fácil',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('de_q2','Nada en lo absoluto','Totalmente',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('de_q6','Nada en lo absoluto','Totalmente',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('de_q7','Muy difícil','Muy fácil',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('de_q8','Muy difícil','Muy fácil',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('de_q9','Muy difícil','Muy fácil',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('gp_q4','Nada en lo absoluto','Totalmente',5,'inversa','Poco/Nada (1 y 2)','Neutro (3)','Corrupción generalizada (4 y 5)','Informe, Fig. 63: corrupción generalizada');
INSERT INTO EF_ESCALA VALUES ('gp_q5_matrix','Muy insatisfecho','Muy satisfecho',5,'directa','Insatisfechos','Neutros','Satisfechos','Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('gp_q6','Nada en lo absoluto','Totalmente',5,'directa','En desacuerdo','Indiferente','De acuerdo','Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('gp_q7',NULL,NULL,NULL,'directa','En desacuerdo','Indiferente','De acuerdo','Informe');
INSERT INTO EF_ESCALA VALUES ('mv_q2','no confío en absoluto','confío plenamente',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('mv_q3','no confío en absoluto','confío plenamente',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('mv_q4_matrix','Nada en lo absoluto','Totalmente',5,'inversa','Baja exposición (1 y 2)','Neutral (3)','Alta exposición a corrupción (4 y 5)','Informe, Fig. 49: exposición a riesgos de corrupción');
INSERT INTO EF_ESCALA VALUES ('mv_q5','Nada en lo absoluto','Totalmente',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('mv_q8','No confío en absoluto','Confío plenamente',5,'directa',NULL,NULL,NULL,'Informe, Fig. 51');
INSERT INTO EF_ESCALA VALUES ('pa_q10_matrix','Totalmente en desacuerdo','Totalmente de acuerdo',5,'directa','En desacuerdo','Neutro','De acuerdo','Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('pa_q2_matrix','Nunca','Siempre',5,'directa','No asiste (1+2)','A veces (3)','Asiste (4+5)','Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('pa_q5','no confío en absoluto','confío plenamente',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('pa_q6','Nada transparentes','Muy transparentes',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('pa_q7_matrix','Ninguna','Mucha',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('ri_q1_matrix','Totalmente en desacuerdo','Totalmente de acuerdo',5,'directa','En desacuerdo','Ni de acuerdo, ni en desacuerdo','De acuerdo','Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('ri_q4','Nada en lo absoluto','Totalmente',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('ri_q8','Muy insatisfecho (a)','Muy satisfecho (a)',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('sg_q3','Muy fácil','Muy difícil',5,'inversa',NULL,NULL,NULL,'Informe, Fig. 43');
INSERT INTO EF_ESCALA VALUES ('sg_q6','Muy insatisfecho (a)','Muy satisfecho (a)',5,'directa',NULL,NULL,NULL,'Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('sp_q1_matrix','Muy insatisfecho','Muy satisfecho',5,'directa','Insatisfechos','Neutro','Satisfechos','Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('sp_q2_matrix','Muy insatisfecho','Muy satisfecho',5,'directa','Insatisfechos','Neutro','Satisfechos','Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('sp_q3_matrix','Muy insatisfecho','Muy satisfecho',5,'directa','Insatisfechos','Neutro','Satisfechos','Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('sp_q4_matrix','Muy insatisfecho','Muy satisfecho',5,'directa','Insatisfechos','Neutro','Satisfechos','Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('sp_q5_matrix','Totalmente en desacuerdo','Totalmente de acuerdo',5,'directa','En desacuerdo','Indiferente','De acuerdo','Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('sp_q6_matrix','Totalmente en desacuerdo','Totalmente de acuerdo',5,'directa','En desacuerdo','Indiferente','De acuerdo','Enunciado de la pregunta');
INSERT INTO EF_ESCALA VALUES ('sp_q7_matrix','Muy poco','Mucho',5,'directa','Baja','Indiferente','Alta','Enunciado de la pregunta');
```

## 8. Figura del informe, decimales, niveles y figuras combinadas (`06_vistas_explora.sql`)
Incluye `EF_FIGURA` (con `niveles` = 5 para `cr_q1_matrix`, `cr_q3_matrix`, `ci_q10_matrix`) y, de la Fase 2, `EF_FIGURA_ESPECIAL_DATOS`, `EF_FIGURA_SERIE_DATOS` y `EF_FIGURA_FILA_DATOS` (Tabla 5, Figuras 6, 46, 56, 58, 59, 64 y Tabla 12).
```sql
INSERT INTO EF_FIGURA VALUES ('sd_localidad','Tabla 3',2,3);
INSERT INTO EF_FIGURA VALUES ('sd_municipio','Tabla 4',2,3);
INSERT INTO EF_FIGURA VALUES ('sd_edad','Figura 1',2,3);
INSERT INTO EF_FIGURA VALUES ('sd_genero','Figura 2',2,3);
INSERT INTO EF_FIGURA VALUES ('sd_educacion','Figura 3',0,3);
INSERT INTO EF_FIGURA VALUES ('sd_ocupacion','Figura 4',1,3);
INSERT INTO EF_FIGURA VALUES ('sd_estrato','Figura 5',1,3);
INSERT INTO EF_FIGURA VALUES ('sd_servidor','Figura 6',1,3);
INSERT INTO EF_FIGURA VALUES ('sd_autopercepcion','Figura 6',1,3);
INSERT INTO EF_FIGURA VALUES ('ci_q1','Figura 7',1,3);
INSERT INTO EF_FIGURA VALUES ('ci_q2','Figura 8',2,3);
INSERT INTO EF_FIGURA VALUES ('ci_q3','Figura 9',2,3);
INSERT INTO EF_FIGURA VALUES ('ci_q4','Figura 10',2,3);
INSERT INTO EF_FIGURA VALUES ('ci_q5','Figura 11',2,3);
INSERT INTO EF_FIGURA VALUES ('ci_q6','Figura 12',2,3);
INSERT INTO EF_FIGURA VALUES ('ci_q7','Figura 13',2,3);
INSERT INTO EF_FIGURA VALUES ('ci_q9_matrix','Figura 14',2,3);
INSERT INTO EF_FIGURA VALUES ('ci_q10_matrix','Tabla 6',2,5);
INSERT INTO EF_FIGURA VALUES ('ci_q8','Figura 15',2,3);
INSERT INTO EF_FIGURA VALUES ('cr_q1_matrix','Figura 16',2,5);
INSERT INTO EF_FIGURA VALUES ('cr_q2','Figura 17',2,3);
INSERT INTO EF_FIGURA VALUES ('cr_q3_matrix','Figura 18',2,5);
INSERT INTO EF_FIGURA VALUES ('cr_q4','Figura 19',2,3);
INSERT INTO EF_FIGURA VALUES ('cr_q5','Figura 20',2,3);
INSERT INTO EF_FIGURA VALUES ('cr_q6','Figura 21',2,3);
INSERT INTO EF_FIGURA VALUES ('cr_q7','Figura 22',2,3);
INSERT INTO EF_FIGURA VALUES ('pa_q1','Tabla 7',1,3);
INSERT INTO EF_FIGURA VALUES ('pa_q2_matrix','Figura 23',1,3);
INSERT INTO EF_FIGURA VALUES ('pa_q4_open','Tabla 8',1,3);
INSERT INTO EF_FIGURA VALUES ('pa_q5','Figura 24',2,3);
INSERT INTO EF_FIGURA VALUES ('pa_q6','Figura 25',2,3);
INSERT INTO EF_FIGURA VALUES ('pa_q7_matrix','Tabla 9',2,3);
INSERT INTO EF_FIGURA VALUES ('pa_q8','Figura 26',1,3);
INSERT INTO EF_FIGURA VALUES ('pa_q9','Figura 27',1,3);
INSERT INTO EF_FIGURA VALUES ('pa_q10_matrix','Figura 28',2,3);
INSERT INTO EF_FIGURA VALUES ('pa_q11_matrix','Figura 29',2,3);
INSERT INTO EF_FIGURA VALUES ('pa_q12','Figura 30',2,3);
INSERT INTO EF_FIGURA VALUES ('pa_q13','Figura 31',2,3);
INSERT INTO EF_FIGURA VALUES ('pa_q14_si','Figura 32',2,3);
INSERT INTO EF_FIGURA VALUES ('pa_q14_no','Figura 33',2,3);
INSERT INTO EF_FIGURA VALUES ('ri_q1_matrix','Figura 34',2,3);
INSERT INTO EF_FIGURA VALUES ('ri_q2','Figura 35',2,3);
INSERT INTO EF_FIGURA VALUES ('ri_q3','Figura 36',2,3);
INSERT INTO EF_FIGURA VALUES ('ri_q4','Figura 37',2,3);
INSERT INTO EF_FIGURA VALUES ('ri_q6','Tabla 10',2,3);
INSERT INTO EF_FIGURA VALUES ('ri_q8','Figura 38',2,3);
INSERT INTO EF_FIGURA VALUES ('ri_q10','Tabla 11',1,3);
INSERT INTO EF_FIGURA VALUES ('tp_q1','Figura 40',2,3);
INSERT INTO EF_FIGURA VALUES ('sg_q1','Figura 41',2,3);
INSERT INTO EF_FIGURA VALUES ('sg_q2','Figura 42',2,3);
INSERT INTO EF_FIGURA VALUES ('sg_q3','Figura 43',2,3);
INSERT INTO EF_FIGURA VALUES ('sg_q4','Figura 44',2,3);
INSERT INTO EF_FIGURA VALUES ('sg_q5','Figura 45',2,3);
INSERT INTO EF_FIGURA VALUES ('sg_q9','Figura 46',2,3);
INSERT INTO EF_FIGURA VALUES ('sg_q10_si','Figura 46',2,3);
INSERT INTO EF_FIGURA VALUES ('mv_q1','Figura 47',2,3);
INSERT INTO EF_FIGURA VALUES ('mv_q2','Figura 48',2,3);
INSERT INTO EF_FIGURA VALUES ('mv_q4_matrix','Figura 49',2,3);
INSERT INTO EF_FIGURA VALUES ('mv_q5','Figura 50',2,3);
INSERT INTO EF_FIGURA VALUES ('mv_q8','Figura 51',2,3);
INSERT INTO EF_FIGURA VALUES ('de_q2','Figura 52',2,3);
INSERT INTO EF_FIGURA VALUES ('de_q1','Figura 53',2,3);
INSERT INTO EF_FIGURA VALUES ('de_q4','Figura 54',2,3);
INSERT INTO EF_FIGURA VALUES ('de_q3','Figura 55',2,3);
INSERT INTO EF_FIGURA VALUES ('de_q7','Figura 56',2,3);
INSERT INTO EF_FIGURA VALUES ('de_q8','Figura 56',2,3);
INSERT INTO EF_FIGURA VALUES ('de_q10','Figura 56',2,3);
INSERT INTO EF_FIGURA VALUES ('bie_q1_matrix','Figura 57',2,3);
INSERT INTO EF_FIGURA VALUES ('bie_q2','Figura 58',2,3);
INSERT INTO EF_FIGURA VALUES ('bie_q3','Figura 58',2,3);
INSERT INTO EF_FIGURA VALUES ('bie_q4','Figura 59',2,3);
INSERT INTO EF_FIGURA VALUES ('bie_q5','Figura 59',2,3);
INSERT INTO EF_FIGURA VALUES ('bie_q7_matrix','Figura 60',2,3);
INSERT INTO EF_FIGURA VALUES ('gp_q1','Figura 61',2,3);
INSERT INTO EF_FIGURA VALUES ('gp_q5_matrix','Figura 62',2,3);
INSERT INTO EF_FIGURA VALUES ('gp_q4','Figura 63',2,3);
INSERT INTO EF_FIGURA VALUES ('gp_q6','Figura 64',2,3);
INSERT INTO EF_FIGURA VALUES ('gp_q7','Figura 64',2,3);
INSERT INTO EF_FIGURA VALUES ('sp_q1_matrix','Tabla 12',2,3);
INSERT INTO EF_FIGURA VALUES ('sp_q2_matrix','Tabla 12',2,3);
INSERT INTO EF_FIGURA VALUES ('sp_q3_matrix','Tabla 12',2,3);
INSERT INTO EF_FIGURA VALUES ('sp_q4_matrix','Tabla 12',2,3);
INSERT INTO EF_FIGURA VALUES ('sp_q5_matrix','Figura 65',2,3);
INSERT INTO EF_FIGURA VALUES ('sp_q7_matrix','Figura 66',2,3);
INSERT INTO EF_FIGURA VALUES ('sp_q6_matrix','Figura 67',2,3);
INSERT INTO EF_FIGURA_ESPECIAL_DATOS VALUES ('ci_alcalde_localidad','ranking','confianza',11,'Tabla 5. Calificación promedio de la gestión del Alcalde Mayor de Bogotá por localidad.','Tabla 5',1,NULL,NULL,NULL);
INSERT INTO EF_FIGURA_ESPECIAL_DATOS VALUES ('fig_06','paneles','sociodemografico',14,'Figura 6. Número y porcentaje de encuestados según lugar de nacimiento y cultura política.','Figura 6',1,NULL,NULL,NULL);
INSERT INTO EF_FIGURA_SERIE_DATOS VALUES ('fig_06',1,'sd_servidor','Lugar de nacimiento');
INSERT INTO EF_FIGURA_SERIE_DATOS VALUES ('fig_06',2,'sd_autopercepcion','Cultura política');
INSERT INTO EF_FIGURA_ESPECIAL_DATOS VALUES ('fig_46','paneles','seguridad',11,'Figura 46. Porcentaje de encuestados que indicaron ser víctimas de un delito en 2025 que denunciaron y la percepción con la atención recibida por parte de las autoridades.','Figura 46',2,NULL,NULL,NULL);
INSERT INTO EF_FIGURA_SERIE_DATOS VALUES ('fig_46',1,'sg_q9','¿Denunció el delito?');
INSERT INTO EF_FIGURA_SERIE_DATOS VALUES ('fig_46',2,'sg_q10_si','Reacción de las autoridades');
INSERT INTO EF_FIGURA_ESPECIAL_DATOS VALUES ('fig_56','agrupadas','empleabilidad',12,'Figura 56. Percepción de complejidad para emprender o iniciar un nuevo negocio, para conseguir empleo, y para cubrir sus necesidades básicas y costo de vida en Bogotá.','Figura 56',2,NULL,NULL,NULL);
INSERT INTO EF_FIGURA_SERIE_DATOS VALUES ('fig_56',1,'de_q7','Emprender');
INSERT INTO EF_FIGURA_SERIE_DATOS VALUES ('fig_56',2,'de_q8','Conseguir empleo');
INSERT INTO EF_FIGURA_SERIE_DATOS VALUES ('fig_56',3,'de_q10','Cubrir necesidades básicas y costo de vida');
INSERT INTO EF_FIGURA_ESPECIAL_DATOS VALUES ('fig_58','agrupadas_3','bienestar',9,'Figura 58. Percepción sobre la buena gestión y suficiencia de los recursos destinados a la salud y educación en el Distrito Capital.','Figura 58',2,'Desacuerdo (%)','Neutros (%)','Acuerdo (%)');
INSERT INTO EF_FIGURA_SERIE_DATOS VALUES ('fig_58',1,'bie_q3','"Los recursos de Educación son suficientes y están bien gestionados"');
INSERT INTO EF_FIGURA_SERIE_DATOS VALUES ('fig_58',2,'bie_q2','"Los recursos de Salud Pública son gestionados de manera eficiente"');
INSERT INTO EF_FIGURA_ESPECIAL_DATOS VALUES ('fig_59','agrupadas_3','bienestar',10,'Figura 59. Satisfacción y percepción de transparencia sobre los subsidios que se entregan en la ciudad.','Figura 59',2,'En desacuerdo','Neutro (%)','De acuerdo');
INSERT INTO EF_FIGURA_SERIE_DATOS VALUES ('fig_59',1,'bie_q4','Satisfacción con la forma en que el Distrito dispone los subsidios y ayudas');
INSERT INTO EF_FIGURA_SERIE_DATOS VALUES ('fig_59',2,'bie_q5','"La priorización y focalización de beneficiarios es transparente y sin corrupción"');
INSERT INTO EF_FIGURA_ESPECIAL_DATOS VALUES ('fig_64','agrupadas_3','planeacion',9,'Figura 64. Percepción sobre si los servidores públicos están bien capacitados y las entidades distritales tienen altas capacidades de gestión.','Figura 64',2,'En desacuerdo','Indiferente','De acuerdo');
INSERT INTO EF_FIGURA_SERIE_DATOS VALUES ('fig_64',1,'gp_q6','Los servidores públicos del Distrito son idóneos y bien capacitados');
INSERT INTO EF_FIGURA_SERIE_DATOS VALUES ('fig_64',2,'gp_q7','Las entidades distritales cuentan con altas capacidades de gestión');
INSERT INTO EF_FIGURA_ESPECIAL_DATOS VALUES ('tabla_12','tabla','servicios_publicos',9,'Tabla 12. Satisfacción con la calidad, continuidad, canales de comunicación, canales de atención y precio de la tarifa de los servicios públicos domiciliarios.','Tabla 12',2,NULL,NULL,NULL);
INSERT INTO EF_FIGURA_SERIE_DATOS VALUES ('tabla_12',1,'sp_q1_matrix','EAAB');
INSERT INTO EF_FIGURA_SERIE_DATOS VALUES ('tabla_12',2,'sp_q2_matrix','VANTI');
INSERT INTO EF_FIGURA_SERIE_DATOS VALUES ('tabla_12',3,'sp_q3_matrix','ENEL');
INSERT INTO EF_FIGURA_SERIE_DATOS VALUES ('tabla_12',4,'sp_q4_matrix','Operadores de aseo');
INSERT INTO EF_FIGURA_FILA_DATOS VALUES ('tabla_12',1,1,'Calidad del servicio');
INSERT INTO EF_FIGURA_FILA_DATOS VALUES ('tabla_12',2,5,'Continuidad en la prestación del servicio');
INSERT INTO EF_FIGURA_FILA_DATOS VALUES ('tabla_12',3,3,'Medios de comunicación');
INSERT INTO EF_FIGURA_FILA_DATOS VALUES ('tabla_12',4,2,'Canales de atención a usuarios');
INSERT INTO EF_FIGURA_FILA_DATOS VALUES ('tabla_12',5,4,'Precio de la tarifa');
```

## 9. Edición de valores por administración (`08_admin_edicion.sql`, Fase 4)
Script nuevo y **autónomo** (crea `EF_ADMIN_USUARIO`, `EF_VALOR_EDITADO`, `EF_VALOR_EDITADO_LOG` y la vista `EF_GRAFICA_VALORES_EDITADOS`). En una base ya instalada se ejecuta con `root` después del 06. Los valores originales nunca se modifican: lo editado se superpone al leer el dataset y «Restaurar» borra la edición (queda en el historial). La clave del administrador se guarda como hash scrypt; **cámbiala en producción** y define `ADMIN_RUTA` y `ADMIN_SECRETO` en el servicio `web`.

```sql
INSERT INTO EF_ADMIN_USUARIO (usuario, clave_hash) VALUES ('admin', 'scrypt$ef86f20679f4618c658311adb64f11f9$d7f60a1177d7f247515ff53ee3f4202f66bebf7b6529c0ef0e893123689f87e9')
ON DUPLICATE KEY UPDATE clave_hash = VALUES(clave_hash);
CREATE USER IF NOT EXISTS 'web_admin'@'%' IDENTIFIED BY 'web_admin';
GRANT SELECT ON eficiencia.EF_ADMIN_USUARIO TO 'web_admin'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON eficiencia.EF_VALOR_EDITADO TO 'web_admin'@'%';
GRANT SELECT, INSERT ON eficiencia.EF_VALOR_EDITADO_LOG TO 'web_admin'@'%';
GRANT SELECT ON eficiencia.EF_GRAFICA_VALORES_EDITADOS TO 'web_publico'@'%';
```

## 10. Varios años de encuesta (`09_anios.sql` y `10_usuario_carga.sql`, Fase 5)
**Base ya instalada**, en este orden con `root`: `09_anios.sql` (agrega `encuestados.anio` = 2025 a todo lo existente, `anio` a las tablas de edición y crea `EF_ANIO` y `EF_CARGA_LOG`), luego `04_vistas_publicas.sql`, `08_admin_edicion.sql`, `06_vistas_explora.sql` (recrea las tablas y vistas con `anio`; tarda varios minutos) y por último `10_usuario_carga.sql`. Después: `docker compose up -d --build web cargador` con `CARGA_TOKEN` definido en un `.env`. En una instalación nueva no hay que hacer nada especial: `01` ya trae las columnas y los scripts `09`/`10` corren en su orden.

Datos que cambian (INSERT/UPDATE/GRANT):

```sql
INSERT INTO EF_ANIO (anio, etiqueta, usa_informe, filas, archivo, usuario)
SELECT 2025, 'Encuesta 2025', 1, (SELECT COUNT(*) FROM encuestados WHERE anio = 2025), 'BDD_EPCI_Anon.xlsx', 'inicial'
WHERE NOT EXISTS (SELECT 1 FROM EF_ANIO WHERE anio = 2025);
UPDATE EF_ANIO SET filas = (SELECT COUNT(*) FROM encuestados WHERE anio = EF_ANIO.anio) WHERE filas = 0;
CREATE USER IF NOT EXISTS 'web_carga'@'%' IDENTIFIED BY 'web_carga';
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
GRANT SELECT ON eficiencia.EF_ANIO TO 'web_publico'@'%';
GRANT SELECT ON eficiencia.EF_CARGA_LOG TO 'web_admin'@'%';
GRANT SELECT ON eficiencia.EF_ANIO TO 'web_admin'@'%';
```

## 11. Verificación después del despliegue
```sql
-- Género: 6 categorías como la Figura 2 (54,89 / 44,19 / 0,14 / 0,62 / 0,08 / 0,08)
SELECT categoria, n, base, ROUND(porcentaje, 2) FROM EF_GRAFICA_DISTRIBUCION WHERE clave = 'sd_genero' AND segmento = 'todos' ORDER BY orden_categoria;
-- Servidores distritales = 1.833
SELECT segmento, n FROM EF_BASE_RESPONDIENTES WHERE id_pregunta = 15 AND segmento_tipo = 'ocupacion';
-- Figura 46: 66,06 % sí denunció (base 218)
SELECT categoria, n, base, ROUND(porcentaje, 2) FROM EF_GRAFICA_DISTRIBUCION WHERE clave = 'sg_q9' AND segmento = 'todos';
-- Figura 45: «Otro» = 60 personas (11,43 %)
SELECT categoria, n, base, ROUND(porcentaje, 2) FROM EF_GRAFICA_DISTRIBUCION WHERE clave = 'sg_q5' AND segmento = 'todos' ORDER BY n DESC;
-- Valores publicados cargados (esperado: 124)
SELECT COUNT(*) FROM EF_INFORME_PUBLICADO;
```
Con el sitio en marcha: `python etl/auditar_cifras.py` (coherencia base ↔ vistas ↔ API) y `python etl/comparar_informe.py` (informe ↔ vistas).
