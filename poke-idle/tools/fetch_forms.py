#!/usr/bin/env python3
"""Descarga los sprites de las formas regionales y las megaevoluciones (PMD SpriteCollab) y genera js/data/forms.js.

Uso:  python3 tools/fetch_forms.py

- Formas regionales (Alola, Galar, Hisui, Paldea): se añaden a POKEDEX como especies propias (dex = id de PokéAPI, 10001+).
- Megaevoluciones y formas primigenias: se guardan en MEGA_DEX (no se consiguen en el gacha; se desbloquean en el juego).
- Los sprites van a assets/pokemon/<id>/ igual que el resto; los artistas se añaden a CREDITS.md.
"""
import csv, io, json, os, re, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fetch_pokemon as fp

ROOT = fp.ROOT
SC, rows, get, parse_anim = fp.SC, fp.rows, fp.get, fp.parse_anim

REGIONAL = {'Alola': ('alola', 7, ' de Alola', 'Alolan '), 'Galar': ('galar', 8, ' de Galar', 'Galarian '), 'Hisui': ('hisui', 8, ' de Hisui', 'Hisuian '),
            'Paldea': ('paldea', 9, ' de Paldea', 'Paldean '), 'Paldea_Blaze': ('paldea-blaze', 9, ' de Paldea (Ardiente)', 'Paldean (Blaze) '),
            'Paldea_Aqua': ('paldea-aqua', 9, ' de Paldea (Acuática)', 'Paldean (Aqua) ')}
MEGA = {'Mega': ('mega', 'mega', 'Mega ', 'Mega '), 'Mega_X': ('mega-x', 'x', 'Mega ', 'Mega '), 'Mega_Y': ('mega-y', 'y', 'Mega ', 'Mega '), 'Primal': ('primal', 'primal', 'Grande ', 'Primal ')}
ES, EN = 7, 9
# identificadores de PokéAPI que no siguen el patrón especie-sufijo
SPECIAL = {('tauros', 'Paldea'): 'tauros-paldea-combat-breed', ('tauros', 'Paldea_Blaze'): 'tauros-paldea-blaze-breed', ('tauros', 'Paldea_Aqua'): 'tauros-paldea-aqua-breed',
           ('darmanitan', 'Galar'): 'darmanitan-galar-standard'}


def fetch_form(job):
    pid, dex, form = job['pid'], job['dex'], job['form']
    d4 = '%04d' % dex
    base = os.path.join(ROOT, 'assets', 'pokemon', str(pid))
    res = {'pid': pid, 'ok': False, 'shiny': False}
    xml = get(SC + 'sprite/' + d4 + '/' + form + '/AnimData.xml')
    if not xml:
        return res
    anims = parse_anim(xml)
    if 'Walk' not in anims:
        return res
    meta = {}
    for variant, sub in (('', form + '/'), ('s', form + '/0001/')):
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
        por = get(SC + 'portrait/' + d4 + '/' + sub + 'Normal.png') or (get(SC + 'portrait/' + d4 + '/' + form + '/Normal.png') if variant else None)
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
    res['ok'] = bool(meta) and os.path.exists(os.path.join(base, 'portrait.png'))
    res['anim'] = meta
    return res


def main():
    tracker = json.loads(get(SC + 'tracker.json', 'tracker.json'))
    credits = {}
    for r in csv.reader(io.StringIO(get(SC + 'credit_names.txt', 'credit_names.txt').decode('utf-8')), delimiter='\t'):
        if len(r) >= 2:
            credits[r[1]] = r[0] or r[1]
    species = {int(r['id']): r for r in rows('pokemon_species')}
    names = {}
    for r in rows('pokemon_species_names'):
        names.setdefault(int(r['pokemon_species_id']), {})[int(r['local_language_id'])] = r['name']
    pokemon = {r['identifier']: r for r in rows('pokemon')}
    types_by, stats_by = {}, {}
    for r in rows('pokemon_types'):
        types_by.setdefault(int(r['pokemon_id']), []).append((int(r['slot']), int(r['type_id'])))
    sn = {1: 'hp', 2: 'atk', 3: 'def', 4: 'spa', 5: 'spd', 6: 'spe'}
    for r in rows('pokemon_stats'):
        if int(r['stat_id']) in sn:
            stats_by.setdefault(int(r['pokemon_id']), {})[sn[int(r['stat_id'])]] = int(r['base_stat'])
    type_ids = {int(r['id']): r['identifier'] for r in rows('types')}

    txt = open(os.path.join(ROOT, 'js', 'data', 'pokedex.js'), encoding='utf-8').read()
    # solo el array POKEDEX original (por si forms.js ya se había generado)
    own = {e['dex'] for e in json.loads(txt[txt.index('['):txt.index('];') + 1])}

    jobs = []
    for d4, t in tracker.items():
        dex = int(d4)
        if dex not in own or dex not in species:
            continue
        for fk, sub in (t.get('subgroups') or {}).items():
            fname = sub.get('name') or ''
            kind = 'regional' if fname in REGIONAL else 'mega' if fname in MEGA else None
            if not kind:
                continue
            ident = SPECIAL.get((species[dex]['identifier'], fname))
            if not ident:
                suffix = (REGIONAL if kind == 'regional' else MEGA)[fname][0]
                ident = species[dex]['identifier'] + '-' + suffix
            p = pokemon.get(ident)
            if not p or int(p['id']) not in stats_by or int(p['id']) not in types_by:
                print('  sin datos en PokéAPI:', ident)
                continue
            jobs.append({'pid': int(p['id']), 'dex': dex, 'form': fk, 'fname': fname, 'kind': kind, 'ident': ident, 'sub': sub, 'tr': t})
    print('Descargando', len(jobs), 'formas…')
    with ThreadPoolExecutor(12) as ex:
        results = list(ex.map(fetch_form, jobs))
    ok = []
    for j, r in zip(jobs, results):
        if not r['ok']:
            print('  sin sprite:', j['ident'])
            continue
        j['res'] = r
        ok.append(j)

    regional, megas, ens, credit_lines = [], [], {}, []
    have = {(j['dex'], j['fname']): j['pid'] for j in ok if j['kind'] == 'regional'}
    for j in ok:
        pid, dex, r = j['pid'], j['dex'], j['res']
        sp = species[dex]
        es, en = names[dex][ES], names[dex][EN]
        ts = [type_ids[t] for _, t in sorted(types_by[pid])]
        if j['kind'] == 'regional':
            reg = REGIONAL[j['fname']]
            # evolución: de la forma equivalente del Pokémon anterior si existe; si no, del normal
            prev = int(sp['evolves_from_species_id']) if sp['evolves_from_species_id'] else 0
            evo = have.get((prev, j['fname']), prev) if prev else 0
            if j['fname'].startswith('Paldea_'):
                evo = 0
            entry = {'dex': pid, 'name': es + reg[2], 'types': ts, 'stats': stats_by[pid], 'evo': evo, 'chain': int(sp['evolution_chain_id']), 'gen': reg[1],
                     'leg': 1 if sp['is_legendary'] == '1' else (2 if sp['is_mythical'] == '1' else 0), 'shiny': r['shiny'], 'anim': r['anim'], 'form': reg[0], 'of': dex}
            regional.append(entry)
            ens[pid] = reg[3] + en
        else:
            m = MEGA[j['fname']]
            label = {'x': ' X', 'y': ' Y'}.get(m[1], '')
            megas.append({'dex': pid, 'base': dex, 'form': m[1], 'name': m[2] + es + label, 'types': ts, 'stats': stats_by[pid], 'shiny': r['shiny'], 'anim': r['anim']})
            ens[pid] = m[3] + en + label
        who = set()
        sub = j['sub']
        for node in (sub, (sub.get('subgroups') or {}).get('0001', {})):
            for key in ('sprite_credit', 'portrait_credit'):
                c = node.get(key) or {}
                for i in [c.get('primary')] + list(c.get('secondary') or []):
                    if i:
                        who.add(credits.get(i, i.strip('<@!>')))
        credit_lines.append('- #%d %s: %s' % (pid, (ens[pid]), ', '.join(sorted(who)) or 'desconocido'))
    # forma regional de Pokémon cuyo evo apunta a otra forma que no se descargó → al normal
    pids = {e['dex'] for e in regional}
    for e in regional:
        if e['evo'] >= 10000 and e['evo'] not in pids:
            e['evo'] = 0
    regional.sort(key=lambda e: e['dex']); megas.sort(key=lambda e: e['dex'])
    out = os.path.join(ROOT, 'js', 'data', 'forms.js')
    with open(out, 'w', encoding='utf-8') as f:
        f.write('// Generado por tools/fetch_forms.py a partir de PokéAPI y PMD SpriteCollab. No editar a mano.\n')
        f.write("'use strict';\n// formas regionales: especies propias que se consiguen en el gacha\nPOKEDEX.push(...")
        f.write(json.dumps(regional, ensure_ascii=False, separators=(',', ':')) + ');\n')
        f.write('// megaevoluciones y formas primigenias: no están en el gacha, se desbloquean en el juego\nconst MEGA_DEX = ')
        f.write(json.dumps(megas, ensure_ascii=False, separators=(',', ':')) + ';\n')
        f.write('const EN_FORMS = ' + json.dumps({str(k): v for k, v in sorted(ens.items())}, ensure_ascii=False, separators=(',', ':')) + ';\n')
    cpath = os.path.join(ROOT, 'CREDITS.md')
    prev = open(cpath, encoding='utf-8').read().splitlines() if os.path.exists(cpath) else []
    keep = [l for l in prev if not re.match(r'- #1\d{4} ', l)]
    with open(cpath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(keep).rstrip('\n') + '\n' + '\n'.join(sorted(credit_lines, key=lambda l: int(l.split(' ')[1][1:]))) + '\n')
    print('regionales:', len(regional), 'megas:', len(megas))


if __name__ == '__main__':
    main()
