/* ═══════════════════════════════════════════
   constants.js — Board Themes & Piece Sets
   Naya theme ya piece set → sirf yahan add karo
═══════════════════════════════════════════ */

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const BOARD_THEMES = [
    {id:'cc-green',   name:'CC Green',   cat:'♟ Chess.com', light:'#eeeed2',dark:'#769656',border:'#4d7c38',lastLight:'#f5f56a',lastDark:'#baca2b',labelLight:'#769656',labelDark:'#eeeed2',glow:'rgba(76,150,56,.35)'},
    {id:'cc-walnut',  name:'CC Walnut',  cat:'♟ Chess.com', light:'#f1d9b1',dark:'#bc8a5f',border:'#8b5e3c',lastLight:'#e8d040',lastDark:'#c0a820',labelLight:'#bc8a5f',labelDark:'#f1d9b1',glow:'rgba(139,94,60,.35)'},
    {id:'cc-blue',    name:'CC Blue',    cat:'♟ Chess.com', light:'#dde6ec',dark:'#4a8fa8',border:'#3a6f85',lastLight:'#c8d855',lastDark:'#90a830',labelLight:'#4a8fa8',labelDark:'#dde6ec',glow:'rgba(74,143,168,.35)'},
    {id:'cc-purple',  name:'CC Purple',  cat:'♟ Chess.com', light:'#e3d8f6',dark:'#9877bc',border:'#7355a0',lastLight:'#d8c850',lastDark:'#b0a030',labelLight:'#9877bc',labelDark:'#e3d8f6',glow:'rgba(152,119,188,.35)'},
    {id:'cc-dark',    name:'CC Dark',    cat:'♟ Chess.com', light:'#6b6b6b',dark:'#383734',border:'#202020',lastLight:'#888840',lastDark:'#606020',labelLight:'#aaaaaa',labelDark:'#888888',glow:'rgba(50,50,50,.5)'},
    {id:'cc-paper',   name:'CC Paper',   cat:'♟ Chess.com', light:'#ebebd0',dark:'#4f6b6f',border:'#38504a',lastLight:'#e0e060',lastDark:'#a0a030',labelLight:'#4f6b6f',labelDark:'#ebebd0',glow:'rgba(79,107,111,.35)'},
    {id:'li-brown',   name:'Brown',      cat:'♞ Lichess',   light:'#f0d9b5',dark:'#b58863',border:'#8b6940',lastLight:'#cdd26a',lastDark:'#aaa23a',labelLight:'#b58863',labelDark:'#f0d9b5',glow:'rgba(181,136,99,.35)'},
    {id:'li-blue',    name:'Blue',       cat:'♞ Lichess',   light:'#dee3e6',dark:'#8ca2ad',border:'#607d8b',lastLight:'#c8d85e',lastDark:'#9aab3a',labelLight:'#8ca2ad',labelDark:'#dee3e6',glow:'rgba(96,125,139,.35)'},
    {id:'li-green',   name:'Green',      cat:'♞ Lichess',   light:'#ffffdd',dark:'#86a666',border:'#5d8050',lastLight:'#f0f050',lastDark:'#c0d030',labelLight:'#86a666',labelDark:'#ffffdd',glow:'rgba(134,166,102,.35)'},
    {id:'li-ic',      name:'IC',         cat:'♞ Lichess',   light:'#fffff0',dark:'#c8c8c8',border:'#a0a0a0',lastLight:'#e8e860',lastDark:'#b8b830',labelLight:'#888888',labelDark:'#fffff0',glow:'rgba(150,150,150,.35)'},
    {id:'li-pink',    name:'Pink',       cat:'♞ Lichess',   light:'#f8e8e8',dark:'#d07070',border:'#a85050',lastLight:'#f0d840',lastDark:'#c0a820',labelLight:'#d07070',labelDark:'#f8e8e8',glow:'rgba(208,112,112,.35)'},
    {id:'li-purple',  name:'Purple',     cat:'♞ Lichess',   light:'#ede0f0',dark:'#9b72cf',border:'#7355a5',lastLight:'#d8d050',lastDark:'#a8a020',labelLight:'#9b72cf',labelDark:'#ede0f0',glow:'rgba(155,114,207,.35)'},
    {id:'classic-grn',name:'Tournament', cat:'👑 Classic',  light:'#ececd7',dark:'#4c946a',border:'#2d6b4a',lastLight:'#f5f57a',lastDark:'#a8c840',labelLight:'#4c946a',labelDark:'#ececd7',glow:'rgba(45,107,74,.35)'},
    {id:'ocean',      name:'Ocean',      cat:'👑 Classic',  light:'#d5e5f0',dark:'#5889a8',border:'#3d6680',lastLight:'#b8d058',lastDark:'#88a030',labelLight:'#5889a8',labelDark:'#d5e5f0',glow:'rgba(61,102,128,.35)'},
    {id:'coral',      name:'Coral',      cat:'👑 Classic',  light:'#f0e0d8',dark:'#c07860',border:'#9a5840',lastLight:'#d8c050',lastDark:'#b09830',labelLight:'#c07860',labelDark:'#f0e0d8',glow:'rgba(154,88,64,.35)'},
    {id:'marble',     name:'Marble',     cat:'👑 Classic',  light:'#f5f5f0',dark:'#8b8b83',border:'#666660',lastLight:'#d8d860',lastDark:'#a0a040',labelLight:'#8b8b83',labelDark:'#f5f5f0',glow:'rgba(102,102,96,.35)'},
    {id:'wood',       name:'Wood',       cat:'👑 Classic',  light:'#e8c99b',dark:'#a47443',border:'#7a5230',lastLight:'#d4c048',lastDark:'#b09828',labelLight:'#a47443',labelDark:'#e8c99b',glow:'rgba(122,82,48,.35)'},
    {id:'night',      name:'Night',      cat:'👑 Classic',  light:'#3d4a5c',dark:'#1a2332',border:'#0f1826',lastLight:'#5a6a44',lastDark:'#3a4a28',labelLight:'#6b8aaa',labelDark:'#4a6888',glow:'rgba(15,24,38,.5)'},
];

const PIECE_CDN = 'https://cdn.jsdelivr.net/gh/lichess-org/lila@master/public/piece/';

const PIECE_SETS = [
    {id:'cburnett',   name:'Cburnett',   cat:'♞ Lichess'},
    {id:'merida',     name:'Merida',     cat:'♞ Lichess'},
    {id:'alpha',      name:'Alpha',      cat:'♞ Lichess'},
    {id:'pirouetti',  name:'Pirouetti',  cat:'♞ Lichess'},
    {id:'chessnut',   name:'Chessnut',   cat:'♞ Lichess'},
    {id:'chess7',     name:'Chess7',     cat:'♞ Lichess'},
    {id:'california', name:'California', cat:'♟ Chess.com'},
    {id:'maestro',    name:'Maestro',    cat:'♟ Chess.com'},
    {id:'gioco',      name:'Gioco',      cat:'♟ Chess.com'},
    {id:'tatiana',    name:'Tatiana',    cat:'♟ Chess.com'},
    {id:'staunty',    name:'Staunty',    cat:'👑 Classic'},
    {id:'spatial',    name:'Spatial',    cat:'👑 Classic'},
    {id:'governor',   name:'Governor',   cat:'👑 Classic'},
    {id:'dubrovny',   name:'Dubrovny',   cat:'👑 Classic'},
    {id:'fresca',     name:'Fresca',     cat:'👑 Classic'},
    {id:'kosal',      name:'Kosal',      cat:'👑 Classic'},
];

const getPieceImg = (color, type, setId) => {
    const c = color === WHITE ? 'w' : 'b';
    return `${PIECE_CDN}${setId}/${c}${type.toUpperCase()}.svg`;
};
