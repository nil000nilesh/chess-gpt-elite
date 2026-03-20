/* ═══════════════════════════════════════════
   app.js — React Components + Lichess API
   UI, tabs, board rendering, API calls sab yahan
   Lichess API → yahan
   New feature add karna → yahan
═══════════════════════════════════════════ */

const { useState, useEffect, useCallback, useRef, useMemo } = React;

/* ══════════════════════════════════
   ADMIN CONFIG
══════════════════════════════════ */
const ADMIN_EMAIL = 'nil000nilesh@gmail.com';

/* ══════════════════════════════════
   ACCESS DENIED PAGE
══════════════════════════════════ */
const AccessDenied = ({ user }) => (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:'radial-gradient(ellipse at top,#0f172a 0%,#020617 70%)'}}>
        <div className="w-full max-w-sm text-center fade-in">
            <div className="rounded-3xl p-8 border" style={{background:'rgba(15,23,42,0.92)',borderColor:'rgba(239,68,68,0.25)',boxShadow:'0 0 60px rgba(239,68,68,0.08),0 25px 60px rgba(0,0,0,0.6)'}}>
                <div className="text-6xl mb-4">🔒</div>
                <h1 className="chess-title text-2xl font-bold mb-2" style={{color:'#f87171'}}>Access Denied</h1>
                <p className="text-slate-400 text-sm mb-2">Aapka account abhi approved nahi hai.</p>
                <p className="text-slate-500 text-xs mb-6">Admin se contact karo access ke liye.</p>
                <div className="rounded-xl p-3 mb-6 text-xs text-slate-400 font-mono" style={{background:'rgba(30,41,59,0.8)'}}>
                    {user.email}
                </div>
                <button onClick={()=>auth.signOut()}
                    className="w-full py-3 rounded-xl font-semibold text-sm border border-red-700/40 text-red-400 hover:bg-red-800/20 transition-colors">
                    🚪 Sign Out
                </button>
            </div>
        </div>
    </div>
);

/* ══════════════════════════════════
   USERS TAB — Admin Only
══════════════════════════════════ */
const UsersTab = () => {
    const [allowedEmails, setAllowedEmails] = useState([]);
    const [newEmail,  setNewEmail]  = useState('');
    const [loading,   setLoading]   = useState(true);
    const [saving,    setSaving]    = useState(false);
    const [msg,       setMsg]       = useState('');
    const [confirmDel,setConfirmDel]= useState(null);

    const flash = (m) => { setMsg(m); setTimeout(()=>setMsg(''), 3500); };

    const loadList = async () => {
        setLoading(true);
        try {
            const doc = await db.collection('admin').doc('access').get();
            setAllowedEmails(doc.exists ? (doc.data().allowedEmails || []) : []);
        } catch(e) { flash('❌ Load failed: ' + e.message); }
        setLoading(false);
    };

    useEffect(() => { loadList(); }, []);

    const persist = async (list) => {
        setSaving(true);
        try {
            await db.collection('admin').doc('access').set({ allowedEmails: list });
            setAllowedEmails(list);
        } catch(e) { flash('❌ Save failed: ' + e.message); }
        setSaving(false);
    };

    const addUser = async () => {
        const email = newEmail.trim().toLowerCase();
        if (!email.includes('@')) { flash('⚠ Valid email daalo'); return; }
        if (allowedEmails.includes(email)) { flash('⚠ ' + email + ' pehle se hai'); return; }
        await persist([...allowedEmails, email]);
        setNewEmail('');
        flash('✅ ' + email + ' add ho gaya');
    };

    const removeUser = async (email) => {
        await persist(allowedEmails.filter(e => e !== email));
        setConfirmDel(null);
        flash('🗑 ' + email + ' remove ho gaya');
    };

    return (
        <div className="max-w-2xl mx-auto space-y-5 fade-in py-4">
            <div className="rounded-2xl p-5 border border-amber-500/30 bg-amber-900/10">
                <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl">👑</span>
                    <div>
                        <h2 className="text-amber-400 font-bold text-lg">User Access Management</h2>
                        <p className="text-slate-500 text-xs">Sirf admin ko yeh tab dikh raha hai</p>
                    </div>
                </div>
            </div>
            {msg && <div className="p-3 rounded-xl text-sm font-medium text-center bg-slate-800 text-white border border-slate-700">{msg}</div>}
            <div className="rounded-2xl p-5 border border-slate-700/50 bg-slate-800/80">
                <h3 className="text-white font-semibold mb-3 text-sm">➕ Naya User Add Karo</h3>
                <div className="flex gap-2">
                    <input value={newEmail} onChange={e => setNewEmail(e.target.value)} onKeyDown={e => e.key==='Enter' && addUser()} placeholder="user@gmail.com" className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl border border-slate-600 focus:border-amber-500 focus:outline-none text-sm" />
                    <button onClick={addUser} disabled={saving} className="px-5 py-3 rounded-xl font-semibold text-sm text-white bg-amber-600 hover:bg-amber-500 transition-all">{saving ? '…' : 'Add'}</button>
                </div>
            </div>
            <div className="rounded-2xl p-5 border border-slate-700/50 bg-slate-800/80">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold text-sm">👥 Allowed Users ({allowedEmails.length})</h3>
                    <button onClick={loadList} className="text-slate-400 hover:text-white text-xs">🔄 Refresh</button>
                </div>
                {loading ? <p className="text-slate-400 text-sm text-center">Loading...</p> : (
                    <div className="space-y-2">
                        {allowedEmails.map(email => (
                            <div key={email} className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-700 bg-slate-800">
                                <p className="text-slate-200 text-sm truncate">{email} {email === ADMIN_EMAIL && <span className="text-xs text-amber-400 font-medium ml-2">👑 Admin</span>}</p>
                                {email !== ADMIN_EMAIL && (
                                    confirmDel === email ? (
                                        <div className="flex gap-2">
                                            <button onClick={()=>removeUser(email)} className="px-3 py-1 text-xs bg-red-700 text-white rounded">Yes</button>
                                            <button onClick={()=>setConfirmDel(null)} className="px-3 py-1 text-xs bg-slate-600 text-white rounded">Cancel</button>
                                        </div>
                                    ) : <button onClick={()=>setConfirmDel(email)} className="text-slate-400 hover:text-red-400 text-xs px-2">🗑 Remove</button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

/* ══════════════════════════════════
   LOGIN PAGE
══════════════════════════════════ */
const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const signInWithGoogle = async () => {
        setLoading(true); setErr('');
        try { await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); }
        catch { setErr('Sign-in failed. Please try again.'); setLoading(false); }
    };
    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
            <div className="relative z-10 w-full max-w-sm fade-in">
                <div className="rounded-3xl p-8 border border-slate-800 bg-slate-900/90 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="text-7xl float-animate mb-3">♛</div>
                        <h1 className="chess-title text-3xl font-bold mb-1 text-amber-400">ChessGPT Elite</h1>
                        <p className="text-slate-500 text-xs tracking-wider uppercase">AI-Powered Chess Training</p>
                    </div>
                    <button onClick={signInWithGoogle} disabled={loading} className="w-full py-3.5 rounded-xl font-semibold text-sm bg-white text-slate-800 hover:bg-gray-100 transition-all">
                        {loading ? 'Signing in…' : 'Continue with Google'}
                    </button>
                    {err && <p className="text-red-400 text-xs text-center mt-3">{err}</p>}
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════
   SETTINGS TAB
══════════════════════════════════ */
const SettingsTab = ({ user }) => {
    const [lichessToken,setLichessToken]=useState('');
    const [openaiKey,setOpenaiKey]=useState('');
    const [saving,setSaving]=useState(false);
    const [saved,setSaved]=useState(false);
    const [loadingK,setLoadingK]=useState(true);
    useEffect(()=>{
        db.collection('users').doc(user.uid).collection('settings').doc('apiKeys').get()
            .then(doc=>{ if(doc.exists){const d=doc.data();setLichessToken(d.lichessToken||'');setOpenaiKey(d.openaiKey||'');} })
            .catch(()=>{}).finally(()=>setLoadingK(false));
    },[user.uid]);
    const saveKeys = async () => {
        setSaving(true);
        try {
            await db.collection('users').doc(user.uid).collection('settings').doc('apiKeys').set({lichessToken,openaiKey});
            setSaved(true);setTimeout(()=>setSaved(false),3500);
        } catch(e){}
        setSaving(false);
    };
    return (
        <div className="max-w-xl mx-auto space-y-5 fade-in py-4">
            <div className="rounded-2xl p-5 border border-slate-700/50 bg-slate-800/80">
                <h3 className="text-amber-400 font-semibold mb-4 flex items-center gap-2">🔑 API Keys</h3>
                {loadingK?<p className="text-slate-400 text-center py-6 text-sm">Loading keys…</p>:(
                    <div className="space-y-4">
                        <div>
                            <label className="text-slate-300 text-sm font-medium mb-1 block">Lichess API Token</label>
                            <input type="password" value={lichessToken} onChange={e=>setLichessToken(e.target.value)} className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg border border-slate-600 focus:border-amber-500" />
                        </div>
                        <div>
                            <label className="text-slate-300 text-sm font-medium mb-1 block">OpenAI API Key</label>
                            <input type="password" value={openaiKey} onChange={e=>setOpenaiKey(e.target.value)} className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg border border-slate-600 focus:border-amber-500" />
                        </div>
                        <button onClick={saveKeys} disabled={saving} className="w-full py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-500">
                            {saving?'Saving…':saved?'✅ Saved Successfully!':'Save Keys'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ══════════════════════════════════
   STYLE PANEL
══════════════════════════════════ */
const StylePanel = ({ boardTheme, setBoardTheme, pieceSet, setPieceSet }) => {
    return (
        <div className="rounded-xl border border-slate-700/50 overflow-hidden bg-slate-800/80 p-4">
            <p className="text-amber-400 font-semibold text-sm mb-3">🎨 Quick Style</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
                {BOARD_THEMES.slice(0,6).map(t=>(
                    <button key={t.id} onClick={()=>setBoardTheme(t)} title={t.name} className={`shrink-0 flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${boardTheme.id===t.id?'ring-2 ring-amber-400 bg-slate-700':'hover:bg-slate-700/50'}`}>
                        <div className="theme-preview border border-slate-600/50"><div style={{backgroundColor:t.light}} /><div style={{backgroundColor:t.dark}} /><div style={{backgroundColor:t.dark}} /><div style={{backgroundColor:t.light}} /></div>
                    </button>
                ))}
            </div>
        </div>
    );
};

/* ══════════════════════════════════
   useChessAnalysis — Custom Hook
   Manages a single analysis request
   via the global chessAnalyzer instance
══════════════════════════════════ */
const useChessAnalysis = (options = {}) => {
    const [analysis, setAnalysis] = useState(null);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState(null);

    const analyze = useCallback(async (fen, opts = {}) => {
        if (!fen || !AnalysisHelpers.isValidFEN(fen)) return;
        setLoading(true);
        setError(null);
        try {
            const merged = Object.assign({ depth: 16, maxThinkingTime: 50 }, options, opts);
            const result = await chessAnalyzer.analyzeFEN(fen, merged);
            setAnalysis(result);
        } catch (e) {
            setError(e.message);
        }
        setLoading(false);
    }, []);

    const reset = useCallback(() => { setAnalysis(null); setError(null); }, []);

    return { analysis, loading, error, analyze, reset };
};

/* ══════════════════════════════════
   PuzzleAnalysisPanel
   Lichess-style engine analysis panel:
   eval bar · best move · continuation
   top moves · puzzle feedback display
══════════════════════════════════ */
const PuzzleAnalysisPanel = ({ fen, puzzleStatus, puzzleFeedback, onPlayMove }) => {
    const [analysis,  setAnalysis]  = useState(null);
    const [topMoves,  setTopMoves]  = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (!fen || !AnalysisHelpers.isValidFEN(fen)) return;
        if (puzzleStatus === 'idle' || puzzleStatus === 'loading' || puzzleStatus === 'error') return;

        // Debounce 600 ms to avoid hammering API on rapid state changes
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                // variants=3 → ask for top-3 candidate moves
                const result = await chessAnalyzer.analyzeFEN(fen, { variants: 3, depth: 16, maxThinkingTime: 50 });
                if (Array.isArray(result)) {
                    setAnalysis(result[0]);
                    setTopMoves(result);
                } else {
                    setAnalysis(result);
                    setTopMoves([result]);
                }
            } catch (e) {
                setError('Engine unavailable: ' + e.message);
            }
            setLoading(false);
        }, 600);

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [fen, puzzleStatus]);

    if (puzzleStatus === 'idle' || puzzleStatus === 'error') return null;

    const barPct      = analysis ? AnalysisHelpers.evalToBarPercent(analysis.eval, analysis.winChance) : 50;
    const evalText    = analysis ? AnalysisHelpers.formatEval(analysis.eval, analysis.mate) : '—';
    const evalColor   = analysis ? AnalysisHelpers.evalColor(analysis.eval) : '#94a3b8';
    const continuation = analysis ? AnalysisHelpers.formatContinuation(analysis.continuationArr) : '';

    return (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/80 overflow-hidden">

            {/* Header */}
            <div className="px-3 py-2 bg-[#302e2b] border-b border-slate-700 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">⚡ Engine Analysis</span>
                <span className="text-xs text-slate-500">
                    {loading ? <span className="animate-pulse text-amber-500/70">Analyzing…</span>
                             : analysis ? `Depth ${analysis.depth || 16}` : ''}
                </span>
            </div>

            <div className="p-3 space-y-3">

                {/* ── Eval Bar ── */}
                <div>
                    <div className="flex justify-between text-xs mb-1.5 font-semibold">
                        <span className="text-slate-200">White</span>
                        <span className="font-mono" style={{ color: evalColor }}>{evalText}</span>
                        <span className="text-slate-400">Black</span>
                    </div>
                    <div className="w-full h-4 rounded overflow-hidden flex" style={{ background: '#1e1e1e' }}>
                        {loading && !analysis ? (
                            <div className="w-full h-full bg-slate-700 animate-pulse rounded" />
                        ) : (
                            <>
                                <div className="h-full bg-white transition-all duration-500" style={{ width: `${barPct}%` }} />
                                <div className="h-full bg-[#1a1a1a] transition-all duration-500" style={{ width: `${100 - barPct}%` }} />
                            </>
                        )}
                    </div>
                    {analysis?.winChance != null && (
                        <div className="flex justify-between text-xs mt-1 text-slate-500 font-mono">
                            <span>{Math.round(barPct)}%</span>
                            <span>{Math.round(100 - barPct)}%</span>
                        </div>
                    )}
                </div>

                {/* ── Best Move ── */}
                {(analysis?.san || analysis?.move) && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-700/60 border border-slate-600/40">
                        <div>
                            <span className="text-xs text-slate-400 block mb-0.5">Best Move</span>
                            <span className="font-mono font-bold text-amber-300 text-sm">{analysis.san || analysis.move}</span>
                        </div>
                        {onPlayMove && (
                            <button
                                onClick={() => onPlayMove(analysis.move)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-600 active:bg-green-800 text-white rounded-lg text-xs font-bold transition-all shadow shadow-green-900/40"
                                title="Play this move on the board"
                            >
                                ▶ Play
                            </button>
                        )}
                    </div>
                )}

                {/* ── Continuation Line ── */}
                {analysis?.continuationArr?.length > 0 && (
                    <div className="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/30">
                        <p className="text-xs text-slate-500 mb-2">Continuation</p>
                        <div className="flex flex-wrap gap-1">
                            {analysis.continuationArr.slice(0, 6).map((uci, i) => (
                                <button
                                    key={i}
                                    onClick={() => onPlayMove && onPlayMove(uci)}
                                    disabled={!onPlayMove}
                                    className={`px-1.5 py-0.5 rounded text-xs font-mono transition-all ${
                                        onPlayMove
                                            ? 'bg-slate-700 hover:bg-blue-700 hover:text-white text-slate-300 cursor-pointer'
                                            : 'bg-slate-800 text-slate-500 cursor-default'
                                    }`}
                                    title={onPlayMove ? 'Play this move' : uci}
                                >
                                    {i % 2 === 0 && <span className="text-slate-500 mr-0.5">{Math.floor(i/2)+1}.</span>}{uci}
                                </button>
                            ))}
                        </div>
                        {onPlayMove && <p className="text-xs text-slate-600 mt-1.5">Click any move to play it</p>}
                    </div>
                )}

                {/* ── Top Moves (when variants returned multiple) ── */}
                {topMoves.length > 1 && (
                    <div>
                        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Top Moves</p>
                        <div className="space-y-1.5">
                            {topMoves.slice(0, 3).map((m, i) => {
                                const movePct = AnalysisHelpers.evalToBarPercent(m.eval, m.winChance);
                                return (
                                    <div key={i} className="flex items-center gap-2 text-xs">
                                        <span className="text-slate-600 w-3 font-mono">{i + 1}</span>
                                        <span className="font-mono font-bold text-white w-10">{m.san || m.move || '—'}</span>
                                        <div className="flex-1 h-1.5 rounded-full bg-slate-700/80 overflow-hidden">
                                            <div className="h-full rounded-full bg-amber-500/60 transition-all"
                                                 style={{ width: `${Math.max(8, movePct)}%` }} />
                                        </div>
                                        <span className="font-mono text-slate-400 w-10 text-right">
                                            {AnalysisHelpers.formatEval(m.eval)}
                                        </span>
                                        {onPlayMove && m.move && (
                                            <button
                                                onClick={() => onPlayMove(m.move)}
                                                className="px-2 py-0.5 bg-green-800/70 hover:bg-green-700 text-green-300 rounded text-xs font-bold transition-all"
                                                title="Play this move"
                                            >▶</button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Error ── */}
                {error && (
                    <div className="px-3 py-2 rounded-lg bg-red-900/20 border border-red-800/40 text-xs text-red-400">
                        {error}
                    </div>
                )}

                {/* ── Skeleton while loading with no prior result ── */}
                {loading && !analysis && (
                    <div className="space-y-2 animate-pulse">
                        <div className="h-2.5 bg-slate-700 rounded w-2/3" />
                        <div className="h-2.5 bg-slate-700 rounded w-1/2" />
                    </div>
                )}

            </div>

            {/* ── Puzzle Feedback (shown inside panel when set) ── */}
            {puzzleFeedback && (
                <div className={`mx-3 mb-3 px-3 py-2 rounded-lg text-xs font-bold text-center border ${
                    puzzleFeedback.startsWith('✅')
                        ? 'text-green-400 bg-green-900/20 border-green-800/50'
                        : puzzleFeedback.startsWith('❌')
                            ? 'text-red-400 bg-red-900/20 border-red-800/50'
                            : 'text-blue-300 bg-blue-900/20 border-blue-800/50'
                }`}>
                    {puzzleFeedback}
                </div>
            )}
        </div>
    );
};

/* ══════════════════════════════════
   CHESS APP (Main Component)
══════════════════════════════════ */
const ChessApp = ({ user }) => {
    const [gameState,setGameState]=useState(()=>parseFEN(INITIAL_FEN));
    const [selectedSquare,setSelectedSquare]=useState(null);
    const [legalMovesForSelected,setLegalMovesForSelected]=useState([]);
    const [lastMove,setLastMove]=useState(null);
    const [moveHistory,setMoveHistory]=useState([]);
    const [gameResult,setGameResult]=useState(null);
    const [promotionPending,setPromotionPending]=useState(null);
    const [capturedPieces,setCapturedPieces]=useState({w:[],b:[]});
    const [activeTab,setActiveTab]=useState('play');
    const [boardTheme,setBoardTheme]=useState(BOARD_THEMES[6]);
    const [pieceSet,setPieceSet]=useState('cburnett');
    const [currentPuzzle,setCurrentPuzzle]=useState(null);
    const [puzzleStatus,setPuzzleStatus]=useState('idle');
    const [puzzleGameState,setPuzzleGameState]=useState(()=>parseFEN(INITIAL_FEN));
    const [puzzleSolution,setPuzzleSolution]=useState([]);
    const [puzzleMoveIdx,setPuzzleMoveIdx]=useState(0);
    const [puzzleFeedback,setPuzzleFeedback]=useState('');
    const [playerUsername,setPlayerUsername]=useState('magnus');
    const [userGames,setUserGames]=useState([]);
    const [playerStats,setPlayerStats]=useState(null);
    const [lichessToken,setLichessToken]=useState('');
    const [myAccount,setMyAccount]=useState(null);
    const [lichessTab,setLichessTab]=useState('account');
    const [challenges,setChallenges]=useState({in:[],out:[]});
    const [boardGames,setBoardGames]=useState([]);
    const [activeGameId,setActiveGameId]=useState(null);
    const [gameEvents,setGameEvents]=useState([]);
    const [tournaments,setTournaments]=useState([]);
    const [puzzleActivity,setPuzzleActivity]=useState([]);
    const [lichessMsg,setLichessMsg]=useState('');
    const [myGames,setMyGames]=useState([]);
    const [myGamesLoading,setMyGamesLoading]=useState(false);
    const [myGamesError,setMyGamesError]=useState('');
    const [myGamesLastUpdated,setMyGamesLastUpdated]=useState(null);
    const [selectedImportGame,setSelectedImportGame]=useState(null);
    const [importGameState,setImportGameState]=useState(null);
    const [importMoveIdx,setImportMoveIdx]=useState(0);
    const [importMoves,setImportMoves]=useState([]);
    const [explorationBase,setExplorationBase]=useState(null); // {state, moveIdx} snapshot when exploring engine lines
    const abortControllerRef=useRef(null);

    useEffect(()=>{
        if (!user?.uid) return;
        db.collection('users').doc(user.uid).collection('settings').doc('apiKeys').get()
            .then(doc=>{ if(doc.exists){const t=doc.data().lichessToken||'';setLichessToken(t);if(t) fetchMyAccount(t);} })
            .catch(()=>{});
    },[user?.uid]);

    const showMsg = (msg,ms=3000) => { setLichessMsg(msg); setTimeout(()=>setLichessMsg(''),ms); };
    const parseNDJSON = (text) => text.trim().split('\n').filter(Boolean).map(l=>{try{return JSON.parse(l);}catch{return null;}}).filter(Boolean);

    // Fetch account details
    const fetchMyAccount = async (token=lichessToken) => {
        if (!token) return;
        try { const r=await fetch('https://lichess.org/api/account',{headers:{'Authorization':`Bearer ${token}`}}); if(r.ok) setMyAccount(await r.json()); } catch(e){}
    };
    
    // Fetch Board Games
    const fetchBoardGames=async()=>{
        if(!lichessToken) return;
        try{const r=await fetch('https://lichess.org/api/account/playing', {headers:{'Authorization':`Bearer ${lichessToken}`}}); if(r.ok){const d=await r.json();setBoardGames(d.nowPlaying||[]);}}catch(e){}
    };

    // FIXED STREAM API
    const streamBoardGame = async (gameId) => {
        if(abortControllerRef.current) abortControllerRef.current.abort(); // Cancel previous stream
        abortControllerRef.current = new AbortController();
        
        setActiveGameId(gameId);
        setGameEvents([]);
        showMsg('🎮 Streaming game: ' + gameId);
        
        try {
            const response = await fetch(`https://lichess.org/api/board/game/stream/${gameId}`, {
                headers: { 'Authorization': `Bearer ${lichessToken}` },
                signal: abortControllerRef.current.signal
            });
            if(!response.ok) throw new Error('Stream connected nahi hua');
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            
            (async () => {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n').filter(line => line.trim());
                    for (const line of lines) {
                        try {
                            const data = JSON.parse(line);
                            setGameEvents(prev => [data, ...prev.slice(0, 29)]);
                        } catch(e) {}
                    }
                }
            })();
        } catch(err) {
            if(err.name !== 'AbortError') showMsg('❌ Stream failed: ' + err.message);
        }
    };

    // Fetch My Games from Lichess
    const fetchMyGames = async (maxGames=15) => {
        if (!lichessToken) { showMsg('❌ Settings mein Lichess token set karo pehle'); return; }
        const username = myAccount?.id;
        if (!username) { showMsg('❌ Account load nahi hua, refresh karo'); fetchMyAccount(); return; }
        setMyGamesLoading(true);
        setMyGamesError('');
        setMyGames([]);
        try {
            const r = await fetch(`https://lichess.org/api/games/user/${username}?max=${maxGames}&pgnInJson=true&opening=true&clocks=false`, {
                headers: { 'Authorization': `Bearer ${lichessToken}`, 'Accept': 'application/x-ndjson' }
            });
            if (!r.ok) throw new Error('HTTP ' + r.status + (r.status===401?' — Token invalid ya expired hai':r.status===429?' — Rate limit, thodi der baad try karo':''));
            const text = await r.text();
            const games = parseNDJSON(text);
            setMyGames(games);
            setMyGamesLastUpdated(new Date());
            if (games.length === 0) setMyGamesError('Koi game nahi mila is account pe.');
        } catch(e) { setMyGamesError('Games fetch nahi hue: ' + e.message); }
        setMyGamesLoading(false);
    };

    // Import game on board for review
    const importGameForReview = (game) => {
        const moves = (game.moves || '').trim().split(/\s+/).filter(Boolean);
        setImportMoves(moves);
        setImportMoveIdx(0);
        setImportGameState(parseFEN(INITIAL_FEN));
        setSelectedImportGame(game);
        setExplorationBase(null); // clear any previous exploration
        setLichessTab('analysis');
        showMsg('✅ Game loaded! Analysis tab mein dekho');
    };

    // Play a UCI move from the engine analysis on the current board position
    const playAnalysisMove = (uciMove) => {
        if (!importGameState || !uciMove || uciMove.length < 4) return;
        const files = 'abcdefgh', ranks = '87654321';
        const fromC = files.indexOf(uciMove[0]), fromR = ranks.indexOf(uciMove[1]);
        const toC   = files.indexOf(uciMove[2]), toR   = ranks.indexOf(uciMove[3]);
        const promo = uciMove[4] || null;
        if (fromC < 0 || fromR < 0 || toC < 0 || toR < 0) return;

        const legal = generateLegalMoves(importGameState, importGameState.turn);
        const move  = legal.find(m =>
            m.from[0] === fromR && m.from[1] === fromC &&
            m.to[0]   === toR   && m.to[1]   === toC   &&
            (!promo || m.special?.promote === promo)
        );
        if (!move) return;

        // First time entering exploration — save the game position to return to
        if (!explorationBase) setExplorationBase({ state: importGameState, moveIdx: importMoveIdx });
        setImportGameState(applyMove(importGameState, move));
    };

    // Exit exploration and return to saved game position
    const exitExploration = () => {
        if (!explorationBase) return;
        setImportGameState(explorationBase.state);
        setImportMoveIdx(explorationBase.moveIdx);
        setExplorationBase(null);
    };

    // Navigation — always rebuilds from game moves, clearing any exploration state
    const importGameForward = () => {
        if (importMoveIdx >= importMoves.length) return;
        // Rebuild cleanly from game move list to escape exploration state
        let state = parseFEN(INITIAL_FEN);
        for (let i = 0; i < importMoveIdx; i++) { const m = sanToMove(state, importMoves[i]); if (!m) break; state = applyMove(state, m); }
        const move = sanToMove(state, importMoves[importMoveIdx]);
        if (move) { setImportGameState(applyMove(state, move)); setImportMoveIdx(prev=>prev+1); setExplorationBase(null); }
    };

    const importGameBackward = () => {
        if (explorationBase) { exitExploration(); return; } // one press exits exploration
        if (importMoveIdx <= 0) return;
        let state = parseFEN(INITIAL_FEN);
        for (let i = 0; i < importMoveIdx - 1; i++) { const m = sanToMove(state, importMoves[i]); if (!m) break; state = applyMove(state, m); }
        setImportGameState(state);
        setImportMoveIdx(prev=>prev-1);
    };

    const importGameGotoStart = () => { setExplorationBase(null); setImportGameState(parseFEN(INITIAL_FEN)); setImportMoveIdx(0); };
    const importGameGotoEnd = () => {
        setExplorationBase(null);
        let state = parseFEN(INITIAL_FEN);
        for (const san of importMoves) { const m = sanToMove(state, san); if (!m) break; state = applyMove(state, m); }
        setImportGameState(state);
        setImportMoveIdx(importMoves.length);
    };

    // PGN Helper
    const sanToMove=(state,san)=>{const clean=san.replace(/[+#?!=x]/g,'').replace('O-O-O','q-castle').replace('O-O','k-castle');const legal=generateLegalMoves(state,state.turn);if(san.startsWith('O-O-O')||san==='0-0-0')return legal.find(m=>m.special?.type==='castle'&&m.to[1]===2)||null;if(san.startsWith('O-O')||san==='0-0')return legal.find(m=>m.special?.type==='castle'&&m.to[1]===6)||null;const files='abcdefgh',ranks='87654321',isPromo=san.includes('='),promoP=isPromo?san.slice(san.indexOf('=')+1)[0].toLowerCase():null;const s=clean.replace(/^[KQRBN]/,'');const toFile=s.slice(-2,-1),toRank=s.slice(-1);const toC=files.indexOf(toFile),toR=ranks.indexOf(toRank);if(toC<0||toR<0)return null;const pieceChar=/^[KQRBN]/.test(san)?san[0].toLowerCase():'p';const disambig=clean.replace(/^[KQRBN]/,'').slice(0,-2);return legal.find(m=>{if(m.to[0]!==toR||m.to[1]!==toC)return false;if(m.piece!==pieceChar)return false;if(isPromo&&m.special?.promote!==promoP)return false;if(disambig.length===1){if(/[a-h]/.test(disambig)&&m.from[1]!==files.indexOf(disambig))return false;if(/[1-8]/.test(disambig)&&m.from[0]!==ranks.indexOf(disambig))return false;}if(disambig.length===2){if(m.from[1]!==files.indexOf(disambig[0])||m.from[0]!==ranks.indexOf(disambig[1]))return false;}return true;})||null;};
    const replayPGN=(pgn,targetPly)=>{const stripped=pgn.replace(/\[.*?\]\s*/g,'').replace(/\{[^}]*\}/g,'').replace(/\d+\.\s*/g,'').trim();const tokens=stripped.split(/\s+/).filter(t=>t&&!/^\d/.test(t)&&t!=='*'&&t!=='1-0'&&t!=='0-1'&&t!=='1/2-1/2');let state=parseFEN(INITIAL_FEN);for(let i=0;i<Math.min(targetPly,tokens.length);i++){const move=sanToMove(state,tokens[i]);if(!move)break;state=applyMove(state,move);}return state;};

    // Puzzle API
    const fetchPuzzle=async()=>{try{setPuzzleStatus('loading');setPuzzleFeedback('');const headers=lichessToken?{'Authorization':`Bearer ${lichessToken}`,'Accept':'application/json'}:{'Accept':'application/json'};const r=await fetch('https://lichess.org/api/puzzle/daily',{headers});if(!r.ok)throw new Error('HTTP '+r.status);const d=await r.json();const startState=replayPGN(d.game.pgn,d.puzzle.initialPly);setPuzzleGameState(startState);setCurrentPuzzle(d.puzzle);setPuzzleSolution(d.puzzle.solution||[]);setPuzzleMoveIdx(0);setPuzzleStatus('playing');}catch(e){setPuzzleStatus('error');}};

    // Game Functions
    const resetGame=()=>{setGameState(parseFEN(INITIAL_FEN));setSelectedSquare(null);setLegalMovesForSelected([]);setLastMove(null);setMoveHistory([]);setGameResult(null);setPromotionPending(null);setCapturedPieces({w:[],b:[]});};
    const selectPiece=(row,col)=>{setSelectedSquare([row,col]);setLegalMovesForSelected(generateLegalMoves(gameState,gameState.turn).filter(m=>m.from[0]===row&&m.from[1]===col));};
    const executeMove=(move)=>{const notation=moveToAlgebraic(gameState,move),captured=gameState.board[move.to[0]][move.to[1]];if(captured||move.special?.type==='enPassant'){const cp=captured||gameState.board[move.from[0]][move.to[1]];if(cp)setCapturedPieces(prev=>({...prev,[cp.color]:[...prev[cp.color],cp.type]}));}const ns=applyMove(gameState,move);setGameState(ns);setSelectedSquare(null);setLegalMovesForSelected([]);setLastMove({from:move.from,to:move.to});setMoveHistory(prev=>[...prev,notation]);setPromotionPending(null);const res=getGameResult(ns);if(res)setGameResult(res);};
    const handleSquareClick=useCallback((row,col)=>{if(gameResult||promotionPending)return;const piece=gameState.board[row][col];if(selectedSquare){if(selectedSquare[0]===row&&selectedSquare[1]===col){setSelectedSquare(null);setLegalMovesForSelected([]);return;}const matches=legalMovesForSelected.filter(m=>m.to[0]===row&&m.to[1]===col);if(matches.length>0){if(matches.length>1&&matches[0].special?.type==='promotion'){setPromotionPending({moves:matches});return;}executeMove(matches[0]);return;}if(piece&&piece.color===gameState.turn){selectPiece(row,col);return;}setSelectedSquare(null);setLegalMovesForSelected([]);return;}if(piece&&piece.color===gameState.turn)selectPiece(row,col);},[gameState,selectedSquare,legalMovesForSelected,gameResult,promotionPending]);
    const handlePromotion=(p)=>{if(!promotionPending)return;const m=promotionPending.moves.find(m=>m.special.promote===p);if(m)executeMove(m);};
    const isLegalTarget=(r,c)=>legalMovesForSelected.some(m=>m.to[0]===r&&m.to[1]===c);
    const inCheck=isInCheck(gameState.board,gameState.turn);
    const kingPos=findKing(gameState.board,gameState.turn);

    // Puzzle move handler
    const handlePuzzleMove=(row,col)=>{
        if(puzzleStatus!=='playing'||!currentPuzzle)return;
        const piece=puzzleGameState.board[row][col];
        setPuzzleGameState(prev=>{
            const sel=prev._selected;
            if(sel){
                const legal=generateLegalMoves(prev,prev.turn);
                const m=legal.find(mv=>mv.from[0]===sel[0]&&mv.from[1]===sel[1]&&mv.to[0]===row&&mv.to[1]===col);
                if(m){
                    const uci=puzzleSolution[puzzleMoveIdx];
                    const files='abcdefgh',ranks='87654321';
                    const expFrom=[ranks.indexOf(uci[1]),files.indexOf(uci[0])];
                    const expTo=[ranks.indexOf(uci[3]),files.indexOf(uci[2])];
                    // Fix for promotion moves in UCI string
                    const isCorrect = sel[0]===expFrom[0] && sel[1]===expFrom[1] && row===expTo[0] && col===expTo[1] && (uci.length < 5 || m.special?.promote === uci[4]);
                    
                    if(isCorrect){
                        let ns=applyMove(prev,m); delete ns._selected;
                        const nextIdx=puzzleMoveIdx+1;
                        if(nextIdx>=puzzleSolution.length){setPuzzleFeedback('✅ Puzzle Solved! 🎉');setPuzzleStatus('solved');return ns;}
                        const oppUci=puzzleSolution[nextIdx];
                        if(oppUci){
                            const oppLegal=generateLegalMoves(ns,ns.turn);
                            const of1=[ranks.indexOf(oppUci[1]),files.indexOf(oppUci[0])];
                            const ot1=[ranks.indexOf(oppUci[3]),files.indexOf(oppUci[2])];
                            const oppM=oppLegal.find(mv=>mv.from[0]===of1[0]&&mv.from[1]===of1[1]&&mv.to[0]===ot1[0]&&mv.to[1]===ot1[1]&& (oppUci.length < 5 || mv.special?.promote === oppUci[4]));
                            if(oppM)ns=applyMove(ns,oppM);
                        }
                        setPuzzleMoveIdx(nextIdx+1); setPuzzleFeedback('✅ Correct! Continue…'); return ns;
                    }else{
                        setPuzzleFeedback('❌ Wrong move'); return{...prev,_selected:null};
                    }
                }
            }
            return {...prev, _selected: (piece&&piece.color===prev.turn) ? [row,col] : null};
        });
    };

    const renderPiece=(piece)=>(<span className="chess-piece-3d" style={{fontSize:'clamp(22px,3.8vw,46px)',lineHeight:'1',userSelect:'none',pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center',textShadow:'0 1px 4px rgba(0,0,0,0.7)'}}>{PIECE_UNICODE[piece.color][piece.type]}</span>);
    const renderCaptured=(color)=>{const order={q:1,r:2,b:3,n:4,p:5};const sorted=[...capturedPieces[color]].sort((a,b)=>order[a]-order[b]);return <div className="flex flex-wrap gap-0.5 min-h-[22px] items-center">{sorted.map((p,i)=><span key={i} style={{fontSize:'16px',lineHeight:'1'}}>{PIECE_UNICODE[color][p]}</span>)}</div>;};

    const renderBoard=()=>{const files=['a','b','c','d','e','f','g','h'],t=boardTheme;return(
        <div className="inline-block shadow-2xl rounded-sm overflow-hidden" style={{border:`4px solid ${t.border}`}}>
            {Array.from({length:8},(_,r)=>(
                <div key={r} className="flex">
                    {Array.from({length:8},(_,c)=>{const piece=gameState.board[r][c],isLight=(r+c)%2===0,isSel=selectedSquare&&selectedSquare[0]===r&&selectedSquare[1]===c,isLeg=isLegalTarget(r,c),isLast=lastMove&&((lastMove.from[0]===r&&lastMove.from[1]===c)||(lastMove.to[0]===r&&lastMove.to[1]===c)),isKC=inCheck&&kingPos&&kingPos[0]===r&&kingPos[1]===c;let bg=isLight?t.light:t.dark;if(isLast)bg=isLight?t.lastLight:t.lastDark;let cls='';if(isSel)cls+=' square-selected';if(isLeg&&!piece)cls+=' square-legal';if(isLeg&&piece)cls+=' square-capture';if(isKC)cls+=' square-check';return(<div key={`${r}-${c}`} className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center cursor-pointer select-none relative${cls}`} style={{backgroundColor:bg}} onClick={()=>handleSquareClick(r,c)}>{piece&&renderPiece(piece)}{r===7&&<span className="absolute bottom-0.5 right-1 text-xs font-semibold pointer-events-none" style={{color:isLight?t.labelLight:t.labelDark}}>{files[c]}</span>}{c===0&&<span className="absolute top-0.5 left-1 text-xs font-semibold pointer-events-none" style={{color:isLight?t.labelLight:t.labelDark}}>{8-r}</span>}</div>);})}
                </div>
            ))}
        </div>
    );};

    const renderPuzzleBoard=()=>{const files=['a','b','c','d','e','f','g','h'],t=boardTheme,ps=puzzleGameState;return(
        <div className="inline-block shadow-2xl rounded-sm overflow-hidden" style={{border:`4px solid ${t.border}`}}>
            {Array.from({length:8},(_,r)=>(
                <div key={r} className="flex">
                    {Array.from({length:8},(_,c)=>{const piece=ps.board[r][c],isLight=(r+c)%2===0,isSel=ps._selected&&ps._selected[0]===r&&ps._selected[1]===c;let bg=isLight?t.light:t.dark,cls='';if(isSel)cls+=' square-selected';return(<div key={`${r}-${c}`} className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center cursor-pointer select-none relative${cls}`} style={{backgroundColor:bg}} onClick={()=>handlePuzzleMove(r,c)}>{piece&&<span style={{fontSize:'clamp(22px,3.8vw,46px)',lineHeight:'1',userSelect:'none',pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center',textShadow:'0 1px 4px rgba(0,0,0,0.7)'}}>{PIECE_UNICODE[piece.color][piece.type]}</span>}{r===7&&<span className="absolute bottom-0.5 right-1 text-xs font-semibold pointer-events-none" style={{color:isLight?t.labelLight:t.labelDark}}>{files[c]}</span>}{c===0&&<span className="absolute top-0.5 left-1 text-xs font-semibold pointer-events-none" style={{color:isLight?t.labelLight:t.labelDark}}>{8-r}</span>}</div>);})}
                </div>
            ))}
        </div>
    );};

    const renderImportBoard=()=>{if(!importGameState)return null;const files=['a','b','c','d','e','f','g','h'],t=boardTheme,ps=importGameState;return(<div className="inline-block shadow-2xl rounded-sm overflow-hidden" style={{border:`4px solid ${t.border}`}}>{Array.from({length:8},(_,r)=>(<div key={r} className="flex">{Array.from({length:8},(_,c)=>{const piece=ps.board[r][c],isLight=(r+c)%2===0;let bg=isLight?t.light:t.dark;return(<div key={`${r}-${c}`} className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center select-none relative" style={{backgroundColor:bg}}>{piece&&<span style={{fontSize:'clamp(18px,3.2vw,38px)',lineHeight:'1',userSelect:'none',pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center',textShadow:'0 1px 4px rgba(0,0,0,0.7)'}}>{PIECE_UNICODE[piece.color][piece.type]}</span>}{r===7&&<span className="absolute bottom-0.5 right-1 text-xs font-semibold pointer-events-none" style={{color:isLight?t.labelLight:t.labelDark}}>{files[c]}</span>}{c===0&&<span className="absolute top-0.5 left-1 text-xs font-semibold pointer-events-none" style={{color:isLight?t.labelLight:t.labelDark}}>{8-r}</span>}</div>);})}</div>))}</div>);};

    const renderMoveHistory=()=>{const pairs=[];for(let i=0;i<moveHistory.length;i+=2)pairs.push({num:Math.floor(i/2)+1,w:moveHistory[i],b:moveHistory[i+1]||''});return(<div className="max-h-64 overflow-y-auto space-y-1 text-sm font-mono">{pairs.length===0?<p className="text-slate-500 text-center italic text-xs py-4">Make a move…</p>:pairs.map(p=><div key={p.num} className="flex text-slate-300 py-1.5 px-2 rounded hover:bg-slate-700/50 border-b border-slate-700/30"><span className="text-slate-500 w-10">{p.num}.</span><span className="w-20 font-semibold">{p.w}</span><span className="w-20 font-semibold">{p.b}</span></div>)}</div>);};

    // Tabs definition
    const TABS = [
        {id:"play", icon:"♟", label:"Play AI"},
        {id:"puzzles", icon:"🧩", label:"Puzzles"},
        {id:"games", icon:"🎮", label:"Player Analysis"},
        {id:"lichess", icon:"♞", label:"Lichess API"},
        ...(user.email===ADMIN_EMAIL ? [{id:"users", icon:"👥", label:"Users"}] : []),
        {id:"settings", icon:"⚙️", label:"Settings"}
    ];

    return (
        <div className="flex h-screen w-full bg-slate-950 text-white overflow-hidden font-sans">
            
            {/* ── LEFT SIDEBAR NAVIGATION ── */}
            <nav className="w-16 md:w-60 flex flex-col border-r border-slate-800 bg-slate-900 shrink-0 z-20 shadow-xl">
                <div className="h-16 flex items-center justify-center md:justify-start md:px-5 border-b border-slate-800">
                    <span className="text-3xl text-amber-500 float-animate">♛</span>
                    <span className="hidden md:block ml-3 font-bold text-lg chess-title text-amber-500">ChessGPT Elite</span>
                </div>
                
                <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                    {TABS.map(t => (
                        <button key={t.id} onClick={()=>{
                            setActiveTab(t.id);
                            if(t.id==='puzzles'&&!currentPuzzle) fetchPuzzle();
                            if(t.id==='lichess') { fetchMyAccount(); fetchBoardGames(); }
                        }} 
                        className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab===t.id ? 'bg-amber-600/20 text-amber-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 font-medium'}`}>
                            <span className="text-xl md:mr-3 flex justify-center w-6">{t.icon}</span>
                            <span className="hidden md:block text-sm">{t.label}</span>
                        </button>
                    ))}
                </div>

                <div className="p-3 border-t border-slate-800">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 border border-slate-700">
                        {user.photoURL ? <img src={user.photoURL} alt="user" className="w-8 h-8 rounded-full border border-slate-600" /> : <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center font-bold text-white">{user.displayName?.[0]||'U'}</div>}
                        <div className="hidden md:block flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate text-slate-200">{user.displayName?.split(' ')[0]}</p>
                        </div>
                        <button onClick={()=>auth.signOut()} className="hidden md:block text-slate-400 hover:text-red-400 transition-colors" title="Logout">🚪</button>
                    </div>
                </div>
            </nav>

            {/* ── MAIN CONTENT AREA (Split View) ── */}
            <main className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#161512]">
                
                {/* ── CENTER: BOARD & MAIN CONTENT ── */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center justify-center">
                    
                    {activeTab === 'play' && (
                        <div className="fade-in max-w-3xl mx-auto w-full flex flex-col items-center">
                            <div className="w-full flex items-center justify-between mb-2 px-1 bg-slate-800/60 p-2 rounded-t-lg border-b border-slate-700">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-sm bg-slate-700 flex justify-center items-center text-xl">🤖</div>
                                    <div>
                                        <span className={`font-semibold text-sm ${gameState.turn===BLACK&&!gameResult?'text-amber-400':'text-slate-300'}`}>Stockfish (Black)</span>
                                        <div className="text-xs text-slate-500">AI Engine</div>
                                    </div>
                                </div>
                                {renderCaptured('w')}
                            </div>
                            
                            {renderBoard()}
                            
                            <div className="w-full flex items-center justify-between mt-2 px-1 bg-slate-800/60 p-2 rounded-b-lg border-t border-slate-700">
                                <div className="flex items-center gap-2">
                                    {user.photoURL ? <img src={user.photoURL} className="w-8 h-8 rounded-sm border border-slate-600" /> : <div className="w-8 h-8 rounded-sm bg-amber-600 flex justify-center items-center font-bold text-white">{user.displayName?.[0]}</div>}
                                    <div>
                                        <span className={`font-semibold text-sm ${gameState.turn===WHITE&&!gameResult?'text-amber-400':'text-slate-300'}`}>{user.displayName?.split(' ')[0]} (White)</span>
                                        <div className="text-xs text-slate-500">Player</div>
                                    </div>
                                </div>
                                {renderCaptured('b')}
                            </div>
                        </div>
                    )}

                    {activeTab === 'puzzles' && (
                        <div className="fade-in max-w-3xl mx-auto w-full flex flex-col items-center">
                            {puzzleStatus==='loading' ? <div className="text-center"><div className="text-6xl mb-4 animate-pulse">♘</div><p className="text-slate-400">Loading puzzle…</p></div>
                            : puzzleStatus==='idle' ? <div className="text-center"><button onClick={fetchPuzzle} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500">Load Daily Puzzle</button></div>
                            : puzzleStatus==='error' ? <div className="text-center"><p className="text-red-400 mb-4">Puzzle load nahi hua.</p><button onClick={fetchPuzzle} className="px-5 py-2 bg-blue-600 text-white rounded-lg">Retry</button></div>
                            : (
                                <>
                                    <div className="w-full bg-slate-800/80 p-3 rounded-t-lg mb-2 text-center text-sm font-bold border-b border-slate-700" style={{color:puzzleGameState.turn===WHITE?'#e2e8f0':'#94a3b8'}}>
                                        {puzzleGameState.turn===WHITE?'⬜ White To Move':'⬛ Black To Move'}
                                    </div>
                                    {renderPuzzleBoard()}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'games' && <div className="fade-in w-full max-w-4xl"><h2 className="text-2xl font-bold text-amber-400 mb-6 border-b border-slate-800 pb-2">👤 Player Analysis</h2><div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"><p className="text-slate-300">Player lookup interface here.</p></div></div>}
                    
                    {activeTab === 'lichess' && (
                        <div className="fade-in w-full max-w-5xl">
                            <h2 className="text-2xl font-bold text-amber-400 mb-4 border-b border-slate-800 pb-2">♞ Lichess Integration</h2>

                            {/* Sub-tabs */}
                            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                                {[
                                    {id:'mygames',  label:'📥 My Games'},
                                    {id:'analysis', label:'🔬 Game Analysis'},
                                    {id:'account',  label:'👤 Account'},
                                    {id:'live',     label:'📡 Live'}
                                ].map(st=>(
                                    <button key={st.id} onClick={()=>{
                                        setLichessTab(st.id);
                                        if(st.id==='mygames'&&myGames.length===0&&!myGamesLoading) fetchMyGames();
                                        if(st.id==='live') fetchBoardGames();
                                    }} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                                        lichessTab===st.id
                                            ? (st.id==='analysis' ? 'bg-blue-700 text-white' : 'bg-amber-600 text-white')
                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    }`}>{st.label}</button>
                                ))}
                            </div>

                            {lichessMsg && <div className="mb-3 p-2 bg-slate-800 border border-slate-700 rounded text-xs text-amber-400">{lichessMsg}</div>}

                            {/* MY GAMES TAB */}
                            {lichessTab === 'mygames' && (
                                <div>
                                    {!lichessToken && (
                                        <div className="p-5 bg-red-900/20 border border-red-700/50 rounded-xl text-center">
                                            <p className="text-red-400 font-semibold mb-2">⚠ Lichess Token Set Nahi Hai</p>
                                            <p className="text-slate-400 text-sm mb-3">Settings tab mein jaake Lichess API token save karo.</p>
                                            <button onClick={()=>setActiveTab('settings')} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-bold">⚙️ Settings Kholo</button>
                                        </div>
                                    )}
                                    {lichessToken && (
                                        <>
                                            {/* Toolbar */}
                                            <div className="flex gap-2 mb-4 flex-wrap items-center justify-between">
                                                <div className="flex gap-2 flex-wrap items-center">
                                                    <button onClick={()=>fetchMyGames(20)} disabled={myGamesLoading} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all">
                                                        {myGamesLoading ? '⏳ Loading…' : '🔄 Latest 20 Games'}
                                                    </button>
                                                    <button onClick={()=>fetchMyGames(50)} disabled={myGamesLoading} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all">
                                                        Load 50
                                                    </button>
                                                    <button onClick={()=>fetchMyGames(100)} disabled={myGamesLoading} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all">
                                                        Load 100
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                                    {myAccount && <span>👤 <span className="text-white font-semibold">{myAccount.id}</span></span>}
                                                    {myGamesLastUpdated && (
                                                        <span className="text-slate-600">
                                                            Updated {myGamesLastUpdated.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                                                        </span>
                                                    )}
                                                    {myGames.length > 0 && <span className="text-slate-500">{myGames.length} games</span>}
                                                </div>
                                            </div>

                                            {myGamesError && <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm mb-4">{myGamesError}</div>}

                                            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                                                {myGames.map((g,i) => {
                                                    const isWin = g.winner && ((g.winner==='white'&&g.players?.white?.user?.id===myAccount?.id)||(g.winner==='black'&&g.players?.black?.user?.id===myAccount?.id));
                                                    const isLoss = g.winner && !isWin;
                                                    const isDraw = !g.winner && g.status !== 'aborted';
                                                    const myColor = g.players?.white?.user?.id === myAccount?.id ? 'white' : 'black';
                                                    const opp = myColor==='white' ? g.players?.black?.user?.name : g.players?.white?.user?.name;
                                                    const result = g.winner ? (isWin ? '✅ Win' : '❌ Loss') : (isDraw ? '½ Draw' : '—');
                                                    const resultColor = isWin ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-slate-400';
                                                    const isSelected = selectedImportGame?.id === g.id;
                                                    return (
                                                        <div key={g.id||i} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isSelected ? 'border-blue-500/60 bg-blue-900/20' : 'border-slate-700 bg-slate-800/70 hover:border-amber-500/50'}`}>
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <span className={`text-sm font-bold w-14 shrink-0 ${resultColor}`}>{result}</span>
                                                                <div className="min-w-0">
                                                                    <p className="text-white text-sm font-medium truncate">vs <span className="font-bold">{opp || 'Anonymous'}</span></p>
                                                                    <p className="text-slate-500 text-xs">{g.perf} · {myColor} · {g.moves?.split(' ').length||0} moves</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-1.5 shrink-0">
                                                                {g.moves && (
                                                                    <button onClick={()=>importGameForReview(g)}
                                                                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${isSelected ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-amber-600 hover:bg-amber-500 text-white'}`}>
                                                                        {isSelected ? '🔬 Analyzing' : '🔬 Analyze'}
                                                                    </button>
                                                                )}
                                                                <a href={`https://lichess.org/${g.id}`} target="_blank" rel="noopener noreferrer"
                                                                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs font-semibold transition-all">↗</a>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {myGames.length === 0 && !myGamesLoading && !myGamesError && (
                                                    <div className="text-center py-12">
                                                        <div className="text-4xl mb-3 opacity-40">♟</div>
                                                        <p className="text-slate-500 text-sm">Latest games load karne ke liye upar button dabao.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* GAME ANALYSIS TAB */}
                            {lichessTab === 'analysis' && (
                                selectedImportGame ? (
                                    <div className="flex flex-col lg:flex-row gap-5 items-start">
                                        {/* Board + Controls */}
                                        <div className="flex flex-col items-center shrink-0">
                                            {/* Status bar — shows exploration state or normal position */}
                                            {explorationBase ? (
                                                <div className="mb-2 w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-blue-500/50 bg-blue-900/20 text-xs">
                                                    <span className="text-blue-300 font-semibold">⚡ Exploring engine line</span>
                                                    <button onClick={exitExploration}
                                                        className="px-2.5 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded font-bold transition-all">
                                                        ↩ Return to game
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="mb-2 text-xs text-slate-400 font-mono bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700 w-full text-center">
                                                    Move <span className="text-white font-bold">{importMoveIdx}</span> / {importMoves.length}
                                                    <span className="ml-3 text-slate-500">{importGameState ? AnalysisHelpers.sideFromFEN(stateToFEN(importGameState)) + ' to move' : ''}</span>
                                                </div>
                                            )}
                                            {renderImportBoard()}
                                            <div className="flex gap-2 mt-3">
                                                <button onClick={importGameGotoStart} title="Start" className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold flex items-center justify-center text-sm">⏮</button>
                                                <button onClick={importGameBackward} title={explorationBase ? 'Return to game' : 'Prev move'}
                                                    className={`w-10 h-10 rounded-lg text-white font-bold flex items-center justify-center transition-all ${explorationBase ? 'bg-blue-700 hover:bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}>◀</button>
                                                <button onClick={importGameForward} title="Next move" className="w-10 h-10 bg-amber-600 hover:bg-amber-500 rounded-lg text-white font-bold flex items-center justify-center">▶</button>
                                                <button onClick={importGameGotoEnd} title="End" className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold flex items-center justify-center text-sm">⏭</button>
                                            </div>
                                            <button onClick={()=>setLichessTab('mygames')} className="mt-3 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-all">← Change Game</button>
                                        </div>

                                        {/* Right Panel */}
                                        <div className="flex-1 min-w-0 space-y-3">

                                            {/* Engine Analysis — with play buttons enabled */}
                                            <PuzzleAnalysisPanel
                                                fen={importGameState ? stateToFEN(importGameState) : null}
                                                puzzleStatus={importGameState ? 'playing' : 'idle'}
                                                puzzleFeedback={null}
                                                onPlayMove={playAnalysisMove}
                                            />

                                            {/* Game Info */}
                                            <div className="p-4 bg-slate-800/70 border border-slate-700 rounded-xl">
                                                <p className="text-amber-400 font-bold mb-3 text-xs uppercase tracking-wider">Game Info</p>
                                                <div className="space-y-1.5 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-white shrink-0 border border-slate-500"></span>
                                                        <span className="text-slate-300">White: <span className="text-white font-semibold">{selectedImportGame.players?.white?.user?.name || 'Anonymous'}</span>
                                                        <span className="text-slate-500 ml-1 text-xs">({selectedImportGame.players?.white?.rating || '?'})</span></span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-slate-800 shrink-0 border border-slate-400"></span>
                                                        <span className="text-slate-300">Black: <span className="text-white font-semibold">{selectedImportGame.players?.black?.user?.name || 'Anonymous'}</span>
                                                        <span className="text-slate-500 ml-1 text-xs">({selectedImportGame.players?.black?.rating || '?'})</span></span>
                                                    </div>
                                                    <p className="text-slate-400 text-xs pt-1">Result: <span className="text-white font-semibold">{selectedImportGame.winner ? selectedImportGame.winner + ' wins' : selectedImportGame.status}</span>
                                                    <span className="mx-2 text-slate-600">·</span>Variant: <span className="text-white font-semibold">{selectedImportGame.perf}</span></p>
                                                    {selectedImportGame.opening && <p className="text-slate-400 text-xs">Opening: <span className="text-amber-300 font-semibold">{selectedImportGame.opening.name}</span></p>}
                                                </div>
                                            </div>

                                            {/* Move List */}
                                            <div className="p-3 bg-slate-800/70 border border-slate-700 rounded-xl max-h-52 overflow-y-auto">
                                                <p className="text-amber-400 font-bold mb-2 text-xs uppercase tracking-wider">Moves</p>
                                                <div className="text-xs font-mono text-slate-300 flex flex-wrap gap-0.5">
                                                    {importMoves.map((m,i)=>(
                                                        <span key={i} onClick={()=>{
                                                            let state=parseFEN(INITIAL_FEN);
                                                            for(let j=0;j<=i;j++){const mv=sanToMove(state,importMoves[j]);if(!mv)break;state=applyMove(state,mv);}
                                                            setImportGameState(state);setImportMoveIdx(i+1);
                                                        }} className={`cursor-pointer px-1.5 py-0.5 rounded transition-all ${importMoveIdx===i+1?'bg-amber-600 text-white font-bold':'hover:bg-slate-700 hover:text-white'}`}>
                                                            {i%2===0?<span className="text-slate-600 mr-0.5">{Math.floor(i/2)+1}.</span>:null}{m}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                ) : (
                                    /* No game loaded — prompt user */
                                    <div className="flex flex-col items-center justify-center py-20 text-center fade-in">
                                        <div className="text-6xl mb-5 opacity-60">🔬</div>
                                        <h3 className="text-white font-bold text-lg mb-2">Game Analysis</h3>
                                        <p className="text-slate-400 text-sm mb-1">Koi game load nahi hua abhi.</p>
                                        <p className="text-slate-500 text-xs mb-6">My Games tab se koi game review karo, engine analysis yahan dikhega.</p>
                                        <button onClick={()=>{ setLichessTab('mygames'); if(myGames.length===0&&!myGamesLoading) fetchMyGames(); }}
                                            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-amber-900/30">
                                            📥 My Games Dekho
                                        </button>
                                    </div>
                                )
                            )}

                            {/* ACCOUNT TAB */}
                            {lichessTab === 'account' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-5 bg-slate-800/50 rounded-xl border border-slate-700">
                                        <h3 className="text-white font-bold mb-3">👤 Account Info</h3>
                                        {myAccount ? (
                                            <div className="space-y-2 text-sm">
                                                <p className="text-slate-300">Username: <span className="text-white font-bold">{myAccount.id}</span></p>
                                                <p className="text-slate-300">Name: {myAccount.profile?.realName || '—'}</p>
                                                <p className="text-slate-300">Rating: Bullet {myAccount.perfs?.bullet?.rating||'?'} · Blitz {myAccount.perfs?.blitz?.rating||'?'} · Rapid {myAccount.perfs?.rapid?.rating||'?'}</p>
                                            </div>
                                        ) : (
                                            <div>
                                                {!lichessToken ? <p className="text-red-400 text-sm">Token set nahi hai. Settings mein jaao.</p> : <p className="text-slate-400 text-sm">Account load ho raha hai…</p>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5 bg-slate-800/50 rounded-xl border border-slate-700">
                                        <h3 className="text-white font-bold mb-3">🚀 Quick Actions</h3>
                                        <div className="space-y-2">
                                            <button onClick={()=>{ setLichessTab('mygames'); fetchMyGames(15); }} className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-bold">📥 My Games Import Karo</button>
                                            <button onClick={fetchMyAccount} className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-semibold">🔄 Account Refresh</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* LIVE GAMES TAB */}
                            {lichessTab === 'live' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-5 bg-slate-800/50 rounded-xl border border-slate-700">
                                        <h3 className="text-white font-bold mb-3">Active Games</h3>
                                        <button onClick={fetchBoardGames} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm mb-3">Refresh List</button>
                                        {boardGames.length === 0 ? <p className="text-slate-500 text-sm">Koi live game nahi hai.</p> : boardGames.map(g => (
                                            <div key={g.gameId} className="flex justify-between items-center p-2 bg-slate-900 rounded mb-2 border border-slate-700">
                                                <span className="text-sm font-medium">{g.opponent?.username || 'Unknown'}</span>
                                                <button onClick={()=>streamBoardGame(g.gameId)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold text-white">Stream</button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-5 bg-slate-800/50 rounded-xl border border-slate-700 h-64 overflow-y-auto">
                                        <h3 className="text-white font-bold mb-3 text-green-400">📡 Live Stream</h3>
                                        <div className="text-xs font-mono text-slate-400 space-y-1">
                                            {gameEvents.map((e,i) => <div key={i}>&gt; {JSON.stringify(e)}</div>)}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'users' && <div className="fade-in w-full"><UsersTab /></div>}
                    {activeTab === 'settings' && <div className="fade-in w-full"><SettingsTab user={user} /></div>}
                </div>

                {/* ── RIGHT PANEL: MOVES & COACH ── */}
                {['play', 'puzzles'].includes(activeTab) && (
                    <aside className="w-full md:w-80 lg:w-96 border-l border-slate-800 bg-[#262421] flex flex-col shrink-0 z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
                        <div className="flex bg-[#1b1a18]">
                            <button className="flex-1 py-4 text-sm font-bold text-white border-b-2 border-amber-500 bg-[#262421]">Moves List</button>
                            <button className="flex-1 py-4 text-sm font-semibold text-slate-400 hover:text-white transition-colors">🤖 AI Coach</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                             {activeTab === 'play' && (
                                 <>
                                     <div className="rounded-lg p-3 bg-slate-800/50 border border-slate-700/50 flex justify-between items-center">
                                         <span className="text-slate-300 text-sm font-semibold">Current Turn</span>
                                         <span className="text-sm font-bold px-2 py-1 rounded bg-slate-700 text-white">{gameState.turn===WHITE?'White':'Black'}</span>
                                     </div>
                                     {inCheck && !gameResult && <div className="p-2 bg-red-900/30 border border-red-800 text-red-400 font-bold text-center rounded animate-pulse text-sm">⚠ KING IN CHECK</div>}
                                     {gameResult && (<div className="rounded-lg p-4 border border-amber-500/40 text-center bg-amber-900/20"><p className="text-amber-400 text-lg font-bold">Game Over</p><p className="text-amber-200 mt-1 text-sm">{gameResult}</p></div>)}

                                     <StylePanel boardTheme={boardTheme} setBoardTheme={setBoardTheme} pieceSet={pieceSet} setPieceSet={setPieceSet} />
                                     
                                     <div className="bg-[#1b1a18] rounded-lg border border-[#3c3a38] overflow-hidden">
                                         <div className="p-2 bg-[#302e2b] text-xs font-bold text-slate-300 uppercase tracking-wider text-center border-b border-[#3c3a38]">Notation</div>
                                         <div className="p-2">{renderMoveHistory()}</div>
                                     </div>
                                 </>
                             )}

                             {activeTab === 'puzzles' && (
                                 <>
                                    <StylePanel boardTheme={boardTheme} setBoardTheme={setBoardTheme} pieceSet={pieceSet} setPieceSet={setPieceSet} />

                                    {/* Engine Analysis Panel */}
                                    <PuzzleAnalysisPanel
                                        fen={stateToFEN(puzzleGameState)}
                                        puzzleStatus={puzzleStatus}
                                        puzzleFeedback={puzzleFeedback}
                                    />

                                    {currentPuzzle && (
                                        <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-900/10">
                                            <p className="text-amber-400 font-bold text-xs mb-2 border-b border-amber-500/20 pb-1 uppercase tracking-wider">Puzzle Details</p>
                                            <p className="text-slate-300 text-xs mb-1">Themes: <span className="font-semibold text-white">{currentPuzzle.themes?.join(', ')||'None'}</span></p>
                                            <p className="text-slate-400 text-xs">Rating: <span className="text-white font-semibold">{currentPuzzle.rating}</span></p>
                                            <p className="text-slate-500 text-xs mt-2 bg-slate-800/50 p-1.5 rounded text-center font-mono">
                                                Move {Math.min(puzzleMoveIdx+1,puzzleSolution.length)} / {puzzleSolution.length}
                                            </p>
                                        </div>
                                    )}
                                 </>
                             )}
                        </div>

                        <div className="p-4 bg-[#1b1a18] border-t border-[#3c3a38] space-y-3">
                            {activeTab === 'play' && (
                                <button onClick={resetGame} className="w-full py-3 bg-[#81b64c] hover:bg-[#95c95c] text-white rounded font-bold text-sm transition-colors shadow-lg shadow-black/20">
                                    + New Game
                                </button>
                            )}
                            {activeTab === 'puzzles' && (
                                <>
                                    <button onClick={fetchPuzzle} className="w-full py-3 bg-[#81b64c] hover:bg-[#95c95c] text-white rounded font-bold text-sm transition-colors shadow-lg">
                                        Next Puzzle
                                    </button>
                                    {puzzleStatus==='playing' && (
                                        <button onClick={()=>setPuzzleFeedback('💡 Solution: '+puzzleSolution.join(' → '))} className="w-full py-2 bg-[#302e2b] hover:bg-[#3c3a38] text-slate-300 rounded text-sm font-semibold transition-colors">
                                            Show Hint
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </aside>
                )}
            </main>

            {/* ── PROMOTION MODAL ── */}
            {promotionPending && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="rounded-2xl p-6 border border-amber-500/40 bg-slate-900 shadow-[0_0_50px_rgba(245,158,11,0.15)]">
                        <p className="text-amber-400 text-lg font-bold mb-4 text-center">Promote Pawn To</p>
                        <div className="flex gap-4">
                            {['q','r','b','n'].map(p=>(
                                <button key={p} onClick={()=>handlePromotion(p)} className="w-20 h-20 rounded-xl flex items-center justify-center border-2 border-slate-600 bg-slate-800 transition-all hover:scale-110 hover:border-amber-400 hover:bg-slate-700">
                                    <span style={{fontSize:'48px',lineHeight:'1'}}>{PIECE_UNICODE[gameState.turn][p]}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ══════════════════════════════════
   ROOT APP (Auth Gate)
══════════════════════════════════ */
const App = () => {
    const [user,    setUser]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [allowed, setAllowed] = useState(false);
    const [checking,setChecking]= useState(false);

    useEffect(()=>{ return auth.onAuthStateChanged(u=>{ setUser(u); setLoading(false); }); },[]);

    useEffect(()=>{
        if (!user) { setAllowed(false); return; }
        if (user.email === ADMIN_EMAIL) { setAllowed(true); return; }
        setChecking(true);
        db.collection('admin').doc('access').get()
            .then(doc=>{
                const list = doc.exists ? (doc.data().allowedEmails || []) : [];
                setAllowed(list.includes(user.email.toLowerCase()));
            })
            .catch(()=>setAllowed(false))
            .finally(()=>setChecking(false));
    },[user]);

    if (loading || checking) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <div className="text-center">
                <div className="text-7xl float-animate mb-4 text-amber-500">♛</div>
                <p className="text-slate-400 text-sm font-semibold">{checking ? 'Verifying access…' : 'Loading ChessGPT Elite…'}</p>
            </div>
        </div>
    );

    if (!user) return <LoginPage />;
    if (!allowed) return <AccessDenied user={user} />;
    return <ChessApp user={user} />;
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
