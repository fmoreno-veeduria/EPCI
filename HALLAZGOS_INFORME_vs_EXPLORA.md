# Hallazgos: Informe oficial EPCI 2025 vs. vistas MySQL y `/explora`

Fecha de revisión: 2026-11-03 · Fuente de verdad: `Informe_AnalisisEncuestaConfianzaInstitucional_2025.pdf` (133 páginas, 67 figuras y 12 tablas).

## Estado de avance (2026-11-03)

**Fase 0 · decisiones: aprobadas** (las tres recomendaciones). **Fase 1 · datos y vistas MySQL: aplicada** en 1.1 a 1.6; queda pendiente la 1.7.

| Hallazgo | Estado | Resultado |
|---|---|---|
| H-01 categorías agrupadas | ✔ corregido | Figs. 2, 3, 4, 5, 33, 45 y Tabla 4 con las categorías y cifras del informe (p. ej. género 54,89 / 44,19 / 0,14 / 0,62 / 0,08 / 0,08; causas de inseguridad con «Otro» = 60 = 11,43 %) |
| H-02 grupo de servidores | ✔ corregido | 1.833 servidores distritales / 1.851 ciudadanía; Tabla 7 reproducida (66,7 / 56,6…) |
| H-03 Tabla 5 | ◐ datos listos | vista `EF_GRAFICA_LOCALIDAD_ALCALDE` con «Bogotá Región»; falta la gráfica (Fase 2) |
| H-04 Tabla 4 | ✔ corregido | pregunta `sd_municipio` en `/explora` con las 11 filas |
| H-05 / H-06 diferencias de base | ✔ resuelto con valores publicados | `EF_INFORME_PUBLICADO`; pendiente solicitar a la Veeduría la regla de depuración (20 filas de trámite, 9 de actitudes, clasificación de «Otro») |
| H-07 Tabla 8 y PLN | ✔ resuelto con valores publicados | Tabla 8 y las categorías PLN, rotuladas como no recalculables |
| H-08 control 2024 y base 3.684 | ✔ corregido | 1.324 = 35,94 %; `EF_REGLA_BASE` |
| Fig. 46 base de víctimas | ✔ corregido | 66,06 % / 33,94 % (base 218) |
| H-09 rótulos de ítems | ✔ corregido | `EF_ETIQUETA_ITEM`: 20 matrices con la redacción del informe |
| H-10 extremos de escala | ◐ parcial | se añadieron `sg_q3` y `mv_q8`; 8 preguntas quedan sin extremos porque ni el Excel ni el informe los traen |
| H-11 escalas invertidas | ✔ corregido | polaridad inversa en `sg_q3`, `gp_q4` y `mv_q4_matrix` |
| H-12 rótulos de 3 niveles | ✔ corregido | `EF_ESCALA`; visibles en las matrices de `/explora` |
| H-13 5 niveles, H-14 figuras combinadas, H-15 decimales y orden | ⏳ pendiente | datos ya en MySQL (`EF_FIGURA`, `orden_categoria`); falta el Explorador (Fase 2) |

Ver el detalle en `FASES.md`.

Verificación: `etl/auditar_cifras.py` → 42.613 comprobaciones, 0 diferencias; `etl/comparar_informe.py` → las 13 piezas con valores distintos quedaron resueltas (las que aún aparecen son números de ejes, de página o filas de totales).
Sentencias de despliegue: `DESPLIEGUE_CAMBIOS_BD.md`.

## 1. Cómo se hizo la revisión

1. Se extrajo el texto de cada figura y tabla del PDF (las gráficas son vectoriales, así que sus etiquetas numéricas salen como texto). La figura 39 se verificó además a simple vista.
2. Cada figura/tabla se asoció a la pregunta de `/explora` que la representa (`etl/comparar_informe.py`, diccionario `MAPA`).
3. Los porcentajes y conteos que imprime el informe se buscaron entre los valores que entregan las vistas `EF_*` (la misma fuente de las gráficas de `/explora`). Se descartaron las marcas de los ejes.
4. Lo que no coincidió se revisó a mano contra las tablas base de MySQL (`respuestas`, `respuestas_opciones`) y contra el texto narrativo del informe.
5. Se revisaron en el navegador las páginas de `/explora` con mayor riesgo (matrices, escalas invertidas, género).

El script se puede repetir: `python etl/comparar_informe.py` (requiere el sitio en marcha en `:8080`).

**Límites de esta revisión.** «Los valores coinciden» significa que cada cifra del informe aparece entre las que publica la base para esa pregunta; el emparejamiento ítem por ítem de las matrices se confirmó con el texto narrativo en la figura 18 y por coincidencia de valores en el resto. Las figuras 1–67 se compararon a nivel de datos; la comparación visual (colores, orden exacto de barras) solo se hizo en los casos citados.

## 2. Resumen

De las 79 piezas del informe (67 figuras + 12 tablas):

| Resultado | Cantidad | Piezas |
|---|---|---|
| Valores **y** gráfica de Explora equivalentes al informe | **36** | Tablas 1 y 3; figuras 7–13, 15, 17, 19, 20, 22, 24–27, 29–32, 35–37, 41, 42, 44, 47, 48, 50–55 y las demás marcadas ✔ en la sección 5 |
| Valores coinciden, pero la **presentación difiere** del informe | **27** | etiquetas, 3 vs 5 niveles, escalas invertidas, figuras combinadas (H-09 a H-15) |
| Valores coinciden, pero **falta la gráfica** en `/explora` | **1** | Tabla 5 (Alcalde por localidad con «Bogotá Región») |
| Valores **no coinciden** con lo que muestra Explora | **13** | Figuras 2, 3, 4, 5, 33, 38, 39, 45, 46 · Tablas 4, 7, 10, 11 |
| **No se puede** reproducir desde MySQL | **1** | Tabla 8 (y los análisis PLN de preguntas abiertas, que el informe da en texto) |
| Solo documental (no es dato de la base) | **1** | Tabla 2 (ficha técnica) |

El script automático reportó 56 piezas sin diferencias; el resto se resolvió a mano (ruido de ejes en algunas figuras y piezas que el script no mapea: tablas 1, 3 y 5).

Total de la base confirmado: 4.009 filas = 301 sin autorización + 24 sin vínculo + 3.684 efectivas (tabla 1 ✔). Calificación media del Alcalde 5,98 ✔ y 52,1 % / 17,0 % / 30,8 % ✔.

## 3. Hallazgos que cambian cifras o categorías (prioridad alta)

### H-01 · La homologación agrupó categorías que el informe muestra por separado
El informe grafica las categorías originales; la base y `/explora` publican versiones agrupadas. Las cifras sumadas coinciden, pero las barras no.

| Informe | Lo que muestra el informe | Lo que muestra `/explora` |
|---|---|---|
| Fig. 2 · género | 6 categorías: Femenino 54,89 %, Masculino 44,19 %, No binario 0,14 %, Prefiero no responder 0,62 %, Transfemenino 0,08 %, Transmasculino 0,08 % | 4: «Otras identidades de género» (11) junta no binario y trans; falta 0,14 % y 0,08 % |
| Fig. 3 · educación | 6: primaria 52, secundaria 461, técnica 698, universitaria 906, postgrado 1.566, sin educación formal 1 | 4: «Secundaria o menos» = 514 (suma primaria + secundaria + sin educación formal) |
| Fig. 4 · ocupación | 12 categorías (distrital/nacional separados: 1.119 / 92 empleados y 714 / 118 contratistas; multilateral 34; rural 17…) | 9: «Empleado sector público» = 1.211, «Independiente/contratista sector público» = 832, «Otra ocupación» = 51 |
| Fig. 5 · ingresos | 6 rangos (717, 697, 559, 467, 497, 747) | 3 grupos (1.414 / 1.026 / 1.244) |
| Tabla 4 · municipios | 11 filas (Funza 9, La Calera 9, Facatativá 6, Zipaquirá 5, «Otros municipios de la sabana» 13…) | 7 grupos: Funza, La Calera, Facatativá y Zipaquirá desaparecen dentro de «Otros municipios de Cundinamarca» |
| Fig. 33 · razón para no hacer control social | 7 opciones + «Otras respuestas abiertas»: 37,9 % no tengo información, 26,1 % tiempo, 8,9 % seguridad, 7,9 % no sirve… | 9 categorías reclasificadas: «Falta de información» 1.132 (38,1 %) incluye texto libre; el 37,9 % original son 1.125 |
| Fig. 45 · causas de inseguridad | 6 causas + «Otro (respuestas ciudadanas abiertas)» 60 = 11,43 % | 11 categorías: «Otra causa» 30, «Justicia y sanciones débiles» 12, «Corrupción» 7… (reclasificación mía por palabras clave) |
| Fig. 21 · canales de información | 8 canales | 10: se agregan «No sabe / no responde» (145) y «Partidos políticos» (91) |
| Fig. 40 · módulo temático | «Deseo finalizar el formulario» | «Sin respuesta (finalizó el formulario)» |

**Causa:** la homologación pensada para «graficar legible» se aplicó también donde el informe pide fidelidad. `respuestas.respuesta_original` conserva el texto exacto, así que se puede corregir sin el Excel.

### H-02 · El filtro «Sector público» no es el grupo «servidores» del informe
El informe compara «servidores y contratistas del Distrito» contra el resto: **1.833** personas (49,8 %: 1.119 empleados + 714 contratistas **distritales**). `/explora` usa «Sector público» = distrital + nacional = **2.043**.

Comprobado con MySQL (base de 3.444 de la tabla 7):

| Concepto (tabla 7) | Informe: ciudadanía / servidores | Con definición distrital (MySQL) | Con «Sector público» (Explora hoy) |
|---|---|---|---|
| Involucrarse en espacios de diálogo | 56,6 / 66,7 | **56,6 / 66,7** ✔ | 56,2 / 66,0 ✘ |
| Control social | 43,2 / 46,9 | **43,2 / 46,9** ✔ | 43,1 / 46,6 ✘ |
| Informarse sobre decisiones | 28,1 / 26,3 | **28,1 / 26,3** ✔ | 28,9 / 25,9 ✘ |
| Cumplimiento de normas legales (texto p. 42) | 14,1 / 24,7 | — | 13,1 / 24,4 ✘ |

Los cortes por edad sí coinciden con el informe (56+ = 15,6 %, 26–35 = 23,6 %).

### H-03 · Tabla 5 (calificación del Alcalde por localidad) no existe en `/explora`
Los 21 valores del informe, incluido **«Bogotá Región» (6,78; 4,8 %)**, **coinciden con MySQL** (se verificaron las 21 filas). Pero:
- `v_pub_localidad_alcalde` omite «Bogotá Región» (las 177 personas que no viven en Bogotá) y la columna «Porcentaje»;
- no hay vista `EF_*` ni gráfica en `/explora`; hoy solo la usa el chat de Tula.

### H-04 · Tabla 4 (municipios) no está en `/explora`
La columna 5 del Excel (municipio) no está registrada en `EF_PREGUNTA`. Además, la homologación pierde el detalle (H-01).

### H-05 · La base del trámite no coincide: 1.986 en MySQL vs. 1.966 en el informe
Afecta a todo lo que depende de «¿requirió un trámite?»:

| Informe | Informe | MySQL |
|---|---|---|
| Fig. 38 · satisfacción 1…5 | 421 / 242 / 404 / 482 / 417 (suma 1.966; 21,41 / 12,31 / 20,55 / 24,52 / 21,21 %) | 432 / 247 / 404 / 484 / 419 (suma 1.986) |
| Tabla 11 · personas que percibieron actitudes | 523 | 532 |
| Tabla 11 · desinformación / falta de transparencia / inacción | 193 / 189 / 135 | 196 / 192 / 139 |
| Fig. 46 · «¿denunció?» | 66,06 % sí / 33,94 % no (sobre **218** víctimas) | 144 sí + 75 no = 219 → 65,75 % / 34,25 % |

Hay 20 filas de trámite (y 9 de actitudes, y 1 de denuncia) que el informe excluyó y la base anonimizada conserva. No se puede saber cuáles sin la regla de depuración. En el caso de la denuncia, la causa es clara: una persona respondió «¿denunció?» sin haber declarado ser víctima; la pregunta condicionada debe limitarse a las víctimas (218).

### H-06 · Clasificación de sectores del trámite (tabla 10 y fig. 39)
El informe asigna a un sector también las respuestas de texto libre («Otro»); `respuestas_opciones` solo reconoce los sectores marcados. Diferencias por sector (informe vs. MySQL): Gobierno 100 / 90, Seguridad 87 / 77, Integración Social 86 / 78, Hábitat 72 / 64, Movilidad 376 / 369, Planeación 108 / 103, Comisarías 39 / 33, Mujer 31 / 26, Ambiente 57 / 52, Hacienda 457 / 453 (Educación 93 / 94). Total de menciones 2.015 vs. 1.998.

Efecto en la figura 39 (insatisfechos / satisfechos):

| Sector | Informe | `/explora` |
|---|---|---|
| Gobierno | 61,00 / 21,00 | 57,8 / 25,6 |
| Ambiente | 50,88 / 22,81 | 50,0 / 23,1 |
| Comisarías de Familia | 43,59 / 33,33 | 36,4 / 36,4 |
| Seguridad | 47,13 / 34,48 | 44,2 / 35,1 |
| Hábitat | 37,50 / 38,89 | 31,3 / 42,2 |
| Mujer | 41,94 / 41,94 | 30,8 / 50,0 |
| Integración Social | 29,07 / 43,02 | 24,4 / 44,9 |
| Hacienda | 18,82 / 61,27 | 18,3 / 61,6 |
| (resto) | — | diferencias de 0,1 a 2 puntos |

«Otro» (58 menciones) aparece en `/explora` y no existe en el informe.

### H-07 · Tabla 8 y análisis PLN: no reproducibles desde MySQL
- **Tabla 8:** el informe clasifica con IA el texto libre de la pregunta de temas en 15 sectores distritales (Seguridad 820, Hábitat 370, Educación 264…) sobre N = 3.378. `/explora` ofrece 12 temas por palabras clave sobre 3.442 respuestas (Medio ambiente 906, Seguridad 899…). Son clasificaciones distintas: ningún valor coincide.
- **Análisis PLN de preguntas abiertas** (seguridad: «Control del delito y acción policial» 197 menciones, 42,7 %; movilidad 89 / 46,4 %; empleo 51 / 45,9 %; bienestar 27 / 21,6 %; gestión pública 22 / 22,4 %; servicios públicos 33 / 42,9 %): están en el texto del informe, no en la base. `/explora` solo muestra una nube de palabras.

Con los datos de MySQL **no se pueden obtener estas cifras**; solo se podrían mostrar como «valor publicado en el informe» (ver plan).

### H-08 · Pregunta de control 2024 (35,9 %) y bases del módulo sociodemográfico
- El informe indica que 1.324 personas (35,9 %) respondieron la encuesta de 2024. MySQL lo confirma (1.324 entre las 3.684), pero esa pregunta no está en `/explora`.
- La pregunta «¿vive en Bogotá?» (`sd_vinculo`) muestra 3.708 personas y una categoría «Sin vínculo con Bogotá» (24); el informe usa la base de 3.684 (95,2 % vive en Bogotá, 4,8 % tiene relación laboral/estudiantil/tributaria).

## 4. Hallazgos de etiquetas y escalas (valores correctos, rótulos infieles)

### H-09 · Rótulos de ítems de matrices escritos por mí a partir de cabeceras truncadas
Las cabeceras del Excel están cortadas a 255 caracteres y varias etiquetas cortas (`subitem_corto`) las redacté yo. Con los valores del informe se pudo comprobar cuáles están mal o son imprecisas:

| Matriz | Etiqueta actual | Etiqueta del informe |
|---|---|---|
| Tabla 9 | «Beneficio particular» ✘ | «Obtener un beneficio para la comunidad o una solución a un problema colectivo» |
| Fig. 67 (`id_pregunta` 211–214) | «Condición 1…4 (encabezado truncado)» | Según los valores: 211 «Los servicios públicos funcionan mejor que el año anterior»; 212 «Todas las zonas de Bogotá tienen un acceso equitativo»; 213 «Debería existir una entidad distrital que se especialice en evaluar la calidad»; 214 «Es necesario acudir a otra entidad diferente a la empresa» |
| Fig. 66 | «Confianza en la empresa» / «Atención de solicitudes» | «Confianza en que la empresa resuelva rápida y oportunamente» / «…en que atiendan sus reclamos satisfactoriamente» |
| Fig. 18 y resto | etiquetas abreviadas («Normas sociales», «Disposición de residuos») | redacción completa del informe («Respeto por las normas sociales de convivencia», «Disposición de residuos sólidos en las zonas indicadas»…) |

### H-10 · Escalas sin extremos rotulados
`ancla_min/ancla_max` se leen del enunciado y solo se obtienen cuando dice «1 significa "X" y 5 significa "Y"». Faltan en preguntas de escala como `sg_q3` (denunciar), `mv_q1`, `mv_q6`–`mv_q8`, `de_q1`, `de_q3`, `de_q4`, `bie_q4`, `bie_q6`, `gp_q*`… El informe rotula siempre los extremos (p. ej. «1- No confío en absoluto … 5- Confío plenamente»).

### H-11 · Escalas donde un valor alto es lo negativo
- **Fig. 43** (denunciar un delito): 1 = muy fácil, 5 = muy difícil. `/explora` lo trata como «positivo = 4 y 5».
- **Fig. 49** (exposición a corrupción): el informe dice «Alta exposición (4 y 5) / Neutral / Baja exposición»; `/explora` dice «Positivo (4 y 5)» (verificado en pantalla: «Sec. de Movilidad 60,0 % Positivo»).
- **Fig. 63** (corrupción generalizada): el informe usa «Corrupción generalizada / Neutro / Poco-Nada».

### H-12 · Las barras de 3 niveles usan siempre «Positivo / Neutro / Negativo»
Cada figura del informe tiene sus propios rótulos y orden: Fig. 14 «Confía / Ni confía, ni desconfía / No confía»; Fig. 23 «No asiste (1+2) / A veces (3) / Asiste (4+5)»; Fig. 28 y 34 «De acuerdo / Neutro / En desacuerdo»; Fig. 57 «Satisfechos / Neutros / Insatisfechos»; Fig. 64 «En desacuerdo / Indiferente / De acuerdo»; Fig. 65–67 «Baja / Indiferente / Alta», etc.

### H-13 · Figuras de 5 niveles apiladas (fig. 16, fig. 18, tabla 6)
El informe muestra los 5 niveles (1. Nunca … 5. Siempre) de **todos** los ítems en una sola barra apilada. `/explora` muestra por defecto 3 niveles y deja los 5 niveles solo en el detalle de cada ítem. Los valores de los 5 niveles son correctos (se emparejaron a mano los 13 ítems de la fig. 18).

### H-14 · Figuras que el informe combina y `/explora` separa
Fig. 6 (nacimiento + cultura política), fig. 46 (denuncia + reacción), fig. 56 (emprender, empleo y costo de vida), fig. 58 (salud y educación), fig. 59 (subsidios), fig. 64 (servidores y entidades), tabla 12 (4 empresas × 5 aspectos). Los datos existen; falta la gráfica combinada.

### H-15 · Decimales y formato
El informe usa 2 decimales en la mayoría de las figuras (1 en las figuras 21, 22, 26, 27, 30, 32, 33 y la tabla 7). `/explora` muestra 1 decimal en todas. Además, etiquetas de categorías homologadas distintas del informe: «36 a 45 años» vs. «Entre 36 años y 45 años»; «Bogotá» vs. «Nací en Bogotá».

## 5. Resultado figura por figura

Leyenda: ✔ coincide · ≈ valores coinciden, presentación distinta (ver H-xx) · ✘ no coincide · ∅ no existe en Explora · ⚠ no reproducible.

| Informe | Contenido | Valores en MySQL/EF | Gráfica en Explora | Hallazgo |
|---|---|---|---|---|
| Tabla 1 | Registros y depuración | ✔ | ✔ portada | — |
| Tabla 2 | Ficha técnica | ⚠ no es dato de la base | — | documental |
| Tabla 3 | Encuestados por localidad (20) | ✔ | ✔ (`sd_localidad`) | H-15 |
| Tabla 4 | Municipios | ✘ | ∅ | H-01, H-04 |
| Fig. 1 | Grupo etario | ✔ | ≈ | H-15 |
| Fig. 2 | Género | ✘ | ✘ | H-01 |
| Fig. 3 | Nivel educativo | ✘ | ✘ | H-01 |
| Fig. 4 | Ocupación | ✘ | ✘ | H-01 |
| Fig. 5 | Ingresos | ✘ | ✘ | H-01 |
| Fig. 6 | Nacimiento y cultura política | ✔ | ≈ | H-14, H-15 |
| Fig. 7 | Calificación del Alcalde 1–10 | ✔ | ✔ | — |
| Tabla 5 | Alcalde por localidad + Bogotá Región | ✔ (datos en MySQL) | ∅ | H-03 |
| Fig. 8 – 13 | Acciones, recursos, compromisos, emergencias, información, complejidad | ✔ | ✔ | H-10 (rótulos) |
| Fig. 14 | Confianza por institución (8) | ✔ | ≈ | H-12 |
| Tabla 6 | Premisas que generan confianza (13 × 5) | ✔ | ≈ | H-09, H-13 |
| Fig. 15 | Satisfacción con Bogotá | ✔ | ✔ | — |
| Fig. 16 | Participación en actividades (6 × 5) | ✔ | ≈ | H-13 |
| Fig. 17 | Cumplimiento de normas legales | ✔ | ✔ | — |
| Fig. 18 | Normas sociales (13 × 5) | ✔ | ≈ | H-09, H-13 |
| Fig. 19 – 20 | Reacción ante infractores; conoce el PDD | ✔ | ✔ | — |
| Fig. 21 | Canales de información | ✔ (8 de 10) | ≈ | H-01 (2 categorías de más) |
| Fig. 22 | Quién debe informarse | ✔ | ✔ | — |
| Tabla 7 | Concepto de participación por grupo | ✘ (columnas) | ✘ | H-02 |
| Fig. 23 | Frecuencia por espacio (6 × 3) | ✔ | ≈ | H-12 |
| Tabla 8 | Temas de participación (15 sectores) | ⚠ | ⚠ | H-07 |
| Fig. 24 – 25 | Rendición de cuentas; transparencia | ✔ | ✔ | — |
| Tabla 9 | Razones para participar (7 × 3) | ✔ | ≈ | H-09 (rótulo erróneo) |
| Fig. 26 – 27 | Obstáculos; canales de expresión | ✔ | ✔ | — |
| Fig. 28 | Efectos de la participación (9 × 3) | ✔ | ≈ | H-12 |
| Fig. 29 | Mecanismos usados (6, sí/no) | ✔ | ✔ | — |
| Fig. 30 – 32 | Control social: concepto, participación, espacios | ✔ | ✔ | H-15 |
| Fig. 33 | Razones para no hacer control social | ✘ | ✘ | H-01 |
| Fig. 34 | Premisas sobre corrupción (6 × 3) | ✔ | ≈ | H-12 |
| Fig. 35 – 37 | Canales de denuncia; ocurrencia de corrupción; opinión ciudadana | ✔ | ✔ | — |
| Tabla 10 | Sector del trámite | ✘ | ✘ | H-05, H-06 |
| Fig. 38 | Satisfacción con el servicio | ✘ | ✘ | H-05 |
| Fig. 39 | Satisfacción por sector | ✘ | ✘ | H-06 |
| Tabla 11 | Actitudes poco íntegras | ✘ | ✘ | H-05 |
| Fig. 40 | Módulos temáticos elegidos | ✔ | ≈ | H-01 (rótulo) |
| Fig. 41 – 42 | Seguridad; probabilidad de sanción | ✔ | ✔ | — |
| Fig. 43 | Facilidad para denunciar | ✔ | ≈ | H-11 |
| Fig. 44 | Compromiso de la Secretaría de Seguridad | ✔ | ✔ | — |
| Fig. 45 | Causas de inseguridad | ✘ | ✘ | H-01 |
| Fig. 46 | Denuncia y reacción de autoridades | ✘ (denuncia) / ✔ (reacción) | ≈ | H-05, H-14 |
| Fig. 47 – 48 | Obras a tiempo; contratación | ✔ | ✔ | H-10 |
| Fig. 49 | Exposición a corrupción (7 × 3) | ✔ | ≈ | H-11, H-12 |
| Fig. 50 – 51 | Movilidad; espacios públicos | ✔ | ✔ | H-10 |
| Fig. 52 – 55 | Calidad de vida, empleo, inversión, focalización | ✔ | ✔ | H-10 |
| Fig. 56 | Complejidad: emprender, empleo, costo de vida | ✔ | ≈ | H-14 |
| Fig. 57 | Servicios de bienestar (7 × 3) | ✔ | ≈ | H-12 |
| Fig. 58 – 59 | Recursos de salud/educación; subsidios | ✔ | ≈ | H-14 |
| Fig. 60 | Impacto de las secretarías (4 × 3) | ✔ | ≈ | H-12 |
| Fig. 61 – 62 | Planeación; oferta de servicios | ✔ | ≈ | H-12 |
| Fig. 63 | Corrupción generalizada en contratación | ✔ | ≈ | H-11 |
| Fig. 64 | Servidores capacitados; capacidades | ✔ | ≈ | H-12, H-14 |
| Tabla 12 | Servicios públicos (4 empresas × 5 aspectos) | ✔ | ≈ | H-14 |
| Fig. 65 – 66 | Facturas y tarifa; canales de atención | ✔ | ≈ | H-09, H-12 |
| Fig. 67 | Condiciones de los servicios | ✔ | ≈ | H-09 |

## 6. Plan para subsanar

### Fase 0 · Decisiones (1 reunión corta)
1. **Fidelidad al informe sobre «legibilidad».** Recomendación: mostrar siempre las categorías del informe (H-01). Solo se unifican redacciones equivalentes («Si» = «Sí»).
2. **Grupo de servidores.** Recomendación: «Servidores y contratistas del sector público distrital» (1.833) frente a «Ciudadanía» (resto), como el informe (H-02). Nacional pasa a la ciudadanía.
3. **Cifras no reproducibles** (tabla 8, PLN, y las diferencias de base de H-05/H-06). Recomendación: tabla `EF_INFORME_PUBLICADO` con el valor **tal como lo publica el informe**, rotulado «Valor publicado por la Veeduría; no recalculable desde la base de datos». Alternativa: ocultar esas gráficas. Para H-05/H-06, solicitar a la Veeduría la regla de depuración (las 20 filas de trámite, la 1 de denuncia y la clasificación de «Otro» a sectores).

### Fase 1 · Datos y vistas MySQL (sin necesitar el Excel)
| # | Tarea | Resuelve | Criterio de aceptación |
|---|---|---|---|
| 1.1 | Revertir la homologación de las preguntas `id_pregunta` 5 (municipio), 7 (género), 8 (educación), 9 (ocupación), 12 (ingresos) y 106 (razón para no hacer control social) a las categorías del informe (`respuesta_homologada = respuesta_original`; «Otras respuestas abiertas» solo para texto libre) y actualizar `homologacion` | H-01 | Fig. 2, 3, 4, 5, 33 y tabla 4 iguales al informe |
| 1.2 | Opciones múltiples de causas de inseguridad (`id_pregunta` 128): 6 causas + «Otro (respuestas ciudadanas abiertas)»; canales de información (`id_pregunta` 66): excluir «No sabe» y «Partidos políticos» de la gráfica | H-01 | Fig. 45 = 261/251/192/173/172/144/60; fig. 21 con 8 canales |
| 1.3 | `v_pub_demografia`: grupo ocupación = distrital / resto | H-02 | Tabla 7 y texto p. 42 reproducidos (66,7 / 56,6; 24,7 / 14,1) |
| 1.4 | Vistas nuevas `EF_GRAFICA_LOCALIDAD_ALCALDE` (con «Bogotá Región» y %), `EF_GRAFICA_MUNICIPIOS`, `EF_GRAFICA_CONTROL_2024` | H-03, H-04, H-08 | Tabla 5 (21 filas), tabla 4 (11 filas), 1.324 = 35,9 % |
| 1.5 | Base de la pregunta de denuncia limitada a las víctimas (218); base de `sd_vinculo` = 3.684 | H-05, H-08 | Fig. 46 = 66,06 / 33,94; 95,2 % / 4,8 % |
| 1.6 | Tabla `EF_INFORME_PUBLICADO` + vista para tabla 8, PLN, tabla 10, tabla 11, figs. 38 y 39 (según decisión 3) | H-05, H-06, H-07 | Cada valor con la marca «publicado en el informe» |
| 1.7 | Tablas de metadatos `EF_ETIQUETA_ITEM` (rótulos del informe), `EF_ESCALA` (extremos de escala y polaridad: alto = bueno/malo) y `EF_FIGURA` (rótulos de 3 niveles, decimales, orden, base) | H-09 a H-12, H-15 | Todas las preguntas de escala con extremos; `sg_q3`, fig. 49 y fig. 63 con polaridad negativa |

### Fase 2 · Explorador (`/explora`)
| # | Tarea | Resuelve |
|---|---|---|
| 2.1 | Leer rótulos, extremos, polaridad y decimales desde las tablas `EF_*` (nada escrito en el código) | H-09 a H-12, H-15 |
| 2.2 | Vista de 5 niveles apilados para matrices (figs. 16, 18, tabla 6) | H-13 |
| 2.3 | Gráficas nuevas: tabla 4, tabla 5, pregunta de control 2024 | H-03, H-04, H-08 |
| 2.4 | Figuras combinadas: 6, 46, 56, 58, 59, 64 y tabla 12 | H-14 |
| 2.5 | Distinguir en pantalla lo «publicado en el informe» de lo «calculado desde la base» | H-07 |

### Fase 3 · Verificación continua
1. Convertir `etl/comparar_informe.py` en prueba de regresión con los **valores esperados del informe** (extraídos del PDF) y exigir 0 diferencias antes de publicar.
2. Reemplazar el mapeo por coincidencia de valores por una tabla explícita figura → pregunta → ítem (con el rótulo exacto del informe).
3. Mantener `etl/auditar_cifras.py` (coherencia base ↔ vistas ↔ API) y añadir este cotejo (informe ↔ vistas) al README.

### Orden sugerido y esfuerzo
1. Fase 0 (decisiones): 1 día.
2. Fase 1.1–1.5 (datos y vistas): 2–3 días. Es lo que corrige las cifras.
3. Fase 1.7 + 2.1 (rótulos y escalas): 2 días.
4. Fase 2.2–2.5 (gráficas): 3–4 días.
5. Fase 1.6 y 3 (valores publicados y regresión): 2 días.

## 7. Qué no se pudo comprobar
- Tabla 2 (ficha técnica: fechas, 47 + 8 preguntas, muestreo): no está en la base.
- Los textos narrativos que no son figuras se revisaron solo en las citas usadas arriba (95,2 %, 1.324, 24,7 %/14,1 %, 15,6 %, 23,6 %).
- Las 20 filas de trámite, 9 de actitudes y 1 de denuncia que el informe excluye: sin la regla de depuración no se pueden identificar.
