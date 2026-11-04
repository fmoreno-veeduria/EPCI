#!/usr/bin/env python3
"""Hook PreToolUse: impide que una IA modifique los DATOS de las gráficas o MySQL.

Se permite (y se espera): cambiar textos, estilos, maquetación y componentes visuales.
Se bloquea:
  1. Editar/crear archivos que definen, calculan o cargan datos (mysql/, etl/, cargador/, servidor de datos, edición de valores).
  2. Comandos que escriben en MySQL (INSERT/UPDATE/DELETE/ALTER/DROP/..., cargar .sql, mysqldump, borrar volúmenes).
  3. Llamadas a los endpoints de administración (/api/admin/*), que editan o cargan datos.
  4. Scripts que ejecuten escrituras SQL contra la base.
Solo lectura (SELECT, SHOW, DESCRIBE, scripts de auditoría) sigue permitida.

Para levantar la restricción hay que editar este archivo y .claude/settings.json A MANO (una persona, no una IA).
Salida con código 2 = bloqueo; el mensaje de stderr le llega a la IA.
"""
import json
import re
import sys

# Rutas (relativas a la raíz del proyecto) cuyo contenido define o mueve datos. Solo lectura para una IA.
PROTEGIDAS = [
    'mysql/',                               # esquema, vistas, semillas, datos
    'etl/',                                 # construcción de semillas, vistas y valores esperados del informe
    'cargador/',                            # carga de Excel por año
    'web/server/',                          # API: dataset, edición de valores, conexión a BD, chat con datos
    'web/src/surveyData.ts',                # cómo el sitio obtiene los datos
    'web/src/types.ts',                     # contrato de los datos
    'web/src/components/EditarValores.tsx',  # edición de valores de las gráficas
    'web/src/components/GestionAnios.tsx',   # carga de años
    'docker-compose.yml',                   # credenciales y servicios de la BD
    'despliegue_cambios_bd.md',
    'claude.md',
    '.claude/',                             # esta misma protección
    'informe_analisisencuestaconfianzainstitucional_2025.pdf',
]

SQL_ESCRITURA = re.compile(
    r"\b(insert\s+(ignore\s+)?into|replace\s+into|delete\s+from|truncate\s+(table\s+)?\w|"
    r"drop\s+(table|database|schema|view|procedure|function|trigger|event|index|user)|"
    r"alter\s+(table|database|schema|view|user|event)|create\s+(or\s+replace\s+)?(table|view|database|schema|procedure|function|trigger|event|user|index)|"
    r"rename\s+table|grant\s+\w|revoke\s+\w|load\s+data|set\s+password|"
    r"update\s+[`\w.\"]+\s+set\b|call\s+ef_refrescar\w*|call\s+ef_\w+)",
    re.I,
)
CLIENTE_BD = re.compile(r"\b(mysql|mysqldump|mysqlsh|mysqladmin|mariadb|pymysql|mysql\.connector|mysql2|sqlalchemy)\b", re.I)
VOLUMEN = re.compile(r"(docker\s+(compose\s+)?(down\s+(.*\s)?-v|volume\s+(rm|prune))|docker\s+system\s+prune|"
                     r"(rm|remove-item|del|rmdir|rd|mv|move-item|move|cp|copy-item|copy)\b[^\n;|&]*mysql[\\/]+(data|init|seed))", re.I)
ENTRADA_SQL = re.compile(r"(<\s*\S+\.sql|\bsource\s+\S+\.sql|\\\.\s+\S+\.sql|\.sql\s*\|\s*(docker|mysql))", re.I)
ADMIN_API = re.compile(r"(/api/admin|acceso-veeduria|v33dur14)", re.I)
LLAMADA_HTTP = re.compile(r"(curl|wget|invoke-webrequest|invoke-restmethod|iwr|irm|fetch|requests|urllib|http\.client|axios)", re.I)
SCRIPTS_DATOS = re.compile(r"(build_seed|generar_vistas_explora|etl[\\/]+cargar|cargador[\\/]+app|subir_prueba|excel_prueba|patch_\w+\.py)", re.I)


def bloquear(motivo):
    sys.stderr.write(
        "BLOQUEADO por la regla del proyecto (CLAUDE.md): una IA no puede modificar los datos de las gráficas "
        "ni hacer cambios en MySQL.\n"
        f"Motivo: {motivo}\n"
        "Sí puedes cambiar textos, estilos, maquetación y componentes visuales. Si necesitas un cambio de datos, "
        "díselo a la persona responsable para que lo haga ella.\n"
    )
    sys.exit(2)


def relativa(ruta):
    r = ruta.replace('\\', '/').lower()
    marca = 'database-eficiencia/'
    i = r.find(marca)
    return r[i + len(marca):] if i >= 0 else r.lstrip('./')


def revisar_archivo(ruta, contenido):
    rel = relativa(ruta)
    for p in PROTEGIDAS:
        if rel == p.rstrip('/') or rel.startswith(p):
            bloquear(f"el archivo «{rel}» define, calcula o carga datos y está protegido.")
    # Un archivo nuevo en cualquier otro sitio que escriba en la base tampoco se permite.
    if contenido and CLIENTE_BD.search(contenido) and SQL_ESCRITURA.search(contenido):
        bloquear(f"el contenido de «{rel}» contiene escrituras SQL contra la base de datos.")


def revisar_comando(texto):
    if VOLUMEN.search(texto):
        bloquear("el comando borra, mueve o reinicia los datos de MySQL (volumen/carpeta mysql).")
    if ADMIN_API.search(texto) and LLAMADA_HTTP.search(texto):
        bloquear("el comando usa los endpoints o credenciales de administración, que editan o cargan datos.")
    if SCRIPTS_DATOS.search(texto):
        bloquear("el comando ejecuta un script que construye, carga o modifica datos.")
    if CLIENTE_BD.search(texto) or re.search(r"\bdocker\b[^\n]*\b(exec|run|cp)\b", texto, re.I):
        if SQL_ESCRITURA.search(texto) or ENTRADA_SQL.search(texto):
            bloquear("el comando intenta escribir en MySQL (INSERT/UPDATE/DELETE/ALTER/DROP/CREATE/GRANT/CALL o cargar un .sql).")
    elif SQL_ESCRITURA.search(texto) and re.search(r"\b(python|node|php|ruby|sh|bash)\b", texto, re.I):
        bloquear("el comando ejecuta código con escrituras SQL.")


def main():
    try:
        datos = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    herramienta = datos.get('tool_name', '')
    entrada = datos.get('tool_input') or {}

    if herramienta in ('Write', 'Edit', 'NotebookEdit', 'MultiEdit'):
        ruta = entrada.get('file_path') or entrada.get('notebook_path') or ''
        contenido = ' '.join(str(entrada.get(k, '')) for k in ('content', 'new_string', 'new_source'))
        revisar_archivo(ruta, contenido)
    else:
        revisar_comando(json.dumps(entrada, ensure_ascii=False))
    sys.exit(0)


if __name__ == '__main__':
    main()
