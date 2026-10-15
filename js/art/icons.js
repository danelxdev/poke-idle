/* ============ icons.js — iconos pixel art de objetos e interfaz ============
 * Adaptado de pokesurvivor (js/ui/icons.js, MIT © JPTER78, ver
 * LICENSE-POKESURVIVOR.txt). Mapas de caracteres 12×12: 'k' es el contorno,
 * '.' transparente y el resto de letras salen de la paleta de cada icono.
 *
 *   Icons.html('coin', 24)          <img> pixelado para el DOM
 *   Icons.draw(ctx, 'coin', x, y)   en el canvas (x,y = centro, 1 px = 1 px)
 *   Icons.item(id)                  nombre del icono de un objeto de ITEMS
 */
const Icons = (() => {
  const K = '#1b1528';
  // frasco de vitaminas (Proteína, Hierro…): misma forma, distinta paleta
  const BOTTLE = ['....kkkk....', '....kwwk....', '...kkkkkk...', '..kccccccc..', '..kwlllllk..', '.kwllllllck.',
                  '.kwlkkkklck.', '.klkwwwkllk.', '.klkkkkkllk.', '.kllllllllk.', '..kccccccck.', '...kkkkkk...'];
  const D = {
    leftovers: { pal: {r: '#ff5f6d', d: '#b8283a', w: '#ffd8d8', g: '#5fe08a'}, rows: [
      '.....kgk....', '....kggk....', '..kkkkkkkk..', '.krwrrrrrrk.', 'krwrrrrrrrdk', 'krrrrrrrrrdk', 'krrrrrrrrrdk', 'krrrrrrrrddk', '.krrrrrrrdk.', '..kdrrrrdk..', '...kkkkkk...', '............'] },
    choiceband: { pal: {p: '#ff8ad8', q: '#c04a98', w: '#ffe0f4'}, rows: [
      '............', '............', '...kkkkkk...', '.kkppwwppkk.', 'kpp......ppk', 'kq........qk', 'kq........qk', 'kpp......ppk', '.kkppppppkk.', '...kkkkkk...', '............', '............'] },
    quickclaw: { pal: {y: '#ffd23f', o: '#c08a10', b: '#8a5a2b'}, rows: [
      '........kk..', '.......kyk..', '......kyok..', '..kk..kyok..', '.kyk.kyok...', '.kyokyok....', '.kyyyok..kk.', '.kbbbbk.kyk.', 'kbbbbbbkyok.', 'kbbbbbbyok..', '.kkkkkkkk...', '............'] },
    focussash: { pal: {o: '#ff9a3d', d: '#c0601a', w: '#ffd0a0'}, rows: [
      '.kk.........', 'kook........', 'kwook.......', '.kwook......', '..kwook.....', '...kwook....', '....kwook...', '.....kwook..', '......kwook.', '.......koodk', '........kddk', '.........kk.'] },
    shellbell: { pal: {p: '#ff9ec4', q: '#c05a88', w: '#ffe0ee', y: '#ffd23f'}, rows: [
      '.....kk.....', '....kyyk....', '...kkkkkk...', '..kwppppqk..', '.kwppppppqk.', '.kpppppppqk.', 'kpppppppppqk', 'kppqpqpqppqk', 'kkkkkkkkkkkk', '....kyyk....', '.....kk.....', '............'] },
    amuletcoin: { pal: {y: '#ffd23f', o: '#c08a10', w: '#fff3b0', r: '#ff5f6d'}, rows: [
      '..kk....kk..', '..krk..krk..', '...krkkrk...', '....kkkk....', '...kyyyyk...', '..kywyyyok..', '..kyyooyok..', '..kyyooyok..', '..kyyyyyok..', '...kooook...', '....kkkk....', '............'] },
    egg0: { pal: {w: '#f4f1dc', d: '#c9c2a0', h: '#ffffff', x: '#7fd07a'}, rows: [
      '....kkkk....', '...kwwwwk...', '..kwhwwwwk..', '..kwhwxwwk..', '.kwwwwwwwwk.', '.kwxwwwwxwk.', '.kwwwwwwwdk.', '.kwwwxwwwdk.', '.kwwwwwwwdk.', '..kwwwwwdk..', '...kddddk...', '....kkkk....'] },
    egg1: { pal: {w: '#9fd4ff', d: '#5a98d0', h: '#e6f4ff', x: '#2f6fd0'}, rows: [
      '....kkkk....', '...kwwwwk...', '..kwhwwwwk..', '..kwhwxwwk..', '.kwwwwwwwwk.', '.kwxwwwwxwk.', '.kwwwwwwwdk.', '.kwwwxwwwdk.', '.kwwwwwwwdk.', '..kwwwwwdk..', '...kddddk...', '....kkkk....'] },
    egg2: { pal: {w: '#d2a0ff', d: '#8a58c0', h: '#f0e0ff', x: '#ff7ad0'}, rows: [
      '....kkkk....', '...kwwwwk...', '..kwhwwwwk..', '..kwhwxwwk..', '.kwwwwwwwwk.', '.kwxwwwwxwk.', '.kwwwwwwwdk.', '.kwwwxwwwdk.', '.kwwwwwwwdk.', '..kwwwwwdk..', '...kddddk...', '....kkkk....'] },
    egg3: { pal: {w: '#ffe27a', d: '#c89a20', h: '#fff8d0', x: '#ff6a3a'}, rows: [
      '....kkkk....', '...kwwwwk...', '..kwhwwwwk..', '..kwhwxwwk..', '.kwwwwwwwwk.', '.kwxwwwwxwk.', '.kwwwwwwwdk.', '.kwwwxwwwdk.', '.kwwwwwwwdk.', '..kwwwwwdk..', '...kddddk...', '....kkkk....'] },
    luckyegg: { pal: {w: '#fffaf0', s: '#e0d6c8', r: '#ff5f6d'}, rows: [
      '....kkkk....', '...kwwwwk...', '..kwwrwwwk..', '..kwwwwwwk..', '.kwrwwwwrwk.', '.kwwwwwwwwk.', '.kwwwrwwwsk.', '.kwwwwwwwsk.', '.kwrwwwwssk.', '..kwwwwssk..', '...kkkkkk...', '............'] },
    lifeorb: { pal: {p: '#c04a98', d: '#7a1f5a', w: '#ffb0e0', r: '#ff3048'}, rows: [
      '....kkkk....', '..kkpppdkk..', '.kwwpppppdk.', '.kwpprrpppk.', 'kppprrrrppdk', 'kpprrrrrrpdk', 'kpprrrrrrpdk', 'kppprrrrppdk', '.kpppprppdk.', '.kdpppppddk.', '..kkddddkk..', '....kkkk....'] },
    choicescarf: { pal: {b: '#4fb4ff', d: '#2a6fb0', w: '#cfe8ff'}, rows: [
      '............', '............', 'kkkkkkkkkk..', 'kwbbbbbbbbk.', 'kbbbbbbbbdk.', 'kkkkkkkbbdk.', '......kbbdk.', '......kbbdk.', '.....kbbbdk.', '.....kbbddk.', '.....kkkkkk.', '............'] },
    rockyhelmet: { pal: {g: '#9aa6b5', d: '#5d6773', w: '#e0e6ee'}, rows: [
      '............', '.k...k...k..', 'kgk.kgk.kgk.', '.kkkkkkkkk..', 'kwggggggggk.', 'kwgggggggdk.', 'kggggggggdk.', 'kgggkkkkgdk.', 'kggk....kdk.', 'kkk......kk.', '............', '............'] },
    assaultvest: { pal: {g: '#4f8a3a', d: '#2f5a22', y: '#ffd23f'}, rows: [
      '............', '.kkk....kkk.', 'kggk....kggk', 'kgggkkkkgggk', 'kgggyggygggk', 'kgggggggggdk', 'kggyggggygdk', 'kgggggggggdk', 'kgggggggggdk', 'kddddddddddk', 'kkkkkkkkkkkk', '............'] },
    heart: { pal: {r: '#ff5f6d', s: '#c23a4b', w: '#ffd3d8'}, rows: [
      '............', '.kkk....kkk.', 'kwwrk..krrrk', 'kwrrrkkrrrsk', 'krrrrrrrrrsk', 'krrrrrrrrrsk', '.krrrrrrrsk.', '..krrrrrsk..', '...krrrsk...', '....krsk....', '.....kk.....', '............'] },
    fist: { pal: {r: '#ff5f6d', s: '#c23a4b', w: '#ffd3d8', c: '#e8e8f0'}, rows: [
      '............', '..kkkkkk....', '.krrrrrrk...', 'krwwrrrrrkk.', 'krwrrrrrrrrk', 'krrrrrrrkrsk', 'krrrrrrrkrsk', '.krrrrrrskk.', '..kssssssk..', '..kcccccck..', '..kkkkkkkk..', '............'] },
    up: { pal: {g: '#5fe08a', d: '#2f9a52', w: '#c8ffd8'}, rows: [
      '.....kk.....', '....kwgk....', '...kwgggk...', '..kwgggggk..', '.kwgggggggk.', 'kkkkggggkkkk', '...kggggk...', '...kggggk...', '...kggddk...', '...kgdddk...', '...kddddk...', '...kkkkkk...'] },
    boot: { pal: {b: '#4fb4ff', d: '#2a6fb0', w: '#e6f4ff', g: '#e8e8f0'}, rows: [
      '............', '....kkkk....', '....kbbk....', '....kbbk....', '....kbbk....', '....kbbbkk..', '...kbwbbbbk.', '..kbbbbbbbbk', '..kdddddddbk', '..kgggggggk.', '...kkkkkkk..', '............'] },
    clock: { pal: {w: '#f4f4ff', y: '#ffd23f', o: '#c9c9e0'}, rows: [
      '....kkkk....', '..kkyyyykk..', '.kyywwwwyyk.', '.kywwwkwwyk.', 'kywwwwkwwwyk', 'kywwwwkwwwyk', 'kywwwwkkkwyk', 'kywwwwwwwwyk', '.kywwwwwwyk.', '.kyyowwwyyk.', '..kkyyyykk..', '....kkkk....'] },
    shield: { pal: {s: '#9fb1c9', d: '#5d6f8c', w: '#e6eef8', r: '#4fb4ff'}, rows: [
      '............', '.kkkkkkkkkk.', '.kwwsssssdk.', '.kwssrrssdk.', '.kwssrrssdk.', '.kssrrrrsdk.', '.kssrrrrsdk.', '..kssrrsdk..', '..kssssddk..', '...ksssdk...', '....kddk....', '.....kk.....'] },
    sprout: { pal: {g: '#5fe08a', d: '#2f9a52', b: '#8a5a2b'}, rows: [
      '............', '..kkk..kkk..', '.kgggk.kgggk', '.kggggkgggdk', '..kdggkggdk.', '...kkdgdkk..', '.....kgk....', '.....kgk....', '...kkkdkkk..', '..kbbbbbbbk.', '..kbbbbbbbk.', '...kkkkkkk..'] },
    magnet: { pal: {r: '#ff5f6d', s: '#c23a4b', w: '#e8e8f0'}, rows: [
      '............', '..kkkkkkkk..', '.krrrrrrrrk.', 'krrsskkssrrk', 'krrk....krrk', 'krrk....krrk', 'krrk....krrk', 'kwwk....kwwk', 'kwwk....kwwk', 'kkkk....kkkk', '............', '............'] },
    book: { pal: {c: '#4fb4ff', d: '#2a6fb0', p: '#f4f4ff', y: '#ffd23f'}, rows: [
      '............', '.kkkkkkkkkk.', '.kcccccccck.', '.kcyyyyyyck.', '.kcccccccck.', '.kccyyyyyck.', '.kcccccccck.', '.kcccccccck.', '.kddddddddk.', '.kppppppppk.', '.kkkkkkkkkk.', '............'] },
    coin: { pal: {y: '#ffd23f', o: '#c08a10', w: '#fff4b0'}, rows: [
      '....kkkk....', '..kkyyyykk..', '.kyywwyyyyk.', '.kywyyyyyok.', 'kyyyyooyyyok', 'kywyoyyoyyok', 'kyyyoyyoyyok', 'kyyyyooyyyok', '.kyyyyyyyok.', '.kooyyyyook.', '..kkooookk..', '....kkkk....'] },
    berry: { pal: {r: '#ff7a9e', s: '#c23a6b', w: '#ffd3e0', g: '#5fe08a', d: '#2f9a52'}, rows: [
      '............', '.....kkk....', '....kgggk...', '..kkkgdkkk..', '.krrrkkrrrk.', 'krwwrrrrrrsk', 'krwrrrrrrrsk', 'krrrrrrrrrsk', 'krrrrrrrrssk', '.krrrrrrssk.', '..kkssssskk.', '....kkkkk...'] },
    star: { pal: {y: '#ffd23f', o: '#c08a10', w: '#fff4b0'}, rows: [
      '.....kk.....', '.....kk.....', '....kwyk....', '....kyyk....', 'kkkkwyyykkkk', 'kwyyyyyyyyok', '.kyyyyyyyok.', '..kyyyyyyk..', '..kyyyoyyk..', '.kyok..koyk.', '.kok....kok.', '.kk......kk.'] },
    bomb: { pal: {b: '#3a3a4a', w: '#8a8aa0', f: '#ffd23f', r: '#ff7b3d'}, rows: [
      '........r...', '.......rfr..', '......kfr...', '.....kfk....', '...kkkkkk...', '..kbbbbbbk..', '.kbwwbbbbbk.', '.kbwbbbbbbk.', '.kbbbbbbbbk.', '.kbbbbbbbbk.', '..kbbbbbbk..', '...kkkkkk...'] },
    ball: { pal: {r: '#ff4d4d', w: '#f4f4f4', s: '#c23a3a'}, rows: [
      '....kkkk....', '..kkrrrrkk..', '.krwrrrrrrk.', '.krwrrrrrsk.', 'krrrrkkrrssk', 'kkkkkwwkkkkk', 'kwwwkwwkwwwk', 'kwwwwkkwwwwk', '.kwwwwwwwwk.', '.kwwwwwwwwk.', '..kkwwwwkk..', '....kkkk....'] },
    shiny: { pal: {y: '#ff4d5e', w: '#ffd0d6', o: '#b8283a', x: '#fff6b0'}, rows: [
      '.....kk...x.', '.....kk..xxx', '....kwyk..x.', '....kyyk....', 'kkkkwyyykkkk', 'kwyyyyyyyyok', '.kyyyyyyyok.', '..kyyyyyyk..', '..kyyyoyyk..', '.kyok..koyk.', '.kok....kok.', '.kk......kk.'] },
    friends: { pal: {b: '#4fb4ff', d: '#2a6fb0', g: '#5fe08a', h: '#2f9a52'}, rows: [
      '............', '..kkk..kkk..', '.kbbbkkgggk.', '.kbbbkkgggk.', '..kkk..kkk..', '............', '.kkkkkkkkkk.', 'kbbbbkkggggk', 'kbbbbkkggggk', 'kddddkkhhhhk', 'kkkkkkkkkkkk', '............'] },
    gear: { pal: {g: '#c9d6ff', d: '#7f93c9'}, rows: [
      '....kkkk....', '.kk.kggk.kk.', '.kgkkggkkgk.', '..kggggggk..', 'kkggkkkkggkk', 'kgggk..kgddk', 'kgggk..kgddk', 'kkggkkkkddkk', '..kggddddk..', '.kgkkddkkdk.', '.kk.kddk.kk.', '....kkkk....'] },
    ballJ: { pal: { r: '#ffb020', s: '#c07a10', w: '#fff0b0', b: '#f4f4f4' }, rows: ['....kkkk....', '..kkrrrrkk..', '.krwrrrrrrk.', '.krwrrrrrsk.', 'krrrrkkrrssk', 'kkkkkbbkkkkk', 'kbbbkbbkbbbk', 'kbbbbkkbbbbk', '.kbbbbbbbbk.', '.kbbbbbbbbk.', '..kkbbbbkk..', '....kkkk....'] },
    ballH: { pal: { r: '#3ac060', s: '#228040', w: '#c8ffd8', b: '#f4f4f4' }, rows: ['....kkkk....', '..kkrrrrkk..', '.krwrrrrrrk.', '.krwrrrrrsk.', 'krrrrkkrrssk', 'kkkkkbbkkkkk', 'kbbbkbbkbbbk', 'kbbbbkkbbbbk', '.kbbbbbbbbk.', '.kbbbbbbbbk.', '..kkbbbbkk..', '....kkkk....'] },
    ballLux: { pal: { r: '#30303a', s: '#18181e', w: '#ff5f6d', b: '#ffd23f' }, rows: ['....kkkk....', '..kkrrrrkk..', '.krwrrrrrrk.', '.krwrrrrrsk.', 'krrrrkkrrssk', 'kkkkkbbkkkkk', 'kbbbkbbkbbbk', 'kbbbbkkbbbbk', '.kbbbbbbbbk.', '.kbbbbbbbbk.', '..kkbbbbkk..', '....kkkk....'] },
    ballR4: { pal: { r: '#7aa8d8', s: '#4a6a98', w: '#e0f0ff', b: '#f4f4f4' }, rows: ['....kkkk....', '..kkrrrrkk..', '.krwrrrrrrk.', '.krwrrrrrsk.', 'krrrrkkrrssk', 'kkkkkbbkkkkk', 'kbbbkbbkbbbk', 'kbbbbkkbbbbk', '.kbbbbbbbbk.', '.kbbbbbbbbk.', '..kkbbbbkk..', '....kkkk....'] },
    ballR5: { pal: { r: '#e8e8f0', s: '#a0a0b8', w: '#ffffff', b: '#f4f4f4' }, rows: ['....kkkk....', '..kkrrrrkk..', '.krwrrrrrrk.', '.krwrrrrrsk.', 'krrrrkkrrssk', 'kkkkkbbkkkkk', 'kbbbkbbkbbbk', 'kbbbbkkbbbbk', '.kbbbbbbbbk.', '.kbbbbbbbbk.', '..kkbbbbkk..', '....kkkk....'] },
    ballR6: { pal: { r: '#e0508a', s: '#a02a60', w: '#ffc0d8', b: '#f4f4f4' }, rows: ['....kkkk....', '..kkrrrrkk..', '.krwrrrrrrk.', '.krwrrrrrsk.', 'krrrrkkrrssk', 'kkkkkbbkkkkk', 'kbbbkbbkbbbk', 'kbbbbkkbbbbk', '.kbbbbbbbbk.', '.kbbbbbbbbk.', '..kkbbbbkk..', '....kkkk....'] },
    ballR7: { pal: { r: '#ffa040', s: '#c06a10', w: '#fff0c0', b: '#f4f4f4' }, rows: ['....kkkk....', '..kkrrrrkk..', '.krwrrrrrrk.', '.krwrrrrrsk.', 'krrrrkkrrssk', 'kkkkkbbkkkkk', 'kbbbkbbkbbbk', 'kbbbbkkbbbbk', '.kbbbbbbbbk.', '.kbbbbbbbbk.', '..kkbbbbkk..', '....kkkk....'] },
    ballR8: { pal: { r: '#c04ae0', s: '#7a2a98', w: '#f0c0ff', b: '#f4f4f4' }, rows: ['....kkkk....', '..kkrrrrkk..', '.krwrrrrrrk.', '.krwrrrrrsk.', 'krrrrkkrrssk', 'kkkkkbbkkkkk', 'kbbbkbbkbbbk', 'kbbbbkkbbbbk', '.kbbbbbbbbk.', '.kbbbbbbbbk.', '..kkbbbbkk..', '....kkkk....'] },
    ballR9: { pal: { r: '#d84a3a', s: '#982a1a', w: '#ffd0c0', b: '#f4f4f4' }, rows: ['....kkkk....', '..kkrrrrkk..', '.krwrrrrrrk.', '.krwrrrrrsk.', 'krrrrkkrrssk', 'kkkkkbbkkkkk', 'kbbbkbbkbbbk', 'kbbbbkkbbbbk', '.kbbbbbbbbk.', '.kbbbbbbbbk.', '..kkbbbbkk..', '....kkkk....'] },
    cup: { pal: { w: '#f4f8ff', c: '#bfe6ff', r: '#ff5f6d', s: '#29abe0' }, rows: [
      '............', '.kkkkkkkkk..', 'kwwwwwwwwkkk', 'kwccrccrwkwk', 'kwcrrrrrwkwk', 'kwccrrrcwkwk',
      'kwcccrccwkkk', '.kwwwwwwk...', '..kkkkkk....', '............', '............', '............'] },
    ball2: { pal: { r: '#3d7bff', s: '#2a56b8', w: '#cfe0ff', b: '#f4f4f4' }, rows: ['....kkkk....', '..kkrrrrkk..', '.krwrrrrrrk.', '.krwrrrrrsk.', 'krrrrkkrrssk', 'kkkkkbbkkkkk', 'kbbbkbbkbbbk', 'kbbbbkkbbbbk', '.kbbbbbbbbk.', '.kbbbbbbbbk.', '..kkbbbbkk..', '....kkkk....'] },
    ball3: { pal: { r: '#3a3a46', s: '#1d1d26', w: '#ffd23f', b: '#f4f4f4' }, rows: ['....kkkk....', '..kkrrrrkk..', '.krwrrrrrrk.', '.krwrrrrrsk.', 'krrrrkkrrssk', 'kkkkkbbkkkkk', 'kbbbkbbkbbbk', 'kbbbbkkbbbbk', '.kbbbbbbbbk.', '.kbbbbbbbbk.', '..kkbbbbkk..', '....kkkk....'] },
    ball4: { pal: { r: '#8a3fd0', s: '#5e2a96', w: '#ff8ad8', b: '#f4f4f4' }, rows: ['....kkkk....', '..kkrrrrkk..', '.krwrrrrrrk.', '.krwrrrrrsk.', 'krrrrkkrrssk', 'kkkkkbbkkkkk', 'kbbbkbbkbbbk', 'kbbbbkkbbbbk', '.kbbbbbbbbk.', '.kbbbbbbbbk.', '..kkbbbbkk..', '....kkkk....'] },
    gem: { pal: { c: '#5fe0ff', d: '#2a8ab8', w: '#e6fbff', p: '#9a7bff' }, rows: [
      '............', '...kkkkkk...', '..kwwcccdk..', '.kwccccccdk.', 'kkkkkkkkkkkk', 'kwcccccccddk',
      '.kccccccddk.', '..kccccddk..', '...kcccdk...', '....kcdk....', '.....kk.....', '............'] },
    trophy: { pal: {y: '#ffd23f', d: '#c08a10', w: '#fff3b0'}, rows: [
      '............', '..kkkkkkkk..', 'kkkwyyyydkkk', 'k.kwyyyydk.k', 'k.kwyyyydk.k', '.kkwyyyydkk.', '...kyyyyk...', '....kyyk....', '....kyyk....', '...kddddk...', '..kyyyyyyk..', '..kkkkkkkk..'] },
    crown: { pal: {y: '#ffd23f', o: '#c08a10', r: '#ff5f6d'}, rows: [
      '............', '............', 'k....k....k.', 'kk..kyk..kk.', 'kyk.kyk.kyk.', 'kyykyyykyyk.', 'kyyyyyyyyyk.', 'kyyryyyryyk.', 'kyyyyyyyyyk.', 'koooooooook.', 'kkkkkkkkkkk.', '............'] },
    sound: { pal: {w: '#e8eef8'}, rows: [
      '............', '.....kk.....', '....kwk..k..', '...kwwk...k.', 'kkkwwwk.k..k', 'kwwwwwk..k.k', 'kwwwwwk..k.k', 'kkkwwwk.k..k', '...kwwk...k.', '....kwk..k..', '.....kk.....', '............'] },
    mute: { pal: {w: '#e8eef8', r: '#ff5f6d'}, rows: [
      '............', '.....kk.....', '....kwk.....', '...kwwk.....', 'kkkwwwk.r..r', 'kwwwwwk..rr.', 'kwwwwwk..rr.', 'kkkwwwk.r..r', '...kwwk.....', '....kwk.....', '.....kk.....', '............'] },
    ticket: { pal: {y: '#ffd23f', d: '#c08a10', w: '#fff3b0', r: '#ff5f6d'}, rows: [
      '............', '............', 'kkkkkkkkkkkk', 'kwyyydyyyyyk', 'kyyyyyyrryyk', '.kyyydyrryk.', '.kyyyyyrryk.', 'kyyyydyyyyyk', 'kddddddddddk', 'kkkkkkkkkkkk', '............', '............'] },
    tkPoke: { pal: { y: '#ff5f6d', d: '#b8283a', w: '#ffd3d8', r: '#ffd23f' }, rows: [
      '............', '............', 'kkkkkkkkkkkk', 'kwyyydyyyyyk', 'kyyyyyyrryyk', '.kyyydyrryk.', '.kyyyyyrryk.', 'kyyyydyyyyyk', 'kddddddddddk', 'kkkkkkkkkkkk', '............', '............'] },
    tkSuper: { pal: { y: '#4fb4ff', d: '#2a6fb0', w: '#cfe8ff', r: '#ffffff' }, rows: [
      '............', '............', 'kkkkkkkkkkkk', 'kwyyydyyyyyk', 'kyyyyyyrryyk', '.kyyydyrryk.', '.kyyyyyrryk.', 'kyyyydyyyyyk', 'kddddddddddk', 'kkkkkkkkkkkk', '............', '............'] },
    tkUltra: { pal: { y: '#ffd23f', d: '#c08a10', w: '#fff3b0', r: '#30303a' }, rows: [
      '............', '............', 'kkkkkkkkkkkk', 'kwyyydyyyyyk', 'kyyyyyyrryyk', '.kyyydyrryk.', '.kyyyyyrryk.', 'kyyyydyyyyyk', 'kddddddddddk', 'kkkkkkkkkkkk', '............', '............'] },
    tkMaster: { pal: { y: '#c47bff', d: '#7a3fb0', w: '#f0d8ff', r: '#ffd23f' }, rows: [
      '............', '............', 'kkkkkkkkkkkk', 'kwyyydyyyyyk', 'kyyyyyyrryyk', '.kyyydyrryk.', '.kyyyyyrryk.', 'kyyyydyyyyyk', 'kddddddddddk', 'kkkkkkkkkkkk', '............', '............'] },
    // ---------- propios de PokéMazmorra ----------
    glasses: { pal: { b: '#3a3a5a', l: '#4fb4ff', w: '#cfe8ff' }, rows: [
      '............', '............', '............', 'kkkkkkkkkkkk', 'kwllkkkwllkk', 'klllk.klllk.',
      'klllk.klllk.', '.kkk...kkk..', '............', '............', '............', '............'] },
    bell: { pal: { y: '#ffd23f', o: '#c08a10', w: '#fff3b0', r: '#ff5f6d' }, rows: [
      '.....kk.....', '....krrk....', '....kkkk....', '...kwyyyk...', '..kwyyyyok..', '..kwyyyyok..',
      '..kyyyyyok..', '.kyyyyyyyok.', 'kyyyyyyyyyok', 'kkkkkkkkkkkk', '.....kok....', '......kk....'] },
    zoom: { pal: { g: '#c9d6ff', d: '#7f93c9', l: '#9fe0ff', w: '#ffffff', b: '#8a5a2b' }, rows: [
      '...kkkk.....', '..kggggk....', '.kgwlllgk...', 'kgwllllldk..', 'kglllllldk..', 'kglllllldk..',
      '.kglllldk...', '..kddddkk...', '.....kkbbk..', '......kbbbk.', '.......kbbk.', '........kk..'] },
    dust: { pal: { p: '#c47bff', q: '#7a3fb0', y: '#fff3a8', w: '#ffffff' }, rows: [
      '.y........y.', 'yyy..kk...w.', '.y..kqqk....', '....kkkk....', '...kppppk..y', '..kpwpppqk.y',
      '..kpppppqk..', '.kpppyppppk.', '.kppppppqqk.', '.kpppppqqqk.', '..kkkkkkkk..', '............'] },
    stone: { pal: { g: '#b9c1cc', d: '#6d7684', w: '#eef2f8', c: '#9fe0ff' }, rows: [
      '............', '....kkkk....', '..kkwggdkk..', '.kwggggggdk.', '.kwggcgggdk.', 'kgggcccgggdk',
      'kggggcggggdk', 'kgggggggdddk', '.kggggdddddk', '..kkddddddk.', '....kkkkkk..', '............'] },
    candy: { pal: { b: '#4fb4ff', d: '#2a6fb0', w: '#cfe8ff', y: '#ffd23f' }, rows: [
      '............', '............', 'k.kk....kk.k', 'kkyk.kkkyk.k', 'kyykkbbbkkyk', 'kyykbwbbbkyk',
      'kyykbbbbdkyk', 'kyykkbddkkyk', 'kkyk.kkk.kkk', 'k.kk....kk.k', '............', '............'] },
    revive: { pal: { y: '#ffd23f', o: '#c08a10', w: '#fff3b0' }, rows: [
      '............', '.....kk.....', '....kwyk....', '...kwyyyk...', '..kwyyyyok..', '.kwyyyyyyok.',
      '..kyyyyyok..', '...kyyyok...', '....kyok....', '.....kk.....', '............', '............'] },
    potion: { pal: { p: '#c070ff', q: '#7a3fb0', w: '#e8c0ff', g: '#d0d0e0' }, rows: [
      '....kkkk....', '....kggk....', '...kkkkkk...', '...kwwwwk...', '..kwppppqk..', '.kwppppppqk.',
      '.kwpppppppk.', '.kppppppppk.', '.kpppppppqk.', '.kqpppppqqk.', '..kkqqqqkk..', '....kkkk....'] },
    protein: { pal: { c: '#ffd23f', w: '#ffffff', l: '#ff5f6d' }, rows: BOTTLE },
    iron:    { pal: { c: '#ffd23f', w: '#ffffff', l: '#9aa6b5' }, rows: BOTTLE },
    calcium: { pal: { c: '#ffd23f', w: '#ffffff', l: '#4fb4ff' }, rows: BOTTLE },
    zinc:    { pal: { c: '#ffd23f', w: '#ffffff', l: '#5fe08a' }, rows: BOTTLE },
    carbos:  { pal: { c: '#ffd23f', w: '#ffffff', l: '#ff9a3d' }, rows: BOTTLE },
    hpup:    { pal: { c: '#ffd23f', w: '#ffffff', l: '#ff8ad8' }, rows: BOTTLE },
    ppmax:   { pal: { c: '#ffd23f', w: '#ffffff', l: '#c47bff' }, rows: BOTTLE }
  };

  const ITEM_ICON = {
    restos: 'leftovers', cinta_eleccion: 'choiceband', gafas_eleccion: 'glasses', panuelo_eleccion: 'choicescarf',
    garra_rapida: 'quickclaw', banda_focus: 'focussash', cascabel_concha: 'shellbell', moneda_amuleto: 'amuletcoin',
    huevo_suerte: 'luckyegg', vidasfera: 'lifeorb', casco_dentado: 'rockyhelmet', chaleco_asalto: 'assaultvest',
    cascabel_amistad: 'bell', lente_zoom: 'zoom', polvo_brillo: 'dust', piedra_eterna: 'stone',
    proteina: 'protein', hierro: 'iron', calcio: 'calcium', zinc: 'zinc', carburante: 'carbos',
    mas_ps: 'hpup', pp_max: 'ppmax', caramelo_raro: 'candy', revivir: 'revive'
  };

  const cache = {}, urls = {};
  function canvas(name) {
    if (cache[name]) return cache[name];
    const def = D[name] || D.star, pal = Object.assign({ k: K }, def.pal);
    const h = def.rows.length, w = def.rows[0].length;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    def.rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (!pal[ch]) return;
      g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1);
    }));
    return (cache[name] = cv);
  }
  function url(name) { return urls[name] || (urls[name] = canvas(name).toDataURL()); }
  function html(name, size = 24, cls = '') {
    const s = 12 * Math.max(1, Math.round(size / 12));
    return `<img class="pix ${cls}" src="${url(name)}" width="${s}" height="${s}" alt="" draggable="false">`;
  }
  function draw(ctx, name, x, y, scale = 1) {
    const cv = canvas(name);
    ctx.drawImage(cv, Math.round(x - cv.width * scale / 2), Math.round(y - cv.height * scale / 2), cv.width * scale, cv.height * scale);
  }
  const item = id => ITEM_ICON[id] || 'star';
  return { canvas, url, html, draw, item, ITEM_ICON };
})();
