/* ═══════════════════════════════════════════
   chessAnalyzer.js — Chess Engine API
   chess-api.com (Stockfish 18) integration
   POST + WebSocket, caching, event system
═══════════════════════════════════════════ */

class ChessEngineAnalyzer {
    constructor() {
        this._cache    = new Map();       // FEN-keyed result cache
        this._ws       = null;            // Active WebSocket
        this._pending  = [];              // Requests queued before WS opens
        this._listeners = { progress: [], complete: [], info: [], error: [] };
    }

    /* ─── POST: Single Analysis ─── */
    async analyzeFEN(fen, options = {}) {
        const { variants = 1, depth = 16, maxThinkingTime = 50 } = options;
        if (!fen || typeof fen !== 'string') throw new Error('Invalid FEN string');

        const key = `${fen}|${variants}|${depth}`;
        if (this._cache.has(key)) return this._cache.get(key);

        const ctrl = new AbortController();
        const tid  = setTimeout(() => ctrl.abort(), 15000);

        try {
            const resp = await fetch('https://chess-api.com/v1', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ fen, variants, depth, maxThinkingTime }),
                signal:  ctrl.signal
            });
            clearTimeout(tid);
            if (!resp.ok) throw new Error('API error ' + resp.status);

            const data = await resp.json();

            // Store in cache; evict oldest entry when limit reached
            this._cache.set(key, data);
            if (this._cache.size > 150) {
                this._cache.delete(this._cache.keys().next().value);
            }
            return data;
        } catch (err) {
            clearTimeout(tid);
            if (err.name === 'AbortError') throw new Error('Analysis request timed out');
            throw err;
        }
    }

    /* ─── WebSocket: Progressive Analysis ─── */
    connectWebSocket() {
        return new Promise((resolve, reject) => {
            if (this._ws && this._ws.readyState === WebSocket.OPEN) {
                resolve(this._ws); return;
            }
            if (this._ws) this._ws.close();

            const ws  = new WebSocket('wss://chess-api.com/v1');
            const tid = setTimeout(() => { ws.close(); reject(new Error('WebSocket timed out')); }, 10000);

            ws.onopen = () => {
                clearTimeout(tid);
                this._ws = ws;
                for (const req of this._pending) ws.send(JSON.stringify(req));
                this._pending = [];
                resolve(ws);
            };

            ws.onmessage = ({ data }) => {
                try {
                    const msg = JSON.parse(data);
                    if (msg.type === 'bestmove') this._emit('complete', msg);
                    else                         this._emit('progress', msg);
                    this._emit('info', msg);
                } catch (_) {}
            };

            ws.onerror = () => {
                clearTimeout(tid);
                this._ws = null;
                const e = new Error('WebSocket connection failed');
                this._emit('error', { message: e.message });
                reject(e);
            };

            ws.onclose = () => { this._ws = null; };
        });
    }

    /* Send a request through the WebSocket (opens connection if needed) */
    sendAnalysisRequest(fen, options = {}) {
        const { variants = 1, depth = 16, maxThinkingTime = 50 } = options;
        const req = { fen, variants, depth, maxThinkingTime };

        if (this._ws && this._ws.readyState === WebSocket.OPEN) {
            this._ws.send(JSON.stringify(req));
        } else {
            this._pending.push(req);
            this.connectWebSocket().catch(err => this._emit('error', { message: err.message }));
        }
    }

    /* ─── Puzzle Move Analysis ─── */
    async analyzePuzzle(fen, userMove, depth = 18) {
        const result = await this.analyzeFEN(fen, { depth, maxThinkingTime: 100 });
        const bestMove = (result.move || '').toLowerCase();
        const isCorrect = !!(userMove && bestMove && userMove.toLowerCase() === bestMove);
        const evalStr  = result.eval != null
            ? (result.eval >= 0 ? '+' : '') + result.eval.toFixed(2)
            : '—';

        return {
            userMove,
            bestMove:    result.move,
            bestMoveSan: result.san,
            isCorrect,
            explanation: isCorrect
                ? `Best move! ${result.san || result.move} is the engine's top choice (${evalStr}).`
                : `Best was ${result.san || result.move}. Engine eval: ${evalStr}.`,
            engineEval:    result.eval,
            winChance:     result.winChance,
            depth:         result.depth,
            continuation:  (result.continuationArr || []).slice(0, 5).join(' ')
        };
    }

    /* ─── Rank Multiple Moves ─── */
    async analyzeMoves(fen, moves, depth = 16) {
        const variants = Math.min(moves.length || 3, 5);
        const result   = await this.analyzeFEN(fen, { variants, depth, maxThinkingTime: 100 });
        const arr      = Array.isArray(result) ? result : [result];
        return arr.map((r, i) => ({
            rank: i + 1,
            move: r.move, san: r.san,
            eval: r.eval, winChance: r.winChance,
            from: r.from, to: r.to,
            continuationArr: r.continuationArr || []
        }));
    }

    /* ─── Evaluation Bar Data ─── */
    async getEvaluationBar(fen, depth = 16) {
        const result = await this.analyzeFEN(fen, { depth, maxThinkingTime: 50 });
        return { eval: result.eval, winChance: result.winChance, mate: result.mate || null, depth: result.depth };
    }

    /* ─── Event System ─── */
    on(event, cb)  { if (this._listeners[event]) this._listeners[event].push(cb); return this; }
    off(event, cb) { if (this._listeners[event]) this._listeners[event] = this._listeners[event].filter(f => f !== cb); return this; }
    _emit(event, data) { (this._listeners[event] || []).forEach(cb => { try { cb(data); } catch (_) {} }); }

    disconnect() { if (this._ws) { this._ws.close(); this._ws = null; } }
    clearCache()  { this._cache.clear(); }
}

/* Global singleton — import once, use everywhere */
const chessAnalyzer = new ChessEngineAnalyzer();
