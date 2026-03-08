import React, { useState, useEffect, useCallback } from 'react';

const WHITE = 'w';
const BLACK = 'b';

function parseFEN(fen) {
    const parts = fen.split(' ');
    const rows = parts[0].split('/');
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let r = 0; r < 8; r++) {
        let c = 0;
        for (const ch of rows[r]) {
            if (ch >= '1' && ch <= '8') { c += parseInt(ch); }
            else { board[r][c] = { type: ch.toLowerCase(), color: ch === ch.toUpperCase() ? WHITE : BLACK }; c++; }
        }
    }
    return { board, turn: parts[1] || WHITE, castling: parts[2] || 'KQkq', enPassant: parts[3] || '-', halfMoves: parseInt(parts[4]) || 0, fullMoves: parseInt(parts[5]) || 1 };
}

function cloneBoard(board) { return board.map(row => row.map(p => p ? { ...p } : null)); }
function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function findKing(board, color) {
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++)
        if (board[r][c] && board[r][c].type === 'k' && board[r][c].color === color) return [r, c];
    return null;
}

function isAttackedBy(board, row, col, byColor) {
    const pawnDir = byColor === WHITE ? 1 : -1;
    for (const dc of [-1, 1]) {
        const pr = row + pawnDir, pc = col + dc;
        if (inBounds(pr, pc) && board[pr][pc]?.color === byColor && board[pr][pc].type === 'p') return true;
    }
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const nr = row + dr, nc = col + dc;
        if (inBounds(nr, nc) && board[nr][nc]?.color === byColor && board[nr][nc].type === 'n') return true;
    }
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr, nc = col + dc;
        if (inBounds(nr, nc) && board[nr][nc]?.color === byColor && board[nr][nc].type === 'k') return true;
    }
    const dirs = [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]];
    for (let d = 0; d < 8; d++) {
        const [dr, dc] = dirs[d]; const isDiag = d < 4;
        for (let i = 1; i < 8; i++) {
            const nr = row + dr * i, nc = col + dc * i;
            if (!inBounds(nr, nc)) break;
            if (board[nr][nc]) {
                if (board[nr][nc].color === byColor) {
                    const t = board[nr][nc].type;
                    if (t === 'q' || (isDiag && t === 'b') || (!isDiag && t === 'r')) return true;
                }
                break;
            }
        }
    }
    return false;
}

function isInCheck(board, color) {
    const king = findKing(board, color);
    return king ? isAttackedBy(board, king[0], king[1], color === WHITE ? BLACK : WHITE) : false;
}

function generatePseudoMoves(state, color) {
    const moves = [];
    const { board, castling, enPassant } = state;
    const dir = color === WHITE ? -1 : 1;
    const startRank = color === WHITE ? 6 : 1;

    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece || piece.color !== color) continue;
        const add = (tr, tc, special) => moves.push({ from: [r, c], to: [tr, tc], piece: piece.type, special });

        if (piece.type === 'p') {
            if (inBounds(r + dir, c) && !board[r + dir][c]) {
                if ((color === WHITE && r + dir === 0) || (color === BLACK && r + dir === 7))
                    for (const pr of ['q','r','b','n']) add(r + dir, c, { type: 'promotion', promote: pr });
                else {
                    add(r + dir, c);
                    if (r === startRank && !board[r + 2 * dir][c]) add(r + 2 * dir, c, { type: 'doublePush' });
                }
            }
            for (const dc of [-1, 1]) {
                const tr = r + dir, tc = c + dc;
                if (!inBounds(tr, tc)) continue;
                if (board[tr][tc] && board[tr][tc].color !== color) {
                    if ((color === WHITE && tr === 0) || (color === BLACK && tr === 7))
                        for (const pr of ['q','r','b','n']) add(tr, tc, { type: 'promotion', promote: pr });
                    else add(tr, tc);
                }
                if (enPassant !== '-') {
                    const epCol = enPassant.charCodeAt(0) - 97, epRow = 8 - parseInt(enPassant[1]);
                    if (tr === epRow && tc === epCol) add(tr, tc, { type: 'enPassant' });
                }
            }
        } else if (piece.type === 'n') {
            for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
                const tr = r + dr, tc = c + dc;
                if (inBounds(tr, tc) && (!board[tr][tc] || board[tr][tc].color !== color)) add(tr, tc);
            }
        } else if (piece.type === 'b' || piece.type === 'r' || piece.type === 'q') {
            const slideDirs = piece.type === 'b' ? [[-1,-1],[-1,1],[1,-1],[1,1]]
                : piece.type === 'r' ? [[-1,0],[1,0],[0,-1],[0,1]]
                : [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]];
            for (const [dr, dc] of slideDirs) {
                for (let i = 1; i < 8; i++) {
                    const tr = r + dr * i, tc = c + dc * i;
                    if (!inBounds(tr, tc)) break;
                    if (board[tr][tc]) { if (board[tr][tc].color !== color) add(tr, tc); break; }
                    add(tr, tc);
                }
            }
        } else if (piece.type === 'k') {
            for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const tr = r + dr, tc = c + dc;
                if (inBounds(tr, tc) && (!board[tr][tc] || board[tr][tc].color !== color)) add(tr, tc);
            }
            const opp = color === WHITE ? BLACK : WHITE;
            const rank = color === WHITE ? 7 : 0;
            const kSide = color === WHITE ? 'K' : 'k', qSide = color === WHITE ? 'Q' : 'q';
            if (castling.includes(kSide) && !board[rank][5] && !board[rank][6] && board[rank][7]?.type === 'r' && board[rank][7]?.color === color)
                if (!isAttackedBy(board, rank, 4, opp) && !isAttackedBy(board, rank, 5, opp) && !isAttackedBy(board, rank, 6, opp))
                    add(rank, 6, { type: 'castle', rookFrom: [rank, 7], rookTo: [rank, 5] });
            if (castling.includes(qSide) && !board[rank][3] && !board[rank][2] && !board[rank][1] && board[rank][0]?.type === 'r' && board[rank][0]?.color === color)
                if (!isAttackedBy(board, rank, 4, opp) && !isAttackedBy(board, rank, 3, opp) && !isAttackedBy(board, rank, 2, opp))
                    add(rank, 2, { type: 'castle', rookFrom: [rank, 0], rookTo: [rank, 3] });
        }
    }
    return moves;
}

function generateLegalMoves(state, color) {
    return generatePseudoMoves(state, color).filter(move => {
        const b = cloneBoard(state.board);
        b[move.to[0]][move.to[1]] = b[move.from[0]][move.from[1]];
        b[move.from[0]][move.from[1]] = null;
        if (move.special?.type === 'enPassant') b[move.from[0]][move.to[1]] = null;
        if (move.special?.type === 'castle') { const { rookFrom, rookTo } = move.special; b[rookTo[0]][rookTo[1]] = b[rookFrom[0]][rookFrom[1]]; b[rookFrom[0]][rookFrom[1]] = null; }
        if (move.special?.type === 'promotion') b[move.to[0]][move.to[1]] = { type: move.special.promote, color };
        return !isInCheck(b, color);
    });
}

function applyMove(state, move) {
    const newBoard = cloneBoard(state.board);
    const piece = newBoard[move.from[0]][move.from[1]];
    const captured = newBoard[move.to[0]][move.to[1]];
    const color = piece.color;
    newBoard[move.to[0]][move.to[1]] = piece;
    newBoard[move.from[0]][move.from[1]] = null;

    let newEnPassant = '-', newCastling = state.castling;
    if (move.special?.type === 'doublePush') { const epRow = move.from[0] + (color === WHITE ? -1 : 1); newEnPassant = `${String.fromCharCode(97 + move.from[1])}${8 - epRow}`; }
    if (move.special?.type === 'enPassant') newBoard[move.from[0]][move.to[1]] = null;
    if (move.special?.type === 'castle') { const { rookFrom, rookTo } = move.special; newBoard[rookTo[0]][rookTo[1]] = newBoard[rookFrom[0]][rookFrom[1]]; newBoard[rookFrom[0]][rookFrom[1]] = null; }
    if (move.special?.type === 'promotion') newBoard[move.to[0]][move.to[1]] = { type: move.special.promote, color };

    if (piece.type === 'k') newCastling = color === WHITE ? newCastling.replace(/[KQ]/g, '') : newCastling.replace(/[kq]/g, '');
    if (piece.type === 'r') {
        if (move.from[0] === 7 && move.from[1] === 7) newCastling = newCastling.replace('K', '');
        if (move.from[0] === 7 && move.from[1] === 0) newCastling = newCastling.replace('Q', '');
        if (move.from[0] === 0 && move.from[1] === 7) newCastling = newCastling.replace('k', '');
        if (move.from[0] === 0 && move.from[1] === 0) newCastling = newCastling.replace('q', '');
    }
    if (captured?.type === 'r') {
        if (move.to[0] === 7 && move.to[1] === 7) newCastling = newCastling.replace('K', '');
        if (move.to[0] === 7 && move.to[1] === 0) newCastling = newCastling.replace('Q', '');
        if (move.to[0] === 0 && move.to[1] === 7) newCastling = newCastling.replace('k', '');
        if (move.to[0] === 0 && move.to[1] === 0) newCastling = newCastling.replace('q', '');
    }
    if (newCastling === '') newCastling = '-';

    return {
        board: newBoard, turn: color === WHITE ? BLACK : WHITE, castling: newCastling, enPassant: newEnPassant,
        halfMoves: (piece.type === 'p' || captured || move.special?.type === 'enPassant') ? 0 : state.halfMoves + 1,
        fullMoves: color === BLACK ? state.fullMoves + 1 : state.fullMoves,
    };
}

function getGameResult(state) {
    const legal = generateLegalMoves(state, state.turn);
    if (legal.length === 0) return isInCheck(state.board, state.turn) ? (state.turn === WHITE ? 'Black wins by checkmate!' : 'White wins by checkmate!') : 'Draw by stalemate!';
    if (state.halfMoves >= 100) return 'Draw by 50-move rule!';
    return null;
}

function moveToAlgebraic(state, move) {
    const files = 'abcdefgh', ranks = '87654321';
    const piece = state.board[move.from[0]][move.from[1]];
    const isCapture = state.board[move.to[0]][move.to[1]] || move.special?.type === 'enPassant';
    if (move.special?.type === 'castle') return move.to[1] === 6 ? 'O-O' : 'O-O-O';
    let n = '';
    if (piece.type !== 'p') n += piece.type.toUpperCase();
    else if (isCapture) n += files[move.from[1]];
    if (isCapture) n += 'x';
    n += files[move.to[1]] + ranks[move.to[0]];
    if (move.special?.type === 'promotion') n += '=' + move.special.promote.toUpperCase();
    const ns = applyMove(state, move);
    if (isInCheck(ns.board, ns.turn)) n += generateLegalMoves(ns, ns.turn).length > 0 ? '+' : '#';
    return n;
}

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const PIECE_SYMBOLS = { w: { k:'♔', q:'♕', r:'♖', b:'♗', n:'♘', p:'♙' }, b: { k:'♚', q:'♛', r:'♜', b:'♝', n:'♞', p:'♟' } };

const BOARD_THEMES = [
    { id: 'green', name: 'Green', light: '#eeeed2', dark: '#769656', border: '#4a7c34', lastLight: '#f6f669', lastDark: '#baca2b', labelLight: '#769656', labelDark: '#eeeed2', glow: 'rgba(76, 150, 56, 0.4)' },
    { id: 'brown', name: 'Brown', light: '#f0d9b5', dark: '#b58863', border: '#8b5e3c', lastLight: '#cdd16a', lastDark: '#aaa23a', labelLight: '#b58863', labelDark: '#f0d9b5', glow: 'rgba(139, 94, 60, 0.4)' },
    { id: 'blue', name: 'Blue', light: '#dee3e6', dark: '#8ca2ad', border: '#607d8b', lastLight: '#c8d85e', lastDark: '#9aab3a', labelLight: '#8ca2ad', labelDark: '#dee3e6', glow: 'rgba(96, 125, 139, 0.4)' },
    { id: 'purple', name: 'Purple', light: '#e8e0f0', dark: '#9070a0', border: '#6d4c7d', lastLight: '#d0c850', lastDark: '#a09830', labelLight: '#9070a0', labelDark: '#e8e0f0', glow: 'rgba(109, 76, 125, 0.4)' },
    { id: 'tournament', name: 'Tournament', light: '#ececd7', dark: '#4c946a', border: '#2d6b4a', lastLight: '#f5f57a', lastDark: '#a8c840', labelLight: '#4c946a', labelDark: '#ececd7', glow: 'rgba(45, 107, 74, 0.4)' },
    { id: 'wood', name: 'Wood', light: '#e8c99b', dark: '#a47443', border: '#7a5230', lastLight: '#d4c048', lastDark: '#b09828', labelLight: '#a47443', labelDark: '#e8c99b', glow: 'rgba(122, 82, 48, 0.4)' },
    { id: 'marble', name: 'Marble', light: '#f5f5f0', dark: '#8b8b83', border: '#666660', lastLight: '#d8d860', lastDark: '#a0a040', labelLight: '#8b8b83', labelDark: '#f5f5f0', glow: 'rgba(102, 102, 96, 0.4)' },
    { id: 'ice', name: 'Ice', light: '#e0e8ef', dark: '#7b9baf', border: '#5a7a8e', lastLight: '#c0d860', lastDark: '#90a838', labelLight: '#7b9baf', labelDark: '#e0e8ef', glow: 'rgba(90, 122, 142, 0.4)' },
    { id: 'walnut', name: 'Walnut', light: '#dab886', dark: '#a47443', border: '#7a5230', lastLight: '#d0b840', lastDark: '#a89028', labelLight: '#a47443', labelDark: '#dab886', glow: 'rgba(122, 82, 48, 0.4)' },
    { id: 'canvas', name: 'Canvas', light: '#d7b899', dark: '#8b6e4e', border: '#6a5238', lastLight: '#c8b050', lastDark: '#988830', labelLight: '#8b6e4e', labelDark: '#d7b899', glow: 'rgba(106, 82, 56, 0.4)' },
    { id: 'ocean', name: 'Ocean', light: '#d5e5f0', dark: '#5889a8', border: '#3d6680', lastLight: '#b8d058', lastDark: '#88a030', labelLight: '#5889a8', labelDark: '#d5e5f0', glow: 'rgba(61, 102, 128, 0.4)' },
    { id: 'coral', name: 'Coral', light: '#f0e0d8', dark: '#c07860', border: '#9a5840', lastLight: '#d8c050', lastDark: '#b09830', labelLight: '#c07860', labelDark: '#f0e0d8', glow: 'rgba(154, 88, 64, 0.4)' },
];

const ChessApp = () => {
    const [gameState, setGameState] = useState(() => parseFEN(INITIAL_FEN));
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [legalMovesForSelected, setLegalMovesForSelected] = useState([]);
    const [lastMove, setLastMove] = useState(null);
    const [moveHistory, setMoveHistory] = useState([]);
    const [gameResult, setGameResult] = useState(null);
    const [promotionPending, setPromotionPending] = useState(null);
    const [capturedPieces, setCapturedPieces] = useState({ w: [], b: [] });
    const [activeTab, setActiveTab] = useState('play');
    const [currentPuzzle, setCurrentPuzzle] = useState(null);
    const [puzzleStatus, setPuzzleStatus] = useState('idle');
    const [playerUsername, setPlayerUsername] = useState('magnus');
    const [userGames, setUserGames] = useState([]);
    const [loadingGames, setLoadingGames] = useState(false);
    const [playerStats, setPlayerStats] = useState(null);
    const [boardTheme, setBoardTheme] = useState(BOARD_THEMES[0]);
    const [showThemeSelector, setShowThemeSelector] = useState(false);

    const fetchPuzzle = async () => {
        try { setPuzzleStatus('loading'); const r = await fetch('https://lichess.org/api/puzzle/daily?_format=json'); const d = await r.json(); if (d?.puzzle) { setCurrentPuzzle(d.puzzle); setPuzzleStatus('playing'); } } catch { setPuzzleStatus('error'); }
    };

    const fetchUserGames = async (username) => {
        try { setLoadingGames(true); const [g, s] = await Promise.all([fetch(`https://lichess.org/api/games/${username}?max=15`), fetch(`https://lichess.org/api/user/${username}`)]); setUserGames(await g.json() || []); setPlayerStats(await s.json()); } catch (e) { console.error(e); } finally { setLoadingGames(false); }
    };

    const resetGame = () => {
        setGameState(parseFEN(INITIAL_FEN)); setSelectedSquare(null); setLegalMovesForSelected([]); setLastMove(null); setMoveHistory([]); setGameResult(null); setPromotionPending(null); setCapturedPieces({ w: [], b: [] });
    };

    const selectPiece = (row, col) => {
        setSelectedSquare([row, col]);
        setLegalMovesForSelected(generateLegalMoves(gameState, gameState.turn).filter(m => m.from[0] === row && m.from[1] === col));
    };

    const executeMove = (move) => {
        const notation = moveToAlgebraic(gameState, move);
        const captured = gameState.board[move.to[0]][move.to[1]];
        if (captured || move.special?.type === 'enPassant') {
            const cp = captured || gameState.board[move.from[0]][move.to[1]];
            if (cp) setCapturedPieces(prev => ({ ...prev, [cp.color]: [...prev[cp.color], cp.type] }));
        }
        const newState = applyMove(gameState, move);
        setGameState(newState); setSelectedSquare(null); setLegalMovesForSelected([]); setLastMove({ from: move.from, to: move.to }); setMoveHistory(prev => [...prev, notation]); setPromotionPending(null);
        const result = getGameResult(newState);
        if (result) setGameResult(result);
    };

    const handleSquareClick = useCallback((row, col) => {
        if (gameResult || promotionPending) return;
        const piece = gameState.board[row][col];
        if (selectedSquare) {
            if (selectedSquare[0] === row && selectedSquare[1] === col) { setSelectedSquare(null); setLegalMovesForSelected([]); return; }
            const matches = legalMovesForSelected.filter(m => m.to[0] === row && m.to[1] === col);
            if (matches.length > 0) {
                if (matches.length > 1 && matches[0].special?.type === 'promotion') { setPromotionPending({ moves: matches }); return; }
                executeMove(matches[0]); return;
            }
            if (piece && piece.color === gameState.turn) { selectPiece(row, col); return; }
            setSelectedSquare(null); setLegalMovesForSelected([]); return;
        }
        if (piece && piece.color === gameState.turn) selectPiece(row, col);
    }, [gameState, selectedSquare, legalMovesForSelected, gameResult, promotionPending]);

    const handlePromotion = (p) => { if (!promotionPending) return; const m = promotionPending.moves.find(m => m.special.promote === p); if (m) executeMove(m); };
    const isLegalTarget = (r, c) => legalMovesForSelected.some(m => m.to[0] === r && m.to[1] === c);
    const inCheck = isInCheck(gameState.board, gameState.turn);
    const kingPos = findKing(gameState.board, gameState.turn);

    const renderCaptured = (color) => {
        const order = { q: 1, r: 2, b: 3, n: 4, p: 5 };
        const sorted = [...capturedPieces[color]].sort((a, b) => order[a] - order[b]);
        return <div className="flex flex-wrap gap-0.5 min-h-[24px]">{sorted.map((p, i) => <span key={i} className="text-lg">{PIECE_SYMBOLS[color][p]}</span>)}</div>;
    };

    const renderPiece3D = (piece) => {
        const isWhite = piece.color === WHITE;
        const symbol = PIECE_SYMBOLS[piece.color][piece.type];
        const style = isWhite ? {
            color: '#ffffff',
            WebkitTextStroke: '1px #555555',
            textShadow: '0 2px 4px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.3), 1px 1px 0 #cccccc, -1px -1px 0 #e0e0e0, 0 0 10px rgba(255,255,255,0.3)',
            filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.4))',
            transform: 'translateY(-1px)',
        } : {
            color: '#1a1a1a',
            WebkitTextStroke: '1px #000000',
            textShadow: '0 2px 4px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.3), 1px 1px 0 #444444, -1px -1px 0 #333333, 0 0 8px rgba(0,0,0,0.5)',
            filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.5))',
            transform: 'translateY(-1px)',
        };
        return <span className="chess-piece-3d" style={style}>{symbol}</span>;
    };

    const renderBoard = () => {
        const files = ['a','b','c','d','e','f','g','h'];
        const t = boardTheme;
        return (
            <div className="inline-block shadow-2xl rounded-xl overflow-hidden" style={{ border: `8px solid ${t.border}`, boxShadow: `0 0 30px ${t.glow}, 0 10px 40px rgba(0,0,0,0.5)` }}>
                {Array.from({ length: 8 }, (_, r) => (
                    <div key={r} className="flex">
                        {Array.from({ length: 8 }, (_, c) => {
                            const piece = gameState.board[r][c];
                            const isLight = (r + c) % 2 === 0;
                            const isSelected = selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c;
                            const isLegal = isLegalTarget(r, c);
                            const isLastMv = lastMove && ((lastMove.from[0] === r && lastMove.from[1] === c) || (lastMove.to[0] === r && lastMove.to[1] === c));
                            const isKingCheck = inCheck && kingPos && kingPos[0] === r && kingPos[1] === c;
                            let bgColor = isLight ? t.light : t.dark;
                            if (isLastMv) bgColor = isLight ? t.lastLight : t.lastDark;
                            let extra = '';
                            if (isSelected) extra += ' square-selected';
                            if (isLegal && !piece) extra += ' square-legal';
                            if (isLegal && piece) extra += ' square-capture';
                            if (isKingCheck) extra += ' square-check';
                            return (
                                <div key={`${r}-${c}`} className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-4xl sm:text-5xl font-bold cursor-pointer select-none relative${extra}`} style={{ backgroundColor: bgColor }} onClick={() => handleSquareClick(r, c)}>
                                    {piece && renderPiece3D(piece)}
                                    {r === 7 && <span className="absolute bottom-0.5 right-1 text-xs font-semibold" style={{ color: isLight ? t.labelLight : t.labelDark }}>{files[c]}</span>}
                                    {c === 0 && <span className="absolute top-0.5 left-1 text-xs font-semibold" style={{ color: isLight ? t.labelLight : t.labelDark }}>{8 - r}</span>}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        );
    };

    const renderThemeSelector = () => (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-amber-400 font-semibold">Board Style</h3>
                <button onClick={() => setShowThemeSelector(!showThemeSelector)} className="text-xs text-slate-400 hover:text-slate-300 transition-colors">
                    {showThemeSelector ? 'Hide' : 'Show All'}
                </button>
            </div>
            <div className={`grid ${showThemeSelector ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-4'} gap-2`}>
                {(showThemeSelector ? BOARD_THEMES : BOARD_THEMES.slice(0, 4)).map(theme => (
                    <button key={theme.id} onClick={() => setBoardTheme(theme)} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${boardTheme.id === theme.id ? 'ring-2 ring-amber-400 bg-slate-700' : 'hover:bg-slate-700/50'}`}>
                        <div className="w-8 h-8 rounded overflow-hidden flex flex-wrap border border-slate-600">
                            <div style={{ width: '50%', height: '50%', backgroundColor: theme.light }} />
                            <div style={{ width: '50%', height: '50%', backgroundColor: theme.dark }} />
                            <div style={{ width: '50%', height: '50%', backgroundColor: theme.dark }} />
                            <div style={{ width: '50%', height: '50%', backgroundColor: theme.light }} />
                        </div>
                        <span className="text-xs text-slate-300">{theme.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderMoveHistory = () => {
        const pairs = [];
        for (let i = 0; i < moveHistory.length; i += 2) pairs.push({ num: Math.floor(i / 2) + 1, w: moveHistory[i], b: moveHistory[i + 1] || '' });
        return (
            <div className="max-h-64 overflow-y-auto space-y-1 text-sm font-mono">
                {pairs.length === 0 ? <p className="text-slate-500 text-center italic">Make a move to start...</p>
                    : pairs.map(p => <div key={p.num} className="flex gap-2 text-slate-300"><span className="text-slate-500 w-8">{p.num}.</span><span className="w-16">{p.w}</span><span className="w-16">{p.b}</span></div>)}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="text-4xl float-animate">♛</div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">ChessGPT Elite</h1>
                    </div>
                </div>

                <div className="flex gap-4 mb-6 border-b border-slate-700">
                    <button onClick={() => setActiveTab('play')} className={`pb-3 font-semibold transition-colors ${activeTab === 'play' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-300'}`}>♟ Play Chess</button>
                    <button onClick={() => { setActiveTab('puzzles'); if (!currentPuzzle) fetchPuzzle(); }} className={`pb-3 font-semibold transition-colors ${activeTab === 'puzzles' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-300'}`}>🧩 Daily Puzzles</button>
                    <button onClick={() => setActiveTab('games')} className={`pb-3 font-semibold transition-colors ${activeTab === 'games' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-300'}`}>🎮 Player Games</button>
                </div>

                {activeTab === 'play' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl p-4 sm:p-8 border border-slate-700/50">
                            <div className="flex flex-col items-center">
                                <div className="w-full flex items-center justify-between mb-3 px-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-gray-900 border border-gray-600" />
                                        <span className={`font-semibold ${gameState.turn === BLACK && !gameResult ? 'text-amber-400' : 'text-slate-400'}`}>Black</span>
                                    </div>
                                    {renderCaptured('w')}
                                </div>
                                {renderBoard()}
                                <div className="w-full flex items-center justify-between mt-3 px-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-white border border-gray-300" />
                                        <span className={`font-semibold ${gameState.turn === WHITE && !gameResult ? 'text-amber-400' : 'text-slate-400'}`}>White</span>
                                    </div>
                                    {renderCaptured('b')}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {renderThemeSelector()}
                            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 font-semibold">Turn</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full border ${gameState.turn === WHITE ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-600'}`} />
                                        <span className="text-lg font-bold text-white">{gameState.turn === WHITE ? 'White' : 'Black'}</span>
                                    </div>
                                </div>
                                {inCheck && !gameResult && <div className="mt-2 text-red-400 font-semibold text-center animate-pulse">⚠ CHECK!</div>}
                            </div>
                            {gameResult && (
                                <div className="bg-gradient-to-r from-amber-900/50 to-amber-800/50 rounded-xl p-4 border border-amber-500/50 text-center">
                                    <p className="text-amber-300 text-xl font-bold">🏆 Game Over</p>
                                    <p className="text-amber-100 mt-1">{gameResult}</p>
                                </div>
                            )}
                            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
                                <h3 className="text-amber-400 font-semibold mb-2">Captured</h3>
                                <div className="space-y-2">
                                    <div><span className="text-xs text-slate-500">By White: </span>{renderCaptured('b')}</div>
                                    <div><span className="text-xs text-slate-500">By Black: </span>{renderCaptured('w')}</div>
                                </div>
                            </div>
                            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
                                <h3 className="text-amber-400 font-semibold mb-3">Moves</h3>
                                {renderMoveHistory()}
                            </div>
                            <button onClick={resetGame} className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors">🔄 New Game</button>
                        </div>
                    </div>
                )}

                {activeTab === 'puzzles' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl p-8 border border-slate-700/50">
                            {puzzleStatus === 'loading' ? (
                                <div className="flex items-center justify-center h-96"><div className="text-center"><div className="text-6xl mb-4 animate-pulse">♘</div><p className="text-slate-400">Loading puzzle...</p></div></div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="mb-6">{renderBoard()}</div>
                                    {currentPuzzle && <div className="w-full mt-6 p-4 bg-slate-800 rounded-lg border border-amber-500/30"><p className="text-amber-400 font-semibold">Theme: {currentPuzzle.theme}</p><p className="text-slate-300 text-sm mt-2">Rating: {currentPuzzle.rating}</p></div>}
                                </div>
                            )}
                        </div>
                        <div className="space-y-6"><button onClick={fetchPuzzle} className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:shadow-lg font-semibold">🔄 New Puzzle</button></div>
                    </div>
                )}

                {activeTab === 'games' && (
                    <div>
                        <div className="mb-8 bg-slate-900/80 rounded-2xl p-8 border border-slate-700/50">
                            <h2 className="text-2xl font-bold text-amber-400 mb-6">👤 Player Analysis</h2>
                            <div className="flex gap-3 flex-wrap mb-6">
                                <input type="text" value={playerUsername} onChange={(e) => setPlayerUsername(e.target.value)} placeholder="Enter username" className="flex-1 min-w-64 px-4 py-3 bg-slate-800 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none" />
                                <button onClick={() => fetchUserGames(playerUsername)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:shadow-lg font-semibold" disabled={loadingGames}>{loadingGames ? 'Loading...' : 'Search'}</button>
                            </div>
                            <div className="flex gap-2 flex-wrap">{['magnus','hikaru','fabiano','alireza2003','penguingim1'].map(p => <button key={p} onClick={() => { setPlayerUsername(p); setTimeout(() => fetchUserGames(p), 100); }} className="px-3 py-1 text-sm bg-slate-800 text-amber-400 rounded hover:bg-slate-700">{p}</button>)}</div>
                        </div>
                        {playerStats && (
                            <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-blue-900 rounded-2xl p-6"><p className="text-blue-300 text-sm font-semibold mb-2">Player</p><p className="text-2xl font-bold text-blue-100">{playerStats.username}</p></div>
                                <div className="bg-purple-900 rounded-2xl p-6"><p className="text-purple-300 text-sm font-semibold mb-2">Blitz</p><p className="text-2xl font-bold text-purple-100">{playerStats.perfs?.blitz?.rating || 'N/A'}</p></div>
                                <div className="bg-pink-900 rounded-2xl p-6"><p className="text-pink-300 text-sm font-semibold mb-2">Rapid</p><p className="text-2xl font-bold text-pink-100">{playerStats.perfs?.rapid?.rating || 'N/A'}</p></div>
                                <div className="bg-green-900 rounded-2xl p-6"><p className="text-green-300 text-sm font-semibold mb-2">Classical</p><p className="text-2xl font-bold text-green-100">{playerStats.perfs?.classical?.rating || 'N/A'}</p></div>
                            </div>
                        )}
                        {userGames.length > 0 && (
                            <div className="space-y-4">
                                {userGames.slice(0, 10).map((game, idx) => (
                                    <div key={game.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                                        <div className="flex justify-between items-start">
                                            <div><p className="font-semibold text-white mb-2">Game #{idx + 1}</p><p className="text-slate-300">{game.players.white.name} vs {game.players.black.name}</p></div>
                                            <span className={`px-4 py-2 rounded font-bold ${game.winner === 'white' ? 'bg-amber-900/40 text-amber-300' : game.winner === 'black' ? 'bg-blue-900/40 text-blue-300' : 'bg-gray-700/40'}`}>{game.winner?.toUpperCase() || 'DRAW'}</span>
                                        </div>
                                        <p className="text-slate-400 text-sm mt-3">⚡ {game.speed} • 📖 {game.opening?.name || 'Unknown'}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {promotionPending && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-2xl p-6 border border-amber-500/50">
                        <p className="text-amber-400 text-lg font-semibold mb-4 text-center">Promote Pawn To:</p>
                        <div className="flex gap-3">
                            {['q','r','b','n'].map(p => <button key={p} onClick={() => handlePromotion(p)} className="w-16 h-16 text-4xl bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center border border-slate-500 transition-colors">{renderPiece3D({ color: gameState.turn, type: p })}</button>)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChessApp;
