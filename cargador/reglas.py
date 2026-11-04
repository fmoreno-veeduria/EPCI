"""
Reglas de homologación de la encuesta EPCI, extraídas tal cual de etl/build_seed.py (no editar a mano:
si cambian las reglas, se cambian allí y se vuelve a extraer). Sirven para homologar los valores NUEVOS
de un año cargado desde Excel; los valores ya conocidos usan la homologación que existe en la base.
"""
import re
import unicodedata
from collections import Counter, OrderedDict

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

