#!/usr/bin/env python3
"""
Genera mysql/init/06_vistas_explora.sql: tablas de configuración EF_* y las vistas EF_* que alimentan /explora.

Cada gráfica del explorador se lee de una vista EF_GRAFICA_* (el servidor no calcula ningún porcentaje ni promedio):
  EF_GRAFICA_DISTRIBUCION        barras de cada pregunta/ítem y segmento (conteo, base, porcentaje, promedio)
  EF_GRAFICA_MATRIZ_COMPARATIVA  barras apiladas bajo/medio/alto de las matrices y preguntas de escala
  EF_GRAFICA_BINARIA             Sí/No por mecanismo de participación
  EF_GRAFICA_SATISFACCION_SECTOR satisfacción del trámite por sector
  EF_GRAFICA_NUBE_PALABRAS       palabras más frecuentes de las preguntas abiertas
  EF_GRAFICA_TEMAS_RESUMEN       estadísticas de la clasificación por temas
y catálogos EF_CATALOGO_MODULOS, EF_CATALOGO_PREGUNTAS, EF_ITEMS.

Uso: python etl/generar_vistas_explora.py     (lee etl/registro_explora.json y mysql/seed/*.csv)
"""
import csv, io, json, re, unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
reg = json.load(open(ROOT / 'etl/registro_explora.json', encoding='utf-8'))


def unesc(s):
    return s.replace('\\\\', '\\')


def leer(path):
    with io.open(path, encoding='utf-8', newline='') as f:
        for row in csv.reader(f):
            yield [None if x == '\\N' else unesc(x) for x in row]


preg = {}
for r in leer(ROOT / 'mysql/seed/preguntas.csv'):
    preg[int(r[0])] = dict(numero=r[4], enunciado=r[5], tipo=r[9])


def q(s):
    return 'NULL' if s is None else "'" + str(s).replace('\\', '\\\\').replace("'", "''") + "'"


# ----------------------------------------------------------------------------- anclas de la escala (del enunciado)
ANCLAS = re.compile(r'1\s*(?:significa|es)\s*[“"”]([^”"]+)[”"].*?(10|5)\s*(?:significa|es)?\s*[“"”]([^”"]+)[”"]', re.S)

sql = ['-- Generado por etl/generar_vistas_explora.py. No editar a mano.', 'SET NAMES utf8mb4;', '']
ANCLAS_Q = {}

sql.append('''
DROP VIEW IF EXISTS EF_BASE_RESPUESTAS, EF_CATALOGO_FIGURAS_FILAS, EF_CATALOGO_FIGURAS_SERIES, EF_CATALOGO_FIGURAS, EF_GRAFICA_INFORME_PUBLICADO, EF_GRAFICA_INFORME_ESCALA, EF_GRAFICA_SATISFACCION_SECTOR_INFORME, EF_GRAFICA_LOCALIDAD_ALCALDE,
  EF_GRAFICA_TEMAS_RESUMEN, EF_GRAFICA_NUBE_PALABRAS, EF_GRAFICA_SATISFACCION_SECTOR, EF_GRAFICA_BINARIA,
  EF_GRAFICA_MATRIZ_COMPARATIVA, EF_GRAFICA_DISTRIBUCION, EF_BASE_RESPONDIENTES, EF_BASE_CONTEO, EF_CATALOGO_MODULOS, EF_CATALOGO_PREGUNTAS, EF_ITEMS;
DROP PROCEDURE IF EXISTS EF_REFRESCAR_CONTEOS;
DROP PROCEDURE IF EXISTS EF_REFRESCAR_CONTEOS_ANIO;
DROP TABLE IF EXISTS EF_RESPUESTAS_PREGUNTA, EF_FIGURA_FILA_DATOS, EF_FIGURA_SERIE_DATOS, EF_FIGURA_ESPECIAL_DATOS, EF_FIGURA, EF_ESCALA, EF_ETIQUETA_ITEM, EF_INFORME_PUBLICADO, EF_CATEGORIA_OCULTA, EF_NUBE_PALABRAS_DATOS, EF_PREGUNTA_ITEM, EF_PREGUNTA, EF_MODULO, EF_CONTEO_SEGMENTO, EF_RESPONDIENTES_SEGMENTO;

CREATE TABLE EF_CONTEO_SEGMENTO (
  anio SMALLINT UNSIGNED NOT NULL, id_pregunta SMALLINT UNSIGNED NOT NULL, categoria VARCHAR(500) NOT NULL, segmento_tipo VARCHAR(10) NOT NULL, segmento VARCHAR(30) NOT NULL,
  valor_numerico DECIMAL(5,1) NULL, n INT UNSIGNED NOT NULL, KEY ix_conteo (anio, id_pregunta, segmento_tipo, segmento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Personas por pregunta, categoría y segmento (todos/género/edad/ocupación). Se rellena con EF_REFRESCAR_CONTEOS()';
CREATE TABLE EF_RESPONDIENTES_SEGMENTO (
  anio SMALLINT UNSIGNED NOT NULL, id_pregunta SMALLINT UNSIGNED NOT NULL, segmento_tipo VARCHAR(10) NOT NULL, segmento VARCHAR(30) NOT NULL, n INT UNSIGNED NOT NULL,
  PRIMARY KEY (anio, id_pregunta, segmento_tipo, segmento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Personas que respondieron cada pregunta por segmento (base de los porcentajes)';
CREATE TABLE EF_RESPUESTAS_PREGUNTA (
  anio SMALLINT UNSIGNED NOT NULL, id_pregunta SMALLINT UNSIGNED NOT NULL, n INT UNSIGNED NOT NULL, PRIMARY KEY (anio, id_pregunta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Respuestas recibidas por pregunta y año (sin reglas de base)';

CREATE TABLE EF_MODULO (
  clave VARCHAR(40) NOT NULL PRIMARY KEY, nombre VARCHAR(120) NOT NULL, descripcion TEXT NOT NULL, color CHAR(7) NOT NULL,
  orden DECIMAL(4,1) NOT NULL, opcional TINYINT(1) NOT NULL DEFAULT 0, sin_numero TINYINT(1) NOT NULL DEFAULT 0, es_transicion TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Módulos que muestra /explora (nombre y descripción editoriales)';
CREATE TABLE EF_PREGUNTA (
  clave VARCHAR(40) NOT NULL PRIMARY KEY, modulo_clave VARCHAR(40) NOT NULL, orden TINYINT UNSIGNED NOT NULL, tipo_registro VARCHAR(20) NOT NULL,
  ancla_min VARCHAR(120) NULL, ancla_max VARCHAR(120) NULL, escala_max TINYINT UNSIGNED NULL,
  FOREIGN KEY (modulo_clave) REFERENCES EF_MODULO (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Una fila por pregunta (o matriz) del explorador; ancla_* salen del enunciado';
CREATE TABLE EF_PREGUNTA_ITEM (
  clave VARCHAR(40) NOT NULL, item_orden TINYINT UNSIGNED NOT NULL, id_pregunta SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (clave, item_orden), FOREIGN KEY (clave) REFERENCES EF_PREGUNTA (clave), FOREIGN KEY (id_pregunta) REFERENCES preguntas (id_pregunta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Columnas del Excel (preguntas.id_pregunta) que componen cada pregunta; las matrices tienen varias';
CREATE TABLE EF_NUBE_PALABRAS_DATOS (
  anio SMALLINT UNSIGNED NOT NULL, id_pregunta SMALLINT UNSIGNED NOT NULL, posicion TINYINT UNSIGNED NOT NULL, palabra VARCHAR(60) NOT NULL, menciones INT UNSIGNED NOT NULL,
  PRIMARY KEY (anio, id_pregunta, posicion), FOREIGN KEY (id_pregunta) REFERENCES preguntas (id_pregunta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Palabras más frecuentes de las preguntas abiertas (sin stopwords, una mención por respuesta)';
CREATE TABLE EF_CATEGORIA_OCULTA (
  clave VARCHAR(40) NOT NULL, categoria VARCHAR(255) NOT NULL, motivo VARCHAR(300) NOT NULL,
  PRIMARY KEY (clave, categoria(150)), FOREIGN KEY (clave) REFERENCES EF_PREGUNTA (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Categorías que existen en la base pero que el informe no grafica';
CREATE TABLE EF_ETIQUETA_ITEM (
  clave VARCHAR(40) NOT NULL, item_orden TINYINT UNSIGNED NOT NULL, etiqueta VARCHAR(250) NOT NULL, fuente VARCHAR(80) NOT NULL,
  PRIMARY KEY (clave, item_orden), FOREIGN KEY (clave) REFERENCES EF_PREGUNTA (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Rótulo de cada ítem de matriz tal como lo escribe el informe';
CREATE TABLE EF_ESCALA (
  clave VARCHAR(40) NOT NULL PRIMARY KEY, ancla_min VARCHAR(120) NULL, ancla_max VARCHAR(120) NULL, escala_max TINYINT UNSIGNED NULL,
  polaridad ENUM('directa', 'inversa') NOT NULL DEFAULT 'directa' COMMENT 'inversa = un valor alto es lo negativo',
  etiqueta_bajo VARCHAR(80) NULL, etiqueta_medio VARCHAR(80) NULL, etiqueta_alto VARCHAR(80) NULL, fuente VARCHAR(120) NOT NULL,
  FOREIGN KEY (clave) REFERENCES EF_PREGUNTA (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Extremos, polaridad y rótulos de 3 niveles de las preguntas de escala, según el informe';
CREATE TABLE EF_FIGURA (
  clave VARCHAR(40) NOT NULL PRIMARY KEY, figura VARCHAR(40) NOT NULL, decimales TINYINT UNSIGNED NOT NULL,
  niveles TINYINT UNSIGNED NOT NULL DEFAULT 3 COMMENT 'niveles con que el informe apila las matrices: 3 o 5',
  FOREIGN KEY (clave) REFERENCES EF_PREGUNTA (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Figura/tabla del informe que representa cada pregunta, decimales con que la imprime y niveles de apilado';
CREATE TABLE EF_FIGURA_ESPECIAL_DATOS (
  clave VARCHAR(40) NOT NULL PRIMARY KEY, tipo ENUM('ranking', 'paneles', 'agrupadas', 'agrupadas_3', 'tabla') NOT NULL,
  modulo_clave VARCHAR(40) NOT NULL, orden SMALLINT UNSIGNED NOT NULL, titulo VARCHAR(400) NOT NULL, figura VARCHAR(30) NOT NULL, decimales TINYINT UNSIGNED NOT NULL,
  etiqueta_bajo VARCHAR(80) NULL, etiqueta_medio VARCHAR(80) NULL, etiqueta_alto VARCHAR(80) NULL,
  FOREIGN KEY (modulo_clave) REFERENCES EF_MODULO (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Figuras del informe que combinan varias preguntas o no son una pregunta (Tabla 5, figs. 6, 46, 56, 58, 59, 64 y tabla 12)';
CREATE TABLE EF_FIGURA_SERIE_DATOS (
  clave VARCHAR(40) NOT NULL, serie_orden TINYINT UNSIGNED NOT NULL, clave_pregunta VARCHAR(40) NOT NULL, etiqueta VARCHAR(250) NOT NULL,
  PRIMARY KEY (clave, serie_orden), FOREIGN KEY (clave) REFERENCES EF_FIGURA_ESPECIAL_DATOS (clave), FOREIGN KEY (clave_pregunta) REFERENCES EF_PREGUNTA (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Preguntas que componen cada figura combinada';
CREATE TABLE EF_FIGURA_FILA_DATOS (
  clave VARCHAR(40) NOT NULL, fila_orden TINYINT UNSIGNED NOT NULL, item_orden TINYINT UNSIGNED NOT NULL, etiqueta VARCHAR(200) NOT NULL,
  PRIMARY KEY (clave, fila_orden), FOREIGN KEY (clave) REFERENCES EF_FIGURA_ESPECIAL_DATOS (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Filas de las figuras tipo tabla (ítem de cada matriz y su rótulo en el informe)';
CREATE TABLE EF_INFORME_PUBLICADO (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  clave VARCHAR(40) NOT NULL, figura VARCHAR(60) NOT NULL, tipo ENUM('distribucion', 'sector', 'pln') NOT NULL,
  serie VARCHAR(60) NULL, categoria VARCHAR(200) NOT NULL, valor_numerico DECIMAL(5,1) NULL,
  n INT UNSIGNED NULL, base INT UNSIGNED NULL, porcentaje DECIMAL(7,4) NULL, orden SMALLINT NOT NULL,
  nota VARCHAR(300) NOT NULL DEFAULT 'Valor publicado por la Veeduría; no recalculable desde la base de datos',
  FOREIGN KEY (clave) REFERENCES EF_PREGUNTA (clave), KEY ix_pub (clave, figura, tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Valores tal como los publica el Informe EPCI 2025 cuando no se pueden recalcular desde la base';
''')

# ----------------------------------------------------------------------------- módulos / preguntas / ítems
for k, m in reg['modulos'].items():
    sql.append("INSERT INTO EF_MODULO VALUES (%s,%s,%s,%s,%s,%d,%d,%d);" % (
        q(k), q(m['nombre']), q(m['desc']), q(m['color']), m['orden'], int(bool(m.get('opcional'))), int(bool(m.get('sin_numero'))), int(bool(m.get('is_transicion')))))
for p in reg['preguntas']:
    enun = preg[p['ids'][0]]['enunciado']
    m = ANCLAS.search(enun) if p['tipo'] != 'multi_binary' else None
    a, b, mx = (m.group(1).strip(), m.group(3).strip(), int(m.group(2))) if m else (None, None, None)
    if a:
        ANCLAS_Q[p['key']] = (a, b, mx)
    sql.append("INSERT INTO EF_PREGUNTA VALUES (%s,%s,%d,%s,%s,%s,%s);" % (
        q(p['key']), q(p['modulo']), p['orden'], q(p['tipo']), q(a), q(b), 'NULL' if mx is None else mx))
    for i, id_ in enumerate(p['ids'], 1):
        sql.append("INSERT INTO EF_PREGUNTA_ITEM VALUES (%s,%d,%d);" % (q(p['key']), i, id_))

# ----------------------------------------------------------------------------- nube de palabras (preguntas abiertas)
STOP = set(('de la que el en y a los del se las por un para con no una su al lo como más pero sus le ya o este sí porque esta entre cuando muy sin sobre también me hasta hay donde quien desde todo nos durante todos uno les ni contra otros ese eso ante ellos e esto mí antes algunos qué unos yo otro otras otra él tanto esa estos mucho quienes nada muchos cual poco ella estar estas algunas algo nosotros mi mis tú te ti tu tus ellas nosotras vosotros vosotras os mío mía míos mías tuyo tuya suyo suya nuestro nuestra son es ser está están fue ha han sea sean más menos así cada bien mejor mayor manera debe deben puede pueden tiene tienen hacer hace parte través según tipo tema temas bogotá distrital distrito administración ciudadanos ciudadanía ciudad').split())


def norm(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').lower()


abiertas = {i for i, p in preg.items() if p['tipo'] == 'abierta'}
usadas = {p['ids'][0] for p in reg['preguntas'] if p['tipo'] in ('open', 'multi_category')}
conteo = {i: Counter() for i in abiertas & usadas}
for r in leer(ROOT / 'mysql/seed/respuestas.csv'):
    idp = int(r[2])
    if idp in conteo:
        vistos = set()
        for w in re.findall(r'[a-záéíóúñü]{4,}', r[3].lower()):
            if w not in STOP and norm(w) not in STOP:
                vistos.add(w)
        conteo[idp].update(vistos)
for idp, c in sorted(conteo.items()):
    for pos, (w, n) in enumerate(sorted(c.items(), key=lambda x: (-x[1], x[0]))[:40], 1):  # empates: orden alfabético
        sql.append("INSERT INTO EF_NUBE_PALABRAS_DATOS VALUES (2025,%d,%d,%s,%d);" % (idp, pos, q(w), n))



# ----------------------------------------------------------------------------- rótulos del informe (1.7)
ETIQ = {
    'ci_q9_matrix': ('Informe, Fig. 14', ['Secretarías Distritales', 'Alcaldías Locales', 'Policía Metropolitana',
        'Organismos Distritales de Control (Personería, Veeduría, Contraloría)', 'Entidades adscritas e institutos del orden distrital y vinculadas',
        'Órganos de justicia distritales (Inspecciones de Policías, Casas de Justicia, etc.)', 'Comisarías de Familia', 'Servidores públicos']),
    'ci_q10_matrix': ('Informe, Tabla 6', ['Que la entidad o sus servidores estén involucrados en escándalos de corrupción',
        'Que se evidencie el resultado de su gestión en la ciudad', 'Que cumplan con sus objetivos y su misión',
        'Que presten un servicio eficiente y atiendan solicitudes rápidamente',
        'Que cuenten con buenos canales de comunicación y brinden una experiencia satisfactoria',
        'Que el funcionario a la cabeza de la entidad demuestre su liderazgo', 'Que cumplan con sus planes, programas y proyectos',
        'Que den respuesta a todas las solicitudes de la ciudadanía', 'Que cumplan con los compromisos pactados en espacios de participación',
        'Que publiquen de manera clara, simple y periódica datos sobre su gestión',
        'Que tengan espacios de interlocución permanente y en territorio con la ciudadanía',
        'Que dispongan canales y espacios para la proposición de ideas de la ciudadanía',
        'Que por medio de sus redes sociales comuniquen de forma simple y clara datos sobre su gestión']),
    'cr_q1_matrix': ('Informe, Fig. 16', ['Espacios culturales', 'Jornadas de salud', 'Eventos institucionales', 'Espacios deportivos',
        'Jornadas de bienestar', 'Espacios de colaboración']),
    'cr_q3_matrix': ('Informe, Fig. 18', ['Pago de impuestos', 'Respeto por las normas sociales de convivencia', 'Reciclaje activo',
        'Pago del pasaje en transporte público', 'Respeto por las normas viales', 'Estacionamiento en Zonas de Parqueo Pago', 'Ahorro de agua',
        'Ahorro de energía', 'Cuidado del espacio público', 'Recolección de heces de mascotas',
        'Disposición de residuos sólidos en las zonas indicadas', 'Respeto por las filas', 'Respeto por la palabra del otro']),
    'pa_q2_matrix': ('Informe, Fig. 23', ['Audiencias Públicas', 'Instancias Distritales (Consejos o Comités Distritales)',
        'Instancias Locales (Consejos Locales, Comités, CPL)', 'Presupuestos Participativos', 'Ejercicios de control social',
        'Espacios de participación no formales']),
    'pa_q7_matrix': ('Informe, Tabla 9', ['Obtener un beneficio para la comunidad o una solución a un problema colectivo', 'Cumplir con un deber ciudadano',
        'Influir en las decisiones de las autoridades y/o entidades públicas', 'Curiosidad por el tema discutido en el espacio',
        'Conocer y relacionarse con otras personas', 'Ser elegido(a) para representar a un grupo o comunidad',
        'Resolver un problema personal y/o familiar']),
    'pa_q10_matrix': ('Informe, Fig. 28', ['Generar mayor colaboración entre distintos sectores', 'Reducir la corrupción, el clientelismo y la politiquería',
        'Promover el diálogo entre instituciones y ciudadanos', 'Fortalecer la creación de grupos y organizaciones sociales',
        'Ampliar el conocimiento sobre la ciudad y sus problemáticas', 'Aumentar la confianza en las instituciones públicas',
        'Empoderar y visibilizar a grupos y comunidades', 'Propiciar el sentido de pertenencia por lo público',
        'Incluir a los ciudadanos en la toma de decisiones']),
    'pa_q11_matrix': ('Informe, Fig. 29', ['Presentación de iniciativas normativas', 'Firmas para promover un referendo', 'Plebiscito', 'Consultas populares',
        'Procesos de revocatoria del mandato', 'Cabildos abiertos']),
    'ri_q1_matrix': ('Informe, Fig. 34', ['Es efectivo denunciar a los servidores que actúan de forma poco transparente', 'Denunciar disminuye el riesgo de corrupción',
        'Los servidores públicos actúan en función del interés general de la ciudadanía', 'La Administración Distrital actúa de manera ética y transparente',
        'Los procesos de contratación pública del Distrito son transparentes', 'La Administración Distrital toma medidas efectivas para prevenir la corrupción']),
    'mv_q4_matrix': ('Informe, Fig. 49', ['Secretaría Distrital de Movilidad (SDM)', 'Instituto de Desarrollo Urbano (IDU)', 'Unidad de Mantenimiento Vial (UMV)',
        'Transmilenio S.A.', "Operadora 'La Rolita'", 'Terminal de Transporte S.A.', 'Empresa Metro de Bogotá']),
    'bie_q1_matrix': ('Informe, Fig. 57', ['Educación Preescolar', 'Educación Básica (Primaria/Secundaria)', 'Educación Media (10° y 11°)', 'Educación Superior',
        'Servicios de Salud', 'Servicios Culturales', 'Servicios Deportivos']),
    'bie_q7_matrix': ('Informe, Fig. 60', ['Secretaría Distrital de Salud', 'Secretaría de Educación del Distrito', 'Secretaría de Cultura, Recreación y Deporte',
        'Secretaría de Integración Social']),
    'gp_q5_matrix': ('Informe, Fig. 62', ['Calidad de los servicios distritales', 'Canales de atención del Distrito (Presencial, telefónico, virtual)',
        'Medios de comunicación de la Alcaldía (Vallas, cuñas, pautas)']),
    'sp_q5_matrix': ('Informe, Fig. 65', ['"Los recibos y facturas de cobro son claros y comprensibles"',
        '"Realizar el pago de la factura de cobro de servicios públicos es fácil"', '"La tarifa de los servicios públicos domiciliarios es justa y razonable"']),
    'sp_q6_matrix': ('Informe, Fig. 67 (orden verificado por coincidencia de valores)', ['"Los servicios públicos funcionan mejor que en el año anterior"',
        '"Todas las zonas de Bogotá tienen un acceso equitativo a los servicios públicos"',
        '"Debería existir una entidad distrital que se especialice en evaluar la calidad de los servicios"',
        '"Es necesario acudir a otra entidad diferente a la empresa para dar solución a los reclamos"']),
    'sp_q7_matrix': ('Informe, Fig. 66 (orden verificado por coincidencia de valores)', ['"Accesibilidad de los canales para reportar fallas" (teléfono, web, presencial, ChatBot, apps)',
        '"Facilidad para gestionar trámites" (reparaciones, suspensiones, cambio de titular)', '"Confianza en que la empresa resuelva rápida y oportunamente"',
        '"Confianza en que atiendan sus reclamos satisfactoriamente"']),
}
ASPECTOS = ['Calidad del servicio', 'Canales de atención a usuarios', 'Medios de comunicación', 'Precio de la tarifa', 'Continuidad en la prestación del servicio']
for k, emp in [('sp_q1_matrix', 'EAAB'), ('sp_q2_matrix', 'VANTI'), ('sp_q3_matrix', 'ENEL'), ('sp_q4_matrix', 'Operadores de aseo')]:
    ETIQ[k] = ('Informe, Tabla 12', [f'{emp} · {a}' for a in ASPECTOS])
for k, (fuente, lista) in ETIQ.items():
    for i, e in enumerate(lista, 1):
        sql.append("INSERT INTO EF_ETIQUETA_ITEM VALUES (%s,%d,%s,%s);" % (q(k), i, q(e), q(fuente)))

# extremos, polaridad y rótulos de 3 niveles
ESC_EXTRA = {   # clave: (ancla_min, ancla_max, escala_max, fuente)
    'sg_q3': ('Muy fácil', 'Muy difícil', 5, 'Informe, Fig. 43'),
    'mv_q8': ('No confío en absoluto', 'Confío plenamente', 5, 'Informe, Fig. 51'),
}
INVERSA = {'sg_q3': 'Informe, Fig. 43: 1 = muy fácil, 5 = muy difícil', 'gp_q4': 'Informe, Fig. 63: corrupción generalizada',
           'mv_q4_matrix': 'Informe, Fig. 49: exposición a riesgos de corrupción'}
ESC3 = {   # clave: (bajo, medio, alto)
    'ci_q1': ('Negativa (1 a 4)', 'Intermedia (5 y 6)', 'Positiva (7 a 10)'),
    'ci_q9_matrix': ('No confía', 'Ni confía, ni desconfía', 'Confía'),
    'pa_q2_matrix': ('No asiste (1+2)', 'A veces (3)', 'Asiste (4+5)'),
    'pa_q10_matrix': ('En desacuerdo', 'Neutro', 'De acuerdo'),
    'ri_q1_matrix': ('En desacuerdo', 'Ni de acuerdo, ni en desacuerdo', 'De acuerdo'),
    'mv_q4_matrix': ('Baja exposición (1 y 2)', 'Neutral (3)', 'Alta exposición a corrupción (4 y 5)'),
    'bie_q1_matrix': ('Insatisfechos', 'Neutros', 'Satisfechos'),
    'bie_q7_matrix': ('Negativo', 'Neutro', 'Positivo'),
    'gp_q5_matrix': ('Insatisfechos', 'Neutros', 'Satisfechos'),
    'sp_q1_matrix': ('Insatisfechos', 'Neutro', 'Satisfechos'), 'sp_q2_matrix': ('Insatisfechos', 'Neutro', 'Satisfechos'),
    'sp_q3_matrix': ('Insatisfechos', 'Neutro', 'Satisfechos'), 'sp_q4_matrix': ('Insatisfechos', 'Neutro', 'Satisfechos'),
    'sp_q5_matrix': ('En desacuerdo', 'Indiferente', 'De acuerdo'), 'sp_q6_matrix': ('En desacuerdo', 'Indiferente', 'De acuerdo'),
    'sp_q7_matrix': ('Baja', 'Indiferente', 'Alta'),
    'gp_q4': ('Poco/Nada (1 y 2)', 'Neutro (3)', 'Corrupción generalizada (4 y 5)'),
    'gp_q6': ('En desacuerdo', 'Indiferente', 'De acuerdo'), 'gp_q7': ('En desacuerdo', 'Indiferente', 'De acuerdo'),
}
claves_esc = set(ANCLAS_Q) | set(ESC_EXTRA) | set(INVERSA) | set(ESC3)
for k in sorted(claves_esc):
    a, b, mx = ANCLAS_Q.get(k, (None, None, None))
    fuente = 'Enunciado de la pregunta' if k in ANCLAS_Q else 'Informe'
    if k in ESC_EXTRA:
        a, b, mx, fuente = ESC_EXTRA[k]
    pol = 'inversa' if k in INVERSA else 'directa'
    e3 = ESC3.get(k, (None, None, None))
    if k in INVERSA:
        fuente = INVERSA[k] if k not in ESC_EXTRA else ESC_EXTRA[k][3]
    sql.append("INSERT INTO EF_ESCALA VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s);" % (
        q(k), q(a), q(b), 'NULL' if mx is None else mx, q(pol), q(e3[0]), q(e3[1]), q(e3[2]), q(fuente)))

# figura del informe y decimales con que la imprime
FIG = {'sd_localidad': ('Tabla 3', 2), 'sd_municipio': ('Tabla 4', 2), 'sd_edad': ('Figura 1', 2), 'sd_genero': ('Figura 2', 2), 'sd_educacion': ('Figura 3', 0),
       'sd_ocupacion': ('Figura 4', 1), 'sd_estrato': ('Figura 5', 1), 'sd_servidor': ('Figura 6', 1), 'sd_autopercepcion': ('Figura 6', 1),
       'ci_q1': ('Figura 7', 1), 'ci_q2': ('Figura 8', 2), 'ci_q3': ('Figura 9', 2), 'ci_q4': ('Figura 10', 2), 'ci_q5': ('Figura 11', 2),
       'ci_q6': ('Figura 12', 2), 'ci_q7': ('Figura 13', 2), 'ci_q9_matrix': ('Figura 14', 2), 'ci_q10_matrix': ('Tabla 6', 2), 'ci_q8': ('Figura 15', 2),
       'cr_q1_matrix': ('Figura 16', 2), 'cr_q2': ('Figura 17', 2), 'cr_q3_matrix': ('Figura 18', 2), 'cr_q4': ('Figura 19', 2), 'cr_q5': ('Figura 20', 2),
       'cr_q6': ('Figura 21', 2), 'cr_q7': ('Figura 22', 2), 'pa_q1': ('Tabla 7', 1), 'pa_q2_matrix': ('Figura 23', 1), 'pa_q4_open': ('Tabla 8', 1),
       'pa_q5': ('Figura 24', 2), 'pa_q6': ('Figura 25', 2), 'pa_q7_matrix': ('Tabla 9', 2), 'pa_q8': ('Figura 26', 1), 'pa_q9': ('Figura 27', 1),
       'pa_q10_matrix': ('Figura 28', 2), 'pa_q11_matrix': ('Figura 29', 2), 'pa_q12': ('Figura 30', 2), 'pa_q13': ('Figura 31', 2),
       'pa_q14_si': ('Figura 32', 2), 'pa_q14_no': ('Figura 33', 2), 'ri_q1_matrix': ('Figura 34', 2), 'ri_q2': ('Figura 35', 2), 'ri_q3': ('Figura 36', 2),
       'ri_q4': ('Figura 37', 2), 'ri_q6': ('Tabla 10', 2), 'ri_q8': ('Figura 38', 2), 'ri_q10': ('Tabla 11', 1), 'tp_q1': ('Figura 40', 2),
       'sg_q1': ('Figura 41', 2), 'sg_q2': ('Figura 42', 2), 'sg_q3': ('Figura 43', 2), 'sg_q4': ('Figura 44', 2), 'sg_q5': ('Figura 45', 2),
       'sg_q9': ('Figura 46', 2), 'sg_q10_si': ('Figura 46', 2), 'mv_q1': ('Figura 47', 2), 'mv_q2': ('Figura 48', 2), 'mv_q4_matrix': ('Figura 49', 2),
       'mv_q5': ('Figura 50', 2), 'mv_q8': ('Figura 51', 2), 'de_q2': ('Figura 52', 2), 'de_q1': ('Figura 53', 2), 'de_q4': ('Figura 54', 2),
       'de_q3': ('Figura 55', 2), 'de_q7': ('Figura 56', 2), 'de_q8': ('Figura 56', 2), 'de_q10': ('Figura 56', 2), 'bie_q1_matrix': ('Figura 57', 2),
       'bie_q2': ('Figura 58', 2), 'bie_q3': ('Figura 58', 2), 'bie_q4': ('Figura 59', 2), 'bie_q5': ('Figura 59', 2), 'bie_q7_matrix': ('Figura 60', 2),
       'gp_q1': ('Figura 61', 2), 'gp_q5_matrix': ('Figura 62', 2), 'gp_q4': ('Figura 63', 2), 'gp_q6': ('Figura 64', 2), 'gp_q7': ('Figura 64', 2),
       'sp_q1_matrix': ('Tabla 12', 2), 'sp_q2_matrix': ('Tabla 12', 2), 'sp_q3_matrix': ('Tabla 12', 2), 'sp_q4_matrix': ('Tabla 12', 2),
       'sp_q5_matrix': ('Figura 65', 2), 'sp_q7_matrix': ('Figura 66', 2), 'sp_q6_matrix': ('Figura 67', 2)}
claves_reg = {pp['key'] for pp in reg['preguntas']}
for k, (fg, d) in FIG.items():
    assert k in claves_reg, k
    sql.append("INSERT INTO EF_FIGURA VALUES (%s,%s,%d,%d);" % (q(k), q(fg), d, 5 if k in ('cr_q1_matrix', 'cr_q3_matrix', 'ci_q10_matrix') else 3))


# ----------------------------------------------------------------------------- figuras especiales (Fase 2)
ESP = [   # clave, tipo, módulo, orden, título, figura, decimales, (bajo, medio, alto), [(clave_pregunta, etiqueta)]
    ('ci_alcalde_localidad', 'ranking', 'confianza', 11, 'Tabla 5. Calificación promedio de la gestión del Alcalde Mayor de Bogotá por localidad.', 'Tabla 5', 1, None, []),
    ('fig_06', 'paneles', 'sociodemografico', 14, 'Figura 6. Número y porcentaje de encuestados según lugar de nacimiento y cultura política.', 'Figura 6', 1, None,
     [('sd_servidor', 'Lugar de nacimiento'), ('sd_autopercepcion', 'Cultura política')]),
    ('fig_46', 'paneles', 'seguridad', 11, 'Figura 46. Porcentaje de encuestados que indicaron ser víctimas de un delito en 2025 que denunciaron y la percepción con la atención recibida por parte de las autoridades.',
     'Figura 46', 2, None, [('sg_q9', '¿Denunció el delito?'), ('sg_q10_si', 'Reacción de las autoridades')]),
    ('fig_56', 'agrupadas', 'empleabilidad', 12, 'Figura 56. Percepción de complejidad para emprender o iniciar un nuevo negocio, para conseguir empleo, y para cubrir sus necesidades básicas y costo de vida en Bogotá.',
     'Figura 56', 2, None, [('de_q7', 'Emprender'), ('de_q8', 'Conseguir empleo'), ('de_q10', 'Cubrir necesidades básicas y costo de vida')]),
    ('fig_58', 'agrupadas_3', 'bienestar', 9, 'Figura 58. Percepción sobre la buena gestión y suficiencia de los recursos destinados a la salud y educación en el Distrito Capital.',
     'Figura 58', 2, ('Desacuerdo (%)', 'Neutros (%)', 'Acuerdo (%)'),
     [('bie_q3', '"Los recursos de Educación son suficientes y están bien gestionados"'), ('bie_q2', '"Los recursos de Salud Pública son gestionados de manera eficiente"')]),
    ('fig_59', 'agrupadas_3', 'bienestar', 10, 'Figura 59. Satisfacción y percepción de transparencia sobre los subsidios que se entregan en la ciudad.',
     'Figura 59', 2, ('En desacuerdo', 'Neutro (%)', 'De acuerdo'),
     [('bie_q4', 'Satisfacción con la forma en que el Distrito dispone los subsidios y ayudas'),
      ('bie_q5', '"La priorización y focalización de beneficiarios es transparente y sin corrupción"')]),
    ('fig_64', 'agrupadas_3', 'planeacion', 9, 'Figura 64. Percepción sobre si los servidores públicos están bien capacitados y las entidades distritales tienen altas capacidades de gestión.',
     'Figura 64', 2, ('En desacuerdo', 'Indiferente', 'De acuerdo'),
     [('gp_q6', 'Los servidores públicos del Distrito son idóneos y bien capacitados'), ('gp_q7', 'Las entidades distritales cuentan con altas capacidades de gestión')]),
    ('tabla_12', 'tabla', 'servicios_publicos', 9, 'Tabla 12. Satisfacción con la calidad, continuidad, canales de comunicación, canales de atención y precio de la tarifa de los servicios públicos domiciliarios.',
     'Tabla 12', 2, None, [('sp_q1_matrix', 'EAAB'), ('sp_q2_matrix', 'VANTI'), ('sp_q3_matrix', 'ENEL'), ('sp_q4_matrix', 'Operadores de aseo')]),
]
FILAS_T12 = [(1, 1, 'Calidad del servicio'), (2, 5, 'Continuidad en la prestación del servicio'), (3, 3, 'Medios de comunicación'),
             (4, 2, 'Canales de atención a usuarios'), (5, 4, 'Precio de la tarifa')]   # (fila, item_orden en la matriz, rótulo del informe)
for (k, tp, mod, orden, titulo, fg, d, e3, series) in ESP:
    assert mod in reg['modulos'], mod
    for _, kp in [(0, x[0]) for x in series]:
        assert kp in claves_reg, kp
    e = e3 or (None, None, None)
    sql.append("INSERT INTO EF_FIGURA_ESPECIAL_DATOS VALUES (%s,%s,%s,%d,%s,%s,%d,%s,%s,%s);" % (q(k), q(tp), q(mod), orden, q(titulo), q(fg), d, q(e[0]), q(e[1]), q(e[2])))
    for i, (kp, et) in enumerate(series, 1):
        sql.append("INSERT INTO EF_FIGURA_SERIE_DATOS VALUES (%s,%d,%s,%s);" % (q(k), i, q(kp), q(et)))
for (f, it, et) in FILAS_T12:
    sql.append("INSERT INTO EF_FIGURA_FILA_DATOS VALUES ('tabla_12',%d,%d,%s);" % (f, it, q(et)))

# ----------------------------------------------------------------------------- categorías que el informe no grafica
for k, c in [('cr_q6', 'No sabe / no responde'), ('cr_q6', 'Partidos políticos')]:
    sql.append("INSERT INTO EF_CATEGORIA_OCULTA VALUES (%s,%s,%s);" % (q(k), q(c), q('El informe (Fig. 21) grafica 8 canales; esta opción existe en la base pero no se muestra')))

# ----------------------------------------------------------------------------- valores publicados por el informe
PUB = []   # (clave, figura, tipo, serie, categoria, valor, n, base, pct, orden)
for i, (c, n, p) in enumerate([('Seguridad', 820, 24.3), ('Hábitat', 370, 11.0), ('Educación', 264, 7.8), ('Desarrollo Económico', 257, 7.6),
        ('Ambiente', 160, 4.7), ('Movilidad', 158, 4.7), ('Gobierno', 154, 4.6), ('Cultura, Recreación y Deporte', 153, 4.5),
        ('Integración Social', 140, 4.1), ('Salud', 111, 3.3), ('Gestión Pública', 65, 1.9), ('Planeación', 54, 1.6), ('Hacienda', 31, 0.9),
        ('Mujer', 27, 0.8), ('Jurídica', 6, 0.2), ('Otros temas (no categorizados)', 1278, 37.8), ('Sin requerimiento / NSNR', 123, 3.6)], 1):
    PUB.append(('pa_q4_open', 'Tabla 8', 'distribucion', None, c, None, n, 3378, p, i))
for i, (c, n, p) in enumerate([('Hacienda', 457, 23.25), ('Movilidad', 376, 19.13), ('Salud', 182, 9.26), ('Servicios Públicos', 153, 7.78),
        ('Planeación', 108, 5.49), ('Gobierno', 100, 5.09), ('Educación', 93, 4.73), ('Seguridad', 87, 4.43), ('Integración Social', 86, 4.37),
        ('Hábitat', 72, 3.66), ('Cultura', 70, 3.56), ('Ambiente', 57, 2.90), ('Desarrollo Económico', 49, 2.49), ('Comisarías de Familia', 39, 1.98),
        ('Jurídica', 34, 1.73), ('Mujer', 31, 1.58), ('Gestión Pública', 21, 1.07)], 1):
    PUB.append(('ri_q6', 'Tabla 10', 'distribucion', None, c, None, n, 1966, p, i))
for i, (v, n, p) in enumerate([(1, 421, 21.41), (2, 242, 12.31), (3, 404, 20.55), (4, 482, 24.52), (5, 417, 21.21)], 1):
    PUB.append(('ri_q8', 'Figura 38', 'distribucion', None, str(v), float(v), n, 1966, p, i))
for i, (c, n, p) in enumerate([('Desinformación', 193, 36.9), ('Falta de transparencia', 189, 36.1), ('Inacción ante irregularidades', 135, 25.8),
        ('Obstrucción al cumplimiento de la ley', 109, 20.8), ('Mal uso de recursos públicos', 87, 16.6), ('Nepotismo', 76, 14.5),
        ('Uso indebido de información', 63, 12.0), ('Conflicto de interés', 57, 10.9), ('Sobornos', 51, 9.8), ('Fraude', 20, 3.8)], 1):
    PUB.append(('ri_q10', 'Tabla 11', 'distribucion', None, c, None, n, 523, p, i))
for i, (c, ins, sat) in enumerate([('Gobierno', 61.00, 21.00), ('Ambiente', 50.88, 22.81), ('Comisarías de Familia', 43.59, 33.33), ('Seguridad', 47.13, 34.48),
        ('Salud', 39.56, 36.81), ('Jurídica', 35.29, 38.24), ('Hábitat', 37.50, 38.89), ('Planeación', 41.67, 40.74), ('Educación', 36.56, 40.86),
        ('Movilidad', 41.76, 41.22), ('Mujer', 41.94, 41.94), ('Integración Social', 29.07, 43.02), ('Servicios Públicos', 30.72, 48.37),
        ('Desarrollo Económico', 32.65, 48.98), ('Gestión Pública', 23.81, 52.38), ('Cultura', 22.86, 60.00), ('Hacienda', 18.82, 61.27)], 1):
    PUB.append(('ri_q8', 'Figura 39', 'sector', 'Insatisfechos (1 y 2)', c, None, None, None, ins, i))
    PUB.append(('ri_q8', 'Figura 39', 'sector', 'Satisfechos (4 y 5)', c, None, None, None, sat, i))
GEN = 'Recomendaciones genéricas / ambiguas'
PLN = {
    'sg_q7_open': [('Control del delito y acción policial', 197, 42.7), ('Justicia, sanciones y normatividad', 88, 19.1),
                   ('Tecnología e Infraestructura para la seguridad', 18, 3.9), ('Prevención y Convivencia Ciudadana', None, 2.2),
                   ('Depuración Institucional', None, 1.3), (GEN, 142, 30.8)],
    'mv_q9_open': [('Ejecución de obras públicas', 89, 46.4), ('Infraestructura vial y espacio público', 27, 14.1),
                   ('Gestión del tráfico y operación de la movilidad', 16, 8.3), ('Gobernanza, planeación y transparencia', None, 7.8),
                   ('Control, regulación y sanción', None, 4.7), ('Cultura ciudadana y comportamiento vial', None, 2.1), (GEN, 32, 16.7)],
    'de_q11_open': [('Empleo y condiciones laborales', 51, 45.9), ('Inclusión y acceso a oportunidades económicas', 7, 6.3),
                    ('Regulación, trámites y entorno empresarial', 7, 6.3), ('Emprendimiento y fortalecimiento empresarial', None, 5.4),
                    ('Información, comunicación y acceso a programas', None, 3.6), ('Gobernanza, transparencia y corrupción', None, 3.6),
                    ('Modelo de desarrollo económico', None, 1.8), (GEN, 30, 27.0)],
    'bie_q8_open': [('Salud y acceso a servicios de salud', 27, 21.6), ('Relación con la ciudadanía y acceso institucional', 22, 17.6),
                    ('Entorno urbano y condiciones de vida', 16, 12.8), ('Servicios sociales y subsidios', None, 8.0),
                    ('Educación y desarrollo humano', None, 7.2), ('Gobernanza, focalización y equidad', None, 5.6), (GEN, 34, 27.2)],
    'gp_q8_open': [('Capacidad Institucional y Talento Humano', 22, 22.4), ('Participación Ciudadana', 20, 20.4),
                   ('Transparencia y Gobierno Abierto', 13, 13.3), ('Planeación, Articulación y Metas', None, 12.2),
                   ('Atención y Servicio al Ciudadano', None, 4.1), (GEN, 27, 27.6)],
    'sp_q8_open': [('Tarifas y Costos del Servicio', 33, 42.9), ('Calidad y Continuidad del Servicio', 16, 20.8),
                   ('Atención al Usuario y Resolución de PQRS', 7, 9.1), ('Regulación, Vigilancia y Control Estatal', None, 3.9),
                   ('Facturación y Cobros Indebidos', None, 1.3), ('Sostenibilidad y Cultura Ambiental', None, 1.3), (GEN, 16, 20.8)],
}
for k, lista in PLN.items():
    for i, (c, n, p) in enumerate(lista, 1):
        PUB.append((k, 'Análisis PLN (texto del informe)', 'pln', None, c, None, n, None, p, i))


def num(x):
    return 'NULL' if x is None else repr(x)


for (k, fig, tipo, serie, cat, val, n, base, pct, orden) in PUB:
    sql.append("INSERT INTO EF_INFORME_PUBLICADO (clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%d);"
               % (q(k), q(fig), q(tipo), q(serie), q(cat), num(val), num(n), num(base), num(pct), orden))

# ----------------------------------------------------------------------------- vistas
sql.append('''
-- ---------------------------------------------------------------- catálogos
CREATE OR REPLACE VIEW EF_ITEMS AS
SELECT i.clave, i.item_orden, i.id_pregunta, COALESCE(e.etiqueta, p.subitem_corto, p.subitem, CONCAT('Ítem ', i.item_orden)) AS item, p.n_respuestas
FROM EF_PREGUNTA_ITEM i JOIN preguntas p ON p.id_pregunta = i.id_pregunta
LEFT JOIN EF_ETIQUETA_ITEM e ON e.clave = i.clave AND e.item_orden = i.item_orden;

CREATE OR REPLACE VIEW EF_CATALOGO_PREGUNTAS AS
SELECT q.clave, q.modulo_clave, q.orden,
       CASE WHEN q.tipo_registro IN ('matrix_likert_5', 'multi_binary', 'open', 'multi_category') THEN q.tipo_registro
            WHEN p.tipo_respuesta = 'escala' THEN 'likert_5' ELSE 'multi_choice' END AS tipo,
       CONCAT(IF(p.numero_pregunta IS NULL, '', CONCAT(p.numero_pregunta, '. ')), p.enunciado) AS pregunta,
       (p.tipo_respuesta = 'multiple' OR q.tipo_registro = 'multi_category') AS es_seleccion_multiple,
       (SELECT COUNT(*) FROM EF_PREGUNTA_ITEM x WHERE x.clave = q.clave) AS n_items,
       COALESCE(es.ancla_min, q.ancla_min) AS ancla_min, COALESCE(es.ancla_max, q.ancla_max) AS ancla_max, COALESCE(es.escala_max, q.escala_max) AS escala_max,
       COALESCE(es.polaridad, 'directa') AS polaridad, es.etiqueta_bajo, es.etiqueta_medio, es.etiqueta_alto, f.figura, f.decimales, f.niveles
FROM EF_PREGUNTA q
JOIN EF_PREGUNTA_ITEM i ON i.clave = q.clave AND i.item_orden = 1
JOIN preguntas p ON p.id_pregunta = i.id_pregunta
LEFT JOIN EF_ESCALA es ON es.clave = q.clave
LEFT JOIN EF_FIGURA f ON f.clave = q.clave;

CREATE OR REPLACE VIEW EF_CATALOGO_MODULOS AS
SELECT a.anio, m.clave, m.nombre,
       REPLACE(m.descripcion, '3.684', REPLACE(FORMAT(COALESCE(c.n, 0), 0), ',', '.')) AS descripcion,
       m.color, m.orden, m.opcional, m.sin_numero, m.es_transicion,
       (SELECT COUNT(*) FROM EF_PREGUNTA_ITEM i JOIN EF_PREGUNTA q ON q.clave = i.clave WHERE q.modulo_clave = m.clave) AS variables_totales,
       (SELECT COUNT(*) FROM EF_PREGUNTA q WHERE q.modulo_clave = m.clave) AS preguntas_principales,
       CASE WHEN m.clave IN ('sociodemografico', 'confianza') THEN COALESCE(c.n, 0)
            ELSE COALESCE((SELECT MAX(rp.n) FROM EF_PREGUNTA_ITEM i JOIN EF_PREGUNTA q ON q.clave = i.clave
                  JOIN EF_RESPUESTAS_PREGUNTA rp ON rp.id_pregunta = i.id_pregunta AND rp.anio = a.anio WHERE q.modulo_clave = m.clave), 0) END AS respuestas_validas
FROM EF_MODULO m CROSS JOIN EF_ANIO a
LEFT JOIN EF_RESPUESTAS_PREGUNTA c ON c.id_pregunta = 15 AND c.anio = a.anio;

-- ---------------------------------------------------------------- bases de conteo por segmento (todos / género / edad / ocupación)
-- Los conteos se calculan desde las respuestas (vistas v_pub_*) y se guardan para que las gráficas respondan rápido.
-- Si cambian las respuestas: CALL EF_REFRESCAR_CONTEOS();
DELIMITER $$
CREATE PROCEDURE EF_REFRESCAR_CONTEOS_ANIO(IN p_anio SMALLINT UNSIGNED)
BEGIN
  DELETE FROM EF_CONTEO_SEGMENTO WHERE p_anio IS NULL OR anio = p_anio;
  DELETE FROM EF_RESPONDIENTES_SEGMENTO WHERE p_anio IS NULL OR anio = p_anio;
  DELETE FROM EF_RESPUESTAS_PREGUNTA WHERE p_anio IS NULL OR anio = p_anio;
  INSERT INTO EF_RESPUESTAS_PREGUNTA
  SELECT e.anio, r.id_pregunta, COUNT(*) FROM respuestas r JOIN encuestados e ON e.id_encuestado = r.id_encuestado
  WHERE p_anio IS NULL OR e.anio = p_anio GROUP BY e.anio, r.id_pregunta;
  INSERT INTO EF_CONTEO_SEGMENTO
  SELECT anio, id_pregunta, categoria, 'todos', 'todos', MIN(CASE WHEN categoria IN ('Sí', 'No') THEN NULL ELSE valor_numerico END), SUM(n)
  FROM v_pub_distribucion WHERE p_anio IS NULL OR anio = p_anio GROUP BY anio, id_pregunta, categoria
  UNION ALL
  SELECT anio, id_pregunta, categoria, 'genero', genero_grupo, MIN(CASE WHEN categoria IN ('Sí', 'No') THEN NULL ELSE valor_numerico END), SUM(n)
  FROM v_pub_distribucion WHERE (p_anio IS NULL OR anio = p_anio) AND genero_grupo IN ('Femenino', 'Masculino', 'Otro') GROUP BY anio, id_pregunta, categoria, genero_grupo
  UNION ALL
  SELECT anio, id_pregunta, categoria, 'edad', edad_grupo, MIN(CASE WHEN categoria IN ('Sí', 'No') THEN NULL ELSE valor_numerico END), SUM(n)
  FROM v_pub_distribucion WHERE (p_anio IS NULL OR anio = p_anio) AND edad_grupo <> 'Sin dato' GROUP BY anio, id_pregunta, categoria, edad_grupo
  UNION ALL
  SELECT anio, id_pregunta, categoria, 'ocupacion', ocupacion_grupo, MIN(CASE WHEN categoria IN ('Sí', 'No') THEN NULL ELSE valor_numerico END), SUM(n)
  FROM v_pub_distribucion WHERE (p_anio IS NULL OR anio = p_anio) AND ocupacion_grupo IN ('Servidores distritales', 'Ciudadanía') GROUP BY anio, id_pregunta, categoria, ocupacion_grupo;
  INSERT INTO EF_RESPONDIENTES_SEGMENTO
  SELECT anio, id_pregunta, 'todos', 'todos', SUM(n) FROM v_pub_encuestados WHERE p_anio IS NULL OR anio = p_anio GROUP BY anio, id_pregunta
  UNION ALL SELECT anio, id_pregunta, 'genero', genero_grupo, SUM(n) FROM v_pub_encuestados WHERE (p_anio IS NULL OR anio = p_anio) AND genero_grupo IN ('Femenino', 'Masculino', 'Otro') GROUP BY anio, id_pregunta, genero_grupo
  UNION ALL SELECT anio, id_pregunta, 'edad', edad_grupo, SUM(n) FROM v_pub_encuestados WHERE (p_anio IS NULL OR anio = p_anio) AND edad_grupo <> 'Sin dato' GROUP BY anio, id_pregunta, edad_grupo
  UNION ALL SELECT anio, id_pregunta, 'ocupacion', ocupacion_grupo, SUM(n) FROM v_pub_encuestados WHERE (p_anio IS NULL OR anio = p_anio) AND ocupacion_grupo IN ('Servidores distritales', 'Ciudadanía') GROUP BY anio, id_pregunta, ocupacion_grupo;
END$$
CREATE PROCEDURE EF_REFRESCAR_CONTEOS()
BEGIN
  CALL EF_REFRESCAR_CONTEOS_ANIO(NULL);
END$$
DELIMITER ;

CALL EF_REFRESCAR_CONTEOS();

CREATE OR REPLACE VIEW EF_BASE_CONTEO AS SELECT * FROM EF_CONTEO_SEGMENTO;
CREATE OR REPLACE VIEW EF_BASE_RESPONDIENTES AS SELECT * FROM EF_RESPONDIENTES_SEGMENTO;
CREATE OR REPLACE VIEW EF_BASE_RESPUESTAS AS SELECT * FROM EF_RESPUESTAS_PREGUNTA;

-- ---------------------------------------------------------------- gráficas
-- Barras de distribución: una fila por pregunta/ítem, segmento y categoría. porcentaje = n / base (personas que respondieron en el segmento).
CREATE OR REPLACE VIEW EF_GRAFICA_DISTRIBUCION AS
SELECT c.anio, q.clave, i.item_orden, i.item, c.segmento_tipo, c.segmento, c.categoria, c.n, b.n AS base,
       ROUND(100 * c.n / b.n, 4) AS porcentaje, c.valor_numerico,
       COALESCE(h.orden, c.valor_numerico) AS orden_categoria,
       CASE WHEN COUNT(c.valor_numerico) OVER w = COUNT(*) OVER w THEN ROUND(CAST(SUM(c.valor_numerico * c.n) OVER w AS DECIMAL(24,8)) / SUM(c.n) OVER w, 2) END AS promedio
FROM EF_PREGUNTA q
JOIN EF_ITEMS i ON i.clave = q.clave
JOIN EF_BASE_CONTEO c ON c.id_pregunta = i.id_pregunta
JOIN EF_BASE_RESPONDIENTES b ON b.anio = c.anio AND b.id_pregunta = i.id_pregunta AND b.segmento_tipo = c.segmento_tipo AND b.segmento = c.segmento
JOIN preguntas p ON p.id_pregunta = i.id_pregunta
LEFT JOIN (SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden FROM homologacion GROUP BY tipo_homologacion, valor_homologado) h
       ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = c.categoria
LEFT JOIN EF_CATEGORIA_OCULTA oc ON oc.clave = q.clave AND oc.categoria = c.categoria
WHERE oc.clave IS NULL
WINDOW w AS (PARTITION BY c.anio, q.clave, i.item_orden, c.segmento_tipo, c.segmento);

-- Barras apiladas bajo / medio / alto. Escala 1-5: bajo = 1-2, medio = 3, alto = 4-5. Escala 1-10: bajo = 1-4, medio = 5-6, alto = 7-10.
CREATE OR REPLACE VIEW EF_GRAFICA_MATRIZ_COMPARATIVA AS
SELECT d.anio, d.clave, d.item_orden, d.item, d.segmento_tipo, d.segmento, SUM(d.n) AS n,
       SUM(CASE WHEN d.valor_numerico <= IF(e.maximo > 5, 4, 2) THEN d.n ELSE 0 END) AS n_bajo,
       SUM(CASE WHEN d.valor_numerico > IF(e.maximo > 5, 4, 2) AND d.valor_numerico < IF(e.maximo > 5, 7, 4) THEN d.n ELSE 0 END) AS n_medio,
       SUM(CASE WHEN d.valor_numerico >= IF(e.maximo > 5, 7, 4) THEN d.n ELSE 0 END) AS n_alto,
       ROUND(100 * SUM(CASE WHEN d.valor_numerico <= IF(e.maximo > 5, 4, 2) THEN d.n ELSE 0 END) / SUM(d.n), 4) AS pct_bajo,
       ROUND(100 * SUM(CASE WHEN d.valor_numerico > IF(e.maximo > 5, 4, 2) AND d.valor_numerico < IF(e.maximo > 5, 7, 4) THEN d.n ELSE 0 END) / SUM(d.n), 4) AS pct_medio,
       ROUND(100 * SUM(CASE WHEN d.valor_numerico >= IF(e.maximo > 5, 7, 4) THEN d.n ELSE 0 END) / SUM(d.n), 4) AS pct_alto,
       MAX(d.promedio) AS promedio, e.maximo AS escala_max
FROM EF_GRAFICA_DISTRIBUCION d
JOIN (SELECT anio, clave, item_orden, MAX(valor_numerico) AS maximo FROM EF_GRAFICA_DISTRIBUCION WHERE segmento_tipo = 'todos' GROUP BY anio, clave, item_orden) e
  ON e.anio = d.anio AND e.clave = d.clave AND e.item_orden = d.item_orden
WHERE d.promedio IS NOT NULL
GROUP BY d.anio, d.clave, d.item_orden, d.item, d.segmento_tipo, d.segmento, e.maximo;

-- Sí / No por mecanismo de participación (preguntas binarias)
CREATE OR REPLACE VIEW EF_GRAFICA_BINARIA AS
SELECT d.anio, d.clave, d.item_orden, d.item, d.segmento_tipo, d.segmento,
       SUM(CASE WHEN d.categoria = 'Sí' THEN d.n ELSE 0 END) AS n_si,
       SUM(CASE WHEN d.categoria = 'No' THEN d.n ELSE 0 END) AS n_no,
       SUM(d.n) AS total,
       ROUND(100 * SUM(CASE WHEN d.categoria = 'Sí' THEN d.n ELSE 0 END) / SUM(d.n), 4) AS pct_si,
       ROUND(100 * SUM(CASE WHEN d.categoria = 'No' THEN d.n ELSE 0 END) / SUM(d.n), 4) AS pct_no
FROM EF_GRAFICA_DISTRIBUCION d
JOIN EF_PREGUNTA q ON q.clave = d.clave AND q.tipo_registro = 'multi_binary'
GROUP BY d.anio, d.clave, d.item_orden, d.item, d.segmento_tipo, d.segmento;

-- Figuras que combinan preguntas o no son una pregunta (Tabla 5, figs. 6, 46, 56, 58, 59, 64 y tabla 12)
CREATE OR REPLACE VIEW EF_CATALOGO_FIGURAS AS SELECT clave, tipo, modulo_clave, orden, titulo, figura, decimales, etiqueta_bajo, etiqueta_medio, etiqueta_alto FROM EF_FIGURA_ESPECIAL_DATOS;
CREATE OR REPLACE VIEW EF_CATALOGO_FIGURAS_SERIES AS SELECT clave, serie_orden, clave_pregunta, etiqueta FROM EF_FIGURA_SERIE_DATOS;
CREATE OR REPLACE VIEW EF_CATALOGO_FIGURAS_FILAS AS SELECT clave, fila_orden, item_orden, etiqueta FROM EF_FIGURA_FILA_DATOS;

-- Valores tal como los publica el informe (cuando la base no permite recalcularlos)
CREATE OR REPLACE VIEW EF_GRAFICA_INFORME_PUBLICADO AS
SELECT clave, figura, tipo, serie, categoria, valor_numerico, n, base, porcentaje, orden, nota FROM EF_INFORME_PUBLICADO;

-- Escala 1-5 publicada (Fig. 38): bajo = 1-2, medio = 3, alto = 4-5; el promedio se calcula con los conteos publicados
CREATE OR REPLACE VIEW EF_GRAFICA_INFORME_ESCALA AS
SELECT clave, figura, SUM(n) AS n,
       SUM(CASE WHEN valor_numerico <= 2 THEN n ELSE 0 END) AS n_bajo, SUM(CASE WHEN valor_numerico = 3 THEN n ELSE 0 END) AS n_medio,
       SUM(CASE WHEN valor_numerico >= 4 THEN n ELSE 0 END) AS n_alto,
       ROUND(100 * SUM(CASE WHEN valor_numerico <= 2 THEN n ELSE 0 END) / SUM(n), 4) AS pct_bajo,
       ROUND(100 * SUM(CASE WHEN valor_numerico = 3 THEN n ELSE 0 END) / SUM(n), 4) AS pct_medio,
       ROUND(100 * SUM(CASE WHEN valor_numerico >= 4 THEN n ELSE 0 END) / SUM(n), 4) AS pct_alto,
       ROUND(SUM(valor_numerico * n) / SUM(n), 2) AS promedio
FROM EF_INFORME_PUBLICADO WHERE tipo = 'distribucion' AND valor_numerico IS NOT NULL GROUP BY clave, figura;

-- Fig. 39 publicada: satisfacción por sector; n sale de la Tabla 10 y el neutro es lo que resta para 100
CREATE OR REPLACE VIEW EF_GRAFICA_SATISFACCION_SECTOR_INFORME AS
SELECT i.clave, ROW_NUMBER() OVER (ORDER BY s.porcentaje DESC, i.categoria) AS orden, i.categoria AS sector, t.n,
       i.porcentaje AS insatisfaccion, s.porcentaje AS satisfaccion, ROUND(100 - i.porcentaje - s.porcentaje, 2) AS neutro
FROM EF_INFORME_PUBLICADO i
JOIN EF_INFORME_PUBLICADO s ON s.clave = i.clave AND s.figura = i.figura AND s.categoria = i.categoria AND s.serie LIKE 'Satisfechos%'
LEFT JOIN EF_INFORME_PUBLICADO t ON t.clave = 'ri_q6' AND t.figura = 'Tabla 10' AND t.categoria = i.categoria
WHERE i.figura = 'Figura 39' AND i.serie LIKE 'Insatisfechos%';

-- Tabla 5: calificación media de la gestión del Alcalde por localidad; «Bogotá Región» = quienes no viven en Bogotá
CREATE OR REPLACE VIEW EF_GRAFICA_LOCALIDAD_ALCALDE AS
SELECT e.anio, COALESCE(l.respuesta_original, 'Bogotá Región') AS localidad, COUNT(*) AS n, ROUND(CAST(SUM(a.valor_numerico) AS DECIMAL(24,8)) / COUNT(*), 2) AS promedio,
       ROUND(100 * COUNT(*) / (SELECT rp.n FROM EF_RESPUESTAS_PREGUNTA rp WHERE rp.id_pregunta = 15 AND rp.anio = e.anio), 1) AS porcentaje
FROM respuestas a
JOIN encuestados e ON e.id_encuestado = a.id_encuestado
LEFT JOIN respuestas l ON l.id_encuestado = a.id_encuestado AND l.id_pregunta = 4
WHERE a.id_pregunta = 15 AND a.valor_numerico IS NOT NULL
GROUP BY e.anio, COALESCE(l.respuesta_original, 'Bogotá Región');

-- Satisfacción con el trámite por sector, de mayor a menor satisfacción
CREATE OR REPLACE VIEW EF_GRAFICA_SATISFACCION_SECTOR AS
SELECT anio, 'ri_q8' AS clave, ROW_NUMBER() OVER (PARTITION BY anio ORDER BY satisfaccion DESC, n DESC, sector) AS orden,
       sector, n, promedio, satisfaccion, neutro, insatisfaccion
FROM v_pub_sector_satisfaccion;

CREATE OR REPLACE VIEW EF_GRAFICA_NUBE_PALABRAS AS
SELECT d.anio, i.clave, d.posicion, d.palabra, d.menciones
FROM EF_NUBE_PALABRAS_DATOS d JOIN EF_PREGUNTA_ITEM i ON i.id_pregunta = d.id_pregunta AND i.item_orden = 1;

CREATE OR REPLACE VIEW EF_GRAFICA_TEMAS_RESUMEN AS
SELECT anio, 'pa_q4_open' AS clave, respondientes, con_tema, multitema, sin_tema_asignado,
       ROUND(100 * sin_tema_asignado / respondientes, 1) AS pct_sin_tema, ROUND(100 * multitema / respondientes, 1) AS pct_multitema
FROM v_pub_temas_stats;
''')

vistas = ['EF_ITEMS', 'EF_CATALOGO_PREGUNTAS', 'EF_CATALOGO_MODULOS', 'EF_BASE_CONTEO', 'EF_BASE_RESPONDIENTES', 'EF_BASE_RESPUESTAS', 'EF_GRAFICA_DISTRIBUCION',
          'EF_GRAFICA_MATRIZ_COMPARATIVA', 'EF_GRAFICA_BINARIA', 'EF_GRAFICA_SATISFACCION_SECTOR', 'EF_GRAFICA_NUBE_PALABRAS', 'EF_GRAFICA_TEMAS_RESUMEN',
          'EF_CATALOGO_FIGURAS', 'EF_CATALOGO_FIGURAS_SERIES', 'EF_CATALOGO_FIGURAS_FILAS', 'EF_GRAFICA_INFORME_PUBLICADO', 'EF_GRAFICA_INFORME_ESCALA', 'EF_GRAFICA_SATISFACCION_SECTOR_INFORME', 'EF_GRAFICA_LOCALIDAD_ALCALDE']
sql.append('-- La aplicación pública lee solo estas vistas')
for v in vistas:
    sql.append("GRANT SELECT ON eficiencia.%s TO 'web_publico'@'%%';" % v)

(ROOT / 'mysql/init/06_vistas_explora.sql').write_text('\n'.join(sql) + '\n', encoding='utf-8')
print('preguntas', len(reg['preguntas']), 'nubes', len(conteo), 'vistas', len(vistas))
