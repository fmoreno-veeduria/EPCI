-- Generado por etl/build_seed.py. No editar a mano.
SET NAMES utf8mb4;

CREATE OR REPLACE VIEW v_diccionario AS
SELECT p.id_pregunta, p.codigo, LOWER(p.codigo) AS alias_en_vistas_base, p.columna_excel, p.modulo, p.numero_pregunta,
       p.enunciado, p.subitem, p.subitem_corto, p.tipo_respuesta, p.tipo_homologacion, p.encabezado_truncado, p.n_respuestas
FROM preguntas p
ORDER BY p.id_pregunta;

CREATE OR REPLACE VIEW v_respuestas_detalle AS
SELECT r.id_respuesta, r.id_encuestado, p.id_pregunta, p.codigo, p.modulo, p.numero_pregunta, p.enunciado,
       p.subitem_corto, p.tipo_respuesta, r.respuesta_original, r.respuesta_homologada, r.valor_numerico
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta;

CREATE OR REPLACE VIEW v_base_excel AS
SELECT e.id_encuestado,
  MAX(CASE WHEN r.id_pregunta = 1 THEN r.respuesta_original END) AS p001,
  MAX(CASE WHEN r.id_pregunta = 2 THEN r.respuesta_original END) AS p002,
  MAX(CASE WHEN r.id_pregunta = 3 THEN r.respuesta_original END) AS p003,
  MAX(CASE WHEN r.id_pregunta = 4 THEN r.respuesta_original END) AS p004,
  MAX(CASE WHEN r.id_pregunta = 5 THEN r.respuesta_original END) AS p005,
  MAX(CASE WHEN r.id_pregunta = 6 THEN r.respuesta_original END) AS p006,
  MAX(CASE WHEN r.id_pregunta = 7 THEN r.respuesta_original END) AS p007,
  MAX(CASE WHEN r.id_pregunta = 8 THEN r.respuesta_original END) AS p008,
  MAX(CASE WHEN r.id_pregunta = 9 THEN r.respuesta_original END) AS p009,
  MAX(CASE WHEN r.id_pregunta = 10 THEN r.respuesta_original END) AS p010,
  MAX(CASE WHEN r.id_pregunta = 11 THEN r.respuesta_original END) AS p011,
  MAX(CASE WHEN r.id_pregunta = 12 THEN r.respuesta_original END) AS p012,
  MAX(CASE WHEN r.id_pregunta = 13 THEN r.respuesta_original END) AS p013,
  MAX(CASE WHEN r.id_pregunta = 14 THEN r.respuesta_original END) AS p014,
  MAX(CASE WHEN r.id_pregunta = 15 THEN r.respuesta_original END) AS p015,
  MAX(CASE WHEN r.id_pregunta = 16 THEN r.respuesta_original END) AS p016,
  MAX(CASE WHEN r.id_pregunta = 17 THEN r.respuesta_original END) AS p017,
  MAX(CASE WHEN r.id_pregunta = 18 THEN r.respuesta_original END) AS p018,
  MAX(CASE WHEN r.id_pregunta = 19 THEN r.respuesta_original END) AS p019,
  MAX(CASE WHEN r.id_pregunta = 20 THEN r.respuesta_original END) AS p020,
  MAX(CASE WHEN r.id_pregunta = 21 THEN r.respuesta_original END) AS p021,
  MAX(CASE WHEN r.id_pregunta = 22 THEN r.respuesta_original END) AS p022,
  MAX(CASE WHEN r.id_pregunta = 23 THEN r.respuesta_original END) AS p023,
  MAX(CASE WHEN r.id_pregunta = 24 THEN r.respuesta_original END) AS p024,
  MAX(CASE WHEN r.id_pregunta = 25 THEN r.respuesta_original END) AS p025,
  MAX(CASE WHEN r.id_pregunta = 26 THEN r.respuesta_original END) AS p026,
  MAX(CASE WHEN r.id_pregunta = 27 THEN r.respuesta_original END) AS p027,
  MAX(CASE WHEN r.id_pregunta = 28 THEN r.respuesta_original END) AS p028,
  MAX(CASE WHEN r.id_pregunta = 29 THEN r.respuesta_original END) AS p029,
  MAX(CASE WHEN r.id_pregunta = 30 THEN r.respuesta_original END) AS p030,
  MAX(CASE WHEN r.id_pregunta = 31 THEN r.respuesta_original END) AS p031,
  MAX(CASE WHEN r.id_pregunta = 32 THEN r.respuesta_original END) AS p032,
  MAX(CASE WHEN r.id_pregunta = 33 THEN r.respuesta_original END) AS p033,
  MAX(CASE WHEN r.id_pregunta = 34 THEN r.respuesta_original END) AS p034,
  MAX(CASE WHEN r.id_pregunta = 35 THEN r.respuesta_original END) AS p035,
  MAX(CASE WHEN r.id_pregunta = 36 THEN r.respuesta_original END) AS p036,
  MAX(CASE WHEN r.id_pregunta = 37 THEN r.respuesta_original END) AS p037,
  MAX(CASE WHEN r.id_pregunta = 38 THEN r.respuesta_original END) AS p038,
  MAX(CASE WHEN r.id_pregunta = 39 THEN r.respuesta_original END) AS p039,
  MAX(CASE WHEN r.id_pregunta = 40 THEN r.respuesta_original END) AS p040,
  MAX(CASE WHEN r.id_pregunta = 41 THEN r.respuesta_original END) AS p041,
  MAX(CASE WHEN r.id_pregunta = 42 THEN r.respuesta_original END) AS p042,
  MAX(CASE WHEN r.id_pregunta = 43 THEN r.respuesta_original END) AS p043,
  MAX(CASE WHEN r.id_pregunta = 44 THEN r.respuesta_original END) AS p044,
  MAX(CASE WHEN r.id_pregunta = 45 THEN r.respuesta_original END) AS p045,
  MAX(CASE WHEN r.id_pregunta = 46 THEN r.respuesta_original END) AS p046,
  MAX(CASE WHEN r.id_pregunta = 47 THEN r.respuesta_original END) AS p047,
  MAX(CASE WHEN r.id_pregunta = 48 THEN r.respuesta_original END) AS p048,
  MAX(CASE WHEN r.id_pregunta = 49 THEN r.respuesta_original END) AS p049,
  MAX(CASE WHEN r.id_pregunta = 50 THEN r.respuesta_original END) AS p050,
  MAX(CASE WHEN r.id_pregunta = 51 THEN r.respuesta_original END) AS p051,
  MAX(CASE WHEN r.id_pregunta = 52 THEN r.respuesta_original END) AS p052,
  MAX(CASE WHEN r.id_pregunta = 53 THEN r.respuesta_original END) AS p053,
  MAX(CASE WHEN r.id_pregunta = 54 THEN r.respuesta_original END) AS p054,
  MAX(CASE WHEN r.id_pregunta = 55 THEN r.respuesta_original END) AS p055,
  MAX(CASE WHEN r.id_pregunta = 56 THEN r.respuesta_original END) AS p056,
  MAX(CASE WHEN r.id_pregunta = 57 THEN r.respuesta_original END) AS p057,
  MAX(CASE WHEN r.id_pregunta = 58 THEN r.respuesta_original END) AS p058,
  MAX(CASE WHEN r.id_pregunta = 59 THEN r.respuesta_original END) AS p059,
  MAX(CASE WHEN r.id_pregunta = 60 THEN r.respuesta_original END) AS p060,
  MAX(CASE WHEN r.id_pregunta = 61 THEN r.respuesta_original END) AS p061,
  MAX(CASE WHEN r.id_pregunta = 62 THEN r.respuesta_original END) AS p062,
  MAX(CASE WHEN r.id_pregunta = 63 THEN r.respuesta_original END) AS p063,
  MAX(CASE WHEN r.id_pregunta = 64 THEN r.respuesta_original END) AS p064,
  MAX(CASE WHEN r.id_pregunta = 65 THEN r.respuesta_original END) AS p065,
  MAX(CASE WHEN r.id_pregunta = 66 THEN r.respuesta_original END) AS p066,
  MAX(CASE WHEN r.id_pregunta = 67 THEN r.respuesta_original END) AS p067,
  MAX(CASE WHEN r.id_pregunta = 68 THEN r.respuesta_original END) AS p068,
  MAX(CASE WHEN r.id_pregunta = 69 THEN r.respuesta_original END) AS p069,
  MAX(CASE WHEN r.id_pregunta = 70 THEN r.respuesta_original END) AS p070,
  MAX(CASE WHEN r.id_pregunta = 71 THEN r.respuesta_original END) AS p071,
  MAX(CASE WHEN r.id_pregunta = 72 THEN r.respuesta_original END) AS p072,
  MAX(CASE WHEN r.id_pregunta = 73 THEN r.respuesta_original END) AS p073,
  MAX(CASE WHEN r.id_pregunta = 74 THEN r.respuesta_original END) AS p074,
  MAX(CASE WHEN r.id_pregunta = 75 THEN r.respuesta_original END) AS p075,
  MAX(CASE WHEN r.id_pregunta = 76 THEN r.respuesta_original END) AS p076,
  MAX(CASE WHEN r.id_pregunta = 77 THEN r.respuesta_original END) AS p077,
  MAX(CASE WHEN r.id_pregunta = 78 THEN r.respuesta_original END) AS p078,
  MAX(CASE WHEN r.id_pregunta = 79 THEN r.respuesta_original END) AS p079,
  MAX(CASE WHEN r.id_pregunta = 80 THEN r.respuesta_original END) AS p080,
  MAX(CASE WHEN r.id_pregunta = 81 THEN r.respuesta_original END) AS p081,
  MAX(CASE WHEN r.id_pregunta = 82 THEN r.respuesta_original END) AS p082,
  MAX(CASE WHEN r.id_pregunta = 83 THEN r.respuesta_original END) AS p083,
  MAX(CASE WHEN r.id_pregunta = 84 THEN r.respuesta_original END) AS p084,
  MAX(CASE WHEN r.id_pregunta = 85 THEN r.respuesta_original END) AS p085,
  MAX(CASE WHEN r.id_pregunta = 86 THEN r.respuesta_original END) AS p086,
  MAX(CASE WHEN r.id_pregunta = 87 THEN r.respuesta_original END) AS p087,
  MAX(CASE WHEN r.id_pregunta = 88 THEN r.respuesta_original END) AS p088,
  MAX(CASE WHEN r.id_pregunta = 89 THEN r.respuesta_original END) AS p089,
  MAX(CASE WHEN r.id_pregunta = 90 THEN r.respuesta_original END) AS p090,
  MAX(CASE WHEN r.id_pregunta = 91 THEN r.respuesta_original END) AS p091,
  MAX(CASE WHEN r.id_pregunta = 92 THEN r.respuesta_original END) AS p092,
  MAX(CASE WHEN r.id_pregunta = 93 THEN r.respuesta_original END) AS p093,
  MAX(CASE WHEN r.id_pregunta = 94 THEN r.respuesta_original END) AS p094,
  MAX(CASE WHEN r.id_pregunta = 95 THEN r.respuesta_original END) AS p095,
  MAX(CASE WHEN r.id_pregunta = 96 THEN r.respuesta_original END) AS p096,
  MAX(CASE WHEN r.id_pregunta = 97 THEN r.respuesta_original END) AS p097,
  MAX(CASE WHEN r.id_pregunta = 98 THEN r.respuesta_original END) AS p098,
  MAX(CASE WHEN r.id_pregunta = 99 THEN r.respuesta_original END) AS p099,
  MAX(CASE WHEN r.id_pregunta = 100 THEN r.respuesta_original END) AS p100,
  MAX(CASE WHEN r.id_pregunta = 101 THEN r.respuesta_original END) AS p101,
  MAX(CASE WHEN r.id_pregunta = 102 THEN r.respuesta_original END) AS p102,
  MAX(CASE WHEN r.id_pregunta = 103 THEN r.respuesta_original END) AS p103,
  MAX(CASE WHEN r.id_pregunta = 104 THEN r.respuesta_original END) AS p104,
  MAX(CASE WHEN r.id_pregunta = 105 THEN r.respuesta_original END) AS p105,
  MAX(CASE WHEN r.id_pregunta = 106 THEN r.respuesta_original END) AS p106,
  MAX(CASE WHEN r.id_pregunta = 107 THEN r.respuesta_original END) AS p107,
  MAX(CASE WHEN r.id_pregunta = 108 THEN r.respuesta_original END) AS p108,
  MAX(CASE WHEN r.id_pregunta = 109 THEN r.respuesta_original END) AS p109,
  MAX(CASE WHEN r.id_pregunta = 110 THEN r.respuesta_original END) AS p110,
  MAX(CASE WHEN r.id_pregunta = 111 THEN r.respuesta_original END) AS p111,
  MAX(CASE WHEN r.id_pregunta = 112 THEN r.respuesta_original END) AS p112,
  MAX(CASE WHEN r.id_pregunta = 113 THEN r.respuesta_original END) AS p113,
  MAX(CASE WHEN r.id_pregunta = 114 THEN r.respuesta_original END) AS p114,
  MAX(CASE WHEN r.id_pregunta = 115 THEN r.respuesta_original END) AS p115,
  MAX(CASE WHEN r.id_pregunta = 116 THEN r.respuesta_original END) AS p116,
  MAX(CASE WHEN r.id_pregunta = 117 THEN r.respuesta_original END) AS p117,
  MAX(CASE WHEN r.id_pregunta = 118 THEN r.respuesta_original END) AS p118,
  MAX(CASE WHEN r.id_pregunta = 119 THEN r.respuesta_original END) AS p119,
  MAX(CASE WHEN r.id_pregunta = 120 THEN r.respuesta_original END) AS p120,
  MAX(CASE WHEN r.id_pregunta = 121 THEN r.respuesta_original END) AS p121,
  MAX(CASE WHEN r.id_pregunta = 122 THEN r.respuesta_original END) AS p122,
  MAX(CASE WHEN r.id_pregunta = 123 THEN r.respuesta_original END) AS p123,
  MAX(CASE WHEN r.id_pregunta = 124 THEN r.respuesta_original END) AS p124,
  MAX(CASE WHEN r.id_pregunta = 125 THEN r.respuesta_original END) AS p125,
  MAX(CASE WHEN r.id_pregunta = 126 THEN r.respuesta_original END) AS p126,
  MAX(CASE WHEN r.id_pregunta = 127 THEN r.respuesta_original END) AS p127,
  MAX(CASE WHEN r.id_pregunta = 128 THEN r.respuesta_original END) AS p128,
  MAX(CASE WHEN r.id_pregunta = 129 THEN r.respuesta_original END) AS p129,
  MAX(CASE WHEN r.id_pregunta = 130 THEN r.respuesta_original END) AS p130,
  MAX(CASE WHEN r.id_pregunta = 131 THEN r.respuesta_original END) AS p131,
  MAX(CASE WHEN r.id_pregunta = 132 THEN r.respuesta_original END) AS p132,
  MAX(CASE WHEN r.id_pregunta = 133 THEN r.respuesta_original END) AS p133,
  MAX(CASE WHEN r.id_pregunta = 134 THEN r.respuesta_original END) AS p134,
  MAX(CASE WHEN r.id_pregunta = 135 THEN r.respuesta_original END) AS p135,
  MAX(CASE WHEN r.id_pregunta = 136 THEN r.respuesta_original END) AS p136,
  MAX(CASE WHEN r.id_pregunta = 137 THEN r.respuesta_original END) AS p137,
  MAX(CASE WHEN r.id_pregunta = 138 THEN r.respuesta_original END) AS p138,
  MAX(CASE WHEN r.id_pregunta = 139 THEN r.respuesta_original END) AS p139,
  MAX(CASE WHEN r.id_pregunta = 140 THEN r.respuesta_original END) AS p140,
  MAX(CASE WHEN r.id_pregunta = 141 THEN r.respuesta_original END) AS p141,
  MAX(CASE WHEN r.id_pregunta = 142 THEN r.respuesta_original END) AS p142,
  MAX(CASE WHEN r.id_pregunta = 143 THEN r.respuesta_original END) AS p143,
  MAX(CASE WHEN r.id_pregunta = 144 THEN r.respuesta_original END) AS p144,
  MAX(CASE WHEN r.id_pregunta = 145 THEN r.respuesta_original END) AS p145,
  MAX(CASE WHEN r.id_pregunta = 146 THEN r.respuesta_original END) AS p146,
  MAX(CASE WHEN r.id_pregunta = 147 THEN r.respuesta_original END) AS p147,
  MAX(CASE WHEN r.id_pregunta = 148 THEN r.respuesta_original END) AS p148,
  MAX(CASE WHEN r.id_pregunta = 149 THEN r.respuesta_original END) AS p149,
  MAX(CASE WHEN r.id_pregunta = 150 THEN r.respuesta_original END) AS p150,
  MAX(CASE WHEN r.id_pregunta = 151 THEN r.respuesta_original END) AS p151,
  MAX(CASE WHEN r.id_pregunta = 152 THEN r.respuesta_original END) AS p152,
  MAX(CASE WHEN r.id_pregunta = 153 THEN r.respuesta_original END) AS p153,
  MAX(CASE WHEN r.id_pregunta = 154 THEN r.respuesta_original END) AS p154,
  MAX(CASE WHEN r.id_pregunta = 155 THEN r.respuesta_original END) AS p155,
  MAX(CASE WHEN r.id_pregunta = 156 THEN r.respuesta_original END) AS p156,
  MAX(CASE WHEN r.id_pregunta = 157 THEN r.respuesta_original END) AS p157,
  MAX(CASE WHEN r.id_pregunta = 158 THEN r.respuesta_original END) AS p158,
  MAX(CASE WHEN r.id_pregunta = 159 THEN r.respuesta_original END) AS p159,
  MAX(CASE WHEN r.id_pregunta = 160 THEN r.respuesta_original END) AS p160,
  MAX(CASE WHEN r.id_pregunta = 161 THEN r.respuesta_original END) AS p161,
  MAX(CASE WHEN r.id_pregunta = 162 THEN r.respuesta_original END) AS p162,
  MAX(CASE WHEN r.id_pregunta = 163 THEN r.respuesta_original END) AS p163,
  MAX(CASE WHEN r.id_pregunta = 164 THEN r.respuesta_original END) AS p164,
  MAX(CASE WHEN r.id_pregunta = 165 THEN r.respuesta_original END) AS p165,
  MAX(CASE WHEN r.id_pregunta = 166 THEN r.respuesta_original END) AS p166,
  MAX(CASE WHEN r.id_pregunta = 167 THEN r.respuesta_original END) AS p167,
  MAX(CASE WHEN r.id_pregunta = 168 THEN r.respuesta_original END) AS p168,
  MAX(CASE WHEN r.id_pregunta = 169 THEN r.respuesta_original END) AS p169,
  MAX(CASE WHEN r.id_pregunta = 170 THEN r.respuesta_original END) AS p170,
  MAX(CASE WHEN r.id_pregunta = 171 THEN r.respuesta_original END) AS p171,
  MAX(CASE WHEN r.id_pregunta = 172 THEN r.respuesta_original END) AS p172,
  MAX(CASE WHEN r.id_pregunta = 173 THEN r.respuesta_original END) AS p173,
  MAX(CASE WHEN r.id_pregunta = 174 THEN r.respuesta_original END) AS p174,
  MAX(CASE WHEN r.id_pregunta = 175 THEN r.respuesta_original END) AS p175,
  MAX(CASE WHEN r.id_pregunta = 176 THEN r.respuesta_original END) AS p176,
  MAX(CASE WHEN r.id_pregunta = 177 THEN r.respuesta_original END) AS p177,
  MAX(CASE WHEN r.id_pregunta = 178 THEN r.respuesta_original END) AS p178,
  MAX(CASE WHEN r.id_pregunta = 179 THEN r.respuesta_original END) AS p179,
  MAX(CASE WHEN r.id_pregunta = 180 THEN r.respuesta_original END) AS p180,
  MAX(CASE WHEN r.id_pregunta = 181 THEN r.respuesta_original END) AS p181,
  MAX(CASE WHEN r.id_pregunta = 182 THEN r.respuesta_original END) AS p182,
  MAX(CASE WHEN r.id_pregunta = 183 THEN r.respuesta_original END) AS p183,
  MAX(CASE WHEN r.id_pregunta = 184 THEN r.respuesta_original END) AS p184,
  MAX(CASE WHEN r.id_pregunta = 185 THEN r.respuesta_original END) AS p185,
  MAX(CASE WHEN r.id_pregunta = 186 THEN r.respuesta_original END) AS p186,
  MAX(CASE WHEN r.id_pregunta = 187 THEN r.respuesta_original END) AS p187,
  MAX(CASE WHEN r.id_pregunta = 188 THEN r.respuesta_original END) AS p188,
  MAX(CASE WHEN r.id_pregunta = 189 THEN r.respuesta_original END) AS p189,
  MAX(CASE WHEN r.id_pregunta = 190 THEN r.respuesta_original END) AS p190,
  MAX(CASE WHEN r.id_pregunta = 191 THEN r.respuesta_original END) AS p191,
  MAX(CASE WHEN r.id_pregunta = 192 THEN r.respuesta_original END) AS p192,
  MAX(CASE WHEN r.id_pregunta = 193 THEN r.respuesta_original END) AS p193,
  MAX(CASE WHEN r.id_pregunta = 194 THEN r.respuesta_original END) AS p194,
  MAX(CASE WHEN r.id_pregunta = 195 THEN r.respuesta_original END) AS p195,
  MAX(CASE WHEN r.id_pregunta = 196 THEN r.respuesta_original END) AS p196,
  MAX(CASE WHEN r.id_pregunta = 197 THEN r.respuesta_original END) AS p197,
  MAX(CASE WHEN r.id_pregunta = 198 THEN r.respuesta_original END) AS p198,
  MAX(CASE WHEN r.id_pregunta = 199 THEN r.respuesta_original END) AS p199,
  MAX(CASE WHEN r.id_pregunta = 200 THEN r.respuesta_original END) AS p200,
  MAX(CASE WHEN r.id_pregunta = 201 THEN r.respuesta_original END) AS p201,
  MAX(CASE WHEN r.id_pregunta = 202 THEN r.respuesta_original END) AS p202,
  MAX(CASE WHEN r.id_pregunta = 203 THEN r.respuesta_original END) AS p203,
  MAX(CASE WHEN r.id_pregunta = 204 THEN r.respuesta_original END) AS p204,
  MAX(CASE WHEN r.id_pregunta = 205 THEN r.respuesta_original END) AS p205,
  MAX(CASE WHEN r.id_pregunta = 206 THEN r.respuesta_original END) AS p206,
  MAX(CASE WHEN r.id_pregunta = 207 THEN r.respuesta_original END) AS p207,
  MAX(CASE WHEN r.id_pregunta = 208 THEN r.respuesta_original END) AS p208,
  MAX(CASE WHEN r.id_pregunta = 209 THEN r.respuesta_original END) AS p209,
  MAX(CASE WHEN r.id_pregunta = 210 THEN r.respuesta_original END) AS p210,
  MAX(CASE WHEN r.id_pregunta = 211 THEN r.respuesta_original END) AS p211,
  MAX(CASE WHEN r.id_pregunta = 212 THEN r.respuesta_original END) AS p212,
  MAX(CASE WHEN r.id_pregunta = 213 THEN r.respuesta_original END) AS p213,
  MAX(CASE WHEN r.id_pregunta = 214 THEN r.respuesta_original END) AS p214,
  MAX(CASE WHEN r.id_pregunta = 215 THEN r.respuesta_original END) AS p215,
  MAX(CASE WHEN r.id_pregunta = 216 THEN r.respuesta_original END) AS p216,
  MAX(CASE WHEN r.id_pregunta = 217 THEN r.respuesta_original END) AS p217,
  MAX(CASE WHEN r.id_pregunta = 218 THEN r.respuesta_original END) AS p218,
  MAX(CASE WHEN r.id_pregunta = 219 THEN r.respuesta_original END) AS p219,
  MAX(CASE WHEN r.id_pregunta = 220 THEN r.respuesta_original END) AS p220
FROM encuestados e
LEFT JOIN respuestas r ON r.id_encuestado = e.id_encuestado
GROUP BY e.id_encuestado;

CREATE OR REPLACE VIEW v_base_homologada AS
SELECT e.id_encuestado,
  MAX(CASE WHEN r.id_pregunta = 1 THEN r.respuesta_homologada END) AS p001,
  MAX(CASE WHEN r.id_pregunta = 2 THEN r.respuesta_homologada END) AS p002,
  MAX(CASE WHEN r.id_pregunta = 3 THEN r.respuesta_homologada END) AS p003,
  MAX(CASE WHEN r.id_pregunta = 4 THEN r.respuesta_homologada END) AS p004,
  MAX(CASE WHEN r.id_pregunta = 5 THEN r.respuesta_homologada END) AS p005,
  MAX(CASE WHEN r.id_pregunta = 6 THEN r.respuesta_homologada END) AS p006,
  MAX(CASE WHEN r.id_pregunta = 7 THEN r.respuesta_homologada END) AS p007,
  MAX(CASE WHEN r.id_pregunta = 8 THEN r.respuesta_homologada END) AS p008,
  MAX(CASE WHEN r.id_pregunta = 9 THEN r.respuesta_homologada END) AS p009,
  MAX(CASE WHEN r.id_pregunta = 10 THEN r.respuesta_homologada END) AS p010,
  MAX(CASE WHEN r.id_pregunta = 11 THEN r.respuesta_homologada END) AS p011,
  MAX(CASE WHEN r.id_pregunta = 12 THEN r.respuesta_homologada END) AS p012,
  MAX(CASE WHEN r.id_pregunta = 13 THEN r.respuesta_homologada END) AS p013,
  MAX(CASE WHEN r.id_pregunta = 14 THEN r.respuesta_homologada END) AS p014,
  MAX(CASE WHEN r.id_pregunta = 15 THEN r.respuesta_homologada END) AS p015,
  MAX(CASE WHEN r.id_pregunta = 16 THEN r.respuesta_homologada END) AS p016,
  MAX(CASE WHEN r.id_pregunta = 17 THEN r.respuesta_homologada END) AS p017,
  MAX(CASE WHEN r.id_pregunta = 18 THEN r.respuesta_homologada END) AS p018,
  MAX(CASE WHEN r.id_pregunta = 19 THEN r.respuesta_homologada END) AS p019,
  MAX(CASE WHEN r.id_pregunta = 20 THEN r.respuesta_homologada END) AS p020,
  MAX(CASE WHEN r.id_pregunta = 21 THEN r.respuesta_homologada END) AS p021,
  MAX(CASE WHEN r.id_pregunta = 22 THEN r.respuesta_homologada END) AS p022,
  MAX(CASE WHEN r.id_pregunta = 23 THEN r.respuesta_homologada END) AS p023,
  MAX(CASE WHEN r.id_pregunta = 24 THEN r.respuesta_homologada END) AS p024,
  MAX(CASE WHEN r.id_pregunta = 25 THEN r.respuesta_homologada END) AS p025,
  MAX(CASE WHEN r.id_pregunta = 26 THEN r.respuesta_homologada END) AS p026,
  MAX(CASE WHEN r.id_pregunta = 27 THEN r.respuesta_homologada END) AS p027,
  MAX(CASE WHEN r.id_pregunta = 28 THEN r.respuesta_homologada END) AS p028,
  MAX(CASE WHEN r.id_pregunta = 29 THEN r.respuesta_homologada END) AS p029,
  MAX(CASE WHEN r.id_pregunta = 30 THEN r.respuesta_homologada END) AS p030,
  MAX(CASE WHEN r.id_pregunta = 31 THEN r.respuesta_homologada END) AS p031,
  MAX(CASE WHEN r.id_pregunta = 32 THEN r.respuesta_homologada END) AS p032,
  MAX(CASE WHEN r.id_pregunta = 33 THEN r.respuesta_homologada END) AS p033,
  MAX(CASE WHEN r.id_pregunta = 34 THEN r.respuesta_homologada END) AS p034,
  MAX(CASE WHEN r.id_pregunta = 35 THEN r.respuesta_homologada END) AS p035,
  MAX(CASE WHEN r.id_pregunta = 36 THEN r.respuesta_homologada END) AS p036,
  MAX(CASE WHEN r.id_pregunta = 37 THEN r.respuesta_homologada END) AS p037,
  MAX(CASE WHEN r.id_pregunta = 38 THEN r.respuesta_homologada END) AS p038,
  MAX(CASE WHEN r.id_pregunta = 39 THEN r.respuesta_homologada END) AS p039,
  MAX(CASE WHEN r.id_pregunta = 40 THEN r.respuesta_homologada END) AS p040,
  MAX(CASE WHEN r.id_pregunta = 41 THEN r.respuesta_homologada END) AS p041,
  MAX(CASE WHEN r.id_pregunta = 42 THEN r.respuesta_homologada END) AS p042,
  MAX(CASE WHEN r.id_pregunta = 43 THEN r.respuesta_homologada END) AS p043,
  MAX(CASE WHEN r.id_pregunta = 44 THEN r.respuesta_homologada END) AS p044,
  MAX(CASE WHEN r.id_pregunta = 45 THEN r.respuesta_homologada END) AS p045,
  MAX(CASE WHEN r.id_pregunta = 46 THEN r.respuesta_homologada END) AS p046,
  MAX(CASE WHEN r.id_pregunta = 47 THEN r.respuesta_homologada END) AS p047,
  MAX(CASE WHEN r.id_pregunta = 48 THEN r.respuesta_homologada END) AS p048,
  MAX(CASE WHEN r.id_pregunta = 49 THEN r.respuesta_homologada END) AS p049,
  MAX(CASE WHEN r.id_pregunta = 50 THEN r.respuesta_homologada END) AS p050,
  MAX(CASE WHEN r.id_pregunta = 51 THEN r.respuesta_homologada END) AS p051,
  MAX(CASE WHEN r.id_pregunta = 52 THEN r.respuesta_homologada END) AS p052,
  MAX(CASE WHEN r.id_pregunta = 53 THEN r.respuesta_homologada END) AS p053,
  MAX(CASE WHEN r.id_pregunta = 54 THEN r.respuesta_homologada END) AS p054,
  MAX(CASE WHEN r.id_pregunta = 55 THEN r.respuesta_homologada END) AS p055,
  MAX(CASE WHEN r.id_pregunta = 56 THEN r.respuesta_homologada END) AS p056,
  MAX(CASE WHEN r.id_pregunta = 57 THEN r.respuesta_homologada END) AS p057,
  MAX(CASE WHEN r.id_pregunta = 58 THEN r.respuesta_homologada END) AS p058,
  MAX(CASE WHEN r.id_pregunta = 59 THEN r.respuesta_homologada END) AS p059,
  MAX(CASE WHEN r.id_pregunta = 60 THEN r.respuesta_homologada END) AS p060,
  MAX(CASE WHEN r.id_pregunta = 61 THEN r.respuesta_homologada END) AS p061,
  MAX(CASE WHEN r.id_pregunta = 62 THEN r.respuesta_homologada END) AS p062,
  MAX(CASE WHEN r.id_pregunta = 63 THEN r.respuesta_homologada END) AS p063,
  MAX(CASE WHEN r.id_pregunta = 64 THEN r.respuesta_homologada END) AS p064,
  MAX(CASE WHEN r.id_pregunta = 65 THEN r.respuesta_homologada END) AS p065,
  MAX(CASE WHEN r.id_pregunta = 66 THEN r.respuesta_homologada END) AS p066,
  MAX(CASE WHEN r.id_pregunta = 67 THEN r.respuesta_homologada END) AS p067,
  MAX(CASE WHEN r.id_pregunta = 68 THEN r.respuesta_homologada END) AS p068,
  MAX(CASE WHEN r.id_pregunta = 69 THEN r.respuesta_homologada END) AS p069,
  MAX(CASE WHEN r.id_pregunta = 70 THEN r.respuesta_homologada END) AS p070,
  MAX(CASE WHEN r.id_pregunta = 71 THEN r.respuesta_homologada END) AS p071,
  MAX(CASE WHEN r.id_pregunta = 72 THEN r.respuesta_homologada END) AS p072,
  MAX(CASE WHEN r.id_pregunta = 73 THEN r.respuesta_homologada END) AS p073,
  MAX(CASE WHEN r.id_pregunta = 74 THEN r.respuesta_homologada END) AS p074,
  MAX(CASE WHEN r.id_pregunta = 75 THEN r.respuesta_homologada END) AS p075,
  MAX(CASE WHEN r.id_pregunta = 76 THEN r.respuesta_homologada END) AS p076,
  MAX(CASE WHEN r.id_pregunta = 77 THEN r.respuesta_homologada END) AS p077,
  MAX(CASE WHEN r.id_pregunta = 78 THEN r.respuesta_homologada END) AS p078,
  MAX(CASE WHEN r.id_pregunta = 79 THEN r.respuesta_homologada END) AS p079,
  MAX(CASE WHEN r.id_pregunta = 80 THEN r.respuesta_homologada END) AS p080,
  MAX(CASE WHEN r.id_pregunta = 81 THEN r.respuesta_homologada END) AS p081,
  MAX(CASE WHEN r.id_pregunta = 82 THEN r.respuesta_homologada END) AS p082,
  MAX(CASE WHEN r.id_pregunta = 83 THEN r.respuesta_homologada END) AS p083,
  MAX(CASE WHEN r.id_pregunta = 84 THEN r.respuesta_homologada END) AS p084,
  MAX(CASE WHEN r.id_pregunta = 85 THEN r.respuesta_homologada END) AS p085,
  MAX(CASE WHEN r.id_pregunta = 86 THEN r.respuesta_homologada END) AS p086,
  MAX(CASE WHEN r.id_pregunta = 87 THEN r.respuesta_homologada END) AS p087,
  MAX(CASE WHEN r.id_pregunta = 88 THEN r.respuesta_homologada END) AS p088,
  MAX(CASE WHEN r.id_pregunta = 89 THEN r.respuesta_homologada END) AS p089,
  MAX(CASE WHEN r.id_pregunta = 90 THEN r.respuesta_homologada END) AS p090,
  MAX(CASE WHEN r.id_pregunta = 91 THEN r.respuesta_homologada END) AS p091,
  MAX(CASE WHEN r.id_pregunta = 92 THEN r.respuesta_homologada END) AS p092,
  MAX(CASE WHEN r.id_pregunta = 93 THEN r.respuesta_homologada END) AS p093,
  MAX(CASE WHEN r.id_pregunta = 94 THEN r.respuesta_homologada END) AS p094,
  MAX(CASE WHEN r.id_pregunta = 95 THEN r.respuesta_homologada END) AS p095,
  MAX(CASE WHEN r.id_pregunta = 96 THEN r.respuesta_homologada END) AS p096,
  MAX(CASE WHEN r.id_pregunta = 97 THEN r.respuesta_homologada END) AS p097,
  MAX(CASE WHEN r.id_pregunta = 98 THEN r.respuesta_homologada END) AS p098,
  MAX(CASE WHEN r.id_pregunta = 99 THEN r.respuesta_homologada END) AS p099,
  MAX(CASE WHEN r.id_pregunta = 100 THEN r.respuesta_homologada END) AS p100,
  MAX(CASE WHEN r.id_pregunta = 101 THEN r.respuesta_homologada END) AS p101,
  MAX(CASE WHEN r.id_pregunta = 102 THEN r.respuesta_homologada END) AS p102,
  MAX(CASE WHEN r.id_pregunta = 103 THEN r.respuesta_homologada END) AS p103,
  MAX(CASE WHEN r.id_pregunta = 104 THEN r.respuesta_homologada END) AS p104,
  MAX(CASE WHEN r.id_pregunta = 105 THEN r.respuesta_homologada END) AS p105,
  MAX(CASE WHEN r.id_pregunta = 106 THEN r.respuesta_homologada END) AS p106,
  MAX(CASE WHEN r.id_pregunta = 107 THEN r.respuesta_homologada END) AS p107,
  MAX(CASE WHEN r.id_pregunta = 108 THEN r.respuesta_homologada END) AS p108,
  MAX(CASE WHEN r.id_pregunta = 109 THEN r.respuesta_homologada END) AS p109,
  MAX(CASE WHEN r.id_pregunta = 110 THEN r.respuesta_homologada END) AS p110,
  MAX(CASE WHEN r.id_pregunta = 111 THEN r.respuesta_homologada END) AS p111,
  MAX(CASE WHEN r.id_pregunta = 112 THEN r.respuesta_homologada END) AS p112,
  MAX(CASE WHEN r.id_pregunta = 113 THEN r.respuesta_homologada END) AS p113,
  MAX(CASE WHEN r.id_pregunta = 114 THEN r.respuesta_homologada END) AS p114,
  MAX(CASE WHEN r.id_pregunta = 115 THEN r.respuesta_homologada END) AS p115,
  MAX(CASE WHEN r.id_pregunta = 116 THEN r.respuesta_homologada END) AS p116,
  MAX(CASE WHEN r.id_pregunta = 117 THEN r.respuesta_homologada END) AS p117,
  MAX(CASE WHEN r.id_pregunta = 118 THEN r.respuesta_homologada END) AS p118,
  MAX(CASE WHEN r.id_pregunta = 119 THEN r.respuesta_homologada END) AS p119,
  MAX(CASE WHEN r.id_pregunta = 120 THEN r.respuesta_homologada END) AS p120,
  MAX(CASE WHEN r.id_pregunta = 121 THEN r.respuesta_homologada END) AS p121,
  MAX(CASE WHEN r.id_pregunta = 122 THEN r.respuesta_homologada END) AS p122,
  MAX(CASE WHEN r.id_pregunta = 123 THEN r.respuesta_homologada END) AS p123,
  MAX(CASE WHEN r.id_pregunta = 124 THEN r.respuesta_homologada END) AS p124,
  MAX(CASE WHEN r.id_pregunta = 125 THEN r.respuesta_homologada END) AS p125,
  MAX(CASE WHEN r.id_pregunta = 126 THEN r.respuesta_homologada END) AS p126,
  MAX(CASE WHEN r.id_pregunta = 127 THEN r.respuesta_homologada END) AS p127,
  MAX(CASE WHEN r.id_pregunta = 128 THEN r.respuesta_homologada END) AS p128,
  MAX(CASE WHEN r.id_pregunta = 129 THEN r.respuesta_homologada END) AS p129,
  MAX(CASE WHEN r.id_pregunta = 130 THEN r.respuesta_homologada END) AS p130,
  MAX(CASE WHEN r.id_pregunta = 131 THEN r.respuesta_homologada END) AS p131,
  MAX(CASE WHEN r.id_pregunta = 132 THEN r.respuesta_homologada END) AS p132,
  MAX(CASE WHEN r.id_pregunta = 133 THEN r.respuesta_homologada END) AS p133,
  MAX(CASE WHEN r.id_pregunta = 134 THEN r.respuesta_homologada END) AS p134,
  MAX(CASE WHEN r.id_pregunta = 135 THEN r.respuesta_homologada END) AS p135,
  MAX(CASE WHEN r.id_pregunta = 136 THEN r.respuesta_homologada END) AS p136,
  MAX(CASE WHEN r.id_pregunta = 137 THEN r.respuesta_homologada END) AS p137,
  MAX(CASE WHEN r.id_pregunta = 138 THEN r.respuesta_homologada END) AS p138,
  MAX(CASE WHEN r.id_pregunta = 139 THEN r.respuesta_homologada END) AS p139,
  MAX(CASE WHEN r.id_pregunta = 140 THEN r.respuesta_homologada END) AS p140,
  MAX(CASE WHEN r.id_pregunta = 141 THEN r.respuesta_homologada END) AS p141,
  MAX(CASE WHEN r.id_pregunta = 142 THEN r.respuesta_homologada END) AS p142,
  MAX(CASE WHEN r.id_pregunta = 143 THEN r.respuesta_homologada END) AS p143,
  MAX(CASE WHEN r.id_pregunta = 144 THEN r.respuesta_homologada END) AS p144,
  MAX(CASE WHEN r.id_pregunta = 145 THEN r.respuesta_homologada END) AS p145,
  MAX(CASE WHEN r.id_pregunta = 146 THEN r.respuesta_homologada END) AS p146,
  MAX(CASE WHEN r.id_pregunta = 147 THEN r.respuesta_homologada END) AS p147,
  MAX(CASE WHEN r.id_pregunta = 148 THEN r.respuesta_homologada END) AS p148,
  MAX(CASE WHEN r.id_pregunta = 149 THEN r.respuesta_homologada END) AS p149,
  MAX(CASE WHEN r.id_pregunta = 150 THEN r.respuesta_homologada END) AS p150,
  MAX(CASE WHEN r.id_pregunta = 151 THEN r.respuesta_homologada END) AS p151,
  MAX(CASE WHEN r.id_pregunta = 152 THEN r.respuesta_homologada END) AS p152,
  MAX(CASE WHEN r.id_pregunta = 153 THEN r.respuesta_homologada END) AS p153,
  MAX(CASE WHEN r.id_pregunta = 154 THEN r.respuesta_homologada END) AS p154,
  MAX(CASE WHEN r.id_pregunta = 155 THEN r.respuesta_homologada END) AS p155,
  MAX(CASE WHEN r.id_pregunta = 156 THEN r.respuesta_homologada END) AS p156,
  MAX(CASE WHEN r.id_pregunta = 157 THEN r.respuesta_homologada END) AS p157,
  MAX(CASE WHEN r.id_pregunta = 158 THEN r.respuesta_homologada END) AS p158,
  MAX(CASE WHEN r.id_pregunta = 159 THEN r.respuesta_homologada END) AS p159,
  MAX(CASE WHEN r.id_pregunta = 160 THEN r.respuesta_homologada END) AS p160,
  MAX(CASE WHEN r.id_pregunta = 161 THEN r.respuesta_homologada END) AS p161,
  MAX(CASE WHEN r.id_pregunta = 162 THEN r.respuesta_homologada END) AS p162,
  MAX(CASE WHEN r.id_pregunta = 163 THEN r.respuesta_homologada END) AS p163,
  MAX(CASE WHEN r.id_pregunta = 164 THEN r.respuesta_homologada END) AS p164,
  MAX(CASE WHEN r.id_pregunta = 165 THEN r.respuesta_homologada END) AS p165,
  MAX(CASE WHEN r.id_pregunta = 166 THEN r.respuesta_homologada END) AS p166,
  MAX(CASE WHEN r.id_pregunta = 167 THEN r.respuesta_homologada END) AS p167,
  MAX(CASE WHEN r.id_pregunta = 168 THEN r.respuesta_homologada END) AS p168,
  MAX(CASE WHEN r.id_pregunta = 169 THEN r.respuesta_homologada END) AS p169,
  MAX(CASE WHEN r.id_pregunta = 170 THEN r.respuesta_homologada END) AS p170,
  MAX(CASE WHEN r.id_pregunta = 171 THEN r.respuesta_homologada END) AS p171,
  MAX(CASE WHEN r.id_pregunta = 172 THEN r.respuesta_homologada END) AS p172,
  MAX(CASE WHEN r.id_pregunta = 173 THEN r.respuesta_homologada END) AS p173,
  MAX(CASE WHEN r.id_pregunta = 174 THEN r.respuesta_homologada END) AS p174,
  MAX(CASE WHEN r.id_pregunta = 175 THEN r.respuesta_homologada END) AS p175,
  MAX(CASE WHEN r.id_pregunta = 176 THEN r.respuesta_homologada END) AS p176,
  MAX(CASE WHEN r.id_pregunta = 177 THEN r.respuesta_homologada END) AS p177,
  MAX(CASE WHEN r.id_pregunta = 178 THEN r.respuesta_homologada END) AS p178,
  MAX(CASE WHEN r.id_pregunta = 179 THEN r.respuesta_homologada END) AS p179,
  MAX(CASE WHEN r.id_pregunta = 180 THEN r.respuesta_homologada END) AS p180,
  MAX(CASE WHEN r.id_pregunta = 181 THEN r.respuesta_homologada END) AS p181,
  MAX(CASE WHEN r.id_pregunta = 182 THEN r.respuesta_homologada END) AS p182,
  MAX(CASE WHEN r.id_pregunta = 183 THEN r.respuesta_homologada END) AS p183,
  MAX(CASE WHEN r.id_pregunta = 184 THEN r.respuesta_homologada END) AS p184,
  MAX(CASE WHEN r.id_pregunta = 185 THEN r.respuesta_homologada END) AS p185,
  MAX(CASE WHEN r.id_pregunta = 186 THEN r.respuesta_homologada END) AS p186,
  MAX(CASE WHEN r.id_pregunta = 187 THEN r.respuesta_homologada END) AS p187,
  MAX(CASE WHEN r.id_pregunta = 188 THEN r.respuesta_homologada END) AS p188,
  MAX(CASE WHEN r.id_pregunta = 189 THEN r.respuesta_homologada END) AS p189,
  MAX(CASE WHEN r.id_pregunta = 190 THEN r.respuesta_homologada END) AS p190,
  MAX(CASE WHEN r.id_pregunta = 191 THEN r.respuesta_homologada END) AS p191,
  MAX(CASE WHEN r.id_pregunta = 192 THEN r.respuesta_homologada END) AS p192,
  MAX(CASE WHEN r.id_pregunta = 193 THEN r.respuesta_homologada END) AS p193,
  MAX(CASE WHEN r.id_pregunta = 194 THEN r.respuesta_homologada END) AS p194,
  MAX(CASE WHEN r.id_pregunta = 195 THEN r.respuesta_homologada END) AS p195,
  MAX(CASE WHEN r.id_pregunta = 196 THEN r.respuesta_homologada END) AS p196,
  MAX(CASE WHEN r.id_pregunta = 197 THEN r.respuesta_homologada END) AS p197,
  MAX(CASE WHEN r.id_pregunta = 198 THEN r.respuesta_homologada END) AS p198,
  MAX(CASE WHEN r.id_pregunta = 199 THEN r.respuesta_homologada END) AS p199,
  MAX(CASE WHEN r.id_pregunta = 200 THEN r.respuesta_homologada END) AS p200,
  MAX(CASE WHEN r.id_pregunta = 201 THEN r.respuesta_homologada END) AS p201,
  MAX(CASE WHEN r.id_pregunta = 202 THEN r.respuesta_homologada END) AS p202,
  MAX(CASE WHEN r.id_pregunta = 203 THEN r.respuesta_homologada END) AS p203,
  MAX(CASE WHEN r.id_pregunta = 204 THEN r.respuesta_homologada END) AS p204,
  MAX(CASE WHEN r.id_pregunta = 205 THEN r.respuesta_homologada END) AS p205,
  MAX(CASE WHEN r.id_pregunta = 206 THEN r.respuesta_homologada END) AS p206,
  MAX(CASE WHEN r.id_pregunta = 207 THEN r.respuesta_homologada END) AS p207,
  MAX(CASE WHEN r.id_pregunta = 208 THEN r.respuesta_homologada END) AS p208,
  MAX(CASE WHEN r.id_pregunta = 209 THEN r.respuesta_homologada END) AS p209,
  MAX(CASE WHEN r.id_pregunta = 210 THEN r.respuesta_homologada END) AS p210,
  MAX(CASE WHEN r.id_pregunta = 211 THEN r.respuesta_homologada END) AS p211,
  MAX(CASE WHEN r.id_pregunta = 212 THEN r.respuesta_homologada END) AS p212,
  MAX(CASE WHEN r.id_pregunta = 213 THEN r.respuesta_homologada END) AS p213,
  MAX(CASE WHEN r.id_pregunta = 214 THEN r.respuesta_homologada END) AS p214,
  MAX(CASE WHEN r.id_pregunta = 215 THEN r.respuesta_homologada END) AS p215,
  MAX(CASE WHEN r.id_pregunta = 216 THEN r.respuesta_homologada END) AS p216,
  MAX(CASE WHEN r.id_pregunta = 217 THEN r.respuesta_homologada END) AS p217,
  MAX(CASE WHEN r.id_pregunta = 218 THEN r.respuesta_homologada END) AS p218,
  MAX(CASE WHEN r.id_pregunta = 219 THEN r.respuesta_homologada END) AS p219,
  MAX(CASE WHEN r.id_pregunta = 220 THEN r.respuesta_homologada END) AS p220
FROM encuestados e
LEFT JOIN respuestas r ON r.id_encuestado = e.id_encuestado
GROUP BY e.id_encuestado;

CREATE OR REPLACE VIEW v_g_genero AS
SELECT r.respuesta_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS porcentaje,
       COALESCE(MIN(h.orden), MIN(r.valor_numerico)) AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
LEFT JOIN (SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden FROM homologacion GROUP BY tipo_homologacion, valor_homologado) h ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = r.respuesta_homologada
WHERE r.id_pregunta = 7 AND r.respuesta_homologada IS NOT NULL
GROUP BY r.respuesta_homologada;

CREATE OR REPLACE VIEW v_g_edad AS
SELECT r.respuesta_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS porcentaje,
       COALESCE(MIN(h.orden), MIN(r.valor_numerico)) AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
LEFT JOIN (SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden FROM homologacion GROUP BY tipo_homologacion, valor_homologado) h ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = r.respuesta_homologada
WHERE r.id_pregunta = 6 AND r.respuesta_homologada IS NOT NULL
GROUP BY r.respuesta_homologada;

CREATE OR REPLACE VIEW v_g_localidad AS
SELECT r.respuesta_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS porcentaje,
       COALESCE(MIN(h.orden), MIN(r.valor_numerico)) AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
LEFT JOIN (SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden FROM homologacion GROUP BY tipo_homologacion, valor_homologado) h ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = r.respuesta_homologada
WHERE r.id_pregunta = 4 AND r.respuesta_homologada IS NOT NULL
GROUP BY r.respuesta_homologada;

CREATE OR REPLACE VIEW v_g_ingresos AS
SELECT r.respuesta_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS porcentaje,
       COALESCE(MIN(h.orden), MIN(r.valor_numerico)) AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
LEFT JOIN (SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden FROM homologacion GROUP BY tipo_homologacion, valor_homologado) h ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = r.respuesta_homologada
WHERE r.id_pregunta = 12 AND r.respuesta_homologada IS NOT NULL
GROUP BY r.respuesta_homologada;

CREATE OR REPLACE VIEW v_g_educacion AS
SELECT r.respuesta_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS porcentaje,
       COALESCE(MIN(h.orden), MIN(r.valor_numerico)) AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
LEFT JOIN (SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden FROM homologacion GROUP BY tipo_homologacion, valor_homologado) h ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = r.respuesta_homologada
WHERE r.id_pregunta = 8 AND r.respuesta_homologada IS NOT NULL
GROUP BY r.respuesta_homologada;

CREATE OR REPLACE VIEW v_g_ocupacion AS
SELECT r.respuesta_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS porcentaje,
       COALESCE(MIN(h.orden), MIN(r.valor_numerico)) AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
LEFT JOIN (SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden FROM homologacion GROUP BY tipo_homologacion, valor_homologado) h ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = r.respuesta_homologada
WHERE r.id_pregunta = 9 AND r.respuesta_homologada IS NOT NULL
GROUP BY r.respuesta_homologada;

CREATE OR REPLACE VIEW v_g_calificacion_alcalde AS
SELECT r.respuesta_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS porcentaje,
       COALESCE(MIN(h.orden), MIN(r.valor_numerico)) AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
LEFT JOIN (SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden FROM homologacion GROUP BY tipo_homologacion, valor_homologado) h ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = r.respuesta_homologada
WHERE r.id_pregunta = 15 AND r.respuesta_homologada IS NOT NULL
GROUP BY r.respuesta_homologada;

CREATE OR REPLACE VIEW v_g_acciones_generan_confianza AS
SELECT r.respuesta_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS porcentaje,
       COALESCE(MIN(h.orden), MIN(r.valor_numerico)) AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
LEFT JOIN (SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden FROM homologacion GROUP BY tipo_homologacion, valor_homologado) h ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = r.respuesta_homologada
WHERE r.id_pregunta = 16 AND r.respuesta_homologada IS NOT NULL
GROUP BY r.respuesta_homologada;

CREATE OR REPLACE VIEW v_g_confianza_instituciones AS
SELECT p.subitem_corto AS categoria, CAST(NULL AS CHAR) AS serie, ROUND(AVG(r.valor_numerico), 2) AS valor,
       COUNT(*) AS n, p.id_pregunta AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
WHERE r.id_pregunta BETWEEN 23 AND 30 AND r.valor_numerico IS NOT NULL
GROUP BY p.id_pregunta, p.subitem_corto;

CREATE OR REPLACE VIEW v_g_confianza_instituciones_dist AS
SELECT p.subitem_corto AS categoria, r.respuesta_homologada AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY p.id_pregunta), 1) AS porcentaje,
       p.id_pregunta AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
WHERE r.id_pregunta BETWEEN 23 AND 30 AND r.respuesta_homologada IS NOT NULL
GROUP BY p.id_pregunta, p.subitem_corto, r.respuesta_homologada;

CREATE OR REPLACE VIEW v_g_premisas_confianza AS
SELECT p.subitem_corto AS categoria, CAST(NULL AS CHAR) AS serie, ROUND(AVG(r.valor_numerico), 2) AS valor,
       COUNT(*) AS n, p.id_pregunta AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
WHERE r.id_pregunta BETWEEN 31 AND 43 AND r.valor_numerico IS NOT NULL
GROUP BY p.id_pregunta, p.subitem_corto;

CREATE OR REPLACE VIEW v_g_participacion_eventos AS
SELECT p.subitem_corto AS categoria, CAST(NULL AS CHAR) AS serie, ROUND(AVG(r.valor_numerico), 2) AS valor,
       COUNT(*) AS n, p.id_pregunta AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
WHERE r.id_pregunta BETWEEN 44 AND 49 AND r.valor_numerico IS NOT NULL
GROUP BY p.id_pregunta, p.subitem_corto;

CREATE OR REPLACE VIEW v_g_cumplimiento_normas AS
SELECT p.subitem_corto AS categoria, CAST(NULL AS CHAR) AS serie, ROUND(AVG(r.valor_numerico), 2) AS valor,
       COUNT(*) AS n, p.id_pregunta AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
WHERE r.id_pregunta BETWEEN 51 AND 63 AND r.valor_numerico IS NOT NULL
GROUP BY p.id_pregunta, p.subitem_corto;

CREATE OR REPLACE VIEW v_g_reaccion_infracciones AS
SELECT r.respuesta_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS porcentaje,
       COALESCE(MIN(h.orden), MIN(r.valor_numerico)) AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
LEFT JOIN (SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden FROM homologacion GROUP BY tipo_homologacion, valor_homologado) h ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = r.respuesta_homologada
WHERE r.id_pregunta = 64 AND r.respuesta_homologada IS NOT NULL
GROUP BY r.respuesta_homologada;

CREATE OR REPLACE VIEW v_g_conocimiento_plan_desarrollo AS
SELECT r.respuesta_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS porcentaje,
       COALESCE(MIN(h.orden), MIN(r.valor_numerico)) AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
LEFT JOIN (SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden FROM homologacion GROUP BY tipo_homologacion, valor_homologado) h ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = r.respuesta_homologada
WHERE r.id_pregunta = 65 AND r.respuesta_homologada IS NOT NULL
GROUP BY r.respuesta_homologada;

CREATE OR REPLACE VIEW v_g_canales_informacion AS
SELECT o.opcion_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(DISTINCT o.id_encuestado) AS valor,
       ROUND(100 * COUNT(DISTINCT o.id_encuestado) / (SELECT COUNT(*) FROM respuestas WHERE id_pregunta = 66), 1) AS porcentaje,
       NULL AS orden
FROM respuestas_opciones o
WHERE o.id_pregunta = 66
GROUP BY o.opcion_homologada;

CREATE OR REPLACE VIEW v_g_frecuencia_participacion AS
SELECT p.subitem_corto AS categoria, CAST(NULL AS CHAR) AS serie, ROUND(AVG(r.valor_numerico), 2) AS valor,
       COUNT(*) AS n, p.id_pregunta AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
WHERE r.id_pregunta BETWEEN 69 AND 74 AND r.valor_numerico IS NOT NULL
GROUP BY p.id_pregunta, p.subitem_corto;

CREATE OR REPLACE VIEW v_g_temas_participacion AS
SELECT o.opcion_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(DISTINCT o.id_encuestado) AS valor,
       ROUND(100 * COUNT(DISTINCT o.id_encuestado) / (SELECT COUNT(*) FROM respuestas WHERE id_pregunta = 76), 1) AS porcentaje,
       NULL AS orden
FROM respuestas_opciones o
WHERE o.id_pregunta = 76
GROUP BY o.opcion_homologada;

CREATE OR REPLACE VIEW v_g_obstaculo_participacion AS
SELECT r.respuesta_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS porcentaje,
       COALESCE(MIN(h.orden), MIN(r.valor_numerico)) AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
LEFT JOIN (SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden FROM homologacion GROUP BY tipo_homologacion, valor_homologado) h ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = r.respuesta_homologada
WHERE r.id_pregunta = 86 AND r.respuesta_homologada IS NOT NULL
GROUP BY r.respuesta_homologada;

CREATE OR REPLACE VIEW v_g_canales_expresion AS
SELECT o.opcion_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(DISTINCT o.id_encuestado) AS valor,
       ROUND(100 * COUNT(DISTINCT o.id_encuestado) / (SELECT COUNT(*) FROM respuestas WHERE id_pregunta = 87), 1) AS porcentaje,
       NULL AS orden
FROM respuestas_opciones o
WHERE o.id_pregunta = 87
GROUP BY o.opcion_homologada;

CREATE OR REPLACE VIEW v_g_razon_no_control_social AS
SELECT r.respuesta_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS porcentaje,
       COALESCE(MIN(h.orden), MIN(r.valor_numerico)) AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
LEFT JOIN (SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden FROM homologacion GROUP BY tipo_homologacion, valor_homologado) h ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = r.respuesta_homologada
WHERE r.id_pregunta = 106 AND r.respuesta_homologada IS NOT NULL
GROUP BY r.respuesta_homologada;

CREATE OR REPLACE VIEW v_g_premisas_anticorrupcion AS
SELECT p.subitem_corto AS categoria, CAST(NULL AS CHAR) AS serie, ROUND(AVG(r.valor_numerico), 2) AS valor,
       COUNT(*) AS n, p.id_pregunta AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
WHERE r.id_pregunta BETWEEN 107 AND 112 AND r.valor_numerico IS NOT NULL
GROUP BY p.id_pregunta, p.subitem_corto;

CREATE OR REPLACE VIEW v_g_corrupcion_servidores AS
SELECT r.respuesta_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS porcentaje,
       COALESCE(MIN(h.orden), MIN(r.valor_numerico)) AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
LEFT JOIN (SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden FROM homologacion GROUP BY tipo_homologacion, valor_homologado) h ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = r.respuesta_homologada
WHERE r.id_pregunta = 114 AND r.respuesta_homologada IS NOT NULL
GROUP BY r.respuesta_homologada;

CREATE OR REPLACE VIEW v_g_tramite_canal AS
SELECT r.respuesta_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS porcentaje,
       COALESCE(MIN(h.orden), MIN(r.valor_numerico)) AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
LEFT JOIN (SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden FROM homologacion GROUP BY tipo_homologacion, valor_homologado) h ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = r.respuesta_homologada
WHERE r.id_pregunta = 118 AND r.respuesta_homologada IS NOT NULL
GROUP BY r.respuesta_homologada;

CREATE OR REPLACE VIEW v_g_tramite_satisfaccion AS
SELECT r.respuesta_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS porcentaje,
       COALESCE(MIN(h.orden), MIN(r.valor_numerico)) AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
LEFT JOIN (SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden FROM homologacion GROUP BY tipo_homologacion, valor_homologado) h ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = r.respuesta_homologada
WHERE r.id_pregunta = 119 AND r.respuesta_homologada IS NOT NULL
GROUP BY r.respuesta_homologada;

CREATE OR REPLACE VIEW v_g_tramite_actitud_no_integra AS
SELECT r.respuesta_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS porcentaje,
       COALESCE(MIN(h.orden), MIN(r.valor_numerico)) AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
LEFT JOIN (SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden FROM homologacion GROUP BY tipo_homologacion, valor_homologado) h ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = r.respuesta_homologada
WHERE r.id_pregunta = 120 AND r.respuesta_homologada IS NOT NULL
GROUP BY r.respuesta_homologada;

CREATE OR REPLACE VIEW v_g_tramite_sector AS
SELECT o.opcion_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(DISTINCT o.id_encuestado) AS valor,
       ROUND(100 * COUNT(DISTINCT o.id_encuestado) / (SELECT COUNT(*) FROM respuestas WHERE id_pregunta = 117), 1) AS porcentaje,
       NULL AS orden
FROM respuestas_opciones o
WHERE o.id_pregunta = 117
GROUP BY o.opcion_homologada;

CREATE OR REPLACE VIEW v_g_actitudes_no_integras AS
SELECT o.opcion_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(DISTINCT o.id_encuestado) AS valor,
       ROUND(100 * COUNT(DISTINCT o.id_encuestado) / (SELECT COUNT(*) FROM respuestas WHERE id_pregunta = 121), 1) AS porcentaje,
       NULL AS orden
FROM respuestas_opciones o
WHERE o.id_pregunta = 121
GROUP BY o.opcion_homologada;

CREATE OR REPLACE VIEW v_g_tema_prioritario AS
SELECT r.respuesta_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS porcentaje,
       COALESCE(MIN(h.orden), MIN(r.valor_numerico)) AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
LEFT JOIN (SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden FROM homologacion GROUP BY tipo_homologacion, valor_homologado) h ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = r.respuesta_homologada
WHERE r.id_pregunta = 123 AND r.respuesta_homologada IS NOT NULL
GROUP BY r.respuesta_homologada;

CREATE OR REPLACE VIEW v_g_sensacion_seguridad AS
SELECT r.respuesta_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS porcentaje,
       COALESCE(MIN(h.orden), MIN(r.valor_numerico)) AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
LEFT JOIN (SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden FROM homologacion GROUP BY tipo_homologacion, valor_homologado) h ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = r.respuesta_homologada
WHERE r.id_pregunta = 124 AND r.respuesta_homologada IS NOT NULL
GROUP BY r.respuesta_homologada;

CREATE OR REPLACE VIEW v_g_causas_inseguridad AS
SELECT o.opcion_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(DISTINCT o.id_encuestado) AS valor,
       ROUND(100 * COUNT(DISTINCT o.id_encuestado) / (SELECT COUNT(*) FROM respuestas WHERE id_pregunta = 128), 1) AS porcentaje,
       NULL AS orden
FROM respuestas_opciones o
WHERE o.id_pregunta = 128
GROUP BY o.opcion_homologada;

CREATE OR REPLACE VIEW v_g_victima_delito AS
SELECT r.respuesta_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS porcentaje,
       COALESCE(MIN(h.orden), MIN(r.valor_numerico)) AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
LEFT JOIN (SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden FROM homologacion GROUP BY tipo_homologacion, valor_homologado) h ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = r.respuesta_homologada
WHERE r.id_pregunta = 131 AND r.respuesta_homologada IS NOT NULL
GROUP BY r.respuesta_homologada;

CREATE OR REPLACE VIEW v_g_reaccion_autoridades AS
SELECT r.respuesta_homologada AS categoria, CAST(NULL AS CHAR) AS serie, COUNT(*) AS valor,
       ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS porcentaje,
       COALESCE(MIN(h.orden), MIN(r.valor_numerico)) AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
LEFT JOIN (SELECT tipo_homologacion, valor_homologado, MIN(orden) AS orden FROM homologacion GROUP BY tipo_homologacion, valor_homologado) h ON h.tipo_homologacion = p.tipo_homologacion AND h.valor_homologado = r.respuesta_homologada
WHERE r.id_pregunta = 133 AND r.respuesta_homologada IS NOT NULL
GROUP BY r.respuesta_homologada;

CREATE OR REPLACE VIEW v_g_riesgo_corrupcion_entidades AS
SELECT p.subitem_corto AS categoria, CAST(NULL AS CHAR) AS serie, ROUND(AVG(r.valor_numerico), 2) AS valor,
       COUNT(*) AS n, p.id_pregunta AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
WHERE r.id_pregunta BETWEEN 138 AND 144 AND r.valor_numerico IS NOT NULL
GROUP BY p.id_pregunta, p.subitem_corto;

CREATE OR REPLACE VIEW v_g_satisfaccion_bienestar AS
SELECT p.subitem_corto AS categoria, CAST(NULL AS CHAR) AS serie, ROUND(AVG(r.valor_numerico), 2) AS valor,
       COUNT(*) AS n, p.id_pregunta AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
WHERE r.id_pregunta BETWEEN 161 AND 167 AND r.valor_numerico IS NOT NULL
GROUP BY p.id_pregunta, p.subitem_corto;

CREATE OR REPLACE VIEW v_g_servicios_publicos AS
SELECT SUBSTRING_INDEX(p.subitem_corto, ' – ', -1) AS categoria, SUBSTRING_INDEX(p.subitem_corto, ' – ', 1) AS serie,
       ROUND(AVG(r.valor_numerico), 2) AS valor, COUNT(*) AS n, p.id_pregunta AS orden
FROM respuestas r
JOIN preguntas p ON p.id_pregunta = r.id_pregunta
WHERE r.id_pregunta BETWEEN 188 AND 207 AND r.valor_numerico IS NOT NULL
GROUP BY p.id_pregunta, p.subitem_corto;

CREATE OR REPLACE VIEW v_g_kpis AS
SELECT 'Encuestados' AS categoria, COUNT(*) AS valor FROM encuestados
UNION ALL SELECT 'Autorizaron el tratamiento de datos', COUNT(*) FROM respuestas WHERE id_pregunta = 1 AND respuesta_homologada = 'Sí'
UNION ALL SELECT 'Respondieron el cuestionario principal', COUNT(*) FROM respuestas WHERE id_pregunta = 15
UNION ALL SELECT 'Calificación promedio del Alcalde (1-10)', ROUND(AVG(valor_numerico), 2) FROM respuestas WHERE id_pregunta = 15
UNION ALL SELECT 'Confianza promedio en gestión de recursos (1-5)', ROUND(AVG(valor_numerico), 2) FROM respuestas WHERE id_pregunta = 17
UNION ALL SELECT 'Satisfacción promedio con Bogotá (1-5)', ROUND(AVG(valor_numerico), 2) FROM respuestas WHERE id_pregunta = 22;
