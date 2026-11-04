-- Carga de los CSV generados por etl/build_seed.py (montados en /seed)
SET NAMES utf8mb4;
SET foreign_key_checks = 0;
SET unique_checks = 0;

LOAD DATA INFILE '/seed/preguntas.csv' INTO TABLE preguntas CHARACTER SET utf8mb4
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' ESCAPED BY '\\' LINES TERMINATED BY '\n'
  (id_pregunta, codigo, columna_excel, modulo, numero_pregunta, enunciado, subitem, subitem_corto,
   encabezado_original, tipo_respuesta, tipo_homologacion, grupo_pregunta, encabezado_truncado, n_respuestas);

LOAD DATA INFILE '/seed/encuestados.csv' INTO TABLE encuestados CHARACTER SET utf8mb4
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' ESCAPED BY '\\' LINES TERMINATED BY '\n'
  (id_encuestado, fila_excel, n_respondidas);

LOAD DATA INFILE '/seed/homologacion.csv' INTO TABLE homologacion CHARACTER SET utf8mb4
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' ESCAPED BY '\\' LINES TERMINATED BY '\n'
  (id_homologacion, tipo_homologacion, valor_original, valor_hash, valor_homologado, valor_numerico, orden, n_casos);

LOAD DATA INFILE '/seed/respuestas.csv' INTO TABLE respuestas CHARACTER SET utf8mb4
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' ESCAPED BY '\\' LINES TERMINATED BY '\n'
  (id_respuesta, id_encuestado, id_pregunta, respuesta_original, respuesta_homologada, valor_numerico);

LOAD DATA INFILE '/seed/respuestas_opciones.csv' INTO TABLE respuestas_opciones CHARACTER SET utf8mb4
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' ESCAPED BY '\\' LINES TERMINATED BY '\n'
  (id_opcion, id_respuesta, id_encuestado, id_pregunta, opcion_original, opcion_homologada);

SET unique_checks = 1;
SET foreign_key_checks = 1;
