#!/usr/bin/env python3
"""Descarga los sprites de PMD SpriteCollab y los datos de PokéAPI que usa el juego.

Uso:  python3 tools/fetch_pokemon.py [desde] [hasta]     (por defecto 1 151)

Genera:
  assets/pokemon/<dex>/{walk,idle,attack,hurt}.png + anim.json   (y s/ para shiny)
  assets/pokemon/<dex>/portrait.png                              (y s/portrait.png)
  js/data/pokedex.js   nombres en español, tipos, estadísticas, evoluciones y tabla de tipos
  CREDITS.md           artistas de cada sprite (licencia CC BY-NC 4.0)
"""
import csv, io, json, os, sys, urllib.request, xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SC = 'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/'
PA = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/'
CACHE = os.path.join(ROOT, 'tools', '.cache')
ANIMS = ['Walk', 'Idle', 'Attack', 'Hurt']
ES = 7  # id del idioma español en PokéAPI


def get(url, cache_name=None):
    if cache_name:
        p = os.path.join(CACHE, cache_name)
        if os.path.exists(p):
            return open(p, 'rb').read()
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                data = r.read()
            break
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if attempt == 3:
                raise
        except Exception:
            if attempt == 3:
                raise
    if cache_name:
        os.makedirs(CACHE, exist_ok=True)
        open(os.path.join(CACHE, cache_name), 'wb').write(data)
    return data


def rows(name):
    return list(csv.DictReader(io.StringIO(get(PA + name + '.csv', name + '.csv').decode('utf-8'))))


def parse_anim(xml):
    root = ET.fromstring(xml)
    out = {}
    anims = {a.findtext('Name'): a for a in root.iter('Anim')}
    for name in ANIMS:
        a = anims.get(name)
        seen = set()
        while a is not None and a.find('CopyOf') is not None and name not in seen:
            seen.add(name)
            a = anims.get(a.findtext('CopyOf'))
        if a is None or a.find('FrameWidth') is None:
            continue
        out[name] = {
            'src': a.findtext('Name'),
            'w': int(a.findtext('FrameWidth')),
            'h': int(a.findtext('FrameHeight')),
            'd': [int(d.text) for d in a.iter('Duration')],
            'hit': int(a.findtext('HitFrame')) if a.find('HitFrame') is not None else None,
        }
    return out


def fetch_one(dex):
    d4 = '%04d' % dex
    base = os.path.join(ROOT, 'assets', 'pokemon', str(dex))
    res = {'dex': dex, 'ok': False, 'shiny': False}
    xml = get(SC + 'sprite/' + d4 + '/AnimData.xml')
    if not xml:
        return res
    anims = parse_anim(xml)
    if 'Walk' not in anims:
        return res
    meta = {}
    for variant, sub in (('', ''), ('s', '0000/0001/')):
        vdir = os.path.join(base, variant) if variant else base
        got = {}
        if variant:
            vxml = get(SC + 'sprite/' + d4 + '/' + sub + 'AnimData.xml')
            vanims = parse_anim(vxml) if vxml else anims
        else:
            vanims = anims
        for name, a in vanims.items():
            png = get(SC + 'sprite/' + d4 + '/' + sub + a['src'] + '-Anim.png')
            if png:
                os.makedirs(vdir, exist_ok=True)
                open(os.path.join(vdir, name.lower() + '.png'), 'wb').write(png)
                got[name.lower()] = {k: a[k] for k in ('w', 'h', 'd', 'hit')}
        if variant and 'walk' not in got:
            continue
        por = get(SC + 'portrait/' + d4 + '/' + sub + 'Normal.png') or (get(SC + 'portrait/' + d4 + '/Normal.png') if variant else None)
        if por:
            os.makedirs(vdir, exist_ok=True)
            open(os.path.join(vdir, 'portrait.png'), 'wb').write(por)
        if variant:
            res['shiny'] = True
            if got != meta:
                open(os.path.join(vdir, 'anim.json'), 'w').write(json.dumps(got, separators=(',', ':')))
        else:
            meta = got
            open(os.path.join(base, 'anim.json'), 'w').write(json.dumps(got, separators=(',', ':')))
    res['ok'] = True
    res['anim'] = meta
    return res


def main():
    a = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    b = int(sys.argv[2]) if len(sys.argv) > 2 else 151
    print('Descargando tracker y datos…')
    tracker = json.loads(get(SC + 'tracker.json', 'tracker.json'))
    credits = {}
    for r in csv.reader(io.StringIO(get(SC + 'credit_names.txt', 'credit_names.txt').decode('utf-8')), delimiter='\t'):
        if len(r) >= 2:
            credits[r[1]] = r[0] or r[1]

    names = {int(r['pokemon_species_id']): r['name'] for r in rows('pokemon_species_names') if int(r['local_language_id']) == ES}
    species = {int(r['id']): r for r in rows('pokemon_species')}
    types_by = {}
    for r in rows('pokemon_types'):
        types_by.setdefault(int(r['pokemon_id']), []).append((int(r['slot']), int(r['type_id'])))
    stat_names = {1: 'hp', 2: 'atk', 3: 'def', 4: 'spa', 5: 'spd', 6: 'spe'}
    stats_by = {}
    for r in rows('pokemon_stats'):
        pid, sid = int(r['pokemon_id']), int(r['stat_id'])
        if sid in stat_names:
            stats_by.setdefault(pid, {})[stat_names[sid]] = int(r['base_stat'])
    type_ids = {int(r['id']): r['identifier'] for r in rows('types')}
    type_es = {int(r['type_id']): r['name'] for r in rows('type_names') if int(r['local_language_id']) == ES}
    chart = {}
    for r in rows('type_efficacy'):
        f = int(r['damage_factor'])
        if f != 100:
            chart.setdefault(type_ids[int(r['damage_type_id'])], {})[type_ids[int(r['target_type_id'])]] = f / 100

    print('Descargando sprites %d-%d…' % (a, b))
    with ThreadPoolExecutor(12) as ex:
        results = list(ex.map(fetch_one, range(a, b + 1)))

    dex = []
    credit_lines = []
    for r in results:
        n = r['dex']
        if not r['ok']:
            print('  sin sprite:', n)
            continue
        sp = species[n]
        ts = [type_ids[t] for _, t in sorted(types_by[n])]
        dex.append({
            'dex': n, 'name': names.get(n, sp['identifier'].title()), 'types': ts, 'stats': stats_by[n],
            'evo': int(sp['evolves_from_species_id']) if sp['evolves_from_species_id'] else 0,
            'chain': int(sp['evolution_chain_id']), 'gen': int(sp['generation_id']),
            'leg': 1 if sp['is_legendary'] == '1' else (2 if sp['is_mythical'] == '1' else 0),
            'shiny': r['shiny'], 'anim': r['anim'],
        })
        t = tracker.get('%04d' % n, {})
        who = set()
        for node in (t, t.get('subgroups', {}).get('0000', {}), t.get('subgroups', {}).get('0000', {}).get('subgroups', {}).get('0001', {})):
            for key in ('sprite_credit', 'portrait_credit'):
                c = node.get(key) or {}
                for i in [c.get('primary')] + list(c.get('secondary') or []):
                    if i:
                        who.add(credits.get(i, i.strip('<@!>')))
        credit_lines.append('- #%03d %s: %s' % (n, names.get(n, ''), ', '.join(sorted(who)) or 'desconocido'))

    # conserva entradas de descargas anteriores fuera de este rango
    out = os.path.join(ROOT, 'js', 'data', 'pokedex.js')
    old = {}
    if os.path.exists(out):
        try:
            txt = open(out, encoding='utf-8').read()
            old = {e['dex']: e for e in json.loads(txt[txt.index('['):txt.index('];') + 1])}
        except Exception:
            old = {}
    for e in dex:
        old[e['dex']] = e
    full = [old[k] for k in sorted(old)]
    with open(out, 'w', encoding='utf-8') as f:
        f.write('// Generado por tools/fetch_pokemon.py a partir de PokéAPI. No editar a mano.\n')
        f.write("'use strict';\nconst POKEDEX = " + json.dumps(full, ensure_ascii=False, separators=(',', ':')) + ';\n')
        f.write('const TYPE_CHART = ' + json.dumps(chart, separators=(',', ':')) + ';\n')
        f.write('const TYPE_ES = ' + json.dumps({type_ids[k]: v for k, v in type_es.items() if k in type_ids and k < 10000}, ensure_ascii=False) + ';\n')

    cpath = os.path.join(ROOT, 'CREDITS.md')
    prev = []
    if os.path.exists(cpath):
        prev = [l for l in open(cpath, encoding='utf-8').read().splitlines() if l.startswith('- #')]
    allc = {l.split(' ')[1]: l for l in prev}
    for l in credit_lines:
        allc[l.split(' ')[1]] = l
    with open(cpath, 'w', encoding='utf-8') as f:
        f.write('# Créditos\n\n')
        f.write('Sprites y retratos: [PMD SpriteCollab](https://github.com/PMDCollab/SpriteCollab) y sus artistas, '
                'con licencia [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). '
                'Algunos sprites proceden originalmente de los juegos Pokémon Mystery Dungeon (CHUNSOFT).\n\n')
        f.write('Datos de la Pokédex: [PokéAPI](https://pokeapi.co/).\n\n')
        f.write('Pokémon © Nintendo / Creatures Inc. / GAME FREAK inc. Proyecto de fans sin ánimo de lucro.\n\n')
        f.write('## Artistas por Pokémon\n\n')
        f.write('\n'.join(allc[k] for k in sorted(allc)) + '\n')
    print('Listo: %d Pokémon' % len(dex))


if __name__ == '__main__':
    main()
