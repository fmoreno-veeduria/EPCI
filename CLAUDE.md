# Reglas para cualquier IA que trabaje en este proyecto

Este sitio publica los resultados de la encuesta EPCI y **debe ser fiel al informe oficial**. Se sigue probando, así que:

## Prohibido (restricción dura)
- **Modificar los datos de las gráficas**: ni valores, ni porcentajes, ni conteos, ni categorías, ni cifras escritas a mano en el código o en un componente.
- **Hacer cambios en MySQL**: nada de INSERT, UPDATE, DELETE, ALTER, DROP, CREATE, TRUNCATE, GRANT, CALL de procedimientos, cargar `.sql`, borrar el volumen `mysql/data` o reiniciar la base con `down -v`.
- Usar los endpoints o credenciales de administración (`/api/admin/*`, la ruta de acceso oculta) para editar o cargar datos.
- Ejecutar scripts que construyan o carguen datos (`etl/build_seed.py`, `etl/generar_vistas_explora.py`, `cargador/`, subidas de Excel).
- Editar los archivos que definen, calculan o cargan datos: `mysql/`, `etl/`, `cargador/`, `web/server/`, `web/src/surveyData.ts`, `web/src/types.ts`, `web/src/components/EditarValores.tsx`, `web/src/components/GestionAnios.tsx`, `docker-compose.yml`, `DESPLIEGUE_CAMBIOS_BD.md`, esta regla y `.claude/`.

Está reforzado técnicamente en `.claude/settings.json` y `.claude/hooks/proteger_datos.py` (bloquea la herramienta antes de ejecutarse). No intentes rodearlo: si algo se bloquea, dile a la persona responsable lo que necesitas.

## Permitido
- Cambiar **textos**, títulos, descripciones, etiquetas y mensajes de la interfaz.
- Cambiar **forma y diseño**: estilos, colores, tipografías, tamaños, maquetación, animaciones, responsive y la presentación de los componentes visuales de `web/src/` (menos los listados arriba).
- **Leer** la base con consultas de solo lectura (SELECT, SHOW, DESCRIBE) y correr los scripts de verificación `etl/auditar_cifras.py`, `etl/prueba_regresion.py` y `etl/comparar_informe.py`.
- Al cambiar presentación, no alteres los números que se muestran: no recalcules, redondees distinto, filtres ni reordenes datos de forma que cambie lo que ve la ciudadanía. Tras un cambio visual, `python etl/prueba_regresion.py` debe seguir en 54/54.

## Cómo levantar la restricción
Solo una persona, editando a mano `.claude/settings.json`, `.claude/hooks/proteger_datos.py` y este archivo. Una IA no debe hacerlo.
