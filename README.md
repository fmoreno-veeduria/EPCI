# eficiencia — Encuesta de Percepción de Confianza Institucional

MySQL 8 en Docker (`eficiencia`) cargado desde `BDD_EPCI_Anon.xlsx`, un sitio público con dos módulos y un tablero interno.

```bash
docker compose up -d        # MySQL :3307 · sitio público http://localhost:8080 · tablero interno :8090
docker compose down         # detiene todo (los datos quedan en mysql/data)
```

## Sitio público (`web/`, contenedor `eficiencia-web`)
Basado en el proyecto «Explorador de Confianza EPCI 2025» (React + Express), pero **todas las cifras salen de MySQL**.
- `/` portada: cifras de la base, módulos y lo que la plataforma no puede mostrar.
- `/aprende` **módulo 1 · Aprende con Tula**: ruta de 6 paradas y chat. Tula responde solo con cifras calculadas desde la base (no usa un modelo de lenguaje); si el dato no existe, lo dice.
- `/explora` **módulo 2 · Explora la encuesta**: 12 módulos, 108 preguntas, filtros por género/edad/ocupación (servidores distritales / ciudadanía) y fichas descargables.
- Los dos módulos son páginas y bundles distintos y se comunican solo por enlaces; el servidor expone `/api/explora/*` y `/api/aprende/*` por separado.
- Lee únicamente vistas (`EF_*` para `/explora`, `v_pub_*` para portada y Aula) con el usuario de solo lectura `web_publico`; ninguna tabla base. Las citas textuales de la ciudadanía no se publican; solo palabras frecuentes agregadas.
- Desarrollo: `cd web && npm install && npm run build && PORT=8085 npm start` (con MySQL arriba en `:3307`).

### Auditoría de cifras
`python etl/auditar_cifras.py` recalcula con SQL desde las tablas base de MySQL (no desde las vistas ni el servidor) lo que publica `/api/explora/dataset` y lo compara: totales, base y distribución de cada pregunta, promedios, cortes por género/edad/ocupación, satisfacción por sector, temas del texto libre, Alcalde por localidad y módulos. Última corrida: **43.331 comprobaciones, 0 diferencias** (incluye las vistas `EF_*`). Total de la base: 4.009 filas = 301 sin autorización + 24 sin vínculo + 3.684 respuestas efectivas.

### Verificación contra el proyecto original
Se comparó el `surveyData.ts` del zip con el dataset armado desde MySQL: **105 de 107 preguntas tienen la misma base** y los promedios coinciden en todas. Diferencias: `sd_vinculo` (original 3.684, MySQL 3.708 porque incluye a quienes no tienen vínculo) y `pa_q4_open` (3.378 vs 3.442 respuestas).
Cifras del proyecto que **no coinciden o no se pueden reproducir** y por eso se reemplazaron o quitaron:
- «75 % con educación universitaria o posgrado» → la base da 67,1 %; «93 % interesado» → 80,6 %.
- Índices «confianza institucional 34,2 %», «cultura ciudadana», «probidad», «calificación alcalde 3,92»: su fórmula no está en la base (la calificación media real es 5,98 de 10).
- Fechas de aplicación, Google Forms, diseño muestral, «47 + 8 preguntas», «151 variables»: no están en la base; solo quedan como texto documental rotulado.
- Los textos del informe oficial (`reportExcerpts.ts`, Figuras/Tablas) se sustituyeron por análisis calculados desde la base.
- Las etiquetas de los extremos de cada escala se toman del enunciado (el original rotulaba «1 = Muy fácil» en preguntas donde 1 es «Muy difícil»).

## Conexión a la base de datos (MySQL 8.0, base `eficiencia`)

| Usuario | Contraseña | Permisos |
|---|---|---|
| `eficiencia` | `eficiencia` | usuario de la base `eficiencia` (lectura y escritura) |
| `root` | `eficiencia_root` | administrador |
| `web_publico` | `web_publico` | solo lectura sobre las vistas `v_pub_*` (lo usa el sitio público) |

Según desde dónde te conectes:
- **Desde tu equipo** (DBeaver, Workbench, etc.): host `localhost`, puerto `3307`.
- **Desde el contenedor `dbx`** (u otro contenedor fuera de este compose): host `host.docker.internal`, puerto `3307`.
- **Desde un contenedor de este compose**: host `eficiencia`, puerto `3306`.

Son credenciales de desarrollo; si publicas el servidor, cámbialas en `docker-compose.yml` y en `mysql/init/05_usuario_web.sql`.

## Datos dentro del proyecto
Los datos de MySQL viven en `mysql/data/` (~300 MB), así que copiar la carpeta completa del proyecto copia también la base. Para moverla:
1. `docker compose down` (detén los contenedores antes de copiar).
2. Copia toda la carpeta `database-eficiencia`.
3. En el nuevo equipo: `docker compose up -d`. Si `mysql/data` ya tiene datos, MySQL los usa y **no** vuelve a ejecutar los scripts de `mysql/init`.

Para empezar de cero: `docker compose down`, borra el contenido de `mysql/data/` y `docker compose up -d` (tarda unos minutos en recargar). Usa la misma versión de imagen (`mysql:8.0`) al copiar.

## Cómo fluye la información
```
Excel → tablas base (5) → vistas v_pub_* → servidor web (Express) → páginas
                        ↘ vistas v_g_*   → tablero interno (:8090)
                        ↘ vistas v_base_* / v_diccionario / v_respuestas_detalle → consulta directa (DBeaver / dbx)
```
El sitio público **nunca** lee las tablas base: solo las vistas `v_pub_*`, con el usuario `web_publico`. El servidor las consulta una sola vez al arrancar y guarda el resultado en memoria; si cambias datos en MySQL, reinicia el sitio con `docker compose restart web`.

## Tablas base: para qué sirve cada una

### `preguntas` — el catálogo del cuestionario (220 filas, una por cabecera del Excel)
Guarda el módulo, el número y el enunciado de cada pregunta, el sub-ítem de las matrices (`subitem_corto` es la etiqueta corta), el `tipo_respuesta` (`escala`, `si_no`, `categorica`, `multiple`, `abierta`) y cuántas personas la respondieron (`n_respuestas`). `id_pregunta` es la posición de la columna en el Excel (1 = A).
**En la web influye en:** los títulos de las preguntas y el nombre de cada ítem en el Explorador; el tipo de gráfica (una pregunta `escala` se grafica como Likert, una `multiple` como porcentaje sobre personas); las etiquetas de los extremos de cada escala (se leen del enunciado, p. ej. «1 = muy mala, 10 = Excelente»); las «columnas en la base» y el número de respondientes de cada módulo; y qué pregunta encuentra Tula cuando buscas un tema en el chat.

### `encuestados` — una fila por formulario recibido (4.009)
Solo tiene el identificador y cuántas preguntas respondió cada persona. Es la base para contar personas.
**En la web influye en:** el total de **4.009** de la portada y del Aula, y en los grupos de género/edad/ocupación (cada persona se asigna a un grupo a partir de sus respuestas).

### `respuestas` — todas las respuestas en formato largo (432.379 celdas con dato)
Una fila por persona y pregunta contestada. Guarda tres cosas: `respuesta_original` (el texto tal cual venía en el Excel), `respuesta_homologada` (el valor unificado para graficar) y `valor_numerico` (1–5, 1–10 o 5 niveles Likert; permite calcular promedios).
**En la web influye en:** casi todo lo que se grafica: las barras y matrices del Explorador, los promedios, los porcentajes de los filtros por género/edad/ocupación, la satisfacción por sector, la calificación del Alcalde por localidad, la tabla de confianza del Aula (parada 4), las cifras de apoyo del Aula (educación, interés, trámites) y las respuestas de Tula. Aquí también está el texto libre de las preguntas abiertas, que alimenta las nubes de palabras.

### `respuestas_opciones` — las opciones marcadas en preguntas de selección múltiple
Una fila por opción elegida (p. ej. cada canal por el que se informa una persona) y también por cada tema detectado en la pregunta abierta de participación (p076). Guarda la opción original y la homologada.
**En la web influye en:** los gráficos de selección múltiple (canales de información, obstáculos, sectores de trámites, causas de inseguridad…), la clasificación por temas de la pregunta 4 de Participación y el cruce de satisfacción por sector del trámite.

### `homologacion` — el diccionario de homologación (≈4.000 filas, 38 tipos)
Relaciona cada valor original con su valor homologado (`1. Nunca` → `1`, `Transmasculino` → `Otras identidades de género`…), con su valor numérico, su orden y cuántas veces apareció.
**En la web influye:** de forma indirecta. El sitio público no la consulta; los valores homologados ya están guardados en `respuestas`. Sirve para documentar y revisar cada decisión de homologación, y para ordenar las categorías en el tablero interno (`v_g_*`).

## Vistas: para qué sirve cada una

### Vistas del sitio público (`v_pub_*`, usadas por `/explora`, `/aprende` y la portada)
| Vista | Qué entrega | Dónde se ve en la página |
|---|---|---|
| `v_pub_resumen` | filas, no autorizaron, sin vínculo, efectivas, localidades, columnas | Portada («Respuestas recibidas 4.009», cobertura, columnas), Aula parada 3 y la respuesta de Tula sobre cuántas personas respondieron |
| `v_pub_preguntas` | catálogo de preguntas (copia de `preguntas`) | Lista de preguntas y módulos del Explorador, títulos, ítems de las matrices, búsqueda de Tula |
| `v_pub_demografia` | grupo de género, edad y ocupación de cada persona | Filtros del Explorador (Mujeres/Hombres, rangos de edad, Sector público/Otras ocupaciones) |
| `v_pub_distribucion` | conteo de personas por pregunta, categoría y grupo demográfico | Todas las gráficas del Explorador, el «Análisis de Tula», los «Destacados clave», las Fichas descargables, la tabla del Aula y las respuestas del chat |
| `v_pub_encuestados` | personas que respondieron cada pregunta, por grupo | Base de los porcentajes en preguntas de selección múltiple (no suman 100 %) |
| `v_pub_sector_satisfaccion` | satisfacción con el trámite por sector (Hacienda, Movilidad, Salud…) | Botón «Satisfacción por Sector» de la pregunta 8 de Relacionamiento e Integridad |
| `v_pub_temas_stats` | cuántas respuestas de texto libre quedaron con tema, sin tema o con varios | Nota metodológica y «Destacados» de la pregunta de temas de participación |
| `v_pub_abiertas` | texto libre de preguntas abiertas, sin identificador | Nubes de palabras (el texto no se publica, solo las palabras frecuentes agregadas) |
| `v_pub_localidad_alcalde` | promedio de calificación al Alcalde por localidad | Solo en el chat de Tula («¿qué localidad califica mejor al Alcalde?») |

### Vistas de consulta directa (para analistas, no las usa la web)
- `v_base_excel`: una fila por persona y una columna por pregunta (`p001`…`p220`) con el texto original, como en el Excel.
- `v_base_homologada`: igual, con los valores homologados.
- `v_diccionario`: qué es cada `pNNN` (columna del Excel, módulo, enunciado).
- `v_respuestas_detalle`: respuestas unidas a los datos de su pregunta.

### Vistas del tablero interno (`v_g_*`, 37 vistas, puerto 8090)
Resúmenes ya agregados para graficar (`categoria`, `serie`, `valor`, `porcentaje`/`n`, `orden`), por ejemplo género, edad, confianza por institución o servicios públicos. Solo las lee el tablero interno; el sitio público no las usa.

## Vistas `EF_*`: de dónde sale cada gráfica de `/explora`
Cada gráfica del explorador se pinta con filas que entrega una vista `EF_*`. El servidor (`web/server/dataset.mjs`) solo agrupa esas filas; **no calcula porcentajes, promedios ni conteos**, y el navegador los muestra tal cual.

| Lo que ves en `/explora` | Vista | Columnas principales |
|---|---|---|
| Barras de cada pregunta (opción única, selección múltiple, escalas 1-5 y 1-10) y el detalle de un ítem de matriz | `EF_GRAFICA_DISTRIBUCION` | `clave`, `item_orden`, `segmento_tipo`, `segmento`, `categoria`, `n`, `base`, `porcentaje`, `promedio` |
| Barras apiladas Positivo / Neutro / Negativo de las matrices, «Balance positivo» y «Desglose de escala» | `EF_GRAFICA_MATRIZ_COMPARATIVA` | `n_bajo/medio/alto`, `pct_bajo/medio/alto`, `promedio`, `escala_max` |
| Mecanismos de participación Sí / No | `EF_GRAFICA_BINARIA` | `n_si`, `n_no`, `pct_si`, `pct_no`, `total` |
| «Satisfacción por sector» (trámites) | `EF_GRAFICA_SATISFACCION_SECTOR` | `sector`, `n`, `satisfaccion`, `neutro`, `insatisfaccion`, `promedio`, `orden` |
| Nube de palabras de las preguntas abiertas | `EF_GRAFICA_NUBE_PALABRAS` | `clave`, `posicion`, `palabra`, `menciones` |
| Nota y destacados de la clasificación por temas | `EF_GRAFICA_TEMAS_RESUMEN` | `respondientes`, `con_tema`, `pct_sin_tema`, `pct_multitema` |
| Menú de módulos, preguntas e ítems (títulos, tipo de gráfica, extremos de la escala) | `EF_CATALOGO_MODULOS`, `EF_CATALOGO_PREGUNTAS`, `EF_ITEMS` | `nombre`, `pregunta`, `tipo`, `ancla_min/max`, `respuestas_validas` |

- **Segmentos:** cada fila existe para `todos` y para cada filtro de la página (`genero`: Femenino/Masculino/Otro; `edad`: 18-25 … 56+; `ocupacion`: Sector público/Otras ocupaciones). El porcentaje siempre es `n / base`, donde `base` son las personas que respondieron esa pregunta en el segmento.
- **Escalas:** en 1-5, bajo = 1-2, medio = 3, alto = 4-5; en 1-10, bajo = 1-4, medio = 5-6, alto = 7-10.
- **`clave`** es el identificador de la pregunta en el explorador (p. ej. `ci_q1`, `pa_q11_matrix`); `item_orden` numera los ítems de una matriz (1 en las preguntas simples).
- **Tablas de apoyo:** `EF_MODULO`, `EF_PREGUNTA` y `EF_PREGUNTA_ITEM` guardan qué columnas del Excel forman cada pregunta y los textos de cada módulo; `EF_CONTEO_SEGMENTO` y `EF_RESPONDIENTES_SEGMENTO` guardan los conteos por segmento; `EF_NUBE_PALABRAS_DATOS` guarda las palabras frecuentes.
- **Si cambian las respuestas:** `CALL EF_REFRESCAR_CONTEOS();` recalcula los conteos por segmento; la nube de palabras y los catálogos se regeneran con `python etl/generar_vistas_explora.py` (reescribe `mysql/init/06_vistas_explora.sql`) y luego `docker compose restart web`.

Consultarlas en SQL (por ejemplo, la barra de la calificación del Alcalde):
```sql
SELECT categoria, n, base, porcentaje FROM EF_GRAFICA_DISTRIBUCION
WHERE clave = 'ci_q1' AND segmento = 'todos' ORDER BY orden_categoria;
```
O por la API del sitio (devuelve lo mismo que la vista): `http://localhost:8080/api/explora/vista/EF_GRAFICA_DISTRIBUCION?clave=ci_q1&segmento=todos`. `GET /api/explora/vista` lista las vistas disponibles. No hizo falta una API aparte en Python: el servidor Node del sitio ya es la API y solo lee estas vistas.

Lo que sigue calculándose en el navegador son solo textos y presentación derivados de esos mismos números (frases del «Análisis de Tula», colores, orden de las barras). La auditoría (`etl/auditar_cifras.py`) comprueba que cada base, conteo y porcentaje de estas vistas coincide con un recálculo independiente desde las tablas base.

> La primera instalación desde cero tarda más (varios minutos) porque `06_vistas_explora.sql` crea tablas y vistas sobre una carpeta de Windows; las siguientes veces MySQL arranca con los datos ya guardados en `mysql/data/`.

## Qué se homologó (y qué no)
Desde la Fase 0 el criterio es **fidelidad al informe oficial**: las preguntas de perfil muestran las categorías originales (género 6, educación 6, ocupación 12, ingresos 6, municipios 11…). Solo se unifican redacciones equivalentes.
- Escalas: `1`, `1. Nunca`, `1. No confío en absoluto`, `4.` … → un solo valor 1–5 (más `valor_numerico`); Likert de acuerdo/seguridad/probabilidad/reacción → texto único + valor 1–5; «Si» = «Sí».
- Municipios: siete municipios de la sabana se agrupan en una fila, como la Tabla 4 del informe.
- Razón para no hacer control social (p106) y causas de inseguridad (p128): las opciones del cuestionario + «Otras respuestas abiertas» / «Otro», como las figuras 33 y 45.
- Selección múltiple: se separa en `respuestas_opciones`.
- **Filtro de ocupación:** «Servidores y contratistas distritales» (1.833) frente a «Ciudadanía» (resto), como el informe.
- **Preguntas condicionadas** (`EF_REGLA_BASE`): «¿denunció?» se calcula sobre las 218 víctimas, «vive en Bogotá» sobre las 3.684 respuestas efectivas y la pregunta de control 2024 sobre las 3.684 (1.324 = 35,9 %).
- **Valores no recalculables** (Tabla 8, análisis PLN, Tablas 10 y 11, Figuras 38 y 39): se guardan tal como los publica el informe en `EF_INFORME_PUBLICADO` y `/explora` los rotula «Valor publicado por la Veeduría; no recalculable desde la base de datos».
- Las sentencias `INSERT`/`UPDATE` de estos cambios están en `DESPLIEGUE_CAMBIOS_BD.md`.

## Varios años de encuesta (2025, 2026, …)
Cada año se hace la misma encuesta (mismas preguntas y columnas); solo cambian las respuestas.
- **Dónde se ve:** `/explora` tiene un selector de **año de la encuesta**; por defecto muestra el más reciente y el navegador recuerda la elección. `/aprende` y el chat de Tula usan el mismo año.
- **Cómo se sube un año:** con la sesión de administrador (login oculto, ver Fase 4 en `FASES.md`) aparece el botón **«⚙ Años y cargas de Excel»**: se elige el año, se adjunta el `.xlsx` y se pulsa *Cargar*. Hay una **plantilla** descargable con las cabeceras exactas. La carga valida que las 220 cabeceras coincidan con las preguntas; si no, la rechaza y dice cuáles difieren.
- **Qué pasa al cargar:** el servicio interno `cargador` (contenedor `eficiencia-cargador`, sin puerto publicado) guarda personas y respuestas con `encuestados.anio`, homologa igual que en 2025 (los valores ya conocidos usan exactamente la homologación existente; los nuevos pasan por las reglas de `cargador/reglas.py`), calcula las nubes de palabras y los conteos del año (`EF_REFRESCAR_CONTEOS_ANIO`) y muestra un reporte: filas, respuestas, textos nuevos y valores no reconocidos. Tarda de segundos a unos pocos minutos.
- **Reglas:** el año 2025 tiene informe oficial y está protegido (no se reemplaza ni se elimina). Un año sin informe puede **reemplazarse** (marcando la casilla) o **eliminarse**. Para los años sin informe, las preguntas que en 2025 muestran valores publicados por la Veeduría (Tablas 8, 10 y 11, Figuras 38 y 39) se calculan desde la base. Las ediciones manuales de valores (Fase 4) son por año.
- **Tablas nuevas:** `EF_ANIO` (años cargados), `EF_CARGA_LOG` (historial de cargas), `encuestados.anio`; los conteos (`EF_CONTEO_SEGMENTO`, `EF_RESPONDIENTES_SEGMENTO`, `EF_RESPUESTAS_PREGUNTA`), la nube de palabras y las ediciones llevan `anio`. Todas las vistas `EF_*` por gráfica y `v_pub_*` traen la columna `anio` (filtra con `?anio=2027` en `/api/explora/vista/<vista>`).
- **Usuarios de base de datos:** `web_carga` (solo lo necesario para cargar un año) además de `web_publico` y `web_admin`.
- **Despliegue:** definir `CARGA_TOKEN` (secreto entre web y cargador) en un `.env`; en una base ya instalada ejecutar `09_anios.sql` antes de `04`/`06` y `10_usuario_carga.sql` al final (ver `DESPLIEGUE_CAMBIOS_BD.md`).
- **Límite conocido:** el tablero interno `dashboard` (puerto 8090, vistas `v_g_*`) no distingue años: sumaría todos. El sitio público sí.
- **Verificar un año:** `python etl/auditar_cifras.py 2026` (compara el sitio con consultas independientes a la base, solo de ese año).

## Regenerar
`python etl/build_seed.py` vuelve a leer el Excel y reescribe `mysql/seed/*.csv` y `mysql/init/03_views.sql`; luego `docker compose down`, borra el contenido de `mysql/data/` y `docker compose up -d`.

## Limitaciones
- Excel recorta las cabeceras a 255 caracteres: algunos sub-ítems están cortados (`encabezado_truncado = 1`); en las columnas 211–214 el recorte ocurrió antes del sub-ítem y quedaron con etiquetas genéricas.
- Los nombres de módulo son una inferencia a partir del contenido de las preguntas.
- La clasificación de texto libre es por palabras clave, no manual: revisar `homologacion` (`TEMAS_PARTICIPACION`) antes de citar cifras.
