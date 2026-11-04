#!/usr/bin/env python3
"""
Prueba de regresión de /explora contra el informe oficial.

1. Valores esperados (etl/esperados_informe.json) contra /api/explora/dataset (que sale solo de las vistas EF_*).
2. Figuras especiales presentes y matrices de 5 niveles marcadas.
3. etl/comparar_informe.py: falla si aparece una figura con diferencias que no esté en `diferencias_conocidas`.

Uso: python etl/prueba_regresion.py [url_dataset]      (código de salida 0 = todo bien, 1 = hay regresiones)
"""
import json, subprocess, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8080/api/explora/dataset?anio=2025'
E = json.loads((ROOT / 'etl' / 'esperados_informe.json').read_text(encoding='utf-8'))
ds = json.load(urllib.request.urlopen(URL))
P, fallos, ok = ds['preguntas'], [], 0


def check(cond, msg):
    global ok
    if cond:
        ok += 1
    else:
        fallos.append(msg)


for k, v in E['meta'].items():
    check(ds['meta'].get(k) == v, f'meta.{k}: esperado {v}, hay {ds["meta"].get(k)}')

for d in E['distribuciones']:
    g = (P.get(d['clave'], {}).get('graficas') or {}).get('1', {}).get('todos')
    if not g:
        fallos.append(f'{d["figura"]}: {d["clave"]} sin datos'); continue
    check(g['base'] == d['base'], f'{d["figura"]} base: esperado {d["base"]}, hay {g["base"]}')
    filas = {f['categoria']: f for f in g['filas']}
    for cat, (n, pct) in d['filas'].items():
        f = filas.get(cat)
        if not f:
            fallos.append(f'{d["figura"]}: falta la categoría «{cat}»'); continue
        check(f['n'] == n, f'{d["figura"]} «{cat}» n: esperado {n}, hay {f["n"]}')
        check(abs(f['porcentaje'] - pct) <= d['tol'], f'{d["figura"]} «{cat}» %: esperado {pct}, hay {f["porcentaje"]:.4f}')

for t in E['tablas']:
    q = P.get(t['clave'])
    if not q:
        fallos.append(f'{t["figura"]}: {t["clave"]} no existe'); continue
    if 'ranking' in t:
        r = q.get('ranking', [])
        check(len(r) == t['ranking'], f'{t["figura"]} filas: esperado {t["ranking"]}, hay {len(r)}')
        br = next((x for x in r if x['localidad'] == 'Bogotá Región'), None)
        e = t['bogota_region']
        check(bool(br) and br['n'] == e['n'] and abs(br['promedio'] - e['promedio']) < 0.006 and abs(br['porcentaje'] - e['porcentaje']) < 0.06,
              f'{t["figura"]} Bogotá Región: esperado {e}, hay {br}')
    else:
        g = q['graficas']['1']['todos']
        if 'base' in t:
            check(g['base'] == t['base'], f'{t["figura"]} base: esperado {t["base"]}, hay {g["base"]}')
        check(len(g['filas']) == t['filas'], f'{t["figura"]} categorías: esperado {t["filas"]}, hay {len(g["filas"])}')

for seg, n in E['ocupacion'].items():
    base = P['ci_q1']['graficas']['1'].get(f'ocupacion:{seg}', {}).get('base')
    check(base == n, f'ocupación «{seg}»: esperado {n}, hay {base}')

for k in E['figuras_especiales']:
    check(P.get(k, {}).get('tipo') in ('ranking', 'combinada'), f'figura especial {k} ausente')
for k in E['matrices_5_niveles']:
    check(P.get(k, {}).get('niveles') == 5, f'{k} no está marcada con 5 niveles')

# informe PDF ↔ vistas: no debe aparecer ninguna diferencia nueva
res = subprocess.run([sys.executable, str(ROOT / 'etl' / 'comparar_informe.py')], capture_output=True, text=True, encoding='utf-8', env={**__import__('os').environ, 'PYTHONIOENCODING': 'utf-8'})
con_dif = [l.split('  ')[0].strip() for l in res.stdout.splitlines() if 'DIFERENCIAS' in l or 'SIN DATOS' in l]
nuevas = [f for f in con_dif if f not in E['diferencias_conocidas']]
check(res.returncode == 0, f'comparar_informe.py falló: {res.stderr[-200:]}')
check(not nuevas, f'figuras con diferencias nuevas respecto al informe: {nuevas}')
resueltas = [f for f in E['diferencias_conocidas'] if f not in con_dif]

print(f'Comprobaciones correctas: {ok} · fallos: {len(fallos)}')
for f in fallos:
    print('  ✘', f)
if resueltas:
    print('Diferencias conocidas ya resueltas (quítalas de esperados_informe.json):', resueltas)
sys.exit(1 if fallos else 0)
