#!/usr/bin/env python3
"""
Compara cada figura y tabla del informe oficial (PDF) con lo que entregan las vistas EF_* y, por tanto, /explora.

1. Extrae el texto de las figuras/tablas del PDF (pdftotext -layout).
2. Para cada figura toma los porcentajes y conteos que imprime la gráfica.
3. Los busca entre los valores que publica /api/explora/dataset para las preguntas correspondientes
   (conteos y porcentajes de las barras, bajo/medio/alto de las matrices, Sí/No).
4. Lista lo que el informe muestra y la base/Explorador NO tiene (o tiene con otro valor).

Uso: python etl/comparar_informe.py [ruta.pdf] [url_dataset]
"""
import json, re, subprocess, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PDF = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'Informe_AnalisisEncuestaConfianzaInstitucional_2025.pdf'
URL = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:8080/api/explora/dataset?anio=2025'

# figura/tabla del informe -> claves de /explora que la representan
MAPA = {
    'Tabla 3': ['sd_localidad'], 'Tabla 4': ['sd_municipio'], 'Tabla 5': ['__localidad'], 'Figura 39': ['ri_q8'],
    'Figura 1': ['sd_edad'], 'Figura 2': ['sd_genero'], 'Figura 3': ['sd_educacion'], 'Figura 4': ['sd_ocupacion'], 'Figura 5': ['sd_estrato'],
    'Figura 6': ['sd_servidor', 'sd_autopercepcion'], 'Figura 7': ['ci_q1'], 'Figura 8': ['ci_q2'], 'Figura 9': ['ci_q3'], 'Figura 10': ['ci_q4'],
    'Figura 11': ['ci_q5'], 'Figura 12': ['ci_q6'], 'Figura 13': ['ci_q7'], 'Figura 14': ['ci_q9_matrix'], 'Tabla 6': ['ci_q10_matrix'],
    'Figura 15': ['ci_q8'], 'Figura 16': ['cr_q1_matrix'], 'Figura 17': ['cr_q2'], 'Figura 18': ['cr_q3_matrix'], 'Figura 19': ['cr_q4'],
    'Figura 20': ['cr_q5'], 'Figura 21': ['cr_q6'], 'Figura 22': ['cr_q7'], 'Tabla 7': ['pa_q1'], 'Figura 23': ['pa_q2_matrix'],
    'Tabla 8': ['pa_q4_open'], 'Figura 24': ['pa_q5'], 'Figura 25': ['pa_q6'], 'Tabla 9': ['pa_q7_matrix'], 'Figura 26': ['pa_q8'],
    'Figura 27': ['pa_q9'], 'Figura 28': ['pa_q10_matrix'], 'Figura 29': ['pa_q11_matrix'], 'Figura 30': ['pa_q12'], 'Figura 31': ['pa_q13'],
    'Figura 32': ['pa_q14_si'], 'Figura 33': ['pa_q14_no'], 'Figura 34': ['ri_q1_matrix'], 'Figura 35': ['ri_q2'], 'Figura 36': ['ri_q3'],
    'Figura 37': ['ri_q4'], 'Tabla 10': ['ri_q6'], 'Figura 38': ['ri_q8'], 'Tabla 11': ['ri_q10'], 'Figura 40': ['tp_q1'],
    'Figura 41': ['sg_q1'], 'Figura 42': ['sg_q2'], 'Figura 43': ['sg_q3'], 'Figura 44': ['sg_q4'], 'Figura 45': ['sg_q5'],
    'Figura 46': ['sg_q9', 'sg_q10_si'], 'Figura 47': ['mv_q1'], 'Figura 48': ['mv_q2'], 'Figura 49': ['mv_q4_matrix'], 'Figura 50': ['mv_q5'],
    'Figura 51': ['mv_q8'], 'Figura 52': ['de_q2'], 'Figura 53': ['de_q1'], 'Figura 54': ['de_q4'], 'Figura 55': ['de_q3'],
    'Figura 56': ['de_q7', 'de_q8', 'de_q10'], 'Figura 57': ['bie_q1_matrix'], 'Figura 58': ['bie_q2', 'bie_q3'], 'Figura 59': ['bie_q4', 'bie_q5'],
    'Figura 60': ['bie_q7_matrix'], 'Figura 61': ['gp_q1'], 'Figura 62': ['gp_q5_matrix'], 'Figura 63': ['gp_q4'], 'Figura 64': ['gp_q6', 'gp_q7'],
    'Tabla 12': ['sp_q1_matrix', 'sp_q2_matrix', 'sp_q3_matrix', 'sp_q4_matrix'], 'Figura 65': ['sp_q5_matrix'], 'Figura 66': ['sp_q7_matrix'],
    'Figura 67': ['sp_q6_matrix'],
}

txt = subprocess.run(['pdftotext', '-layout', str(PDF), '-'], capture_output=True).stdout.decode('utf-8', 'replace').split('\n')
ds = json.load(urllib.request.urlopen(URL))
P = ds['preguntas']

SKIP = re.compile(r'C.digo: CI-FO|Versi.n: 008|Fecha Vigencia|An.lisis de resultados de la|Encuesta de Percepci.n de\s*$|Confianza Institucional en\s*$|Bogot. D.C \(2025\)\s*$')
inicio = next(i for i, l in enumerate(txt) if 'Tabla 1. N' in l and i > 600)
caps = [(i, re.match(r'\s*((?:Figura|Tabla) \d+)\.', l).group(1)) for i, l in enumerate(txt) if i >= inicio and re.match(r'\s*(Figura|Tabla) \d+\.', l)]


def segmento(i):
    out = []
    for x in range(i, min(len(txt), i + 90)):
        s = txt[x]
        if x > i and re.match(r'\s*Fuente:', s):
            break
        if x > i and re.match(r'\s*(Figura|Tabla) \d+\.', s):
            break
        if SKIP.search(s) or not s.strip():
            continue
        out.append(s)
    return '\n'.join(out)


def candidatos(claves, segmentos=('todos',)):
    pct, cnt, prom = set(), set(), set()
    for k in claves:
        if k == '__localidad':
            for l in ds['localidad_alcalde']:
                pct.add(l['porcentaje']); cnt.add(l['n']); prom.add(l['promedio'])
            continue
        q = P.get(k)
        if not q:
            continue
        for sct in q.get('satisfaccion_por_sector') or []:
            pct.update([sct['satisfaccion'], sct['insatisfaccion']]); cnt.add(sct['n'])
        fuentes = [q] + (q.get('items') or [])
        for f in fuentes:
            for seg in (f.get('graficas') or {}).values() if f is q else []:
                for g in seg.values():
                    pass
        graf = q.get('graficas') or {}
        for it, porSeg in graf.items():
            for sk, g in porSeg.items():
                if sk not in segmentos:
                    continue
                for fila in g['filas']:
                    pct.add(round(fila['porcentaje'], 4)); cnt.add(fila['n'])
                cnt.add(g['base'])
                if g.get('promedio') is not None:
                    prom.add(g['promedio'])
        for obj in [q] + (q.get('items') or []):
            c = (obj.get('comparativa') or {}).get('todos')
            if c:
                pct.update([c['pct_bajo'], c['pct_medio'], c['pct_alto']]); cnt.update([c['n_bajo'], c['n_medio'], c['n_alto'], c['n']])
            b = (obj.get('binaria') or {}).get('todos')
            if b:
                pct.update([b['pct_si'], b['pct_no']]); cnt.update([b['n_si'], b['n_no']])
        if q.get('respuestas_recibidas'):
            cnt.add(q['respuestas_recibidas'])
    return pct, cnt, prom


def toks(seg):
    """Porcentajes y conteos que imprime la gráfica, sin los números de los ejes ni los del título."""
    seg = '\n'.join(seg.split('\n')[2:])
    seg = re.sub(r'\d+\.\d{3}\.\d{3}', '', seg)
    p = []
    for raw in re.findall(r'(\d+(?:,\d+)?)\s?%', seg):
        v = float(raw.replace(',', '.'))
        if v % 5 == 0 and re.fullmatch(r'\d+(?:,0+)?', raw):   # marcas del eje (5%, 10,00% ...)
            continue
        p.append(v)
    seg2 = re.sub(r'\d+(?:,\d+)?\s?%', ' ', seg)
    c = []
    for raw in re.findall(r'(?<![\d,.])(\d{1,3}(?:\.\d{3})+|\d{1,4})(?![\d,])', seg2):
        v = int(raw.replace('.', ''))
        if (v <= 200 and v % 5 == 0) or (v > 200 and v % 100 == 0) or v < 6:   # marcas del eje y categorías 1-5
            continue
        c.append(v)
    return p, c


resumen = []
for i, nombre in caps:
    if nombre not in MAPA:
        resumen.append((nombre, 'sin mapa', [], []))
        continue
    seg = segmento(i)
    p, c = toks(seg)
    pct, cnt, prom = candidatos(MAPA[nombre], ('todos', 'ocupacion:Servidores distritales', 'ocupacion:Ciudadanía') if nombre == 'Tabla 7' else ('todos',))
    if not pct:
        resumen.append((nombre, 'SIN DATOS EN EXPLORA', p, c))
        continue
    faltan_p = sorted({x for x in p if x > 0 and not any(abs(x - y) <= (0.06 if '.' in str(x) and len(str(x).split('.')[1]) >= 1 else 0.51) for y in pct) and x != 100.0})
    # los porcentajes enteros (37%) se comparan contra valores redondeados
    faltan_c = sorted({x for x in c if x not in cnt})
    resumen.append((nombre, 'ok' if not faltan_p and not faltan_c else 'DIFERENCIAS', faltan_p, faltan_c))

ok = sum(1 for r in resumen if r[1] == 'ok')
print(f'Figuras/tablas revisadas: {len(resumen)} · sin diferencias: {ok}\n')
for nombre, est, fp, fc in resumen:
    if est == 'ok':
        print(f'{nombre:10s} OK')
    else:
        print(f'{nombre:10s} {est}  % que el informe imprime y no están en la base: {fp[:14]}  conteos: {fc[:14]}')
