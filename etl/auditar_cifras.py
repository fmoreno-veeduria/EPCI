#!/usr/bin/env python3
"""
Auditoría de las cifras del sitio público, hecha a partir de MySQL.

Recalcula con SQL directo sobre las tablas base (encuestados, preguntas, respuestas, respuestas_opciones),
sin pasar por las vistas v_pub_* ni por el código del servidor, y compara con lo que publica /api/explora/dataset:
  - totales (filas, no autorizaron, sin vínculo, efectivas) y localidades
  - por cada pregunta: base de respondientes, distribución, promedio y cortes por género/edad/ocupación
  - satisfacción por sector, temas del texto libre, calificación del Alcalde por localidad
  - respondientes y columnas de cada módulo y las cifras que muestra el Aula
  - vistas EF_*: base, conteo y porcentaje de cada barra, barras apiladas bajo/medio/alto, Sí/No, orden de sectores,
    nube de palabras, y que /api/explora/vista/* devuelva lo mismo que las vistas

Uso: python etl/auditar_cifras.py [anio]      (por defecto 2025; requiere el contenedor `eficiencia` y el sitio en marcha)
Cada año se audita por separado: las consultas se restringen a las personas de ese año.
"""
import json, re, subprocess, sys, urllib.request
from decimal import Decimal, ROUND_HALF_UP
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ANIO = int(sys.argv[1]) if len(sys.argv) > 1 else 2025
URL = f'http://localhost:8080/api/explora/dataset?anio={ANIO}'
ds = json.load(urllib.request.urlopen(URL))

# Grupos demográficos definidos aquí, sobre las respuestas originales de las preguntas 6, 7 y 9
PRELUDIO = """
SET NAMES utf8mb4;
CREATE TEMPORARY TABLE dem AS
SELECT e.id_encuestado,
  CASE WHEN g.id_respuesta IS NULL THEN 'Sin dato' WHEN g.respuesta_original IN ('Femenino','Masculino') THEN g.respuesta_original ELSE 'Otro' END AS gen,
  CASE WHEN a.respuesta_original LIKE 'Entre 18%' THEN '18-25' WHEN a.respuesta_original LIKE 'Entre 26%' THEN '26-35'
       WHEN a.respuesta_original LIKE 'Entre 36%' THEN '36-45' WHEN a.respuesta_original LIKE 'Entre 46%' THEN '46-55'
       WHEN a.respuesta_original LIKE '56%' THEN '56+' ELSE 'Sin dato' END AS edad,
  CASE WHEN o.id_respuesta IS NULL THEN 'Sin dato' WHEN o.respuesta_original LIKE '%sector público distrital%' THEN 'Servidores distritales' ELSE 'Ciudadanía' END AS ocu
FROM encuestados e
LEFT JOIN respuestas g ON g.id_encuestado = e.id_encuestado AND g.id_pregunta = 7
LEFT JOIN respuestas a ON a.id_encuestado = e.id_encuestado AND a.id_pregunta = 6
LEFT JOIN respuestas o ON o.id_encuestado = e.id_encuestado AND o.id_pregunta = 9;
"""

CONSULTAS = {
    'totales': """SELECT 'filas', COUNT(*) FROM encuestados
      UNION ALL SELECT 'no_aut', COUNT(*) FROM respuestas WHERE id_pregunta=1 AND respuesta_original='No'
      UNION ALL SELECT 'sin_vinculo', COUNT(*) FROM respuestas WHERE id_pregunta=3 AND respuesta_original LIKE 'No vivo en Bogotá ni en sus alrededores%'
      UNION ALL SELECT 'efectivas', COUNT(*) FROM respuestas WHERE id_pregunta=15
      UNION ALL SELECT 'modulos_obl', COUNT(*) FROM respuestas WHERE id_pregunta=44
      UNION ALL SELECT 'columnas', COUNT(*) FROM preguntas
      UNION ALL SELECT 'localidades', COUNT(DISTINCT respuesta_original) FROM respuestas WHERE id_pregunta=4""",
    # distribución de preguntas simples, por grupo
    'simples': """SELECT r.id_pregunta, r.respuesta_homologada, d.gen, d.edad, d.ocu, COUNT(*), MIN(r.valor_numerico)
      FROM respuestas r JOIN preguntas p ON p.id_pregunta=r.id_pregunta JOIN dem d ON d.id_encuestado=r.id_encuestado
      WHERE p.tipo_respuesta IN ('escala','si_no','categorica') AND r.respuesta_homologada IS NOT NULL
      AND (r.id_pregunta <> 132 OR EXISTS (SELECT 1 FROM respuestas v WHERE v.id_encuestado = r.id_encuestado AND v.id_pregunta = 131 AND v.respuesta_original = 'Sí'))
      AND (r.id_pregunta <> 3 OR r.respuesta_original NOT LIKE 'No vivo en Bogotá ni en sus alrededores%')
      AND (r.id_pregunta <> 2 OR EXISTS (SELECT 1 FROM respuestas v WHERE v.id_encuestado = r.id_encuestado AND v.id_pregunta = 15))
      GROUP BY 1,2,3,4,5""",
    # selección múltiple y temas: personas distintas por opción
    'multiples': """SELECT x.id_pregunta, x.opcion_homologada, d.gen, d.edad, d.ocu, COUNT(*)
      FROM (SELECT DISTINCT id_encuestado, id_pregunta, opcion_homologada FROM respuestas_opciones) x
      JOIN dem d ON d.id_encuestado=x.id_encuestado GROUP BY 1,2,3,4,5""",
    'respondientes': """SELECT r.id_pregunta, d.gen, d.edad, d.ocu, COUNT(*) FROM respuestas r JOIN dem d ON d.id_encuestado=r.id_encuestado
      WHERE 1=1
      AND (r.id_pregunta <> 132 OR EXISTS (SELECT 1 FROM respuestas v WHERE v.id_encuestado = r.id_encuestado AND v.id_pregunta = 131 AND v.respuesta_original = 'Sí'))
      AND (r.id_pregunta <> 3 OR r.respuesta_original NOT LIKE 'No vivo en Bogotá ni en sus alrededores%')
      AND (r.id_pregunta <> 2 OR EXISTS (SELECT 1 FROM respuestas v WHERE v.id_encuestado = r.id_encuestado AND v.id_pregunta = 15))
      GROUP BY 1,2,3,4""",
    'sector': """SELECT t.s, COUNT(*), SUM(r.valor_numerico>=4), SUM(r.valor_numerico<=2), ROUND(AVG(r.valor_numerico),2)
      FROM (SELECT DISTINCT id_encuestado, opcion_homologada s FROM respuestas_opciones WHERE id_pregunta=117) t
      JOIN respuestas r ON r.id_encuestado=t.id_encuestado AND r.id_pregunta=119 AND r.valor_numerico IS NOT NULL GROUP BY t.s""",
    'localidad': """SELECT COALESCE(l.respuesta_original, 'Bogotá Región'), COUNT(*), SUM(a.valor_numerico) FROM respuestas a
      LEFT JOIN respuestas l ON l.id_encuestado=a.id_encuestado AND l.id_pregunta=4 WHERE a.id_pregunta=15 GROUP BY 1""",
    'publicado': "SELECT clave, figura, tipo, COALESCE(serie, ''), categoria, COALESCE(n, ''), COALESCE(base, ''), COALESCE(porcentaje, '') FROM EF_INFORME_PUBLICADO",
    'ocultas': "SELECT clave, categoria FROM EF_CATEGORIA_OCULTA",
    'temas': """SELECT COUNT(*), SUM(n>=1), SUM(n>=2), SUM(n=0) FROM (
        SELECT r.id_encuestado, COUNT(DISTINCT o.opcion_homologada) n FROM respuestas r
        LEFT JOIN respuestas_opciones o ON o.id_respuesta=r.id_respuesta AND o.opcion_homologada NOT IN ('Otros temas','Sin tema / no responde')
        WHERE r.id_pregunta=76 GROUP BY r.id_encuestado) x""",
    'cols_por_pregunta': "SELECT p.id_pregunta, COALESCE(c.n, 0), p.tipo_respuesta FROM preguntas p LEFT JOIN (SELECT id_pregunta, COUNT(*) n FROM respuestas GROUP BY id_pregunta) c ON c.id_pregunta = p.id_pregunta",
    'registro': """SELECT q.clave, q.modulo_clave, q.tipo_registro, GROUP_CONCAT(i.id_pregunta ORDER BY i.item_orden)
      FROM EF_PREGUNTA q JOIN EF_PREGUNTA_ITEM i ON i.clave = q.clave GROUP BY q.clave, q.modulo_clave, q.tipo_registro""",
    'abiertas': """SELECT i.id_pregunta, r.respuesta_original FROM EF_PREGUNTA_ITEM i JOIN EF_PREGUNTA q ON q.clave = i.clave
      JOIN respuestas r ON r.id_pregunta = i.id_pregunta WHERE q.tipo_registro IN ('open', 'multi_category') AND i.item_orden = 1
      AND i.id_pregunta IN (SELECT id_pregunta FROM preguntas WHERE tipo_respuesta = 'abierta')""",
    'aula': """SELECT 'edu_total', COUNT(*) FROM respuestas WHERE id_pregunta=8
      UNION ALL SELECT 'edu_univ_pos', COUNT(*) FROM respuestas WHERE id_pregunta=8 AND (respuesta_original LIKE 'Postgrado%' OR respuesta_original LIKE 'Educación universitaria%')
      UNION ALL SELECT 'aut_total', COUNT(*) FROM respuestas WHERE id_pregunta=14
      UNION ALL SELECT 'aut_interesado', COUNT(*) FROM respuestas WHERE id_pregunta=14 AND respuesta_original LIKE '%interesado (a)%' AND respuesta_original NOT LIKE '%desinteresado%'
      UNION ALL SELECT 'tram_total', COUNT(*) FROM respuestas WHERE id_pregunta=120
      UNION ALL SELECT 'tram_no_integro', COUNT(*) FROM respuestas WHERE id_pregunta=120 AND respuesta_original='Si'
      UNION ALL SELECT 'alcalde_suma', SUM(valor_numerico) FROM respuestas WHERE id_pregunta=15
      UNION ALL SELECT 'alcalde_n', COUNT(*) FROM respuestas WHERE id_pregunta=15""",
}


PALABRAS = {'WHERE', 'ON', 'LEFT', 'RIGHT', 'INNER', 'JOIN', 'GROUP', 'UNION', 'ORDER', 'AND', 'OR', 'LIMIT', 'SET', 'HAVING', 'USING'}


def por_anio(q):
    """Sustituye las tablas de personas y respuestas por su versión filtrada al año auditado."""
    def sub(m):
        kw, tabla, tail, alias = m.group(1), m.group(2), m.group(3) or '', m.group(4)
        if alias and alias.upper() in PALABRAS:
            alias = None
        if tabla == 'encuestados':
            sel = f'(SELECT * FROM encuestados WHERE anio = {ANIO})'
        else:
            sel = f'(SELECT x_.* FROM {tabla} x_ JOIN encuestados ee_ ON ee_.id_encuestado = x_.id_encuestado WHERE ee_.anio = {ANIO})'
        if alias:
            return f"{kw} {sel} {alias}"
        return f"{kw} {sel} {tabla}{tail}"
    return re.sub(r'\b(FROM|JOIN)\s+(respuestas_opciones|respuestas|encuestados)\b(\s+(?:AS\s+)?([A-Za-z_]\w*))?', sub, q)


def sql():
    partes = [por_anio(PRELUDIO)]
    for k, q in CONSULTAS.items():
        partes.append(f"SELECT '##{k}';\n{por_anio(q) if k not in ('publicado', 'ocultas') else q};")
    return '\n'.join(partes)


def ejecutar():
    cmd = ['docker', 'exec', '-i', 'eficiencia', 'mysql', '-uroot', '-peficiencia_root', '--default-character-set=utf8mb4', '-B', '-N', 'eficiencia']
    r = subprocess.run(cmd, input=sql().encode('utf-8'), capture_output=True)
    if r.returncode:
        sys.exit(r.stderr.decode('utf-8', 'replace'))
    out, sec = defaultdict(list), None
    for linea in r.stdout.decode('utf-8').splitlines():
        if linea.startswith('##'):
            sec = linea[2:]
        elif sec:
            out[sec].append(linea.split('\t'))
    return out


def nul(v):
    return None if v == 'NULL' else v


T = ejecutar()
reg = {'preguntas': [dict(key=c, modulo=m, tipo=t, ids=[int(x) for x in ids.split(',')]) for c, m, t, ids in T['registro']]}
errores, ok = [], 0


def r1(num, den):
    # MySQL redondea los empates hacia arriba; round() de Python los lleva al par
    return float((Decimal(100 * num) / Decimal(den)).quantize(Decimal('0.1'), rounding=ROUND_HALF_UP))


def check(nombre, esperado, obtenido, tol=0):
    global ok
    if isinstance(esperado, (int, float)) and isinstance(obtenido, (int, float)):
        bien = abs(esperado - obtenido) <= tol
    else:
        bien = esperado == obtenido
    if bien:
        ok += 1
    else:
        errores.append(f'{nombre}: MySQL={esperado} sitio={obtenido}')


tot = {k: int(v) for k, v in T['totales']}
for k, sitio in [('filas', ds['meta']['total_form']), ('no_aut', ds['meta']['no_autorizaron']), ('sin_vinculo', ds['meta']['sin_vinculo']),
                 ('efectivas', ds['meta']['total_n']), ('modulos_obl', ds['meta']['total_modulos_obligatorios']),
                 ('columnas', ds['meta']['columnas']), ('localidades', ds['meta']['localidades'])]:
    check(f'meta.{k}', tot[k], sitio)
check('identidad filas = no autorizaron + sin vínculo + efectivas', tot['filas'] - tot['no_aut'] - tot['sin_vinculo'], tot['efectivas'])

GEN, EDAD, OCU = ['Femenino', 'Masculino', 'Otro'], ['18-25', '26-35', '36-45', '46-55', '56+'], ['Servidores distritales', 'Ciudadanía']
CORTES = (('por_genero', 0, GEN), ('por_edad', 1, EDAD), ('por_ocupacion', 2, OCU))

# distribuciones por pregunta: dist[id]['total' | 'corte|grupo'][categoria] = personas
dist = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
valores = defaultdict(dict)
for fila, es_multi in [(f, False) for f in T['simples']] + [(f, True) for f in T['multiples']]:
    id_, cat, g, e, o, n = int(fila[0]), fila[1], fila[2], fila[3], fila[4], int(fila[5])
    d = dist[id_]
    d['total'][cat] += n
    for corte, val in (('por_genero', g), ('por_edad', e), ('por_ocupacion', o)):
        d[corte + '|' + val][cat] += n
    if not es_multi and nul(fila[6]) is not None and cat not in ('Sí', 'No'):
        valores[id_][cat] = float(fila[6])

resp = defaultdict(lambda: defaultdict(int))
for id_, g, e, o, n in T['respondientes']:
    id_, n = int(id_), int(n)
    resp[id_]['total'] += n
    resp[id_]['por_genero|' + g] += n
    resp[id_]['por_edad|' + e] += n
    resp[id_]['por_ocupacion|' + o] += n
n_bd = {int(i): int(n) for i, n, _ in T['cols_por_pregunta']}

# categorías que existen en la base pero que el informe no grafica (EF_CATEGORIA_OCULTA)
_ids = {r['key']: r['ids'][0] for r in reg['preguntas']}
for _clave, _cat in T['ocultas']:
    for _k in dist[_ids[_clave]]:
        dist[_ids[_clave]][_k].pop(_cat, None)


def promedio(c, v):
    n = sum(c.values())
    # MySQL redondea los empates hacia arriba
    return float((Decimal(str(sum(v[k] * x for k, x in c.items()))) / Decimal(n)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)) if n and all(k in v for k in c) else None


def comparar(nombre, id_, obj):
    d = dist[id_]
    multi = obj.get('respuestas_recibidas') is not None
    check(f'{nombre}.distribucion', dict(d['total']), obj['distribucion'])
    if multi:
        check(f'{nombre}.respuestas_recibidas', resp[id_]['total'], obj['respuestas_recibidas'])
        check(f'{nombre}.respuestas_analizadas', sum(d['total'].values()), obj['respuestas_analizadas'])
    else:
        check(f'{nombre}.n', sum(d['total'].values()), obj['n'])
    if 'promedio' in obj:
        check(f'{nombre}.promedio', promedio(d['total'], valores[id_]), obj['promedio'], 0.005)
    for corte, _, lista in CORTES:
        for g in lista:
            check(f'{nombre}.{corte}[{g}]', {k: v for k, v in d[corte + '|' + g].items() if v},
                  {k: v for k, v in obj[corte][g].items() if v})
            if multi:
                check(f'{nombre}.encuestados_{corte}[{g}]', resp[id_][corte + '|' + g], obj['encuestados_' + corte].get(g, 0))


PUBLICADAS = {fila[0] for fila in T['publicado'] if fila[2] == 'distribucion'}
for r in reg['preguntas']:
    q = ds['preguntas'][r['key']]
    if r['key'] in PUBLICADAS:
        continue
    if q['tipo'] in ('matrix_likert_5', 'multi_binary'):
        for j, id_ in enumerate(r['ids']):
            comparar(f"{r['key']}[{j}]", id_, q['items'][j])
    elif q['tipo'] == 'open':
        check(f"{r['key']}.n (abierta)", resp[r['ids'][0]]['total'], q['n'])
    else:
        comparar(r['key'], r['ids'][0], q)

# valores publicados por el informe: el dataset debe traer exactamente lo que guarda EF_INFORME_PUBLICADO
CON_INFORME = any(a['anio'] == ANIO and a['usa_informe'] for a in ds['meta']['anios'])
for clave in (PUBLICADAS if CON_INFORME else []):
    q = ds['preguntas'][clave]
    filas = [f for f in T['publicado'] if f[0] == clave and f[2] == 'distribucion']
    check(f'{clave}.fuente', 'informe', q.get('fuente'))
    check(f'{clave}.categorias publicadas', {f[4]: int(f[5]) for f in filas}, q['distribucion'])
    for f in filas:
        fila = next(x for x in q['graficas']['1']['todos']['filas'] if x['categoria'] == f[4])
        check(f'{clave}.{f[4]}.porcentaje', float(f[7]), fila['porcentaje'], 0.0001)
        check(f'{clave}.{f[4]}.base', int(f[6]), q['graficas']['1']['todos']['base'])
ocultas = {(c, k) for c, k in T['ocultas']}
for clave, cat in ocultas:
    check(f'oculta {clave}/{cat} no se publica', False, cat in ds['preguntas'][clave]['distribucion'])

# módulos
for mk, m in ds['modulos'].items():
    qs = [r for r in reg['preguntas'] if r['modulo'] == mk]
    ids = [i for r in qs for i in r['ids']]
    check(f'modulo {mk}.variables_totales', len(ids), m['variables_totales'])
    check(f'modulo {mk}.preguntas_principales', len(qs), m['preguntas_principales'])
    base = tot['efectivas'] if mk in ('sociodemografico', 'confianza') else max(n_bd[i] for i in ids)
    check(f'modulo {mk}.respuestas_validas', base, m['respuestas_validas'])

# satisfacción por sector (recalculada; la publicada se compara arriba con EF_INFORME_PUBLICADO)
for sector, n, alta, baja, prom in []:
    s = next((x for x in ds['preguntas']['ri_q8']['satisfaccion_por_sector'] if x['sector'] == sector), None)
    if s is None:
        errores.append(f'sector {sector}: no aparece en el sitio')
        continue
    n, alta, baja = int(n), int(alta), int(baja)
    check(f'sector {sector}.n', n, s['n'])
    check(f'sector {sector}.satisfaccion', r1(alta, n), s['satisfaccion'], 0.051)
    check(f'sector {sector}.insatisfaccion', r1(baja, n), s['insatisfaccion'], 0.051)
    check(f'sector {sector}.promedio', float(prom), s['promedio'], 0.005)


# Alcalde por localidad
for loc, n, suma in T['localidad']:
    s = next((x for x in ds['localidad_alcalde'] if x['localidad'] == loc), None)
    if s is None:
        errores.append(f'localidad {loc}: no aparece en el sitio')
        continue
    check(f'localidad {loc}.n', int(n), s['n'])
    check(f'localidad {loc}.promedio', float((Decimal(str(suma)) / Decimal(int(n))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)), s['promedio'], 0.0001)


# ---------------------------------------------------------------- vistas EF_*: lo que pinta cada gráfica
SEG = {'genero': 'por_genero', 'edad': 'por_edad', 'ocupacion': 'por_ocupacion'}


def clave_seg(seg):
    return 'total' if seg == 'todos' else SEG[seg.split(':')[0]] + '|' + seg.split(':', 1)[1]


def umbrales(maximo):
    return (4, 7) if maximo > 5 else (2, 4)   # bajo <= a ; alto >= b


for r in reg['preguntas']:
    q = ds['preguntas'][r['key']]
    if q['tipo'] == 'open' or r['key'] in PUBLICADAS:
        continue
    for j, id_ in enumerate(r['ids'], 1):
        porSeg = q.get('graficas', {}).get(str(j), {})
        d, v = dist[id_], valores[id_]
        check(f"{r['key']}[{j}].segmentos publicados", True, 'todos' in porSeg)
        item = q['items'][j - 1] if q.get('items') else q
        for seg, obj in porSeg.items():
            k = clave_seg(seg)
            base = resp[id_][k]
            nombre = f"{r['key']}[{j}].{seg}"
            check(nombre + '.base', base, obj['base'])
            check(nombre + '.categorias', len({c for c, x in d[k].items() if x}), len(obj['filas']))
            for f in obj['filas']:
                check(f"{nombre}.{f['categoria']}.n", d[k].get(f['categoria'], 0), f['n'])
                check(f"{nombre}.{f['categoria']}.porcentaje", 100 * f['n'] / base if base else 0, f['porcentaje'], 0.0001)
            # barras apiladas bajo / medio / alto (solo preguntas con valor numérico en todas sus categorías)
            if v and all(c in v for c, x in d[k].items() if x) and sum(d[k].values()):
                lo, hi = umbrales(max(v.values()))
                n = sum(d[k].values())
                nb = sum(x for c, x in d[k].items() if v[c] <= lo)
                na = sum(x for c, x in d[k].items() if v[c] >= hi)
                cmp_ = (item.get('comparativa') or {}).get(seg)
                check(nombre + '.comparativa publicada', True, cmp_ is not None)
                if cmp_:
                    check(nombre + '.n_bajo', nb, cmp_['n_bajo'])
                    check(nombre + '.n_alto', na, cmp_['n_alto'])
                    check(nombre + '.n_medio', n - nb - na, cmp_['n_medio'])
                    check(nombre + '.pct_bajo', 100 * nb / n, cmp_['pct_bajo'], 0.0001)
                    check(nombre + '.pct_alto', 100 * na / n, cmp_['pct_alto'], 0.0001)
                    check(nombre + '.promedio_segmento', promedio(d[k], v), cmp_['promedio'], 0.005)
            if r['tipo'] == 'multi_binary':
                b_ = (item.get('binaria') or {}).get(seg)
                check(nombre + '.binaria publicada', True, b_ is not None)
                if b_:
                    si, no = d[k].get('Sí', 0), d[k].get('No', 0)
                    check(nombre + '.n_si', si, b_['n_si'])
                    check(nombre + '.n_no', no, b_['n_no'])
                    check(nombre + '.pct_si', 100 * si / (si + no), b_['pct_si'], 0.0001)

# satisfacción por sector: de mayor a menor satisfacción
sat_pub = ds['preguntas']['ri_q8']['satisfaccion_por_sector']
check('sectores ordenados por satisfacción', [x['satisfaccion'] for x in sat_pub], sorted((x['satisfaccion'] for x in sat_pub), reverse=True))
esp = {f[4]: float(f[7]) for f in T['publicado'] if f[0] == 'ri_q8' and f[1] == 'Figura 39' and f[3].startswith('Satisfechos')}
if CON_INFORME:
    check('Fig.39 sectores publicados', esp, {x['sector']: x['satisfaccion'] for x in sat_pub})

# nube de palabras: se recalcula desde los textos guardados en MySQL
import re as _re, unicodedata as _ud
_src = open(ROOT / 'etl/generar_vistas_explora.py', encoding='utf-8').read()
_ns = {}
exec(_src[_src.index('STOP = set('):_src.index('abiertas = {i for')], {'unicodedata': _ud, 're': _re}, _ns)
from collections import Counter as _C
_cnt = defaultdict(_C)
for id_, texto in T['abiertas']:
    vistos = {w for w in _re.findall(r'[a-záéíóúñü]{4,}', texto.lower()) if w not in _ns['STOP'] and _ns['norm'](w) not in _ns['STOP']}
    _cnt[int(id_)].update(vistos)
for r in reg['preguntas']:
    if r['tipo'] in ('open', 'multi_category'):
        esperado = dict(sorted(_cnt[r['ids'][0]].items(), key=lambda x: (-x[1], x[0]))[:40])
        q = ds['preguntas'][r['key']]
        check(f"{r['key']}.nube", esperado, {w['word']: w['count'] for w in q.get('word_cloud', [])})

# la API de vistas devuelve exactamente lo que respalda cada gráfica
base_url = URL.rsplit('/api/', 1)[0]
for r in reg['preguntas']:
    q = ds['preguntas'][r['key']]
    if q['tipo'] == 'open' or r['key'] in PUBLICADAS:
        continue
    filas = json.load(urllib.request.urlopen(f"{base_url}/api/explora/vista/EF_GRAFICA_DISTRIBUCION?anio={ANIO}&clave={r['key']}"))
    publicado = sum(len(seg['filas']) for item in q['graficas'].values() for seg in item.values())
    check(f"api {r['key']}: filas de EF_GRAFICA_DISTRIBUCION", len(filas), publicado)
    check(f"api {r['key']}: suma n", sum(int(f['n']) for f in filas), sum(f['n'] for item in q['graficas'].values() for seg in item.values() for f in seg['filas']))

# cifras del Aula y de la portada
A = {k: float(v) for k, v in T['aula']}
print(f"Educación universitaria o posgrado: {A['edu_univ_pos']:.0f}/{A['edu_total']:.0f} = {100 * A['edu_univ_pos'] / A['edu_total']:.1f}%")
print(f"Interesado en asuntos públicos: {A['aut_interesado']:.0f}/{A['aut_total']:.0f} = {100 * A['aut_interesado'] / A['aut_total']:.1f}%")
print(f"Trámite con actitud no íntegra: {A['tram_no_integro']:.0f}/{A['tram_total']:.0f} = {100 * A['tram_no_integro'] / A['tram_total']:.1f}%")
print(f"Calificación media Alcalde: {A['alcalde_suma'] / A['alcalde_n']:.2f}")
d8, d14, d120 = ds['preguntas']['sd_educacion']['distribucion'], ds['preguntas']['sd_autopercepcion']['distribucion'], ds['preguntas']['ri_q9']['distribucion']
check('aula.edu', A['edu_univ_pos'], d8.get('Educación universitaria', 0) + d8.get('Postgrado (especialización, maestría, doctorado)', 0))
check('aula.interesado', A['aut_interesado'], d14.get('Un(a) ciudadano(a) interesado (a) de los asuntos públicos', 0))
check('aula.no_integro', A['tram_no_integro'], d120.get('Sí', 0))
check('home.alcalde', round(A['alcalde_suma'] / A['alcalde_n'], 2), ds['preguntas']['ci_q1']['promedio'], 0.005)

print(f'\nComprobaciones correctas: {ok}')
print(f'Diferencias: {len(errores)}')
for e in errores[:60]:
    print(' -', e)
sys.exit(1 if errores else 0)
