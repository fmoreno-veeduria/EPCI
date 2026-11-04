"""
Cargador de años de encuesta. Servicio interno (no publica puerto): lo llama el sitio web cuando un administrador
sube un Excel. Cada año usa las MISMAS preguntas (mismas columnas) que la encuesta de 2025.

  GET    /plantilla            Excel vacío con las cabeceras exactas de las preguntas
  POST   /cargar               cuerpo = archivo .xlsx; parámetros: anio, reemplazar, usuario, archivo
  GET    /estado/<job>         avance y resultado de una carga
  DELETE /anio/<anio>          elimina un año (nunca uno con informe oficial)

Los valores que ya existían en 2025 se homologan exactamente igual que entonces (se leen de la base);
solo los valores nuevos pasan por las reglas de reglas.py.
"""
import hashlib
import io
import os
import re
import threading
import time
import uuid
from collections import Counter, defaultdict

import openpyxl
import pymysql
from flask import Flask, jsonify, request, send_file
from openpyxl.utils import get_column_letter

import reglas as R

app = Flask(__name__)
TOKEN = os.environ.get('CARGA_TOKEN', '')
MAX_BYTES = 80 * 1024 * 1024
app.config['MAX_CONTENT_LENGTH'] = MAX_BYTES

JOBS = {}
LOCK = threading.Lock()

# categorías de perfil que el informe muestra con el texto original (ver 05b_ajustes_informe.sql)
HK_ORIGINAL = {'VIVE_BOGOTA', 'EDAD', 'GENERO', 'EDUCACION', 'OCUPACION', 'DISCAPACIDAD', 'ETNIA', 'INGRESOS',
               'LUGAR_NACIMIENTO', 'AUTOPERCEPCION_CIUDADANA', 'TEMA_PRIORITARIO'}
RAZONES_FIG33 = {'No tengo información al respecto', 'No tengo tiempo para esas actividades', 'Por riesgos a mi seguridad',
                 'No sirve para nada', 'Hay personas que lo hacen mejor que yo', 'No me interesa participar', 'Por temor a ser desacreditado/a'}
OTRAS_FIG33 = 'Otras respuestas abiertas (incompatibilidad como servidor, roscas, salud, etc.)'
SABANA = {'Cota', 'Fusagasugá', 'Silvania', 'Sopó', 'Tabio', 'Tenjo', 'Tocancipá'}
SABANA_LAB = 'Otros municipios de la sabana de Bogotá (Cota, Fusagasugá, Silvania, Sopó, Tabio, Tenjo, Tocancipá)'
CAUSAS_128 = ['Falta de estrategias más efectivas', 'Falta de articulación interinstitucional', 'Falta de capacidades operativas',
              'Falta de inteligencia estratégica', 'Falta de personal', 'Escasez de recursos técnicos y tecnológicos']
OTRO_128 = 'Otro (respuestas ciudadanas abiertas)'
HK_LIKERT = dict(R.LIKERTS)

STOP = set(('de la que el en y a los del se las por un para con no una su al lo como más pero sus le ya o este sí porque esta entre cuando muy sin sobre también me hasta hay donde quien desde todo nos durante todos uno les ni contra otros ese eso ante ellos e esto mí antes algunos qué unos yo otro otras otra él tanto esa estos mucho quienes nada muchos cual poco ella estar estas algunas algo nosotros mi mis tú te ti tu tus ellas nosotras vosotros vosotras os mío mía míos mías tuyo tuya suyo suya nuestro nuestra son es ser está están fue ha han sea sean más menos así cada bien mejor mayor manera debe deben puede pueden tiene tienen hacer hace parte través según tipo tema temas bogotá distrital distrito administración ciudadanos ciudadanía ciudad').split())


def conectar():
    return pymysql.connect(host=os.environ.get('DB_HOST', 'eficiencia'), port=int(os.environ.get('DB_PORT', '3306')),
                           user=os.environ.get('DB_USER', 'web_carga'), password=os.environ.get('DB_PASSWORD', 'web_carga'),
                           database=os.environ.get('DB_NAME', 'eficiencia'), charset='utf8mb4', autocommit=False)


@app.before_request
def autenticar():
    if not TOKEN or request.headers.get('X-Carga-Token') != TOKEN:
        return jsonify(error='No autorizado'), 401


def preguntas_db(cx):
    with cx.cursor() as c:
        c.execute('SELECT id_pregunta, columna_excel, encabezado_original, tipo_respuesta, tipo_homologacion FROM preguntas ORDER BY id_pregunta')
        return c.fetchall()


@app.get('/plantilla')
def plantilla():
    cx = conectar()
    try:
        pre = preguntas_db(cx)
    finally:
        cx.close()
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Respuestas'
    ws.append([p[2] for p in pre])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return send_file(buf, as_attachment=True, download_name='plantilla_encuesta.xlsx',
                     mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')


class ErrorCarga(Exception):
    pass


def paso(job, texto):
    JOBS[job]['paso'] = texto


def hom_fallback_cat(j, hk, v):
    """Valor de una columna categórica que no existía en 2025."""
    if hk in HK_ORIGINAL:
        return v
    if hk == 'MUNICIPIO':
        return SABANA_LAB if v in SABANA else v
    if hk == 'RAZON_NO_CONTROL_SOCIAL':
        return v if v in RAZONES_FIG33 else OTRAS_FIG33
    return R.CAT_MAP[j][1](v)


def cargar(job, datos, anio, reemplazar, usuario, archivo):
    cx = conectar()
    try:
        _cargar(job, cx, datos, anio, reemplazar, usuario, archivo)
    except ErrorCarga as e:
        cx.rollback()
        JOBS[job].update(estado='error', error=str(e))
    except Exception as e:  # noqa: BLE001
        cx.rollback()
        app.logger.exception('carga fallida')
        JOBS[job].update(estado='error', error=f'Error inesperado: {e}')
    finally:
        cx.close()
        LOCK.release()


def borrar_anio(cx, anio):
    with cx.cursor() as c:
        c.execute('DELETE o FROM respuestas_opciones o JOIN encuestados e ON e.id_encuestado = o.id_encuestado WHERE e.anio = %s', (anio,))
        c.execute('DELETE r FROM respuestas r JOIN encuestados e ON e.id_encuestado = r.id_encuestado WHERE e.anio = %s', (anio,))
        c.execute('DELETE FROM encuestados WHERE anio = %s', (anio,))
        c.execute('DELETE FROM EF_NUBE_PALABRAS_DATOS WHERE anio = %s', (anio,))
        c.execute('DELETE FROM EF_VALOR_EDITADO WHERE anio = %s', (anio,))
        c.execute('DELETE FROM EF_ANIO WHERE anio = %s', (anio,))


def _cargar(job, cx, datos, anio, reemplazar, usuario, archivo):
    paso(job, 'Leyendo el Excel')
    try:
        wb = openpyxl.load_workbook(io.BytesIO(datos), read_only=True, data_only=True)
        raw = list(wb.worksheets[0].iter_rows(values_only=True))
    except Exception as e:  # noqa: BLE001
        raise ErrorCarga(f'No se pudo leer el archivo como Excel (.xlsx): {e}')
    if len(raw) < 2:
        raise ErrorCarga('El archivo no tiene filas de respuestas (solo cabecera o vacío).')

    pre = preguntas_db(cx)
    ncol = len(pre)
    hdr = [R.clean(h) if h is not None else '' for h in raw[0]]
    while hdr and not hdr[-1]:
        hdr.pop()
    if len(hdr) != ncol:
        raise ErrorCarga(f'El Excel tiene {len(hdr)} columnas y las preguntas son {ncol}. Cada año debe usar las mismas preguntas: descarga la plantilla.')
    malas = [f'{get_column_letter(j + 1)}: «{hdr[j][:70]}» ≠ «{R.clean(pre[j][2])[:70]}»' for j in range(ncol) if hdr[j] != R.clean(pre[j][2])]
    if malas:
        raise ErrorCarga(f'{len(malas)} cabeceras no coinciden con las preguntas de la encuesta. Primeras: ' + ' | '.join(malas[:6]))

    with cx.cursor() as c:
        c.execute('SELECT usa_informe FROM EF_ANIO WHERE anio = %s', (anio,))
        ya = c.fetchone()
    if ya and ya[0]:
        raise ErrorCarga(f'El año {anio} tiene informe oficial y no se puede reemplazar.')
    if ya and not reemplazar:
        raise ErrorCarga(f'Ya hay datos del año {anio}. Marca «reemplazar» para sustituirlos.')

    data = []
    for r in raw[1:]:
        fila = [R.cell(v) for v in list(r)[:ncol]] + [None] * (ncol - len(r))
        if any(v is not None for v in fila):
            data.append(fila)
    if not data:
        raise ErrorCarga('No hay filas con respuestas.')

    # ---- plan por columna: igual que build_seed, pero el tipo sale de la base (no de los datos nuevos)
    plan = {}
    for j, (idp, col, enc, tipo, hk) in enumerate(pre):
        if j == R.THEMES_COL:
            plan[j] = dict(kind='themes', hk='TEMAS_PARTICIPACION')
        elif j in R.OPEN_COLS:
            plan[j] = dict(kind='open')
        elif j in R.MULTI:
            plan[j] = dict(kind='multi', hk=R.MULTI[j][0])
        elif j in R.CAT_MAP:
            plan[j] = dict(kind='cat', hk=R.CAT_MAP[j][0])
        elif hk in ('ESCALA_1_5', 'ESCALA_1_10'):
            plan[j] = dict(kind='scale', hk=hk)
        elif hk in HK_LIKERT:
            plan[j] = dict(kind='likert', hk=hk, mp=HK_LIKERT[hk])
        elif hk == 'SI_NO':
            plan[j] = dict(kind='yesno', hk=hk)
        else:
            plan[j] = dict(kind='cat_literal', hk=hk)

    paso(job, 'Leyendo la homologación existente')
    known, known_opt = {}, defaultdict(list)
    with cx.cursor() as c:
        c.execute("SELECT DISTINCT r.id_pregunta, r.respuesta_original, r.respuesta_homologada, r.valor_numerico FROM respuestas r "
                  "JOIN preguntas p ON p.id_pregunta = r.id_pregunta WHERE p.tipo_respuesta IN ('categorica','si_no')")
        for idp, o, h, n in c.fetchall():
            known[(idp, o)] = (h, n)
        c.execute("SELECT DISTINCT id_pregunta, opcion_original, opcion_homologada FROM respuestas_opciones WHERE id_pregunta <> 76")
        for idp, o, h in c.fetchall():
            known_opt[(idp, o)].append(h)
        c.execute('SELECT tipo_homologacion, valor_hash, valor_homologado FROM homologacion')
        hom_exist = {(a, b, d) for a, b, d in c.fetchall()}
        c.execute('SELECT COALESCE(MAX(id_encuestado),0), (SELECT COALESCE(MAX(id_respuesta),0) FROM respuestas), '
                  '(SELECT COALESCE(MAX(id_opcion),0) FROM respuestas_opciones), (SELECT COALESCE(MAX(id_homologacion),0) FROM homologacion) FROM encuestados')
        max_enc, max_resp, max_opt, max_hom = c.fetchone()
    if ya:  # al reemplazar, los ids de ese año se liberan
        pass

    nuevos, problemas = {}, {}

    def nuevo(j, v, motivo=None):
        k = (j, v)
        (problemas if motivo else nuevos).setdefault(k, 0)
        (problemas if motivo else nuevos)[k] += 1

    def homologar(j, v):
        p = plan[j]
        k, hk = p['kind'], p.get('hk')
        idp = j + 1
        if k == 'scale':
            m = R.SCALE_RE.match(v)
            if m:
                n = int(m.group(1))
                return [(v, str(n))], n, hk
            nuevo(j, v, 'no es 1-10')
            return [(v, v)], None, hk
        if k == 'likert':
            n = p['mp'].get(R.nkey(v))
            if n is not None:
                return [(v, R.clean(v))], n, hk
            nuevo(j, v, 'no es de la escala')
            return [(v, v)], None, hk
        if k == 'yesno':
            nv = R.norm(v)
            if nv in ('si', 'no'):
                s = 'Sí' if nv == 'si' else 'No'
                return [(v, s)], 1 if s == 'Sí' else 0, hk
            nuevo(j, v, 'no es Sí/No')
            return [(v, v)], None, hk
        if k in ('cat', 'cat_literal'):
            kn = known.get((idp, v))
            if kn:
                return [(v, kn[0])], kn[1], hk
            nuevo(j, v)
            lab = hom_fallback_cat(j, hk, v) if k == 'cat' else ('Sí' if R.norm(v) == 'si' else v)
            return [(v, lab)], None, hk
        if k == 'multi':
            _, keys, fb = R.MULTI[j]
            pares = []
            for t in R.split_multi(v):
                labs = known_opt.get((idp, t))
                if labs:
                    pares += [(t, lab) for lab in labs]
                    continue
                nuevo(j, t)
                nt = R.norm(t)
                lab = next((l for pre_, l in keys if nt.startswith(pre_)), None)
                if idp == 128:
                    canon = next((c for c in CAUSAS_128 if nt.startswith(R.norm(c))), None)
                    if canon:
                        pares.append((t, canon))
                        if len(t) > len(canon) + 1:
                            pares.append((t, OTRO_128))
                    else:
                        pares.append((t, OTRO_128))
                else:
                    pares.append((t, lab or fb(t)))
            return pares, None, hk
        raise ValueError(k)

    paso(job, f'Homologando {len(data):,} filas'.replace(',', '.'))
    enc_rows, resp_rows, opt_rows = [], [], []
    hom_nuevas = {}
    rid, oid, eid = max_resp, max_opt, max_enc
    if ya:
        eid, rid, oid = max_enc, max_resp, max_opt
    for i, fila in enumerate(data, start=1):
        eid += 1
        nresp = 0
        for j, v in enumerate(fila):
            if v is None:
                continue
            rid += 1
            nresp += 1
            qid = j + 1
            kind = plan[j]['kind']
            if kind == 'open':
                resp_rows.append((rid, eid, qid, v, None, None))
                continue
            if kind == 'themes':
                th = R.themes_of(v)
                for t in th:
                    oid += 1
                    opt_rows.append((oid, rid, eid, qid, v, t))
                    hom_nuevas.setdefault(('TEMAS_PARTICIPACION', v, t), [None, 0])[1] += 1
                resp_rows.append((rid, eid, qid, v, ' | '.join(th), None))
                continue
            pares, num, hk = homologar(j, v)
            if kind == 'multi':
                labs = list(dict.fromkeys(l for _, l in pares))
                for orig, lab in pares:
                    oid += 1
                    opt_rows.append((oid, rid, eid, qid, orig, lab))
                    hom_nuevas.setdefault((hk, orig, lab), [None, 0])[1] += 1
                resp_rows.append((rid, eid, qid, v, ' | '.join(labs), None))
            else:
                lab = pares[0][1]
                hom_nuevas.setdefault((hk, v, lab), [num, 0])[1] += 1
                resp_rows.append((rid, eid, qid, v, lab, num))
        enc_rows.append((max_enc + i, i, nresp, anio))

    with cx.cursor() as c:
        c.execute('SET foreign_key_checks = 0')
        c.execute('SET unique_checks = 0')
        if ya:
            paso(job, f'Eliminando los datos anteriores de {anio}')
            borrar_anio(cx, anio)

        def por_lotes(sql, filas, n=4000):
            for a in range(0, len(filas), n):
                c.executemany(sql, filas[a:a + n])

        paso(job, 'Guardando personas y respuestas')
        por_lotes('INSERT INTO encuestados (id_encuestado, fila_excel, n_respondidas, anio) VALUES (%s,%s,%s,%s)', enc_rows)
        por_lotes('INSERT INTO respuestas (id_respuesta, id_encuestado, id_pregunta, respuesta_original, respuesta_homologada, valor_numerico) VALUES (%s,%s,%s,%s,%s,%s)', resp_rows)
        por_lotes('INSERT INTO respuestas_opciones (id_opcion, id_respuesta, id_encuestado, id_pregunta, opcion_original, opcion_homologada) VALUES (%s,%s,%s,%s,%s,%s)', opt_rows)

        paso(job, 'Actualizando el diccionario de homologación')
        hid = max_hom
        nuevas_hom = []
        for (hk, orig, lab), (num, n) in hom_nuevas.items():
            h = hashlib.md5(orig.encode('utf-8')).hexdigest()
            if (hk, h, lab) in hom_exist:
                continue
            hid += 1
            nuevas_hom.append((hid, hk, orig, h, lab, num, num, n))
            hom_exist.add((hk, h, lab))
        por_lotes('INSERT IGNORE INTO homologacion (id_homologacion, tipo_homologacion, valor_original, valor_hash, valor_homologado, valor_numerico, orden, n_casos) '
                  'VALUES (%s,%s,%s,%s,%s,%s,%s,%s)', nuevas_hom)
        c.execute('SET unique_checks = 1')
        c.execute('SET foreign_key_checks = 1')

        # nube de palabras de las preguntas abiertas que muestra /explora
        paso(job, 'Calculando nubes de palabras')
        c.execute("SELECT DISTINCT i.id_pregunta FROM EF_PREGUNTA q JOIN EF_PREGUNTA_ITEM i ON i.clave = q.clave AND i.item_orden = 1 "
                  "JOIN preguntas p ON p.id_pregunta = i.id_pregunta WHERE q.tipo_registro IN ('open','multi_category') AND p.tipo_respuesta = 'abierta'")
        abiertas = [r[0] for r in c.fetchall()]
        c.execute('DELETE FROM EF_NUBE_PALABRAS_DATOS WHERE anio = %s', (anio,))
        nube = []
        for idp in abiertas:
            cont = Counter()
            for fila in data:
                v = fila[idp - 1]
                if v:
                    cont.update({w for w in re.findall(r'[a-záéíóúñü]{4,}', v.lower()) if w not in STOP and R.norm(w) not in STOP})
            for pos, (w, n) in enumerate(sorted(cont.items(), key=lambda x: (-x[1], x[0]))[:40], 1):
                nube.append((anio, idp, pos, w, n))
        por_lotes('INSERT INTO EF_NUBE_PALABRAS_DATOS (anio, id_pregunta, posicion, palabra, menciones) VALUES (%s,%s,%s,%s,%s)', nube)

        c.execute('REPLACE INTO EF_ANIO (anio, etiqueta, usa_informe, filas, archivo, usuario) VALUES (%s,%s,0,%s,%s,%s)',
                  (anio, f'Encuesta {anio}', len(data), archivo[:255], usuario))
        c.execute('INSERT INTO EF_CARGA_LOG (anio, accion, archivo, filas, respuestas, valores_nuevos, usuario) VALUES (%s,%s,%s,%s,%s,%s,%s)',
                  (anio, 'reemplazar' if ya else 'cargar', archivo[:255], len(data), len(resp_rows), len(nuevos) + len(problemas), usuario))
    cx.commit()

    paso(job, 'Calculando conteos para las gráficas (puede tardar varios minutos)')
    with cx.cursor() as c:
        c.execute('CALL EF_REFRESCAR_CONTEOS_ANIO(%s)', (anio,))
    cx.commit()

    def muestra(d, n=25):
        return [{'columna': get_column_letter(j + 1), 'pregunta': R.clean(pre[j][2])[:90], 'valor': v[:90], 'veces': k}
                for (j, v), k in sorted(d.items(), key=lambda x: -x[1])[:n]]

    JOBS[job].update(estado='listo', paso='Listo', resultado=dict(
        anio=anio, filas=len(data), respuestas=len(resp_rows), opciones=len(opt_rows), reemplazo=bool(ya),
        valores_nuevos=len(nuevos), muestra_nuevos=muestra(nuevos), valores_no_reconocidos=len(problemas), muestra_no_reconocidos=muestra(problemas)))


@app.post('/cargar')
def cargar_http():
    try:
        anio = int(request.args.get('anio', ''))
    except ValueError:
        return jsonify(error='Año no válido'), 400
    if not 2000 <= anio <= 2100:
        return jsonify(error='El año debe estar entre 2000 y 2100'), 400
    datos = request.get_data()
    if len(datos) < 1000 or datos[:2] != b'PK':
        return jsonify(error='El archivo no parece un Excel .xlsx'), 400
    cx = conectar()
    try:
        with cx.cursor() as c:
            c.execute('SELECT usa_informe FROM EF_ANIO WHERE anio = %s', (anio,))
            ya = c.fetchone()
    finally:
        cx.close()
    if ya and ya[0]:
        return jsonify(error=f'El año {anio} tiene informe oficial y no se puede reemplazar.'), 400
    if ya and request.args.get('reemplazar') != '1':
        return jsonify(error=f'Ya hay datos del año {anio}. Marca «reemplazar» para sustituirlos.'), 409
    if not LOCK.acquire(blocking=False):
        return jsonify(error='Ya hay una carga en curso. Espera a que termine.'), 409
    job = uuid.uuid4().hex[:12]
    JOBS[job] = dict(estado='en_curso', paso='Iniciando', inicio=time.time())
    threading.Thread(target=cargar, daemon=True, args=(
        job, datos, anio, request.args.get('reemplazar') == '1', request.args.get('usuario', 'admin')[:40], request.args.get('archivo', 'archivo.xlsx'))).start()
    return jsonify(job=job)


@app.get('/estado/<job>')
def estado(job):
    j = JOBS.get(job)
    if not j:
        return jsonify(error='Carga no encontrada'), 404
    return jsonify({**j, 'segundos': int(time.time() - j['inicio'])})


@app.delete('/anio/<int:anio>')
def eliminar(anio):
    cx = conectar()
    try:
        with cx.cursor() as c:
            c.execute('SELECT usa_informe, filas FROM EF_ANIO WHERE anio = %s', (anio,))
            r = c.fetchone()
        if not r:
            return jsonify(error='Ese año no existe'), 404
        if r[0]:
            return jsonify(error='Este año tiene informe oficial y no se puede eliminar'), 400
        if not LOCK.acquire(blocking=False):
            return jsonify(error='Hay una carga en curso'), 409
        try:
            borrar_anio(cx, anio)
            with cx.cursor() as c:
                c.execute('INSERT INTO EF_CARGA_LOG (anio, accion, filas, usuario) VALUES (%s,%s,%s,%s)',
                          (anio, 'eliminar', r[1], request.args.get('usuario', 'admin')[:40]))
            cx.commit()
            with cx.cursor() as c:
                c.execute('CALL EF_REFRESCAR_CONTEOS_ANIO(%s)', (anio,))
            cx.commit()
        finally:
            LOCK.release()
        return jsonify(ok=True)
    except Exception as e:  # noqa: BLE001
        cx.rollback()
        app.logger.exception('eliminar')
        return jsonify(error=f'No se pudo eliminar: {e}'), 500
    finally:
        cx.close()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
