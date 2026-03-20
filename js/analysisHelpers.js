/* ═══════════════════════════════════════════
   analysisHelpers.js — Analysis Utilities
   stateToFEN + display helpers for engine data
═══════════════════════════════════════════ */

/* ─── State → FEN ───────────────────────────
   Converts the engine.js board state object back
   to a standard FEN string for chess-api.com.
   Ignores _selected and any extra UI state.
──────────────────────────────────────────── */
function stateToFEN(state) {
    if (!state || !state.board) return '';
    const { board, turn, castling, enPassant, halfMoves, fullMoves } = state;

    const rows = [];
    for (let r = 0; r < 8; r++) {
        let row = '', empty = 0;
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (!p) {
                empty++;
            } else {
                if (empty) { row += empty; empty = 0; }
                // White pieces → uppercase, Black → lowercase
                row += p.color === 'w' ? p.type.toUpperCase() : p.type;
            }
        }
        if (empty) row += empty;
        rows.push(row);
    }

    const c = castling || '-';
    const ep = enPassant || '-';
    return `${rows.join('/')} ${turn} ${c} ${ep} ${halfMoves || 0} ${fullMoves || 1}`;
}

/* ─── Display Helpers ─────────────────────── */
const AnalysisHelpers = {

    /* Format evaluation score: +1.50  /  -0.25  /  M4  /  — */
    formatEval(evalScore, mate) {
        if (mate != null) return (mate > 0 ? '+' : '') + 'M' + Math.abs(mate);
        if (evalScore == null) return '—';
        return (evalScore >= 0 ? '+' : '') + evalScore.toFixed(2);
    },

    /* Convert eval + winChance → white bar percentage (5–95) */
    evalToBarPercent(evalScore, winChance) {
        if (winChance != null) return Math.max(5, Math.min(95, winChance));
        if (evalScore == null) return 50;
        // Smooth sigmoid: ±4 pawns ≈ 75/25 split
        const pct = 50 + (Math.atan(evalScore / 3) / Math.PI) * 100;
        return Math.max(5, Math.min(95, pct));
    },

    /* CSS colour for the eval number text */
    evalColor(evalScore) {
        if (evalScore == null) return '#94a3b8';
        if (evalScore >  0.3) return '#86efac'; // green  — white advantage
        if (evalScore < -0.3) return '#fca5a5'; // red    — black advantage
        return '#94a3b8';                        // neutral
    },

    /* Human-readable move quality given the eval drop */
    moveQuality(evalDiff) {
        if (evalDiff == null) return null;
        if (evalDiff >= -0.1) return { label: 'Best',        color: '#86efac', symbol: '✓'  };
        if (evalDiff >= -0.5) return { label: 'Good',        color: '#a3e635', symbol: '!'  };
        if (evalDiff >= -1.5) return { label: 'Inaccuracy',  color: '#fbbf24', symbol: '?!' };
        if (evalDiff >= -3.0) return { label: 'Mistake',     color: '#fb923c', symbol: '?'  };
        return                       { label: 'Blunder',     color: '#f87171', symbol: '??' };
    },

    /* Quick FEN validity check (structural only) */
    isValidFEN(fen) {
        if (!fen || typeof fen !== 'string') return false;
        const parts = fen.trim().split(/\s+/);
        if (parts.length < 2) return false;
        return parts[0].split('/').length === 8;
    },

    /* Trim & join continuation array for display */
    formatContinuation(arr, max = 6) {
        if (!arr || !arr.length) return '';
        return arr.slice(0, max).join(' ');
    },

    /* Active side label from a FEN string */
    sideFromFEN(fen) {
        if (!fen) return null;
        return fen.split(' ')[1] === 'b' ? 'Black' : 'White';
    }
};
