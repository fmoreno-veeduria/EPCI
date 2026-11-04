#!/usr/bin/env python3
"""
Lee BDD_EPCI_Anon.xlsx y genera todo lo que necesita el contenedor MySQL `eficiencia`:

  mysql/seed/*.csv               datos listos para LOAD DATA
  mysql/init/03_views.sql        vistas (base tipo Excel + vistas para graficas)

El esquema (01_schema.sql) y la carga (02_load.sql) son estaticos y estan versionados aparte.
Uso:   python etl/build_seed.py [ruta.xlsx]
"""
import csv
import hashlib
import re
import sys
import unicodedata
from collections import Counter, OrderedDict, defaultdict
from pathlib import Path

import openpyxl
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parent.parent
XLSX = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "BDD_EPCI_Anon.xlsx"
SEED = ROOT / "mysql" / "seed"
INIT = ROOT / "mysql" / "init"
SEED.mkdir(parents=True, exist_ok=True)
INIT.mkdir(parents=True, exist_ok=True)


# ----------------------------------------------------------------------------- utilidades
def clean(s):
    s = str(s).replace("\r\n", "\n").replace("\r", "\n").replace("\xa0", " ")
    return re.sub(r"[ \t]+", " ", s).strip()


def norm(s):
    s = unicodedata.normalize("NFD", clean(s).lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", s).strip()


def cell(v):
    if v is None:
        return None
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    v = clean(v)
    return v or None


def split_multi(v):
    """Separa una respuesta de seleccion multiple: ', ' + Mayuscula fuera de parentesis."""
    v = v.replace("Cultura, Recreación", "Cultura‚ Recreación")
    out, depth, cur, i = [], 0, "", 0
    while i < len(v):
        ch = v[i]
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth = max(0, depth - 1)
        if ch == "," and depth == 0 and v[i + 1:i + 2] == " " and re.match(r"[A-ZÁÉÍÓÚÑ¿]", v[i + 2:i + 3] or ""):
            out.append(cur)
            cur = ""
            i += 2
            continue
        cur += ch
        i += 1
    out.append(cur)
    return [o.replace("‚", ",").strip() for o in out if o.strip()]


# ----------------------------------------------------------------------------- lectura
wb = openpyxl.load_workbook(XLSX, read_only=True)
raw = list(wb.worksheets[0].iter_rows(values_only=True))
HDR = [clean(h) for h in raw[0]]
DATA = [[cell(v) for v in r] for r in raw[1:]]
NCOL = len(HDR)
NROW = len(DATA)
print(f"Excel: {NROW} filas x {NCOL} columnas")


def col_values(j):
    return [r[j] for r in DATA if r[j] is not None]


# ----------------------------------------------------------------------------- modulos
MODULOS = [
    (0, 1, "Filtros y autorización"),
    (2, 13, "Caracterización sociodemográfica"),
    (14, 42, "Confianza institucional"),
    (43, 66, "Cultura ciudadana e información"),
    (67, 105, "Participación ciudadana y control social"),
    (106, 120, "Transparencia, integridad y trámites"),
    (121, 122, "Selector de módulos opcionales"),
    (123, 133, "Módulo Seguridad y justicia"),
    (134, 148, "Módulo Obras y movilidad"),
    (149, 159, "Módulo Desarrollo económico"),
    (160, 176, "Módulo Bienestar"),
    (177, 186, "Módulo Planeación y gestión pública"),
    (187, 218, "Módulo Servicios públicos domiciliarios"),
    (219, 219, "Selector de otro módulo"),
]


def modulo_de(j):
    for a, b, n in MODULOS:
        if a <= j <= b:
            return n


# ----------------------------------------------------------------------------- etiquetas cortas de sub-items
SUB = {}
def _s(start, labels):
    for k, l in enumerate(labels):
        SUB[start + k] = l

_s(22, ["Secretarías Distritales", "Alcaldías Locales", "Policía Metropolitana", "Organismos de Control",
        "Entidades adscritas e institutos", "Órganos de justicia distritales", "Comisarías de Familia", "Servidores públicos"])
_s(30, ["Escándalos de corrupción", "Resultados visibles de la gestión", "Cumple objetivos y misión", "Servicio eficiente",
        "Buenos canales de comunicación", "Liderazgo del jefe de la entidad", "Cumple planes y proyectos",
        "Responde solicitudes ciudadanas", "Cumple compromisos pactados", "Publica datos claros y periódicos",
        "Interlocución permanente en territorio", "Canales para proponer ideas", "Comunicación en redes sociales"])
_s(43, ["Espacios culturales", "Jornadas de salud", "Eventos institucionales", "Espacios deportivos",
        "Jornadas de bienestar", "Espacios de colaboración"])
_s(50, ["Pago de impuestos", "Normas sociales", "Reciclaje activo", "Pago del pasaje", "Normas viales",
        "Estacionamiento permitido", "Ahorro de agua", "Ahorro de energía", "Cuidado del espacio público",
        "Recolección de heces de mascotas", "Disposición de residuos", "Respeto por las filas", "Respeto por la palabra del otro"])
_s(68, ["Audiencias públicas", "Instancias distritales", "Instancias locales", "Presupuestos participativos",
        "Control social", "Espacios no formales"])
_s(78, ["Beneficio particular", "Deber ciudadano", "Influir en decisiones", "Curiosidad por el tema",
        "Conocer y relacionarse", "Ser elegido o representante", "Resolver problema personal"])
_s(87, ["Colaboración entre sectores", "Reducir corrupción y clientelismo", "Diálogo institución-ciudadanía",
        "Fortalecer organizaciones sociales", "Conocimiento de la ciudad", "Confianza en instituciones",
        "Empoderar grupos y comunidades", "Sentido de pertenencia por lo público", "Incluir ciudadanos en decisiones"])
_s(96, ["Iniciativas normativas", "Firmas para referendo", "Plebiscito", "Consultas populares",
        "Revocatoria del mandato", "Cabildos abiertos"])
_s(106, ["Es efectivo denunciar", "Denunciar reduce la corrupción", "Servidores actúan por interés general",
         "Administración ética y transparente", "Contratación pública transparente", "Medidas efectivas anticorrupción"])
_s(137, ["Sec. de Movilidad", "IDU", "UAERMV", "Transmilenio", "La Rolita", "Terminal de Transporte", "Metro de Bogotá"])
_s(160, ["Educación preescolar", "Educación básica", "Educación media", "Educación superior", "Salud", "Cultura", "Deporte"])
_s(172, ["Sec. de Salud", "Sec. de Educación", "Sec. de Cultura, Recreación y Deporte", "Sec. de Integración Social"])
_s(181, ["Calidad de servicios", "Canales de atención", "Medios de comunicación"])
for k, op in enumerate(["EAAB", "VANTI", "ENEL", "Aseo"]):
    _s(187 + 5 * k, [f"{op} – {a}" for a in ["Calidad", "Canales de atención", "Medios de comunicación", "Tarifa", "Continuidad"]])
_s(207, ["Claridad de recibos y facturas", "Facilidad para pagar", "Tarifa de los servicios"])
_s(210, [f"Condición {i} (encabezado truncado en el Excel)" for i in range(1, 5)])
_s(214, ["Accesibilidad de canales", "Facilidad de gestión", "Confianza en la empresa", "Atención de solicitudes"])

# ----------------------------------------------------------------------------- tipos de columna
OPEN_COLS = {75, 129, 148, 159, 176, 186, 218}      # texto libre (75 se clasifica por temas)
THEMES_COL = 75

ACUERDO = {"totalmente en desacuerdo": 1, "en desacuerdo": 2, "ni de acuerdo ni en desacuerdo": 3,
           "de acuerdo": 4, "totalmente de acuerdo": 5}
SEGURIDAD = {"completamente inseguro": 1, "inseguro": 2, "ni seguro ni inseguro": 3, "seguro": 4, "completamente seguro": 5}
PROB = {"muy baja": 1, "baja": 2, "moderada": 3, "alta": 4, "muy alta": 5}
REACC = {"muy mala": 1, "mala": 2, "regular": 3, "buena": 4, "muy buena": 5}
LIKERTS = [("LIKERT_ACUERDO", ACUERDO), ("LIKERT_SEGURIDAD", SEGURIDAD),
           ("LIKERT_PROB_SANCION", PROB), ("LIKERT_REACCION", REACC)]

SCALE_RE = re.compile(r"^(10|[1-9])\s*(\.\s*.*)?$", re.S)


def nkey(v):
    return norm(v).replace(",", "")


# ----- homologaciones categoricas especificas (valor -> etiqueta)
def h_vive(v):
    n = norm(v)
    if n.startswith("si, vivo"):
        return "Vive en Bogotá"
    if "ni en sus alrededores" in n:
        return "Sin vínculo con Bogotá"
    return "No vive, pero tiene vínculo (trabajo, estudio o tributario)"


MUN_GRANDES = {"Soacha", "Mosquera", "Chía", "Madrid", "Cajicá"}
MUN_COUNT = Counter(col_values(4))
def h_municipio(v):
    if v in MUN_GRANDES:
        return v
    return "Otro municipio de Colombia" if norm(v).startswith("otro municipio") else "Otros municipios de Cundinamarca"


def h_genero(v):
    n = norm(v)
    if n in ("femenino", "masculino"):
        return clean(v)
    if n.startswith("prefiero"):
        return "Prefiere no responder"
    return "Otras identidades de género"


def h_edad(v):
    n = norm(v)
    for k, l in [("18", "18 a 25 años"), ("26", "26 a 35 años"), ("36", "36 a 45 años"), ("46", "46 a 55 años"), ("56", "56 años o más")]:
        if k in n.split("entre ")[-1][:3] or n.startswith(k):
            return l
    return clean(v)


def h_educ(v):
    n = norm(v)
    if "postgrado" in n:
        return "Postgrado"
    if "universitaria" in n:
        return "Universitaria"
    if "tecnica" in n:
        return "Técnica o tecnológica"
    return "Secundaria o menos"


def h_ocup(v):
    n = norm(v)
    if "estudiante" in n:
        return "Estudiante"
    if "desempleado" in n:
        return "Desempleado(a) o en búsqueda de empleo"
    if "hogar" in n:
        return "Trabajos del cuidado o del hogar"
    if "jubilado" in n:
        return "Jubilado(a) o pensionado(a)"
    if "independiente" in n and "public" in n:
        return "Independiente / contratista sector público"
    if "independiente" in n and "privad" in n:
        return "Independiente / contratista sector privado"
    if "empleado" in n and "public" in n:
        return "Empleado(a) sector público"
    if "empleado" in n and "privad" in n:
        return "Empleado(a) sector privado"
    return "Otra ocupación (multilateral u otra)"


def h_discap(v):
    n = norm(v)
    if n.startswith("no tengo"):
        return "Sin discapacidad"
    if "caminar" in n:
        return "Movilidad"
    if "ver" in n.split():
        return "Visual"
    if "oir" in n:
        return "Auditiva"
    if "recordar" in n:
        return "Cognitiva (recordar o concentrarse)"
    return "Otra discapacidad"


def h_etnia(v):
    n = norm(v)
    if n.startswith("no pertenezco"):
        return "Ninguno"
    if "afro" in n or "negro" in n:
        return "Afrodescendiente"
    if "indigena" in n:
        return "Indígena"
    return "Otro grupo étnico (raizal, ROM, palenquero u otro)"


def h_ingresos(v):
    n = norm(v)
    if n.startswith("menos de 1") or n.startswith("entre 1"):
        return "Menos de 2 SMMLV"
    if n.startswith("entre 2") or n.startswith("entre 3"):
        return "De 2 a menos de 4 SMMLV"
    return "4 o más SMMLV"


def h_nacio(v):
    n = norm(v)
    if "bogota" in n:
        return "Bogotá"
    if "cundinamarca" in n:
        return "Municipio de Cundinamarca"
    if "otro municipio" in n:
        return "Otro municipio de Colombia"
    return "Fuera de Colombia"


def h_ciudadano(v):
    n = norm(v)
    if "desinteresado" in n:
        return "Desinteresado(a) o indiferente"
    if "activista" in n:
        return "Activista político(a) o comunitario(a)"
    return "Interesado(a) en asuntos públicos"


def h_tema_prioritario(v):
    return "Sin respuesta (finalizó el formulario)" if "finalizar" in norm(v) else clean(v)


def h_razon_no_control(v):
    n = norm(v)
    rules = [
        (r"tiempo|horario|carga laboral|labor|trabajo|cruza con otras", "Falta de tiempo"),
        (r"informacion", "Falta de información"),
        (r"riesgos a mi seguridad|temor|amenaz", "Riesgo o temor (seguridad / ser desacreditado)"),
        (r"no sirve|no sirven|rosca|manoseo|coptad|arbitrari|tramitologia|politiq", "Desconfianza: no sirve o está cooptado"),
        (r"hay personas que lo hacen mejor|funcionarios de entidades|siempre lo realizan", "Otras personas lo hacen mejor"),
        (r"no me interesa|desinteres|no lo dire", "Falta de interés"),
        (r"participo|participa|ninguna de las razones|contractual|servidor|comite local", "Ya participa / ninguna razón"),
        (r"extranjer|exterior|no naci|llegue hace poco|edad|no aplica|^x$", "No aplica / otra circunstancia personal"),
    ]
    for p, l in rules:
        if re.search(p, n):
            return l
    return "Otra razón"


CAT_MAP = {
    2: ("VIVE_BOGOTA", h_vive, None),
    4: ("MUNICIPIO", h_municipio, None),
    5: ("EDAD", h_edad, ["18 a 25 años", "26 a 35 años", "36 a 45 años", "46 a 55 años", "56 años o más"]),
    6: ("GENERO", h_genero, ["Femenino", "Masculino", "Otras identidades de género", "Prefiere no responder"]),
    7: ("EDUCACION", h_educ, ["Secundaria o menos", "Técnica o tecnológica", "Universitaria", "Postgrado"]),
    8: ("OCUPACION", h_ocup, None),
    9: ("DISCAPACIDAD", h_discap, None),
    10: ("ETNIA", h_etnia, None),
    11: ("INGRESOS", h_ingresos, ["Menos de 2 SMMLV", "De 2 a menos de 4 SMMLV", "4 o más SMMLV"]),
    12: ("LUGAR_NACIMIENTO", h_nacio, None),
    13: ("AUTOPERCEPCION_CIUDADANA", h_ciudadano, None),
    105: ("RAZON_NO_CONTROL_SOCIAL", h_razon_no_control, None),
    122: ("TEMA_PRIORITARIO", h_tema_prioritario, None),
}

# ----- seleccion multiple: (prefijo normalizado, etiqueta), fallback
def fb_const(label):
    return lambda t: label


def fb_sector(t):
    n = norm(t)
    for p, l in [(r"transmilenio|movilidad|\bvia\b|\bvias\b|ciclo|transito", "Movilidad"), (r"educ|colegio|icbf", "Educación"),
                 (r"ambient|arbol", "Ambiente"), (r"gobierno|dadep|personeria", "Gobierno"), (r"salud", "Salud"),
                 (r"juridic|genero", "Jurídica"), (r"mujer", "Mujer"),
                 (r"habitat|alcantarill|basura|alumbrado", "Hábitat")]:
        if re.search(p, n):
            return l
    return "Otro"


def fb_causa(t):
    n = norm(t)
    for p, l in [(r"corrup|soborn|carteles|complic", "Corrupción"),
                 (r"sancion|justicia|\bpena|\bley|normativ|judicial|condena|codigo|impunidad", "Justicia y sanciones débiles"),
                 (r"migra|venezol|extranj|inmigr", "Migración"),
                 (r"desempleo|pobreza|educacion|empleo|moral|valores|formacion|familia", "Causas sociales (empleo, educación, valores)")]:
        if re.search(p, n):
            return l
    return "Otra causa"


MULTI = {
    65: ("CANALES_INFORMACION", [
        ("por los canales oficiales", "Canales oficiales de las entidades"), ("por redes sociales", "Redes sociales"),
        ("por medios de comunicacion tradicionales", "Medios de comunicación tradicionales"),
        ("por correo electronico", "Correo electrónico"), ("por un vecino", "Vecinos, amigos o familiares"),
        ("reuniones comunitarias", "Reuniones comunitarias (JAC)"), ("medios locales", "Medios locales"),
        ("organizaciones sociales", "Organizaciones sociales"), ("no sabe", "No sabe / no responde"),
        ("partidos politicos", "Partidos políticos")], fb_const("Otro canal")),
    67: ("CONCEPTO_PARTICIPACION", [
        ("involucrarse en espacios de dialogo", "Espacios de diálogo ciudadanía-instituciones"),
        ("ejercer control social", "Control social"), ("informarse sobre", "Informarse sobre decisiones"),
        ("participar en actividades comunitarias", "Actividades comunitarias"),
        ("impulsar o votar", "Consultas y revocatorias"), ("votar o postularse", "Votar o postularse a cargos"),
        ("hacer parte de manifestaciones", "Manifestaciones pacíficas"), ("no sabe", "No sabe / no responde")],
        fb_const("Otro")),
    86: ("CANALES_EXPRESION", [
        ("radicando una peticion", "Radicar una petición"), ("usando las plataformas virtuales", "Plataformas virtuales de la alcaldía"),
        ("a traves de las redes sociales", "Redes sociales"), ("acudiendo directamente", "Acudir directamente a la entidad"),
        ("instancias formales", "Instancias formales de participación"),
        ("a traves de organizaciones sociales", "Organizaciones sociales y comunitarias"),
        ("participando en manifestaciones", "Manifestaciones pacíficas"),
        ("a traves de medios de comunicacion", "Medios de comunicación tradicionales")], fb_const("Otro")),
    102: ("CONCEPTO_CONTROL_SOCIAL", [
        ("hacer seguimiento y evaluacion", "Seguimiento y evaluación de políticas"),
        ("vigilar el uso", "Vigilar recursos y gestión pública"), ("acceder a la informacion", "Acceso a información pública"),
        ("participar de forma incidente", "Participar en la toma de decisiones"),
        ("evaluar las decisiones", "Evaluar decisiones de autoridades"),
        ("integrar o ser miembro", "Ser miembro de una veeduría")], fb_const("Otro")),
    104: ("EJERCICIOS_CONTROL_SOCIAL", [
        ("veedurias", "Veedurías ciudadanas"), ("procesos de rendicion de cuentas distritales", "Rendición de cuentas distritales"),
        ("procesos de rendicion de cuentas locales", "Rendición de cuentas locales"),
        ("ejercicios de control social individual", "Control social individual"),
        ("grupos de control social", "Grupos no formales"), ("observatorios ciudadanos locales", "Observatorios locales"),
        ("auditorias", "Auditorías ciudadanas"), ("comites de desarrollo", "Comités de servicios públicos"),
        ("observatorios ciudadanos distritales", "Observatorios distritales")], fb_const("Otro")),
    116: ("SECTOR_TRAMITE", [(norm(k), k) for k in [
        "Hacienda", "Movilidad", "Salud", "Servicios Públicos", "Planeación", "Educación", "Gobierno", "Seguridad",
        "Integración Social", "Cultura, Recreación y Deporte", "Hábitat", "Ambiente", "Desarrollo Económico",
        "Comisarías de Familia", "Jurídica", "Mujer", "Gestión Pública"]], fb_sector),
    120: ("ACTITUDES_NO_INTEGRAS", [(norm(k), k) for k in [
        "Desinformación", "Falta de transparencia", "Inacción ante irregularidades", "Obstrucción al cumplimiento de la ley",
        "Mal uso de recursos públicos", "Nepotismo", "Uso indebido de información privilegiada o protegida",
        "Conflicto de intereses", "Sobornos", "Fraude"]], fb_const("Otra actitud")),
    127: ("CAUSAS_INSEGURIDAD", [(norm(k), k) for k in [
        "Falta de estrategias más efectivas", "Falta de articulación interinstitucional", "Falta de capacidades operativas",
        "Falta de inteligencia estratégica", "Falta de personal", "Escasez de recursos técnicos y tecnológicos"]], fb_causa),
}

# ----- temas de la pregunta abierta 75
THEME_RULES = [
    ("Seguridad y convivencia", r"segur|delincu|\brobo|hurto|crimen|policia|atraco|violencia|convivencia|drogas|microtrafico|raponazo|camaras|inseguridad|vigilancia"),
    ("Movilidad y transporte", r"movil|mobil|transporte|transmilenio|\bmetro\b|\bvias?\b|trancon|trafico|transito|ciclo|bicicle|peaje|parquea|malla vial|huecos|sitp|avenida|caminabilidad|motos"),
    ("Salud", r"salud|\beps\b|hospital|medic|\bcitas\b"),
    ("Educación", r"educaci|colegio|cupo|escolar|universidad|estudiant|jardin|escuela|profesor|docente|icetex|academi"),
    ("Subsidios y programas sociales", r"subsid|subcid|sunsid|sisben|adulto mayor|\bbono|apoyo economico|renta ciudadana|vulnerab|habitante.? de calle|discapac|genero|mujer|jovenes|juventud|ninez|infancia|inclusion|victimas|cuidador|cuidado de|manzana del cuidado|centros? dia|vejez|poblacion"),
    ("Medio ambiente y espacio público", r"ambient|humedal|arbol|reciclaj|basura|residuos|contamin|parques?\b|zonas verdes|animal|mascota|\bagua\b|cerros|\brios?\b|espacio publico|aseo|ruido|mineria|sostenib|ecolog|hidric|estructura ecologica|grafiti"),
    ("Empleo y economía", r"empleo|empleabilidad|trabajo|emprend|econom|desempleo|laboral|ingresos|impuesto|empresa|negocio|vendedor|inversion"),
    ("Vivienda, servicios públicos e infraestructura", r"vivienda|servicios publicos|tarifa|energia|acueducto|alcantarillado|catastro|predial|barrio|legaliza|obras|infraestructura|alumbrado|andenes|valorizacion|\bpot\b|urbanis|territorial|plan parcial"),
    ("Participación, control social y transparencia", r"particip|control social|veeduria|corrup|transparen|trasparen|rendicion|comunal|junta|democracia|derechos|ciudadan|gobernanza|politic|presupuesto|contratacion|auditoria|recursos publicos|gasto|convocatoria|ejecucion"),
    ("Cultura, deporte y recreación", r"cultura|deporte|deportiv|recreacion|\barte\b|artistic|biblioteca|festival|cancha|baile"),
]
NO_TEMA = {"n/a", "na", "no", "ninguno", "ninguna", "no aplica", "no se", "nose", "ns", "nr", "n.r.", "n.r", "nn", "x", "-", ".", "*",
           "nada", "no sabe", "no respondo", "no responde", "no tengo", "no de momento", "no me llama la atencion", "p", "m"}


def themes_of(v):
    n = norm(v)
    if n in NO_TEMA:
        return ["Sin tema / no responde"]
    out = [t for t, p in THEME_RULES if re.search(p, n)]
    return out or ["Otros temas"]


# ----------------------------------------------------------------------------- clasificacion por columna
PLAN = {}          # j -> dict(kind, hk, fn, orden)
for j in range(NCOL):
    vals = col_values(j)
    distinct = set(vals)
    if j in OPEN_COLS:
        PLAN[j] = dict(kind="open")
        continue
    if j in MULTI:
        PLAN[j] = dict(kind="multi", hk=MULTI[j][0])
        continue
    if j in CAT_MAP:
        PLAN[j] = dict(kind="cat", hk=CAT_MAP[j][0])
        continue
    if distinct and all(SCALE_RE.match(v) for v in distinct):
        mx = max(int(SCALE_RE.match(v).group(1)) for v in distinct)
        PLAN[j] = dict(kind="scale", hk="ESCALA_1_10" if mx > 5 else "ESCALA_1_5")
        continue
    done = False
    for hk, mp in LIKERTS:
        if distinct and all(nkey(v) in mp for v in distinct):
            PLAN[j] = dict(kind="likert", hk=hk, mp=mp)
            done = True
            break
    if done:
        continue
    if distinct and all(norm(v) in ("si", "no") for v in distinct):
        PLAN[j] = dict(kind="yesno", hk="SI_NO")
        continue
    PLAN[j] = dict(kind="cat_literal", hk=f"P{j + 1:03d}")


def homologate(j, v):
    """-> (lista[(original, homologado)], valor_numerico, hk). Para no-multi la lista tiene 1 elemento."""
    p = PLAN[j]
    k = p["kind"]
    if k == "scale":
        n = int(SCALE_RE.match(v).group(1))
        return [(v, str(n))], n, p["hk"]
    if k == "likert":
        n = p["mp"][nkey(v)]
        return [(v, clean(v))], n, p["hk"]
    if k == "yesno":
        s = "Sí" if norm(v) == "si" else "No"
        return [(v, s)], 1 if s == "Sí" else 0, p["hk"]
    if k == "cat":
        return [(v, CAT_MAP[j][1](v))], None, p["hk"]
    if k == "cat_literal":
        # «Si» y «Sí» son la misma respuesta (p120 mezcla Sí/No con una tercera opción)
        return [(v, "Sí" if norm(v) == "si" else v)], None, p["hk"]
    if k == "multi":
        hk, keys, fb = MULTI[j]
        pairs = []
        for t in split_multi(v):
            n = norm(t)
            lab = next((l for pre, l in keys if n.startswith(pre)), None) or fb(t)
            pairs.append((t, lab))
        return pairs, None, hk
    raise ValueError(k)


# ----------------------------------------------------------------------------- preguntas
preguntas = []
prev_enun, grp_start = None, None
for j, h in enumerate(HDR):
    m = re.match(r"^(\d+)\.\s*(.*)$", h, re.S)
    num, rest = (int(m.group(1)), m.group(2)) if m else (None, h)
    sub, trunc = None, 0
    k = rest.rfind("[")
    if k >= 0:
        sub = rest[k + 1:].rstrip("]").strip()
        trunc = 0 if rest.rstrip().endswith("]") else 1
        rest = rest[:k].strip()
    elif len(h) >= 250:
        trunc = 1
    if j == 4:
        pass
    enun = rest.strip()
    if enun == prev_enun and sub is not None:
        pass
    else:
        grp_start = j + 1
    prev_enun = enun
    kind = PLAN[j]["kind"]
    tipo = {"scale": "escala", "likert": "escala", "yesno": "si_no", "cat": "categorica", "cat_literal": "categorica",
            "multi": "multiple", "open": "abierta"}[kind]
    if j == THEMES_COL:
        tipo = "abierta"
    preguntas.append(dict(
        id=j + 1, codigo=f"P{j + 1:03d}", col=get_column_letter(j + 1), modulo=modulo_de(j), numero=num,
        enunciado=enun, subitem=sub, subitem_corto=SUB.get(j) or (sub[:100] if sub else None),
        encabezado=h, tipo=tipo, hk=("TEMAS_PARTICIPACION" if j == THEMES_COL else PLAN[j].get("hk")),
        grupo=grp_start, trunc=trunc))
# grupo solo cuando hay mas de una columna en el mismo bloque
cnt = Counter(p["grupo"] for p in preguntas)
for p in preguntas:
    if cnt[p["grupo"]] == 1:
        p["grupo"] = None

# ----------------------------------------------------------------------------- respuestas
resp_rows, opt_rows = [], []
hom = OrderedDict()      # (hk, original, homologado) -> [numerico, n]
n_por_pregunta = Counter()
n_por_encuestado = Counter()
rid = 0
oid = 0
for i, row in enumerate(DATA, start=1):
    for j, v in enumerate(row):
        if v is None:
            continue
        rid += 1
        qid = j + 1
        n_por_pregunta[qid] += 1
        n_por_encuestado[i] += 1
        kind = PLAN[j]["kind"]
        if kind == "open" and j != THEMES_COL:
            resp_rows.append((rid, i, qid, v, None, None))
            continue
        if j == THEMES_COL:
            th = themes_of(v)
            for t in th:
                oid += 1
                opt_rows.append((oid, rid, i, qid, v, t))
                e = hom.setdefault(("TEMAS_PARTICIPACION", v, t), [None, 0])
                e[1] += 1
            resp_rows.append((rid, i, qid, v, " | ".join(th), None))
            continue
        pairs, num, hk = homologate(j, v)
        if kind == "multi":
            labs = list(OrderedDict.fromkeys(l for _, l in pairs))
            for orig, lab in pairs:
                oid += 1
                opt_rows.append((oid, rid, i, qid, orig, lab))
                e = hom.setdefault((hk, orig, lab), [None, 0])
                e[1] += 1
            resp_rows.append((rid, i, qid, v, " | ".join(labs), None))
        else:
            lab = pairs[0][1]
            e = hom.setdefault((hk, v, lab), [num, 0])
            e[1] += 1
            resp_rows.append((rid, i, qid, v, lab, num))

# orden de las categorias homologadas
ORDEN = {}
for j, (hk, fn, order) in CAT_MAP.items():
    if order:
        ORDEN[hk] = {l: n for n, l in enumerate(order, 1)}


def orden_of(hk, lab, num):
    if hk in ORDEN:
        return ORDEN[hk].get(lab)
    return num


hom_rows = []
for hid, ((hk, orig, lab), (num, n)) in enumerate(hom.items(), start=1):
    hom_rows.append((hid, hk, orig, hashlib.md5(orig.encode("utf-8")).hexdigest(), lab, num, orden_of(hk, lab, num), n))

# ----------------------------------------------------------------------------- CSV
def w(path, rows):
    with open(path, "w", encoding="utf-8", newline="") as f:
        for r in rows:
            out = []
            for x in r:
                if x is None:
                    out.append("\\N")
                else:
                    s = str(x).replace("\\", "\\\\").replace('"', '""')
                    out.append('"' + s + '"')
            f.write(",".join(out) + "\n")


w(SEED / "preguntas.csv", [(p["id"], p["codigo"], p["col"], p["modulo"], p["numero"], p["enunciado"], p["subitem"],
                            p["subitem_corto"], p["encabezado"], p["tipo"], p["hk"], p["grupo"], p["trunc"],
                            n_por_pregunta[p["id"]]) for p in preguntas])
w(SEED / "homologacion.csv", hom_rows)
w(SEED / "encuestados.csv", [(i, i + 1, n_por_encuestado[i]) for i in range(1, NROW + 1)])
w(SEED / "respuestas.csv", resp_rows)
w(SEED / "respuestas_opciones.csv", opt_rows)
print(f"preguntas={len(preguntas)} homologacion={len(hom_rows)} respuestas={len(resp_rows)} opciones={len(opt_rows)}")

# ----------------------------------------------------------------------------- vistas
V = []


def q(sql):
    V.append(sql.strip().rstrip(";") + ";\n")


Q = {p["codigo"]: p["id"] for p in preguntas}

# --- diccionario
q("""
CREATE OR REPLACE VIEW v_diccionario AS
SELECT p.id_pregunta, p.codigo, LOWER(p.codigo) AS alias_en_vistas_base, p.columna_excel, p.modulo, p.numero_pregunta,
       p.enunciado, p.subitem, p.subitem_corto, p.tipo_respuesta, p.tipo_homologacion, p.encabezado_truncado, p.n_respuestas
FROM preguntas p
ORDER BY p.id_pregunta
""")

# --- detalle largo
q("""
CREATE OR REPLACE VIEW v_respuestas_detalle AS
SELECT r.id_respuesta, r.id_encuestado, p.id_pregunta, p.codigo, p.modulo, p.numero_pregunta, p.enunciado,
       p.subitem_corto, p.tipo_respuesta, r.respuesta_original, r.respuesta_homologada, r.valor_numerico
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
""")

# --- bases anchas (una fila por encuestado, una columna por pregunta como en el Excel)
def pivot(col):
    cols = ",\n  ".join(
        f"MAX(CASE WHEN r.id_pregunta = {p['id']} THEN r.{col} END) AS p{p['id']:03d}" for p in preguntas)
    return cols


q(f"""
CREATE OR REPLACE VIEW v_base_excel AS
SELECT e.id_encuestado,
  {pivot('respuesta_original')}
FROM encuestados e
LEFT JOIN respuestas r ON r.id_encuestado = e.id_encuestado
GROUP BY e.id_encuestado
""")
q(f"""
CREATE OR REPLACE VIEW v_base_homologada AS
SELECT e.id_encuestado,
  {pivot('respuesta_homologada')}
FROM encuestados e
LEFT JOIN respuestas r ON r.id_encuestado = e.id_encuestado
GROUP BY e.id_encuestado
""")

# --- vistas para graficas (categoria, serie, valor, porcentaje, orden)
HORD = ("(SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden "
        "FROM homologacion GROUP BY tipo_homologacion, valor_homologado)")


def dist(name, pid):
    q(f"""
CREATE OR REPLACE VIEW {name} AS
SELECT r.respuesta_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS porcentaje,
       COALESCE(MIN(h.orden), MIN(r.valor_numerico)) AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
LEFT JOIN {HORD} h ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = r.respuesta_homologada
WHERE r.id_pregunta = {pid} AND r.respuesta_homologada IS NOT NULL
GROUP BY r.respuesta_homologada
""")


def dist_multi(name, pid):
    q(f"""
CREATE OR REPLACE VIEW {name} AS
SELECT o.opcion_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(DISTINCT o.id_encuestado) AS valor,
       ROUND(100 * COUNT(DISTINCT o.id_encuestado) / (SELECT COUNT(*) FROM respuestas WHERE id_pregunta = {pid}), 1) AS porcentaje,
       NULL AS orden
FROM respuestas_opciones o
WHERE o.id_pregunta = {pid}
GROUP BY o.opcion_homologada
""")


def prom(name, a, b):
    q(f"""
CREATE OR REPLACE VIEW {name} AS
SELECT p.subitem_corto AS categoria, CAST(NULL AS CHAR) AS serie, ROUND(AVG(r.valor_numerico), 2) AS valor,
       COUNT(*) AS n, p.id_pregunta AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
WHERE r.id_pregunta BETWEEN {a} AND {b} AND r.valor_numerico IS NOT NULL
GROUP BY p.id_pregunta, p.subitem_corto
""")


def apilada(name, a, b):
    q(f"""
CREATE OR REPLACE VIEW {name} AS
SELECT p.subitem_corto AS categoria, r.respuesta_homologada AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY p.id_pregunta), 1) AS porcentaje,
       p.id_pregunta AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
WHERE r.id_pregunta BETWEEN {a} AND {b} AND r.respuesta_homologada IS NOT NULL
GROUP BY p.id_pregunta, p.subitem_corto, r.respuesta_homologada
""")


def P(n):      # numero de columna (0-based) -> id_pregunta
    return n + 1


dist("v_g_genero", P(6))
dist("v_g_edad", P(5))
dist("v_g_localidad", P(3))
dist("v_g_ingresos", P(11))
dist("v_g_educacion", P(7))
dist("v_g_ocupacion", P(8))
dist("v_g_calificacion_alcalde", P(14))
dist("v_g_acciones_generan_confianza", P(15))
prom("v_g_confianza_instituciones", P(22), P(29))
apilada("v_g_confianza_instituciones_dist", P(22), P(29))
prom("v_g_premisas_confianza", P(30), P(42))
prom("v_g_participacion_eventos", P(43), P(48))
prom("v_g_cumplimiento_normas", P(50), P(62))
dist("v_g_reaccion_infracciones", P(63))
dist("v_g_conocimiento_plan_desarrollo", P(64))
dist_multi("v_g_canales_informacion", P(65))
prom("v_g_frecuencia_participacion", P(68), P(73))
dist_multi("v_g_temas_participacion", P(75))
dist("v_g_obstaculo_participacion", P(85))
dist_multi("v_g_canales_expresion", P(86))
dist("v_g_razon_no_control_social", P(105))
prom("v_g_premisas_anticorrupcion", P(106), P(111))
dist("v_g_corrupcion_servidores", P(113))
dist("v_g_tramite_canal", P(117))
dist("v_g_tramite_satisfaccion", P(118))
dist("v_g_tramite_actitud_no_integra", P(119))
dist_multi("v_g_tramite_sector", P(116))
dist_multi("v_g_actitudes_no_integras", P(120))
dist("v_g_tema_prioritario", P(122))
dist("v_g_sensacion_seguridad", P(123))
dist_multi("v_g_causas_inseguridad", P(127))
dist("v_g_victima_delito", P(130))
dist("v_g_reaccion_autoridades", P(132))
prom("v_g_riesgo_corrupcion_entidades", P(137), P(143))
prom("v_g_satisfaccion_bienestar", P(160), P(166))

q(f"""
CREATE OR REPLACE VIEW v_g_servicios_publicos AS
SELECT SUBSTRING_INDEX(p.subitem_corto, ' – ', -1) AS categoria, SUBSTRING_INDEX(p.subitem_corto, ' – ', 1) AS serie,
       ROUND(AVG(r.valor_numerico), 2) AS valor, COUNT(*) AS n, p.id_pregunta AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
WHERE r.id_pregunta BETWEEN {P(187)} AND {P(206)} AND r.valor_numerico IS NOT NULL
GROUP BY p.id_pregunta, p.subitem_corto
""")

# --- resumen / KPIs
q(f"""
CREATE OR REPLACE VIEW v_g_kpis AS
SELECT 'Encuestados' AS categoria, COUNT(*) AS valor FROM encuestados
UNION ALL SELECT 'Autorizaron el tratamiento de datos', COUNT(*) FROM respuestas WHERE id_pregunta = {P(0)} AND respuesta_homologada = 'Sí'
UNION ALL SELECT 'Respondieron el cuestionario principal', COUNT(*) FROM respuestas WHERE id_pregunta = {P(14)}
UNION ALL SELECT 'Calificación promedio del Alcalde (1-10)', ROUND(AVG(valor_numerico), 2) FROM respuestas WHERE id_pregunta = {P(14)}
UNION ALL SELECT 'Confianza promedio en gestión de recursos (1-5)', ROUND(AVG(valor_numerico), 2) FROM respuestas WHERE id_pregunta = {P(16)}
UNION ALL SELECT 'Satisfacción promedio con Bogotá (1-5)', ROUND(AVG(valor_numerico), 2) FROM respuestas WHERE id_pregunta = {P(21)}
""")

header = "-- Generado por etl/build_seed.py. No editar a mano.\nSET NAMES utf8mb4;\n\n"
(INIT / "03_views.sql").write_text(header + "\n".join(V), encoding="utf-8")
print("vistas:", len(V))

# ----------------------------------------------------------------------------- informe de homologacion
rep = Counter()
for (hk, orig, lab), (num, n) in hom.items():
    rep[hk] += 1
print("tipos de homologacion:", len(rep))
for j in (6, 8, 9, 10, 11, 63, 75, 105, 116, 127):
    c = Counter()
    for r in DATA:
        v = r[j]
        if v is None:
            continue
        if PLAN[j]["kind"] == "multi" or j == THEMES_COL:
            labs = [l for _, l in homologate(j, v)[0]] if j != THEMES_COL else themes_of(v)
            for l in labs:
                c[l] += 1
        elif PLAN[j]["kind"] != "open":
            c[homologate(j, v)[0][0][1]] += 1
    print(f"-- P{j + 1:03d} ({PLAN[j]['kind']}): {dict(c.most_common(12))}")
