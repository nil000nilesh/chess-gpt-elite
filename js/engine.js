/* ═══════════════════════════════════════════
   engine.js — Chess Engine (koi UI nahi)
   Chess rules badlani ho → sirf yahan aao
═══════════════════════════════════════════ */

const WHITE = 'w', BLACK = 'b';

function parseFEN(fen) {
    const parts = fen.split(' '), rows = parts[0].split('/');
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let r = 0; r < 8; r++) {
        let c = 0;
        for (const ch of rows[r]) {
            if (ch >= '1' && ch <= '8') c += parseInt(ch);
            else { board[r][c] = { type: ch.toLowerCase(), color: ch === ch.toUpperCase() ? WHITE : BLACK }; c++; }
        }
    }
    return { board, turn: parts[1]||WHITE, castling: parts[2]||'KQkq', enPassant: parts[3]||'-', halfMoves: parseInt(parts[4])||0, fullMoves: parseInt(parts[5])||1 };
}

function cloneBoard(b) { return b.map(r => r.map(p => p ? {...p} : null)); }
function inBounds(r,c) { return r>=0&&r<8&&c>=0&&c<8; }
function findKing(board, color) { for (let r=0;r<8;r++) for (let c=0;c<8;c++) if (board[r][c]?.type==='k'&&board[r][c]?.color===color) return [r,c]; return null; }

function isAttackedBy(board, row, col, byColor) {
    const pd = byColor===WHITE?1:-1;
    for (const dc of [-1,1]) { const pr=row+pd,pc=col+dc; if (inBounds(pr,pc)&&board[pr][pc]?.color===byColor&&board[pr][pc].type==='p') return true; }
    for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) { const nr=row+dr,nc=col+dc; if (inBounds(nr,nc)&&board[nr][nc]?.color===byColor&&board[nr][nc].type==='n') return true; }
    for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++) { if(!dr&&!dc) continue; const nr=row+dr,nc=col+dc; if (inBounds(nr,nc)&&board[nr][nc]?.color===byColor&&board[nr][nc].type==='k') return true; }
    const dirs=[[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]];
    for (let d=0;d<8;d++) { const [dr,dc]=dirs[d],isDiag=d<4; for (let i=1;i<8;i++) { const nr=row+dr*i,nc=col+dc*i; if (!inBounds(nr,nc)) break; if (board[nr][nc]) { if (board[nr][nc].color===byColor) { const t=board[nr][nc].type; if (t==='q'||(isDiag&&t==='b')||(!isDiag&&t==='r')) return true; } break; } } }
    return false;
}

function isInCheck(board, color) { const k=findKing(board,color); return k?isAttackedBy(board,k[0],k[1],color===WHITE?BLACK:WHITE):false; }

function generatePseudoMoves(state, color) {
    const moves=[],{board,castling,enPassant}=state,dir=color===WHITE?-1:1,startRank=color===WHITE?6:1;
    for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
        const piece=board[r][c]; if(!piece||piece.color!==color) continue;
        const add=(tr,tc,special)=>moves.push({from:[r,c],to:[tr,tc],piece:piece.type,special});
        if (piece.type==='p') {
            if (inBounds(r+dir,c)&&!board[r+dir][c]) {
                if ((color===WHITE&&r+dir===0)||(color===BLACK&&r+dir===7)) for (const pr of ['q','r','b','n']) add(r+dir,c,{type:'promotion',promote:pr});
                else { add(r+dir,c); if (r===startRank&&!board[r+2*dir][c]) add(r+2*dir,c,{type:'doublePush'}); }
            }
            for (const dc of [-1,1]) {
                const tr=r+dir,tc=c+dc; if (!inBounds(tr,tc)) continue;
                if (board[tr][tc]&&board[tr][tc].color!==color) { if ((color===WHITE&&tr===0)||(color===BLACK&&tr===7)) for (const pr of ['q','r','b','n']) add(tr,tc,{type:'promotion',promote:pr}); else add(tr,tc); }
                if (enPassant!=='-') { const epCol=enPassant.charCodeAt(0)-97,epRow=8-parseInt(enPassant[1]); if (tr===epRow&&tc===epCol) add(tr,tc,{type:'enPassant'}); }
            }
        } else if (piece.type==='n') {
            for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) { const tr=r+dr,tc=c+dc; if (inBounds(tr,tc)&&(!board[tr][tc]||board[tr][tc].color!==color)) add(tr,tc); }
        } else if (['b','r','q'].includes(piece.type)) {
            const sd=piece.type==='b'?[[-1,-1],[-1,1],[1,-1],[1,1]]:piece.type==='r'?[[-1,0],[1,0],[0,-1],[0,1]]:[[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]];
            for (const [dr,dc] of sd) { for (let i=1;i<8;i++) { const tr=r+dr*i,tc=c+dc*i; if (!inBounds(tr,tc)) break; if (board[tr][tc]) { if (board[tr][tc].color!==color) add(tr,tc); break; } add(tr,tc); } }
        } else if (piece.type==='k') {
            for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++) { if(!dr&&!dc) continue; const tr=r+dr,tc=c+dc; if (inBounds(tr,tc)&&(!board[tr][tc]||board[tr][tc].color!==color)) add(tr,tc); }
            const opp=color===WHITE?BLACK:WHITE,rank=color===WHITE?7:0,kS=color===WHITE?'K':'k',qS=color===WHITE?'Q':'q';
            if (castling.includes(kS)&&!board[rank][5]&&!board[rank][6]&&board[rank][7]?.type==='r'&&board[rank][7]?.color===color) if (!isAttackedBy(board,rank,4,opp)&&!isAttackedBy(board,rank,5,opp)&&!isAttackedBy(board,rank,6,opp)) add(rank,6,{type:'castle',rookFrom:[rank,7],rookTo:[rank,5]});
            if (castling.includes(qS)&&!board[rank][3]&&!board[rank][2]&&!board[rank][1]&&board[rank][0]?.type==='r'&&board[rank][0]?.color===color) if (!isAttackedBy(board,rank,4,opp)&&!isAttackedBy(board,rank,3,opp)&&!isAttackedBy(board,rank,2,opp)) add(rank,2,{type:'castle',rookFrom:[rank,0],rookTo:[rank,3]});
        }
    }
    return moves;
}

function generateLegalMoves(state, color) {
    return generatePseudoMoves(state,color).filter(move => {
        const b=cloneBoard(state.board);
        b[move.to[0]][move.to[1]]=b[move.from[0]][move.from[1]]; b[move.from[0]][move.from[1]]=null;
        if (move.special?.type==='enPassant') b[move.from[0]][move.to[1]]=null;
        if (move.special?.type==='castle') { const {rookFrom,rookTo}=move.special; b[rookTo[0]][rookTo[1]]=b[rookFrom[0]][rookFrom[1]]; b[rookFrom[0]][rookFrom[1]]=null; }
        if (move.special?.type==='promotion') b[move.to[0]][move.to[1]]={type:move.special.promote,color};
        return !isInCheck(b,color);
    });
}

function applyMove(state, move) {
    const nb=cloneBoard(state.board),piece=nb[move.from[0]][move.from[1]],captured=nb[move.to[0]][move.to[1]],color=piece.color;
    nb[move.to[0]][move.to[1]]=piece; nb[move.from[0]][move.from[1]]=null;
    let ep='-',nc=state.castling;
    if (move.special?.type==='doublePush') { const er=move.from[0]+(color===WHITE?-1:1); ep=`${String.fromCharCode(97+move.from[1])}${8-er}`; }
    if (move.special?.type==='enPassant') nb[move.from[0]][move.to[1]]=null;
    if (move.special?.type==='castle') { const {rookFrom,rookTo}=move.special; nb[rookTo[0]][rookTo[1]]=nb[rookFrom[0]][rookFrom[1]]; nb[rookFrom[0]][rookFrom[1]]=null; }
    if (move.special?.type==='promotion') nb[move.to[0]][move.to[1]]={type:move.special.promote,color};
    if (piece.type==='k') nc=color===WHITE?nc.replace(/[KQ]/g,''):nc.replace(/[kq]/g,'');
    if (piece.type==='r') { if (move.from[0]===7&&move.from[1]===7) nc=nc.replace('K',''); if (move.from[0]===7&&move.from[1]===0) nc=nc.replace('Q',''); if (move.from[0]===0&&move.from[1]===7) nc=nc.replace('k',''); if (move.from[0]===0&&move.from[1]===0) nc=nc.replace('q',''); }
    if (captured?.type==='r') { if (move.to[0]===7&&move.to[1]===7) nc=nc.replace('K',''); if (move.to[0]===7&&move.to[1]===0) nc=nc.replace('Q',''); if (move.to[0]===0&&move.to[1]===7) nc=nc.replace('k',''); if (move.to[0]===0&&move.to[1]===0) nc=nc.replace('q',''); }
    if (nc==='') nc='-';
    return { board:nb, turn:color===WHITE?BLACK:WHITE, castling:nc, enPassant:ep, halfMoves:(piece.type==='p'||captured||move.special?.type==='enPassant')?0:state.halfMoves+1, fullMoves:color===BLACK?state.fullMoves+1:state.fullMoves };
}

function getGameResult(state) {
    const legal=generateLegalMoves(state,state.turn);
    if (legal.length===0) return isInCheck(state.board,state.turn)?(state.turn===WHITE?'Black wins by checkmate!':'White wins by checkmate!'):'Draw by stalemate!';
    if (state.halfMoves>=100) return 'Draw by 50-move rule!';
    return null;
}

function moveToAlgebraic(state, move) {
    const files='abcdefgh',ranks='87654321',piece=state.board[move.from[0]][move.from[1]],isCapture=state.board[move.to[0]][move.to[1]]||move.special?.type==='enPassant';
    if (move.special?.type==='castle') return move.to[1]===6?'O-O':'O-O-O';
    let n=''; if (piece.type!=='p') n+=piece.type.toUpperCase(); else if (isCapture) n+=files[move.from[1]];
    if (isCapture) n+='x'; n+=files[move.to[1]]+ranks[move.to[0]];
    if (move.special?.type==='promotion') n+='='+move.special.promote.toUpperCase();
    const ns=applyMove(state,move); if (isInCheck(ns.board,ns.turn)) n+=generateLegalMoves(ns,ns.turn).length>0?'+':'#';
    return n;
}
