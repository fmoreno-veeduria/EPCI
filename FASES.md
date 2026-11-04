# Fases de ajuste al Informe EPCI 2025

Registro de lo que se hizo para que `/explora` y las vistas MySQL sean fieles al informe oficial (`Informe_AnalisisEncuestaConfianzaInstitucional_2025.pdf`), con sus resultados. El diagnóstico completo está en `HALLAZGOS_INFORME_vs_EXPLORA.md` y las sentencias `INSERT`/`UPDATE` para despliegue en `DESPLIEGUE_CAMBIOS_BD.md`.

Última actualización: 2026-11-03.

## Estado

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Decisiones sobre fidelidad, grupo de servidores y cifras no recalculables | ✔ aprobada |
| 1 | Datos y vistas en MySQL (tareas 1.1 a 1.7) | ✔ aplicada en la base y verificada |
| 2 | Cambios en el Explorador (5 niveles, figuras combinadas, nuevas gráficas, decimales y orden) | ◐ parcial: rótulos y polaridad ya se muestran; el resto pendiente |
| 3 | Verificación continua (regresión contra los valores del informe) | ◐ los scripts existen; falta fijar los valores esperados del informe |

Verificación vigente:
- `etl/auditar_cifras.py` (recalcula desde las tablas base de MySQL y compara con la API): **42.613 comprobaciones, 0 diferencias**.
- `etl/comparar_informe.py` (informe ↔ vistas): las 13 piezas con valores distintos que detectó la revisión inicial quedaron resueltas; las líneas que todavía imprime son números de ejes, de página o filas de totales del PDF.

---

## Fase 0 · Decisiones

| # | Decisión | Aplicación |
|---|---|---|
| 1 | **Fidelidad al informe sobre legibilidad.** Se muestran siempre las categorías del informe; solo se unifican redacciones equivalentes («Si» = «Sí»). | Tarea 1.1 y 1.2 |
| 2 | **Grupo de servidores:** «Servidores y contratistas del sector público distrital» (1.833) frente a «Ciudadanía» (resto). El sector público nacional pasa a la ciudadanía. | Tarea 1.3 |
| 3 | **Cifras no reproducibles** (Tabla 8, análisis PLN y las diferencias de base de las Tablas 10 y 11 y Figuras 38 y 39): se guardan tal como las publica el informe en `EF_INFORME_PUBLICADO`, con la nota «Valor publicado por la Veeduría; no recalculable desde la base de datos». | Tarea 1.6 |

---

## Fase 1 · Datos y vistas MySQL

### 1.1 Categorías del informe en las preguntas de perfil
**Qué se hizo.** `05b_ajustes_informe.sql` vuelve a poner en `respuesta_homologada` el texto original de las preguntas 3 (vive en Bogotá), 6 (edad), 7 (género), 8 (educación), 9 (ocupación), 10 (discapacidad), 11 (grupo étnico), 12 (ingresos), 13 (lugar de nacimiento), 14 (cultura política) y 123 (tema prioritario). Municipio (5) agrupa solo los siete municipios de la sabana, y la razón para no hacer control social (106) queda en las 7 opciones del cuestionario más «Otras respuestas abiertas». También se actualizaron `homologacion` y el orden de las categorías (el de las figuras del informe).

**Resultado.**

| Informe | Antes | Ahora (`/explora`) |
|---|---|---|
| Fig. 2 · género | 4 categorías | 6: 54,89 / 44,19 / 0,14 / 0,62 / 0,08 / 0,08 % |
| Fig. 3 · educación | 4 | 6: 52 / 461 / 698 / 906 / 1.566 / 1 personas |
| Fig. 4 · ocupación | 9 | 12 categorías (distrital 1.119 y 714; nacional 92 y 118; multilateral 34; rural 17…) |
| Fig. 5 · ingresos | 3 grupos | 6 rangos: 717 / 697 / 559 / 467 / 497 / 747 |
| Tabla 4 · municipios | 7 grupos | 11 filas (Soacha 57 … «otros de la sabana» 13), base 177 |
| Fig. 33 · razón para no hacer control social | 9 categorías reclasificadas | 7 opciones + otras abiertas (37,9 % «no tengo información», 26,1 % tiempo…) |

Diferencia residual: «Otras respuestas abiertas» da 5,89 % (175 personas) frente al 5,8 % del informe (3 personas de diferencia que no se pueden atribuir sin la regla de depuración).

### 1.2 Causas de inseguridad y canales de información
- **Causas de inseguridad (pregunta 128, Fig. 45):** las 6 causas del cuestionario más «Otro (respuestas ciudadanas abiertas)». Cuatro personas marcaron una causa y además escribieron texto libre; el informe también las cuenta en «Otro» (56 + 4 = 60), así que se añadieron esas 4 filas en `respuestas_opciones`.
  **Resultado:** 49,71 / 47,81 / 36,57 / 32,95 / 32,76 / 27,43 / **11,43 %**, igual que la Fig. 45.
- **Canales de información (pregunta 66, Fig. 21):** la base conserva «No sabe / no responde» (145) y «Partidos políticos» (91), pero el informe grafica 8 canales; se registraron como categorías ocultas (`EF_CATEGORIA_OCULTA`). **Resultado:** 8 canales en `/explora`.

### 1.3 Grupo de servidores distritales
**Qué se hizo.** `v_pub_demografia` define la ocupación como «Servidores distritales» (texto original con «sector público distrital») o «Ciudadanía»; las vistas y el procedimiento `EF_REFRESCAR_CONTEOS()` usan los nuevos nombres; el servidor y el filtro de `/explora` se actualizaron.

**Resultado.** 1.833 servidores y 1.851 ciudadanía (base de 3.684).
- Tabla 7: reproducida por completo (66,7 % servidores / 56,6 % ciudadanía en «espacios de diálogo»; 46,9 / 43,2 en control social; 26,3 / 28,1 en informarse…).
- Texto de la p. 42 sobre cumplimiento de normas legales: 24,7 % (servidores) y 14,1 % (ciudadanía); antes daba 24,4 % y 13,1 %.

### 1.4 Vistas y preguntas que faltaban
- `EF_GRAFICA_LOCALIDAD_ALCALDE` (Tabla 5): 21 filas, incluida **«Bogotá Región»** (6,78; 177 personas; 4,8 %). Los 21 valores coinciden con el informe.
- Nuevas preguntas en el módulo sociodemográfico de `/explora`: `sd_municipio` (Tabla 4) y `sd_control_2024`.
- La gráfica de la Tabla 5 en el explorador se hizo en la Fase 2.

### 1.5 Bases de las preguntas condicionadas
Se creó `EF_REGLA_BASE` y las vistas `v_pub_distribucion` y `v_pub_encuestados` la aplican.

| Pregunta | Regla | Resultado |
|---|---|---|
| «¿Denunció?» (131 → 132) | solo quienes fueron víctimas | base 218: **66,06 % sí / 33,94 % no** (Fig. 46; antes 65,75 / 34,25) |
| Control 2024 (2) | solo las 3.684 efectivas | **1.324 sí = 35,94 %** (informe: 1.324, 35,9 %) |
| ¿Vive en Bogotá? (3) | se excluyen los 24 sin vínculo | base 3.684 (95,2 % / 4,8 %) |

### 1.6 Valores publicados por el informe (`EF_INFORME_PUBLICADO`)
**Qué se hizo.** Tabla con 124 filas y vistas `EF_GRAFICA_INFORME_PUBLICADO`, `EF_GRAFICA_INFORME_ESCALA` y `EF_GRAFICA_SATISFACCION_SECTOR_INFORME`. El servidor las usa en lugar del cálculo propio en las cuatro preguntas afectadas, y `/explora` muestra el aviso «Valor publicado por la Veeduría; no recalculable desde la base de datos» y oculta los filtros demográficos (estos valores no los tienen).

| Pieza | Filas | Base publicada |
|---|---|---|
| Tabla 8 · temas de participación (15 sectores + no categorizados + NSNR) | 17 | N = 3.378 |
| Tabla 10 · sector del trámite | 17 | 1.966 |
| Figura 38 · satisfacción con el servicio (1 a 5) | 5 | 1.966 |
| Figura 39 · satisfacción por sector (insatisfechos / satisfechos) | 34 | n de la Tabla 10 |
| Tabla 11 · actitudes poco íntegras | 10 | 523 |
| Análisis PLN de 6 preguntas abiertas (seguridad, movilidad, empleo, bienestar, gestión pública, servicios públicos) | 41 | — |

**Resultado.** Cada una de esas gráficas muestra exactamente lo que imprime el informe. En el análisis PLN solo se registró lo que el texto del informe da explícitamente (algunas categorías traen solo el porcentaje). La auditoría comprueba que el dataset trae las 124 filas tal cual.

### 1.7 Rótulos, escalas y figuras
**Qué se hizo.** Tres tablas nuevas, leídas por las vistas `EF_ITEMS` y `EF_CATALOGO_PREGUNTAS`:
- `EF_ETIQUETA_ITEM` (126 filas, 20 matrices): redacción exacta del informe para cada ítem. Corrige, por ejemplo, «Beneficio particular» (la Tabla 9 dice «Obtener un beneficio para la comunidad…») y las «Condición 1 a 4» de la Fig. 67, cuyo orden se dedujo por coincidencia de valores.
- `EF_ESCALA` (40 filas): extremos de la escala, **polaridad** y rótulos de los 3 niveles de cada figura (p. ej. «No confía / Ni confía, ni desconfía / Confía» de la Fig. 14; «Alta exposición a corrupción (4 y 5) / Neutral / Baja exposición» de la Fig. 49). Marcan polaridad inversa `sg_q3` (Fig. 43: 1 = muy fácil, 5 = muy difícil), `gp_q4` (Fig. 63) y `mv_q4_matrix` (Fig. 49). Se añadieron los extremos que faltaban y que el informe sí da: `sg_q3` y `mv_q8`.
- `EF_FIGURA` (85 filas): figura o tabla del informe que representa cada pregunta y los **decimales** con que la imprime (detectados del PDF: 0 en la Fig. 3, 1 en las figuras 4–7, 23, 26 y 27 y en las tablas 7, 8 y 11, 2 en el resto).

**Resultado visible en `/explora`.**
- Fig. 49: «Alta exposición a corrupción (4 y 5): 60,0 %» para la Secretaría de Movilidad (antes decía «Positivo»), con los colores invertidos.
- Fig. 67: «Debería existir una entidad distrital que se especialice…: De acuerdo 69,4 / Indiferente 9,4 / En desacuerdo 21,2 %», con los rótulos de la figura.
- Matrices con los nombres completos del informe y rótulos de 3 niveles propios de cada figura.

**Lo que no se rotuló, y por qué.** Las preguntas `mv_q1`, `mv_q6`, `mv_q7`, `de_q1`, `de_q3`, `de_q4`, `bie_q4` y `bie_q6` no tienen extremos en el encabezado del Excel (cortado a 255 caracteres) ni en el informe, que solo imprime los números 1 a 5. Se dejan así, como las figuras 47, 53–55; no se infirieron de preguntas vecinas.

---

## Fase 2 · Explorador (completada)
Con los datos en MySQL, el navegador ahora los usa tal como el informe los presenta:

| Tarea | Estado |
|---|---|
| Rótulos de ítems y de 3 niveles, extremos y polaridad desde las tablas `EF_*` | ✔ hecho |
| **Decimales** de `EF_FIGURA` (coma decimal) y **orden de las barras** de `orden_categoria` (si todas las categorías lo tienen; si no, por magnitud) | ✔ hecho |
| Vista de **5 niveles apilados** (`EF_FIGURA.niveles = 5`) para `cr_q1_matrix`, `cr_q3_matrix` y `ci_q10_matrix`; botón «Tres niveles» como alternativa | ✔ hecho |
| Gráfica de la **Tabla 5** (Alcalde por localidad), seudopregunta `ci_alcalde_localidad` | ✔ hecho |
| **Figuras combinadas**: 6, 46, 56, 58, 59, 64 y Tabla 12 (`EF_FIGURA_ESPECIAL_DATOS`, `EF_FIGURA_SERIE_DATOS`, `EF_FIGURA_FILA_DATOS`) | ✔ hecho |

**Cómo se hizo.** Nuevas tablas de configuración y vistas `EF_CATALOGO_FIGURAS`, `EF_CATALOGO_FIGURAS_SERIES`, `EF_CATALOGO_FIGURAS_FILAS`; `dataset.mjs` solo reagrupa filas de las vistas existentes (sin calcular porcentajes); el componente nuevo `web/src/components/FigurasInforme.tsx` pinta los tres tipos. Las figuras especiales no tienen filtros de género/edad/ocupación ni ficha, porque el informe no los publica.

**Verificación.** Script 06 aplicado a la base viva (18 vistas EF, 8 figuras especiales); `etl/auditar_cifras.py`: 42.613 comprobaciones, 0 diferencias; `etl/comparar_informe.py`: Figuras 6, 46, 56, 58, 59, 64 y Tabla 12 sin diferencias (Tabla 5 solo muestra un conteo total que el informe imprime distinto). Comprobado en el navegador: Tabla 5, Figura 58 y matriz de 5 niveles. `DESPLIEGUE_CAMBIOS_BD.md` regenerado con los nuevos `INSERT`.

## Fase 3 · Verificación continua (completada)
1. **Prueba de regresión** `etl/prueba_regresion.py` con los valores esperados del informe en `etl/esperados_informe.json` (género, servidores, Fig. 46, control 2024, Fig. 45 «Otro», Tabla 4, Tabla 5, grupos de ocupación, totales de la encuesta, figuras especiales y matrices de 5 niveles). Falla con código 1 si algo cambia.
2. Incluye `etl/comparar_informe.py` como guarda: falla si aparece una figura con diferencias que no esté en `diferencias_conocidas` (hoy 15, todas ruido de ejes/páginas/totales ya revisado). Si una se resuelve, el script avisa para retirarla de la lista.
3. **Antes de cada publicación** (con el sitio en marcha):
```bash
python etl/auditar_cifras.py      # base ↔ vistas ↔ API (42.613 comprobaciones)
python etl/prueba_regresion.py    # informe ↔ vistas (54 comprobaciones)
```
Resultado actual: 0 diferencias y 54/54 correctas. Se comprobó que la prueba detecta un valor alterado (falla con el mensaje esperado).

Queda como mejora futura la tabla explícita figura → pregunta → ítem para reemplazar la coincidencia por conjuntos de valores de `comparar_informe.py`.

## Fase 4 · Edición de valores por administración (completada)
Cada gráfica de `/explora` tiene un botón «✎ Editar valores» que **solo aparece con sesión de administrador**.

- **Login oculto:** `/acceso-veeduria-k7q2x9` (cambiable con `ADMIN_RUTA` en `docker-compose.yml`). No está enlazado en el sitio, no está en robots/sitemap y la página lleva `noindex`. Usuario `admin`; la clave se guarda como hash scrypt en `EF_ADMIN_USUARIO`, nunca en texto plano. Sesión con cookie `HttpOnly` + `SameSite=Strict` de 8 horas; máximo 6 intentos de login cada 5 minutos por IP.
- **Dónde queda lo editado:** `EF_VALOR_EDITADO` (valores vigentes, expuestos por la vista `EF_GRAFICA_VALORES_EDITADOS`) y `EF_VALOR_EDITADO_LOG` (historial: quién, cuándo, valor anterior y nuevo, motivo). Los valores originales no se tocan; «Restaurar valores originales» borra la edición.
- **Qué se edita:** el conteo `n` de cada categoría y la base; el porcentaje lo calcula el servidor (n ÷ base). La Tabla 5 permite editar `n` y promedio por localidad. Las figuras combinadas se editan eligiendo la pregunta que las compone. Solo se aceptan categorías que ya existen en la gráfica. Las nubes de palabras no son editables.
- **Efecto público:** el dataset superpone lo editado (y rehace distribución, comparativa y promedio); la gráfica muestra un aviso «Valores ajustados por la administración» y, como los cortes por género/edad/ocupación dejan de ser coherentes, se ocultan. Caché pública de 30 s.
- **Seguridad de base de datos:** usuario nuevo `web_admin` con permisos solo sobre estas tablas; `web_publico` sigue en solo lectura.
- **Verificación:** login incorrecto rechazado, escritura sin sesión rechazada (401), edición desde la interfaz guardada en MySQL y restaurada; `auditar_cifras.py` 0 diferencias y `prueba_regresion.py` 54/54 tras restaurar. Aviso: si se deja un valor editado, la prueba de regresión y `comparar_informe.py` lo detectarán como diferencia frente al informe (es lo esperado).

## Fase 5 · Varios años de encuesta (completada)
Cada año se repite la encuesta con las mismas preguntas; el administrador sube el Excel del año y el público lo filtra en `/explora`.

- **Modelo:** `encuestados.anio` (todo lo existente quedó como **2025**), tabla `EF_ANIO` (años cargados; `usa_informe = 1` para 2025), `EF_CARGA_LOG`. Conteos, nube de palabras y ediciones manuales llevan `anio`; todas las vistas `EF_*` y `v_pub_*` exponen la columna. Procedimiento `EF_REFRESCAR_CONTEOS_ANIO(anio)` (y `EF_REFRESCAR_CONTEOS()` para todos los años). Scripts: `09_anios.sql` (migración de bases ya instaladas), `10_usuario_carga.sql`.
- **Carga:** servicio nuevo `cargador/` (Flask + openpyxl). Valida las 220 cabeceras contra las preguntas, homologa (valores conocidos = misma homologación que 2025; nuevos = reglas extraídas de `build_seed.py` en `cargador/reglas.py`), inserta en una transacción, calcula nubes y conteos y entrega un reporte. Descarga de plantilla, reemplazo y eliminación de años sin informe.
- **Interfaz:** selector de año en `/explora` (se recuerda en el navegador; el predeterminado es el más reciente) y, solo para administradores, «⚙ Años y cargas de Excel» (subir, reemplazar, eliminar, historial).
- **Fidelidad al informe:** el año con informe (2025) sigue mostrando los valores publicados; los años sin informe calculan esas figuras desde la base.
- **Verificación:**
  - El dataset de 2025 después del cambio es idéntico al de antes (se comparó el JSON completo; solo difiere el orden de empates).
  - Se cargó un Excel de prueba de 400 filas como «2027» (generado desde datos de 2025, con un municipio y un valor de escala anómalo): 22 s, 45.524 respuestas, valor anómalo reportado, año 2025 protegido, reemplazo y eliminación probados.
  - `auditar_cifras.py` ahora audita por año: 2025 → 42.613 comprobaciones sin diferencias; 2027 de prueba → 36.915 sin diferencias.
  - `prueba_regresion.py` 54/54 sobre 2025. El año de prueba se eliminó: la base quedó solo con 2025.
- **Ajuste de precisión:** los promedios (`ROUND(AVG())` en MySQL redondea dos veces) ahora se calculan con más decimales internos; ninguna cifra de 2025 cambió.
- **Límite conocido:** el tablero interno (`dashboard`, vistas `v_g_*`) no filtra por año.

## Pendiente con la Veeduría
La regla de depuración que explica las diferencias entre la base anonimizada y el informe: 20 filas de trámite (1.986 frente a 1.966), 9 de actitudes poco íntegras (532 frente a 523), 3 en la Fig. 33 y la clasificación de las respuestas «Otro» a sectores (Tablas 10 y Fig. 39). Mientras no se tenga, `/explora` muestra los valores publicados por el informe.

---

## Archivos creados o modificados

| Archivo | Cambio |
|---|---|
| `mysql/init/04_vistas_publicas.sql` | `EF_REGLA_BASE` y sus 3 reglas; vistas `v_pub_*` con las reglas y el grupo de servidores |
| `mysql/init/05b_ajustes_informe.sql` | **nuevo**: `UPDATE` de re-homologación, orden y causas de inseguridad; `INSERT` de las 4 personas con texto libre |
| `mysql/init/06_vistas_explora.sql` | regenerado: tablas `EF_CATEGORIA_OCULTA`, `EF_INFORME_PUBLICADO`, `EF_ETIQUETA_ITEM`, `EF_ESCALA`, `EF_FIGURA`; vistas nuevas; procedimiento con los nuevos grupos |
| `etl/generar_vistas_explora.py` | genera el script 06 con todo lo anterior |
| `etl/registro_explora.json` | + `sd_municipio` y `sd_control_2024` |
| `etl/auditar_cifras.py`, `etl/comparar_informe.py` | adaptados a los nuevos grupos, reglas y valores publicados |
| `web/server/dataset.mjs` | lee los valores publicados, rótulos, polaridad, figura y decimales |
| `web/src/components/FigurasInforme.tsx` | **nuevo** (Fase 2): 5 niveles apilados, ranking Tabla 5 y figuras combinadas |
| `web/src/components/SurveyExplorer.tsx`, `AulaStepView.tsx`, `src/types.ts` | filtro de servidores, aviso de valor publicado, categorías PLN, rótulos y colores por polaridad |
| `etl/prueba_regresion.py`, `etl/esperados_informe.json` | **nuevos** (Fase 3): prueba de regresión contra el informe |
| `cargador/` (Dockerfile, app.py, reglas.py) | **nuevo** (Fase 5): carga de Excel por año |
| `mysql/init/09_anios.sql`, `10_usuario_carga.sql`; cambios en `01`, `04`, `08`, `06` | **Fase 5**: columna `anio`, `EF_ANIO`, `EF_CARGA_LOG`, usuario `web_carga` |
| `web/src/components/GestionAnios.tsx`, `surveyData.ts`, `web/server/{admin,dataset,server}.mjs` | **Fase 5**: selector de año, carga y API por año |
| `DESPLIEGUE_CAMBIOS_BD.md` | **nuevo**: sentencias `INSERT`/`UPDATE` para el despliegue |
| `HALLAZGOS_INFORME_vs_EXPLORA.md` | diagnóstico completo con el estado de cada hallazgo |

## Cómo repetir la verificación
```bash
docker compose up -d
python etl/auditar_cifras.py      # base ↔ vistas ↔ API  → 0 diferencias
python etl/comparar_informe.py    # informe ↔ vistas
```
Base ya instalada: ejecutar en este orden `04_vistas_publicas.sql`, `05b_ajustes_informe.sql` y `06_vistas_explora.sql` (detalle en `DESPLIEGUE_CAMBIOS_BD.md`) y `docker compose restart web`.

**Nota.** Como el Excel ya no está en la carpeta, `etl/build_seed.py` no refleja la homologación nueva; si se vuelve a ejecutar con el Excel, hay que aplicar después `05b_ajustes_informe.sql`.
