# Encuesta de Percepción de Confianza Institucional 2025 (EPCI)

Aplicación web React SPA interactiva para la exploración y comprensión pública de los resultados de la **Encuesta de Percepción de Confianza Institucional (EPCI 2025)** de la **Veeduría Distrital de Bogotá**.

## Características Principales

1. **Inicio (`/`)**:
   - Resumen de cifras oficiales de la encuesta (4.009 encuestados, 3.684 respuestas efectivas, 20 localidades de Bogotá y municipios aledaños).
   - Acceso a los 11 módulos temáticos (obligatorios y opcionales).
   - Calificación media general a la gestión del Alcalde (5,98 / 10).
   - Transparencia metodológica sobre lo que la encuesta puede y no puede extrapolar.

2. **Aprende con Tula (`/aprende`)**:
   - **Ruta de Aprendizaje Metodológico**: 6 paradas pedagógicas interactivas con Tula (la tingua bogotana) explicando la fórmula de confianza, umbrales de semaforización, sesgos muestrales y lectura honesta de datos.
   - **Chat Asistente de Tula**: Responde en tiempo real con datos estrictamente contenidos en la base de la encuesta.
   - **Contexto Documental**: Marco normativo (Decreto Ley 1421/93) y los 5 determinantes OCDE/DANE.

3. **Explora la Encuesta (`/explora`)**:
   - Explorador dinámico de preguntas y variables con gráficas interactivas en Recharts.
   - Filtros demográficos en tiempo real por género, rango de edad y ocupación.
   - Soporte para escalas Likert de 5 niveles, calificación de 1 a 10, matrices comparativas, ranking por localidad y nubes de palabras de texto libre.
   - **Descarga de Fichas Metodológicas**: Exportación personalizada en PDF/HTML con análisis cualitativo, gráficos y sellos de veeduría.

## Arquitectura y Tecnologías

- **Framework**: React 19 + TypeScript + Vite.
- **Estilos**: Tailwind CSS v4 con tipografía editorial (`Playfair Display`, `Inter`, `JetBrains Mono`).
- **Visualización**: Recharts + animaciones fluidas con Motion.
- **Datos**: Conjunto de datos verificado y auditado contra las 39 comprobaciones del informe oficial de la Veeduría Distrital (4.009 registros, 3.684 respuestas efectivas, 0 fallas de regresión).
- **Ruteo**: SPA client-side con soporte para deep linking (`/`, `/aprende`, `/explora`, `?modulo=`, `?pregunta=`, `?chat=1`).

## Desarrollo y Compilación

```bash
# Iniciar servidor de desarrollo en host 0.0.0.0:3000
npm run dev

# Compilar para producción
npm run build

# Verificación de tipos TypeScript
npm run lint
```
