/* ═══════════════════════════════════════════
   app.js — React Components + Lichess API
   UI, tabs, board rendering, API calls sab yahan
   Lichess API → yahan
   New feature add karna → yahan
═══════════════════════════════════════════ */

const { useState, useEffect, useCallback, useRef } = React;

/* ══════════════════════════════════
   ADMIN CONFIG
   Sirf is email ko admin powers milenge
══════════════════════════════════ */
const ADMIN_EMAIL = 'nil000nilesh@gmail.com';

/* ══════════════════════════════════
   ACCESS DENIED PAGE
   Jab user whitelist mein nahi hoga
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
   ADMIN PANEL COMPONENT
   Sirf admin (ADMIN_EMAIL) ko dikhega
══════════════════════════════════ */
const AdminPanel = () => {
    const [users, setUsers]       = useState([]);
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading]   = useState(true);
    const [msg, setMsg]           = useState('');

    const showMsg = (m) => { setMsg(m); setTimeout(()=>setMsg(''), 3000); };

    // Firestore se allowed users load karo
    const loadUsers = async () => {
        setLoading(true);
        try {
            const doc = await db.collection('admin').doc('access').get();
            if (doc.exists) setUsers(doc.data().allowedEmails || []);
            else setUsers([]);
        } catch(e) { showMsg('❌ Load failed: ' + e.message); }
        setLoading(false);
    };

    useEffect(() => { loadUsers(); }, []);

    const saveUsers = async (updatedList) => {
        await db.collection('admin').doc('access').set({ allowedEmails: updatedList });
        setUsers(updatedList);
    };

    const addUser = async () => {
        const email = newEmail.trim().toLowerCase();
        if (!email || !email.includes('@')) { showMsg('⚠ Valid email daalo'); return; }
        if (users.includes(email)) { showMsg('⚠ Pehle se hai'); return; }
        try {
            await saveUsers([...users, email]);
            setNewEmail('');
            showMsg('✅ ' + email + ' add ho gaya');
        } catch(e) { showMsg('❌ ' + e.message); }
    };

    const removeUser = async (email) => {
        try {
            await saveUsers(users.filter(e => e !== email));
            showMsg('🗑 ' + email + ' remove ho gaya');
        } catch(e) { showMsg('❌ ' + e.message); }
    };

    return (
        <div className="rounded-2xl p-5 border border-amber-500/30" style={{background:'rgba(120,60,0,0.15)'}}>
            <h3 className="text-amber-400 font-semibold mb-1 flex items-center gap-2">👑 Admin Panel — User Access</h3>
            <p className="text-slate-500 text-xs mb-4">Jinhe app use karni hai unka email yahan add karo</p>

            {/* Message */}
            {msg && <div className="mb-3 p-2 rounded-lg text-xs text-center font-medium" style={{background:'rgba(30,41,59,0.9)',color:msg.startsWith('✅')?'#34d399':msg.startsWith('❌')||msg.startsWith('⚠')?'#f87171':'#fbbf24'}}>{msg}</div>}

            {/* Add user input */}
            <div className="flex gap-2 mb-4">
                <input value={newEmail} onChange={e=>setNewEmail(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&addUser()}
                    placeholder="user@gmail.com"
                    className="flex-1 px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-600 focus:border-amber-500 focus:outline-none text-sm" />
                <button onClick={addUser}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                    style={{background:'#d97706'}}>
                    ➕ Add
                </button>
            </div>

            {/* Users list */}
            {loading ? <p className="text-slate-400 text-sm text-center py-3">Loading…</p> : (
                <div className="space-y-2">
                    {users.length === 0
                        ? <p className="text-slate-500 text-sm text-center py-3">Koi user nahi. Upar email add karo.</p>
                        : users.map(email => (
                            <div key={email} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{background:'rgba(30,41,59,0.8)'}}>
                                <div className="flex items-center gap-2">
                                    <span className="text-green-400 text-xs">●</span>
                                    <span className="text-slate-300 text-sm font-mono">{email}</span>
                                    {email === ADMIN_EMAIL && <span className="text-xs px-2 py-0.5 rounded-full text-amber-300" style={{background:'rgba(217,119,6,0.2)'}}>👑 Admin</span>}
                                </div>
                                {email !== ADMIN_EMAIL && (
                                    <button onClick={()=>removeUser(email)}
                                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-900/30 transition-colors">
                                        🗑 Remove
                                    </button>
                                )}
                            </div>
                        ))
                    }
                    <p className="text-slate-600 text-xs text-right pt-1">{users.length} user(s) allowed</p>
                </div>
            )}
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
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{background:'radial-gradient(ellipse at top,#0f172a 0%,#020617 70%)'}}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
                <div style={{display:'grid',gridTemplateColumns:'repeat(8,64px)',gridTemplateRows:'repeat(8,64px)',transform:'rotate(12deg)'}}>
                    {Array(64).fill(0).map((_,i)=>{const r=Math.floor(i/8),c=i%8; return <div key={i} style={{backgroundColor:(r+c)%2===0?'#eeeed2':'#769656'}} />;})}
                </div>
            </div>
            <div className="absolute w-96 h-96 rounded-full pointer-events-none" style={{top:'-10%',left:'-10%',background:'radial-gradient(circle,rgba(217,119,6,0.12) 0%,transparent 70%)'}} />
            <div className="absolute w-96 h-96 rounded-full pointer-events-none" style={{bottom:'-10%',right:'-10%',background:'radial-gradient(circle,rgba(59,130,246,0.08) 0%,transparent 70%)'}} />
            <div className="relative z-10 w-full max-w-sm fade-in">
                <div className="rounded-3xl p-8 border" style={{background:'rgba(15,23,42,0.92)',borderColor:'rgba(100,116,139,0.25)',boxShadow:'0 0 60px rgba(217,119,6,0.12),0 25px 60px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.05)'}}>
                    <div className="text-center mb-8">
                        <div className="text-7xl float-animate mb-3">♛</div>
                        <h1 className="chess-title text-3xl font-bold mb-1" style={{background:'linear-gradient(135deg,#fbbf24,#f59e0b,#fde68a)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>ChessGPT Elite</h1>
                        <p className="text-slate-500 text-xs tracking-wider uppercase">AI-Powered Chess Training</p>
                    </div>
                    <div className="flex gap-2 mb-8 justify-center flex-wrap">
                        {[['🧩','Puzzles'],['🎮','Analysis'],['🤖','AI Coach'],['📊','Stats']].map(([ic,lb])=>(
                            <span key={lb} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium" style={{background:'rgba(30,41,59,0.8)',color:'#94a3b8',border:'1px solid rgba(51,65,85,0.5)'}}>{ic} {lb}</span>
                        ))}
                    </div>
                    <button onClick={signInWithGoogle} disabled={loading}
                        className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 select-none"
                        style={{background:'#fff',color:'#3c4043',border:'1px solid #dadce0',boxShadow:'0 1px 3px rgba(0,0,0,0.15)'}}
                        onMouseEnter={e=>{e.currentTarget.style.background='#f8f9fa';e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.2)';}}
                        onMouseLeave={e=>{e.currentTarget.style.background='#fff';e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.15)';}}>
                        {loading ? <div style={{width:20,height:20,border:'2.5px solid #ddd',borderTopColor:'#4285F4',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
                        : <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>}
                        {loading ? 'Signing in…' : 'Continue with Google'}
                    </button>
                    {err && <p className="text-red-400 text-xs text-center mt-3">{err}</p>}
                    <p className="text-slate-700 text-xs text-center mt-5">Secure sign-in via Firebase Authentication</p>
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
    const [showL,setShowL]=useState(false);
    const [showO,setShowO]=useState(false);
    const [saveErr,setSaveErr]=useState('');
    useEffect(()=>{
        db.collection('users').doc(user.uid).collection('settings').doc('apiKeys').get()
            .then(doc=>{ if(doc.exists){const d=doc.data();setLichessToken(d.lichessToken||'');setOpenaiKey(d.openaiKey||'');} })
            .catch(()=>{}).finally(()=>setLoadingK(false));
    },[user.uid]);
    const saveKeys = async () => {
        setSaving(true);setSaveErr('');
        try {
            await db.collection('users').doc(user.uid).collection('settings').doc('apiKeys').set({lichessToken,openaiKey,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
            setSaved(true);setTimeout(()=>setSaved(false),3500);
        } catch(e){setSaveErr('Save failed: '+e.message);}
        setSaving(false);
    };
    const inp="w-full px-4 py-3 bg-slate-900 text-white rounded-lg border border-slate-600 focus:border-amber-500 focus:outline-none text-sm font-mono pr-12";
    return (
        <div className="max-w-xl mx-auto space-y-5 fade-in">
            <div className="rounded-2xl p-5 border border-slate-700/50" style={{background:'rgba(30,41,59,0.7)'}}>
                <h3 className="text-amber-400 font-semibold mb-4 flex items-center gap-2">👤 Profile</h3>
                <div className="flex items-center gap-4">
                    {user.photoURL?<img src={user.photoURL} alt="av" className="w-14 h-14 rounded-full border-2 border-amber-400/40" />:<div className="w-14 h-14 rounded-full bg-amber-600 flex items-center justify-center text-white text-2xl font-bold">{user.displayName?.[0]||'U'}</div>}
                    <div className="flex-1 min-w-0"><p className="text-white font-semibold truncate">{user.displayName}</p><p className="text-slate-400 text-sm truncate">{user.email}</p></div>
                    <button onClick={()=>auth.signOut()} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-red-700/30 text-red-400 hover:bg-red-800/30 shrink-0">Sign Out</button>
                </div>
            </div>
            <div className="rounded-2xl p-5 border border-slate-700/50" style={{background:'rgba(30,41,59,0.7)'}}>
                <h3 className="text-amber-400 font-semibold mb-1 flex items-center gap-2">🔑 API Keys</h3>
                <p className="text-slate-500 text-xs mb-5">Stored privately in your Firebase account — only you can access them.</p>
                {loadingK?<p className="text-slate-400 text-center py-6 text-sm">Loading saved keys…</p>:(
                    <div className="space-y-5">
                        <div>
                            <label className="text-slate-300 text-sm font-medium mb-2 flex items-center gap-2"><span className="text-lg">♞</span> Lichess API Token <span className="text-slate-600 text-xs">(puzzles · games · analysis)</span></label>
                            <div className="relative"><input type={showL?'text':'password'} value={lichessToken} onChange={e=>setLichessToken(e.target.value)} placeholder="lip_xxxxxxxxxxxxxxxxxxxxxxxx" className={inp} /><button onClick={()=>setShowL(!showL)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm select-none">{showL?'🙈':'👁️'}</button></div>
                            <p className="text-xs text-slate-600 mt-1.5">Get token → <span className="text-blue-400 cursor-pointer">lichess.org/account/oauth/token</span></p>
                        </div>
                        <div>
                            <label className="text-slate-300 text-sm font-medium mb-2 flex items-center gap-2"><span className="text-lg">🤖</span> OpenAI API Key <span className="text-slate-600 text-xs">(AI coaching · move analysis)</span></label>
                            <div className="relative"><input type={showO?'text':'password'} value={openaiKey} onChange={e=>setOpenaiKey(e.target.value)} placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" className={inp} /><button onClick={()=>setShowO(!showO)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm select-none">{showO?'🙈':'👁️'}</button></div>
                            <p className="text-xs text-slate-600 mt-1.5">Get key → <span className="text-blue-400 cursor-pointer">platform.openai.com/api-keys</span></p>
                        </div>
                        {saveErr&&<p className="text-red-400 text-xs">{saveErr}</p>}
                        <button onClick={saveKeys} disabled={saving} className="w-full py-3 rounded-xl font-semibold transition-all text-sm" style={{background:saving?'#334155':saved?'#15803d':'#d97706',color:saving?'#94a3b8':'#fff'}}>
                            {saving?'💾 Saving…':saved?'✅ Saved Successfully!':'💾 Save API Keys to Firebase'}
                        </button>
                    </div>
                )}
            </div>
            <div className="rounded-2xl p-5 border border-blue-800/30" style={{background:'rgba(30,58,138,0.1)'}}>
                <h4 className="text-blue-400 font-semibold mb-3 text-sm">ℹ️ How Keys Are Used</h4>
                <div className="space-y-2 text-xs text-slate-400">
                    <p>• <strong className="text-slate-300">Lichess Token</strong> — Fetch daily puzzles, player game history, board analysis API</p>
                    <p>• <strong className="text-slate-300">OpenAI Key</strong> — AI move suggestions, natural language coaching, game commentary</p>
                    <p>• Keys are stored in <code className="text-amber-400 text-xs">Firestore → users/{user.uid.slice(0,8)}…/settings/apiKeys</code></p>
                </div>
            </div>
            {/* Admin Panel — sirf admin ko dikhega */}
            {user.email === ADMIN_EMAIL && <AdminPanel />}
        </div>
    );
};

/* ══════════════════════════════════
   STYLE PANEL (Board + Piece)
══════════════════════════════════ */
const StylePanel = ({ boardTheme, setBoardTheme, pieceSet, setPieceSet }) => {
    const [expanded,setExpanded]=useState(false);
    const [activecat,setActiveCat]=useState('♞ Lichess');
    const [activePieceCat,setActivePieceCat]=useState('♞ Lichess');
    const boardCats=['♟ Chess.com','♞ Lichess','👑 Classic'];
    const pieceCats=['♞ Lichess','♟ Chess.com','👑 Classic'];
    return (
        <div className="rounded-xl border border-slate-700/50 overflow-hidden" style={{background:'rgba(30,41,59,0.8)'}}>
            <button onClick={()=>setExpanded(!expanded)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors">
                <span className="text-amber-400 font-semibold text-sm flex items-center gap-2">🎨 Board &amp; Piece Style</span>
                <span className="text-slate-400 text-xs">{expanded?'▲ Less':'▼ More'}</span>
            </button>
            <div className="px-3 pb-3 flex gap-2 overflow-x-auto">
                {BOARD_THEMES.slice(0,6).map(t=>(
                    <button key={t.id} onClick={()=>setBoardTheme(t)} title={t.name} className={`shrink-0 flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${boardTheme.id===t.id?'ring-2 ring-amber-400 bg-slate-700':'hover:bg-slate-700/50'}`}>
                        <div className="theme-preview border border-slate-600/50"><div style={{backgroundColor:t.light}} /><div style={{backgroundColor:t.dark}} /><div style={{backgroundColor:t.dark}} /><div style={{backgroundColor:t.light}} /></div>
                        <span className="text-xs text-slate-400" style={{fontSize:'9px'}}>{t.name}</span>
                    </button>
                ))}
            </div>
            {expanded&&(
                <div className="border-t border-slate-700/50 p-3 space-y-5">
                    <div>
                        <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Board Theme</p>
                        <div className="flex gap-1 mb-3">
                            {boardCats.map(c=><button key={c} onClick={()=>setActiveCat(c)} className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all" style={{background:activecat===c?'rgba(217,119,6,0.2)':'transparent',color:activecat===c?'#fbbf24':'#94a3b8',border:activecat===c?'1px solid rgba(217,119,6,0.3)':'1px solid rgba(51,65,85,0.3)'}}>{c}</button>)}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {BOARD_THEMES.filter(t=>t.cat===activecat).map(t=>(
                                <button key={t.id} onClick={()=>setBoardTheme(t)} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${boardTheme.id===t.id?'ring-2 ring-amber-400 bg-slate-700/70':'hover:bg-slate-700/40 border border-transparent'}`}>
                                    <div className="theme-preview border border-slate-600/50" style={{width:40,height:40}}><div style={{backgroundColor:t.light}} /><div style={{backgroundColor:t.dark}} /><div style={{backgroundColor:t.dark}} /><div style={{backgroundColor:t.light}} /></div>
                                    <span className="text-xs text-slate-300">{t.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="pt-3 border-t border-slate-700/50">
                        <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Piece Set</p>
                        <div className="flex gap-1 mb-3">
                            {pieceCats.map(c=><button key={c} onClick={()=>setActivePieceCat(c)} className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all" style={{background:activePieceCat===c?'rgba(217,119,6,0.2)':'transparent',color:activePieceCat===c?'#fbbf24':'#94a3b8',border:activePieceCat===c?'1px solid rgba(217,119,6,0.3)':'1px solid rgba(51,65,85,0.3)'}}>{c}</button>)}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {PIECE_SETS.filter(ps=>ps.cat===activePieceCat).map(ps=>(
                                <button key={ps.id} onClick={()=>setPieceSet(ps.id)} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${pieceSet===ps.id?'ring-2 ring-amber-400 bg-slate-700/70':'hover:bg-slate-700/40'}`}>
                                    <div className="flex gap-0.5">
                                        <img src={getPieceImg(WHITE,'n',ps.id)} alt="wN" style={{width:28,height:28,objectFit:'contain'}} onError={e=>{e.target.style.display='none';}} />
                                        <img src={getPieceImg(BLACK,'n',ps.id)} alt="bN" style={{width:28,height:28,objectFit:'contain'}} onError={e=>{e.target.style.display='none';}} />
                                    </div>
                                    <span className="text-xs text-slate-300">{ps.name}</span>
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
   CHESS APP (Main Component)
══════════════════════════════════ */
const ChessApp = ({ user }) => {
    // Game state
    const [gameState,setGameState]=useState(()=>parseFEN(INITIAL_FEN));
    const [selectedSquare,setSelectedSquare]=useState(null);
    const [legalMovesForSelected,setLegalMovesForSelected]=useState([]);
    const [lastMove,setLastMove]=useState(null);
    const [moveHistory,setMoveHistory]=useState([]);
    const [gameResult,setGameResult]=useState(null);
    const [promotionPending,setPromotionPending]=useState(null);
    const [capturedPieces,setCapturedPieces]=useState({w:[],b:[]});
    // UI state
    const [activeTab,setActiveTab]=useState('play');
    const [boardTheme,setBoardTheme]=useState(BOARD_THEMES[6]); // li-brown default
    const [pieceSet,setPieceSet]=useState('cburnett');
    // Puzzle state
    const [currentPuzzle,setCurrentPuzzle]=useState(null);
    const [puzzleStatus,setPuzzleStatus]=useState('idle');
    const [puzzleGameState,setPuzzleGameState]=useState(()=>parseFEN(INITIAL_FEN));
    const [puzzleSolution,setPuzzleSolution]=useState([]);
    const [puzzleMoveIdx,setPuzzleMoveIdx]=useState(0);
    const [puzzleFeedback,setPuzzleFeedback]=useState('');
    // Games tab state
    const [playerUsername,setPlayerUsername]=useState('magnus');
    const [userGames,setUserGames]=useState([]);
    const [loadingGames,setLoadingGames]=useState(false);
    const [playerStats,setPlayerStats]=useState(null);
    // Lichess state
    const [lichessToken,setLichessToken]=useState('');
    const [myAccount,setMyAccount]=useState(null);
    const [lichessTab,setLichessTab]=useState('account');
    const [challenges,setChallenges]=useState({in:[],out:[]});
    const [challengeTarget,setChallengeTarget]=useState('');
    const [challengeTime,setChallengeTime]=useState(5);
    const [challengeInc,setChallengeInc]=useState(3);
    const [challengeColor,setChallengeColor]=useState('random');
    const [challengeVariant,setChallengeVariant]=useState('standard');
    const [tournaments,setTournaments]=useState([]);
    const [puzzleActivity,setPuzzleActivity]=useState([]);
    const [boardGames,setBoardGames]=useState([]);
    const [activeGameId,setActiveGameId]=useState(null);
    const [gameEvents,setGameEvents]=useState([]);
    const [moveInput,setMoveInput]=useState('');
    const [lichessLoading,setLichessLoading]=useState({});
    const [lichessMsg,setLichessMsg]=useState('');
    const eventSourceRef=useRef(null);

    // Load Lichess token from Firestore on login
    useEffect(()=>{
        if (!user?.uid) return;
        db.collection('users').doc(user.uid).collection('settings').doc('apiKeys').get()
            .then(doc=>{ if(doc.exists){const t=doc.data().lichessToken||'';setLichessToken(t);if(t) fetchMyAccount(t);} })
            .catch(()=>{});
    },[user?.uid]);

    // ── Helpers ──
    const lichessAPI = async (path, options={}, token=lichessToken) => {
        const headers={'Authorization':`Bearer ${token}`, ...(options.headers||{})};
        return fetch(`https://lichess.org${path}`,{...options,headers});
    };
    const parseNDJSON = (text) => text.trim().split('\n').filter(Boolean).map(l=>{try{return JSON.parse(l);}catch{return null;}}).filter(Boolean);
    const setLoading = (key,val) => setLichessLoading(p=>({...p,[key]:val}));
    const showMsg = (msg,ms=3000) => { setLichessMsg(msg); setTimeout(()=>setLichessMsg(''),ms); };

    // ── Lichess API calls ──
    const fetchMyAccount = async (token=lichessToken) => {
        if (!token) return;
        try { const r=await lichessAPI('/api/account',{},token); if(r.ok) setMyAccount(await r.json()); } catch(e){}
    };
    const fetchChallenges = async () => {
        if (!lichessToken) { showMsg('⚠ Lichess Token required'); return; }
        setLoading('challenges',true);
        try { const r=await lichessAPI('/api/challenge'); if(!r.ok) throw new Error(r.status); const d=await r.json(); setChallenges({in:d.in||[],out:d.out||[]}); } catch(e){ showMsg('Challenges load failed: '+e.message); }
        setLoading('challenges',false);
    };
    const sendChallenge = async () => {
        if (!lichessToken) { showMsg('⚠ Lichess Token required'); return; }
        if (!challengeTarget.trim()) { showMsg('⚠ Username daalo'); return; }
        setLoading('sendChallenge',true);
        try {
            const body=new URLSearchParams({clock_limit:challengeTime*60,clock_increment:challengeInc,color:challengeColor,variant:challengeVariant});
            const r=await lichessAPI(`/api/challenge/${challengeTarget.trim()}`,{method:'POST',body,headers:{'Content-Type':'application/x-www-form-urlencoded'}});
            const d=await r.json();
            if(r.ok&&d.challenge){showMsg('✅ Challenge sent to '+challengeTarget);fetchChallenges();}
            else showMsg('❌ '+(d.error||'Challenge failed'));
        } catch(e){showMsg('Error: '+e.message);}
        setLoading('sendChallenge',false);
    };
    const acceptChallenge=async(id)=>{setLoading('ch_'+id,true);try{const r=await lichessAPI(`/api/challenge/${id}/accept`,{method:'POST'});if(r.ok){showMsg('✅ Challenge accepted');fetchChallenges();}else showMsg('❌ Accept failed');}catch(e){showMsg(e.message);}setLoading('ch_'+id,false);};
    const declineChallenge=async(id)=>{setLoading('dc_'+id,true);try{const r=await lichessAPI(`/api/challenge/${id}/decline`,{method:'POST'});if(r.ok){showMsg('✅ Challenge declined');fetchChallenges();}else showMsg('❌ Decline failed');}catch(e){showMsg(e.message);}setLoading('dc_'+id,false);};
    const cancelChallenge=async(id)=>{setLoading('cc_'+id,true);try{const r=await lichessAPI(`/api/challenge/${id}/cancel`,{method:'POST'});if(r.ok)showMsg('Challenge cancelled');}catch(e){}setLoading('cc_'+id,false);};
    const fetchBoardGames=async()=>{if(!lichessToken){showMsg('⚠ Lichess Token required');return;}setLoading('boardGames',true);try{const r=await lichessAPI('/api/account/playing');if(!r.ok)throw new Error(r.status);const d=await r.json();setBoardGames(d.nowPlaying||[]);}catch(e){showMsg('Board games load failed: '+e.message);}setLoading('boardGames',false);};
    const streamBoardGame=(gameId)=>{if(eventSourceRef.current) eventSourceRef.current.close();setActiveGameId(gameId);setGameEvents([]);const es=new EventSource(`https://lichess.org/api/board/game/stream/${gameId}`,{withCredentials:false});es.onmessage=(e)=>{if(e.data)try{const d=JSON.parse(e.data);setGameEvents(prev=>[d,...prev.slice(0,29)]);}catch{}};es.onerror=()=>es.close();eventSourceRef.current=es;showMsg('🎮 Streaming game: '+gameId);};
    const boardMove=async(gameId,move)=>{if(!move.trim())return;try{const r=await lichessAPI(`/api/board/game/${gameId}/move/${move.trim()}`,{method:'POST'});if(r.ok){setMoveInput('');showMsg('✅ Move played: '+move);}else{const d=await r.json();showMsg('❌ '+(d.error||'Move failed'));}}catch(e){showMsg(e.message);}};
    const abortGame=async(gameId)=>{try{const r=await lichessAPI(`/api/board/game/${gameId}/abort`,{method:'POST'});if(r.ok)showMsg('Game aborted');}catch{}};
    const resignGame=async(gameId)=>{try{const r=await lichessAPI(`/api/board/game/${gameId}/resign`,{method:'POST'});if(r.ok)showMsg('Resigned');}catch{}};
    const fetchTournaments=async()=>{setLoading('tournaments',true);try{const r=await fetch('https://lichess.org/api/tournament');if(!r.ok)throw new Error(r.status);const d=await r.json();setTournaments([...(d.created||[]),...(d.started||[])].slice(0,15));}catch(e){showMsg('Tournaments load failed: '+e.message);}setLoading('tournaments',false);};
    const joinTournament=async(id)=>{if(!lichessToken){showMsg('⚠ Lichess Token required');return;}setLoading('tj_'+id,true);try{const r=await lichessAPI(`/api/tournament/${id}/join`,{method:'POST'});if(r.ok)showMsg('✅ Tournament joined!');else{const d=await r.json();showMsg('❌ '+(d.error||'Join failed'));}}catch(e){showMsg(e.message);}setLoading('tj_'+id,false);};
    const createPuzzleRace=async()=>{if(!lichessToken){showMsg('⚠ Lichess Token required');return;}setLoading('puzzleRace',true);try{const r=await lichessAPI('/api/racer',{method:'POST'});if(!r.ok)throw new Error(r.status);const d=await r.json();if(d.id){showMsg('🏁 Race created! ID: '+d.id);window.open(`https://lichess.org/racer/${d.id}`,'_blank');}}catch(e){showMsg('Puzzle Race create failed: '+e.message);}setLoading('puzzleRace',false);};
    const fetchPuzzleActivity=async()=>{if(!lichessToken){showMsg('⚠ Settings mein Lichess Token save karo pehle');return;}setLoading('puzzleActivity',true);try{const r=await lichessAPI('/api/puzzle/activity?max=20');if(!r.ok)throw new Error(r.status);const text=await r.text();setPuzzleActivity(parseNDJSON(text));}catch(e){showMsg('Puzzle activity load failed: '+e.message);}setLoading('puzzleActivity',false);};
    const fetchUserGames=async(username)=>{try{setLoadingGames(true);const headers=lichessToken?{'Authorization':`Bearer ${lichessToken}`,'Accept':'application/x-ndjson'}:{'Accept':'application/x-ndjson'};const [gRes,sRes]=await Promise.all([fetch(`https://lichess.org/api/games/user/${username}?max=15&opening=true`,{headers}),fetch(`https://lichess.org/api/user/${username}`)]);if(!gRes.ok)throw new Error('Games: '+gRes.status);const gText=await gRes.text();setUserGames(parseNDJSON(gText));if(sRes.ok)setPlayerStats(await sRes.json());}catch(e){showMsg('Games load failed: '+e.message);}finally{setLoadingGames(false);}};

    // ── PGN helpers for puzzles ──
    const sanToMove=(state,san)=>{const clean=san.replace(/[+#?!=x]/g,'').replace('O-O-O','q-castle').replace('O-O','k-castle');const legal=generateLegalMoves(state,state.turn);if(san.startsWith('O-O-O')||san==='0-0-0')return legal.find(m=>m.special?.type==='castle'&&m.to[1]===2)||null;if(san.startsWith('O-O')||san==='0-0')return legal.find(m=>m.special?.type==='castle'&&m.to[1]===6)||null;const files='abcdefgh',ranks='87654321',isPromo=san.includes('='),promoP=isPromo?san.slice(san.indexOf('=')+1)[0].toLowerCase():null;const s=clean.replace(/^[KQRBN]/,'');const toFile=s.slice(-2,-1),toRank=s.slice(-1);const toC=files.indexOf(toFile),toR=ranks.indexOf(toRank);if(toC<0||toR<0)return null;const pieceChar=/^[KQRBN]/.test(san)?san[0].toLowerCase():'p';const disambig=clean.replace(/^[KQRBN]/,'').slice(0,-2);return legal.find(m=>{if(m.to[0]!==toR||m.to[1]!==toC)return false;if(m.piece!==pieceChar)return false;if(isPromo&&m.special?.promote!==promoP)return false;if(disambig.length===1){if(/[a-h]/.test(disambig)&&m.from[1]!==files.indexOf(disambig))return false;if(/[1-8]/.test(disambig)&&m.from[0]!==ranks.indexOf(disambig))return false;}if(disambig.length===2){if(m.from[1]!==files.indexOf(disambig[0])||m.from[0]!==ranks.indexOf(disambig[1]))return false;}return true;})||null;};
    const replayPGN=(pgn,targetPly)=>{const stripped=pgn.replace(/\[.*?\]\s*/g,'').replace(/\{[^}]*\}/g,'').replace(/\d+\.\s*/g,'').trim();const tokens=stripped.split(/\s+/).filter(t=>t&&!/^\d/.test(t)&&t!=='*'&&t!=='1-0'&&t!=='0-1'&&t!=='1/2-1/2');let state=parseFEN(INITIAL_FEN);for(let i=0;i<Math.min(targetPly,tokens.length);i++){const move=sanToMove(state,tokens[i]);if(!move)break;state=applyMove(state,move);}return state;};

    // ── Puzzle fetch ──
    const fetchPuzzle=async()=>{try{setPuzzleStatus('loading');setPuzzleFeedback('');const headers=lichessToken?{'Authorization':`Bearer ${lichessToken}`,'Accept':'application/json'}:{'Accept':'application/json'};const r=await fetch('https://lichess.org/api/puzzle/daily',{headers});if(!r.ok)throw new Error('HTTP '+r.status);const d=await r.json();if(!d?.puzzle||!d?.game)throw new Error('Invalid puzzle response');const startState=replayPGN(d.game.pgn,d.puzzle.initialPly);setPuzzleGameState(startState);setCurrentPuzzle(d.puzzle);setPuzzleSolution(d.puzzle.solution||[]);setPuzzleMoveIdx(0);setPuzzleStatus('playing');}catch(e){setPuzzleStatus('error');}};

    // ── Puzzle move handler ──
    const handlePuzzleMove=(row,col)=>{if(puzzleStatus!=='playing'||!currentPuzzle)return;const piece=puzzleGameState.board[row][col];if(piece&&piece.color===puzzleGameState.turn){setPuzzleGameState(prev=>{const sel=prev._selected;if(sel){const legal=generateLegalMoves(prev,prev.turn);const m=legal.find(mv=>mv.from[0]===sel[0]&&mv.from[1]===sel[1]&&mv.to[0]===row&&mv.to[1]===col);if(m){const uci=puzzleSolution[puzzleMoveIdx];const files='abcdefgh',ranks='87654321';const expFrom=[ranks.indexOf(uci[1]),files.indexOf(uci[0])];const expTo=[ranks.indexOf(uci[3]),files.indexOf(uci[2])];const isCorrect=sel[0]===expFrom[0]&&sel[1]===expFrom[1]&&row===expTo[0]&&col===expTo[1];if(isCorrect){let ns=applyMove(prev,m);delete ns._selected;const nextIdx=puzzleMoveIdx+1;if(nextIdx>=puzzleSolution.length){setPuzzleFeedback('✅ Puzzle Solved! 🎉');setPuzzleStatus('solved');return ns;}const oppUci=puzzleSolution[nextIdx];if(oppUci){const oppLegal=generateLegalMoves(ns,ns.turn);const of1=[ranks.indexOf(oppUci[1]),files.indexOf(oppUci[0])];const ot1=[ranks.indexOf(oppUci[3]),files.indexOf(oppUci[2])];const oppM=oppLegal.find(mv=>mv.from[0]===of1[0]&&mv.from[1]===of1[1]&&mv.to[0]===ot1[0]&&mv.to[1]===ot1[1]);if(oppM)ns=applyMove(ns,oppM);}setPuzzleMoveIdx(nextIdx+1);setPuzzleFeedback('✅ Correct! Continue…');return ns;}else{setPuzzleFeedback('❌ Wrong move');return{...prev,_selected:null};}}}return{...prev,_selected:[row,col]};});}else{setPuzzleGameState(prev=>{const sel=prev._selected;if(sel){const legal=generateLegalMoves(prev,prev.turn);const m=legal.find(mv=>mv.from[0]===sel[0]&&mv.from[1]===sel[1]&&mv.to[0]===row&&mv.to[1]===col);if(m){const uci=puzzleSolution[puzzleMoveIdx];const files='abcdefgh',ranks='87654321';const expFrom=[ranks.indexOf(uci[1]),files.indexOf(uci[0])];const expTo=[ranks.indexOf(uci[3]),files.indexOf(uci[2])];const isCorrect=sel[0]===expFrom[0]&&sel[1]===expFrom[1]&&row===expTo[0]&&col===expTo[1];if(isCorrect){let ns=applyMove(prev,m);delete ns._selected;const nextIdx=puzzleMoveIdx+1;if(nextIdx>=puzzleSolution.length){setPuzzleFeedback('✅ Puzzle Solved! 🎉');setPuzzleStatus('solved');return ns;}const oppUci=puzzleSolution[nextIdx];if(oppUci){const oppLegal=generateLegalMoves(ns,ns.turn);const of1=[ranks.indexOf(oppUci[1]),files.indexOf(oppUci[0])];const ot1=[ranks.indexOf(oppUci[3]),files.indexOf(oppUci[2])];const oppM=oppLegal.find(mv=>mv.from[0]===of1[0]&&mv.from[1]===of1[1]&&mv.to[0]===ot1[0]&&mv.to[1]===ot1[1]);if(oppM)ns=applyMove(ns,oppM);}setPuzzleMoveIdx(nextIdx+1);setPuzzleFeedback('✅ Correct! Continue…');return ns;}else{setPuzzleFeedback('❌ Wrong move');return{...prev,_selected:null};}}}return{...prev,_selected:null};});}};

    // ── Game controls ──
    const resetGame=()=>{setGameState(parseFEN(INITIAL_FEN));setSelectedSquare(null);setLegalMovesForSelected([]);setLastMove(null);setMoveHistory([]);setGameResult(null);setPromotionPending(null);setCapturedPieces({w:[],b:[]});};
    const selectPiece=(row,col)=>{setSelectedSquare([row,col]);setLegalMovesForSelected(generateLegalMoves(gameState,gameState.turn).filter(m=>m.from[0]===row&&m.from[1]===col));};
    const executeMove=(move)=>{const notation=moveToAlgebraic(gameState,move),captured=gameState.board[move.to[0]][move.to[1]];if(captured||move.special?.type==='enPassant'){const cp=captured||gameState.board[move.from[0]][move.to[1]];if(cp)setCapturedPieces(prev=>({...prev,[cp.color]:[...prev[cp.color],cp.type]}));}const ns=applyMove(gameState,move);setGameState(ns);setSelectedSquare(null);setLegalMovesForSelected([]);setLastMove({from:move.from,to:move.to});setMoveHistory(prev=>[...prev,notation]);setPromotionPending(null);const res=getGameResult(ns);if(res)setGameResult(res);};
    const handleSquareClick=useCallback((row,col)=>{if(gameResult||promotionPending)return;const piece=gameState.board[row][col];if(selectedSquare){if(selectedSquare[0]===row&&selectedSquare[1]===col){setSelectedSquare(null);setLegalMovesForSelected([]);return;}const matches=legalMovesForSelected.filter(m=>m.to[0]===row&&m.to[1]===col);if(matches.length>0){if(matches.length>1&&matches[0].special?.type==='promotion'){setPromotionPending({moves:matches});return;}executeMove(matches[0]);return;}if(piece&&piece.color===gameState.turn){selectPiece(row,col);return;}setSelectedSquare(null);setLegalMovesForSelected([]);return;}if(piece&&piece.color===gameState.turn)selectPiece(row,col);},[gameState,selectedSquare,legalMovesForSelected,gameResult,promotionPending]);
    const handlePromotion=(p)=>{if(!promotionPending)return;const m=promotionPending.moves.find(m=>m.special.promote===p);if(m)executeMove(m);};
    const isLegalTarget=(r,c)=>legalMovesForSelected.some(m=>m.to[0]===r&&m.to[1]===c);
    const inCheck=isInCheck(gameState.board,gameState.turn);
    const kingPos=findKing(gameState.board,gameState.turn);

    // ── Render helpers ──
    const renderPiece=(piece)=>(
        <img src={getPieceImg(piece.color,piece.type,pieceSet)} alt={piece.type} draggable={false}
            style={{width:'82%',height:'82%',objectFit:'contain',userSelect:'none',pointerEvents:'none',filter:'drop-shadow(0 2px 3px rgba(0,0,0,0.4))'}} />
    );
    const renderCaptured=(color)=>{const order={q:1,r:2,b:3,n:4,p:5};const sorted=[...capturedPieces[color]].sort((a,b)=>order[a]-order[b]);return <div className="flex flex-wrap gap-0.5 min-h-[22px] items-center">{sorted.map((p,i)=><img key={i} src={getPieceImg(color,p,pieceSet)} alt={p} draggable={false} style={{width:20,height:20,objectFit:'contain'}} />)}</div>;};

    const renderBoard=()=>{const files=['a','b','c','d','e','f','g','h'],t=boardTheme;return(
        <div className="inline-block shadow-2xl rounded-xl overflow-hidden" style={{border:`8px solid ${t.border}`,boxShadow:`0 0 40px ${t.glow},0 12px 40px rgba(0,0,0,0.55)`}}>
            {Array.from({length:8},(_,r)=>(
                <div key={r} className="flex">
                    {Array.from({length:8},(_,c)=>{const piece=gameState.board[r][c],isLight=(r+c)%2===0,isSel=selectedSquare&&selectedSquare[0]===r&&selectedSquare[1]===c,isLeg=isLegalTarget(r,c),isLast=lastMove&&((lastMove.from[0]===r&&lastMove.from[1]===c)||(lastMove.to[0]===r&&lastMove.to[1]===c)),isKC=inCheck&&kingPos&&kingPos[0]===r&&kingPos[1]===c;let bg=isLight?t.light:t.dark;if(isLast)bg=isLight?t.lastLight:t.lastDark;let cls='';if(isSel)cls+=' square-selected';if(isLeg&&!piece)cls+=' square-legal';if(isLeg&&piece)cls+=' square-capture';if(isKC)cls+=' square-check';return(<div key={`${r}-${c}`} className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center cursor-pointer select-none relative${cls}`} style={{backgroundColor:bg}} onClick={()=>handleSquareClick(r,c)}>{piece&&renderPiece(piece)}{r===7&&<span className="absolute bottom-0.5 right-1 text-xs font-semibold pointer-events-none" style={{color:isLight?t.labelLight:t.labelDark}}>{files[c]}</span>}{c===0&&<span className="absolute top-0.5 left-1 text-xs font-semibold pointer-events-none" style={{color:isLight?t.labelLight:t.labelDark}}>{8-r}</span>}</div>);})}
                </div>
            ))}
        </div>
    );};

    const renderPuzzleBoard=()=>{const files=['a','b','c','d','e','f','g','h'],t=boardTheme,ps=puzzleGameState;return(
        <div className="inline-block shadow-2xl rounded-xl overflow-hidden" style={{border:`8px solid ${t.border}`,boxShadow:`0 0 40px ${t.glow},0 12px 40px rgba(0,0,0,0.55)`}}>
            {Array.from({length:8},(_,r)=>(
                <div key={r} className="flex">
                    {Array.from({length:8},(_,c)=>{const piece=ps.board[r][c],isLight=(r+c)%2===0,isSel=ps._selected&&ps._selected[0]===r&&ps._selected[1]===c;let bg=isLight?t.light:t.dark,cls='';if(isSel)cls+=' square-selected';return(<div key={`${r}-${c}`} className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center cursor-pointer select-none relative${cls}`} style={{backgroundColor:bg}} onClick={()=>handlePuzzleMove(r,c)}>{piece&&<img src={getPieceImg(piece.color,piece.type,pieceSet)} alt={piece.type} draggable={false} style={{width:'82%',height:'82%',objectFit:'contain',userSelect:'none',pointerEvents:'none',filter:'drop-shadow(0 2px 3px rgba(0,0,0,0.4))'}} />}{r===7&&<span className="absolute bottom-0.5 right-1 text-xs font-semibold pointer-events-none" style={{color:isLight?t.labelLight:t.labelDark}}>{files[c]}</span>}{c===0&&<span className="absolute top-0.5 left-1 text-xs font-semibold pointer-events-none" style={{color:isLight?t.labelLight:t.labelDark}}>{8-r}</span>}</div>);})}
                </div>
            ))}
        </div>
    );};

    const renderMoveHistory=()=>{const pairs=[];for(let i=0;i<moveHistory.length;i+=2)pairs.push({num:Math.floor(i/2)+1,w:moveHistory[i],b:moveHistory[i+1]||''});return(<div className="max-h-52 overflow-y-auto space-y-0.5 text-sm font-mono">{pairs.length===0?<p className="text-slate-500 text-center italic text-xs py-4">Make a move…</p>:pairs.map(p=><div key={p.num} className="flex gap-2 text-slate-300 px-1 py-0.5 rounded hover:bg-slate-700/30"><span className="text-slate-600 w-8">{p.num}.</span><span className="w-14">{p.w}</span><span className="w-14">{p.b}</span></div>)}</div>);};

    const TABS=[{id:'play',label:'♟ Play'},{id:'puzzles',label:'🧩 Puzzles'},{id:'games',label:'🎮 Games'},{id:'lichess',label:'♞ Lichess'},...(user.email===ADMIN_EMAIL?[{id:'settings',label:'⚙️ Settings'}]:[])];

    return (
        <div className="min-h-screen p-4 sm:p-6" style={{background:'radial-gradient(ellipse at top,#0f172a 0%,#020617 80%)'}}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-3">
                        <div className="text-4xl float-animate">♛</div>
                        <h1 className="chess-title text-2xl sm:text-3xl font-bold" style={{background:'linear-gradient(135deg,#fbbf24,#f59e0b)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>ChessGPT Elite</h1>
                    </div>
                    {user&&(<div className="flex items-center gap-2">{user.photoURL&&<img src={user.photoURL} alt="u" className="w-8 h-8 rounded-full border border-amber-400/30" />}<span className="text-slate-400 text-sm hidden sm:block">{user.displayName?.split(' ')[0]}</span><button onClick={()=>auth.signOut()} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border border-red-700/40 text-red-400 hover:bg-red-800/30" title="Sign Out">🚪 Logout</button></div>)}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 border-b border-slate-800">
                    {TABS.map(t=>(<button key={t.id} onClick={()=>{setActiveTab(t.id);if(t.id==='puzzles'&&!currentPuzzle)fetchPuzzle();if(t.id==='lichess'){fetchMyAccount();fetchChallenges();fetchBoardGames();fetchTournaments();}}} className={`pb-3 px-3 font-semibold transition-colors text-sm ${activeTab===t.id?'tab-active':'tab-inactive'}`}>{t.label}</button>))}
                </div>

                {/* ── PLAY TAB ── */}
                {activeTab==='play'&&(
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 fade-in">
                        <div className="lg:col-span-2 rounded-2xl p-4 sm:p-6 border border-slate-700/40" style={{background:'rgba(15,23,42,0.7)'}}>
                            <div className="flex flex-col items-center">
                                <div className="w-full flex items-center justify-between mb-3 px-1"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-900 border border-gray-600" /><span className={`font-semibold text-sm ${gameState.turn===BLACK&&!gameResult?'text-amber-400':'text-slate-400'}`}>Black</span></div>{renderCaptured('w')}</div>
                                {renderBoard()}
                                <div className="w-full flex items-center justify-between mt-3 px-1"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-white border border-gray-300" /><span className={`font-semibold text-sm ${gameState.turn===WHITE&&!gameResult?'text-amber-400':'text-slate-400'}`}>White</span></div>{renderCaptured('b')}</div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <StylePanel boardTheme={boardTheme} setBoardTheme={setBoardTheme} pieceSet={pieceSet} setPieceSet={setPieceSet} />
                            <div className="rounded-xl p-4 border border-slate-700/50" style={{background:'rgba(30,41,59,0.7)'}}>
                                <div className="flex items-center justify-between"><span className="text-slate-400 text-sm font-semibold">Turn</span><div className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full border ${gameState.turn===WHITE?'bg-white border-gray-300':'bg-gray-900 border-gray-600'}`} /><span className="text-base font-bold text-white">{gameState.turn===WHITE?'White':'Black'}</span></div></div>
                                {inCheck&&!gameResult&&<div className="mt-2 text-red-400 font-semibold text-center animate-pulse text-sm">⚠ CHECK!</div>}
                            </div>
                            {gameResult&&(<div className="rounded-xl p-4 border border-amber-500/40 text-center" style={{background:'rgba(120,80,0,0.25)'}}><p className="text-amber-300 text-lg font-bold">🏆 Game Over</p><p className="text-amber-100 mt-1 text-sm">{gameResult}</p></div>)}
                            <div className="rounded-xl p-4 border border-slate-700/50" style={{background:'rgba(30,41,59,0.7)'}}><h3 className="text-amber-400 font-semibold mb-2 text-sm">Captured Pieces</h3><div className="space-y-2"><div><span className="text-xs text-slate-500">By White: </span>{renderCaptured('b')}</div><div><span className="text-xs text-slate-500">By Black: </span>{renderCaptured('w')}</div></div></div>
                            <div className="rounded-xl p-4 border border-slate-700/50" style={{background:'rgba(30,41,59,0.7)'}}><h3 className="text-amber-400 font-semibold mb-2 text-sm">Move History</h3>{renderMoveHistory()}</div>
                            <button onClick={resetGame} className="w-full px-4 py-3 bg-blue-700 hover:bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors text-sm">🔄 New Game</button>
                        </div>
                    </div>
                )}

                {/* ── PUZZLES TAB ── */}
                {activeTab==='puzzles'&&(
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
                        <div className="lg:col-span-2 rounded-2xl p-6 border border-slate-700/40" style={{background:'rgba(15,23,42,0.7)'}}>
                            {puzzleStatus==='loading'?<div className="flex items-center justify-center h-80"><div className="text-center"><div className="text-6xl mb-4 animate-pulse">♘</div><p className="text-slate-400">Loading puzzle…</p></div></div>
                            :puzzleStatus==='idle'?<div className="flex items-center justify-center h-80 flex-col gap-4"><div className="text-6xl">🧩</div><p className="text-slate-400">Daily puzzle load karne ke liye button dabao</p><button onClick={fetchPuzzle} className="px-6 py-3 bg-blue-700 text-white rounded-xl font-semibold text-sm hover:bg-blue-600">Load Daily Puzzle</button></div>
                            :puzzleStatus==='error'?<div className="flex items-center justify-center h-80 flex-col gap-4"><div className="text-5xl">⚠️</div><p className="text-red-400 text-sm">Puzzle load nahi hua. Retry karo.</p><button onClick={fetchPuzzle} className="px-5 py-2 bg-blue-700 text-white rounded-lg text-sm">Retry</button></div>
                            :<div className="flex flex-col items-center">
                                <div className="mb-3 text-sm font-semibold" style={{color:puzzleGameState.turn===WHITE?'#e2e8f0':'#94a3b8'}}>{puzzleGameState.turn===WHITE?'⬜ White':'⬛ Black'} to move</div>
                                <div className="mb-4">{renderPuzzleBoard()}</div>
                                {puzzleFeedback&&(<div className={`w-full mt-3 p-3 rounded-xl text-sm font-semibold text-center ${puzzleFeedback.startsWith('✅')?'text-green-400':'text-red-400'}`} style={{background:puzzleFeedback.startsWith('✅')?'rgba(22,101,52,0.3)':'rgba(127,29,29,0.3)'}}>{puzzleFeedback}</div>)}
                                {currentPuzzle&&(<div className="w-full mt-4 p-4 rounded-lg border border-amber-500/25" style={{background:'rgba(30,41,59,0.7)'}}><div className="flex justify-between items-center flex-wrap gap-2"><div><p className="text-amber-400 font-semibold text-sm">Themes: {currentPuzzle.themes?.join(', ')||'–'}</p><p className="text-slate-400 text-xs mt-1">Rating: {currentPuzzle.rating} • Plays: {currentPuzzle.plays?.toLocaleString()}</p></div><div className="text-right"><p className="text-slate-400 text-xs">Move {Math.min(puzzleMoveIdx+1,puzzleSolution.length)}/{puzzleSolution.length}</p><a href={`https://lichess.org/training/${currentPuzzle.id}`} target="_blank" className="text-xs text-blue-400 hover:text-blue-300">Lichess ↗</a></div></div></div>)}
                            </div>}
                        </div>
                        <div className="space-y-4">
                            <StylePanel boardTheme={boardTheme} setBoardTheme={setBoardTheme} pieceSet={pieceSet} setPieceSet={setPieceSet} />
                            <button onClick={fetchPuzzle} className="w-full px-6 py-3 bg-blue-700 text-white rounded-xl hover:bg-blue-600 font-semibold text-sm">🔄 New Puzzle</button>
                            {puzzleStatus==='playing'&&(<button onClick={()=>{setPuzzleFeedback('💡 Solution: '+puzzleSolution.join(' → '))}} className="w-full px-6 py-2 border border-amber-700/40 text-amber-400 rounded-xl text-sm hover:bg-amber-900/20">💡 Show Solution</button>)}
                        </div>
                    </div>
                )}

                {/* ── GAMES TAB ── */}
                {activeTab==='games'&&(
                    <div className="fade-in">
                        <div className="mb-6 rounded-2xl p-6 border border-slate-700/40" style={{background:'rgba(15,23,42,0.7)'}}>
                            <h2 className="text-xl font-bold text-amber-400 mb-5">👤 Player Analysis</h2>
                            <div className="flex gap-3 flex-wrap mb-5">
                                <input type="text" value={playerUsername} onChange={e=>setPlayerUsername(e.target.value)} placeholder="Enter Lichess username" className="flex-1 min-w-48 px-4 py-3 bg-slate-800 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none text-sm" />
                                <button onClick={()=>fetchUserGames(playerUsername)} className="px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-600 font-semibold text-sm" disabled={loadingGames}>{loadingGames?'Loading…':'Search'}</button>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {['magnus','hikaru','fabiano','alireza2003','penguingim1'].map(p=>(<button key={p} onClick={()=>{setPlayerUsername(p);setTimeout(()=>fetchUserGames(p),100);}} className="px-3 py-1.5 text-xs bg-slate-800 text-amber-400 rounded-lg hover:bg-slate-700 border border-slate-700/50">{p}</button>))}
                            </div>
                        </div>
                        {playerStats&&(<div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">{[['Player',playerStats.username,'bg-blue-900/60'],['Blitz',playerStats.perfs?.blitz?.rating||'N/A','bg-purple-900/60'],['Rapid',playerStats.perfs?.rapid?.rating||'N/A','bg-pink-900/60'],['Classical',playerStats.perfs?.classical?.rating||'N/A','bg-green-900/60']].map(([l,v,bg])=>(<div key={l} className={`${bg} rounded-2xl p-5 border border-slate-700/30`}><p className="text-slate-400 text-xs font-semibold mb-1">{l}</p><p className="text-xl font-bold text-white truncate">{v}</p></div>))}</div>)}
                        {userGames.length>0&&(<div className="space-y-3">{userGames.slice(0,10).map((game,idx)=>(<div key={game.id} className="rounded-xl p-5 border border-slate-700/40" style={{background:'rgba(30,41,59,0.6)'}}><div className="flex justify-between items-start"><div><p className="font-semibold text-white text-sm mb-1">Game #{idx+1}</p><p className="text-slate-400 text-sm">{game.players.white.name} vs {game.players.black.name}</p></div><span className={`px-3 py-1 rounded text-sm font-bold ${game.winner==='white'?'bg-amber-900/40 text-amber-300':game.winner==='black'?'bg-blue-900/40 text-blue-300':'bg-gray-700/40 text-gray-300'}`}>{game.winner?.toUpperCase()||'DRAW'}</span></div><p className="text-slate-500 text-xs mt-2">⚡ {game.speed} • 📖 {game.opening?.name||'Unknown'}</p></div>))}</div>)}
                    </div>
                )}

                {/* ── LICHESS TAB ── */}
                {activeTab==='lichess'&&(
                    <div className="fade-in">
                        {!lichessToken&&(<div className="mb-4 p-4 rounded-xl border border-amber-600/40 flex items-center gap-3" style={{background:'rgba(120,60,0,0.25)'}}><span className="text-2xl">⚠</span><div><p className="text-amber-300 font-semibold text-sm">Lichess Token nahi mila</p><p className="text-amber-200/60 text-xs">⚙️ Settings tab → Lichess API Token save karo</p></div></div>)}
                        {lichessMsg&&(<div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{background:'rgba(30,41,59,0.9)',color:lichessMsg.startsWith('✅')?'#34d399':lichessMsg.startsWith('❌')?'#f87171':'#fbbf24'}}>{lichessMsg}</div>)}
                        {myAccount&&(<div className="mb-5 p-4 rounded-2xl border border-slate-700/50 flex items-center gap-4" style={{background:'rgba(15,23,42,0.8)'}}><div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xl font-bold shrink-0">{myAccount.username?.[0]?.toUpperCase()}</div><div className="flex-1 min-w-0"><p className="text-white font-bold text-sm">{myAccount.username}</p><div className="flex gap-3 flex-wrap mt-1">{myAccount.perfs?.blitz&&<span className="text-xs text-purple-300">⚡ Blitz: {myAccount.perfs.blitz.rating}</span>}{myAccount.perfs?.rapid&&<span className="text-xs text-blue-300">🕐 Rapid: {myAccount.perfs.rapid.rating}</span>}{myAccount.perfs?.bullet&&<span className="text-xs text-red-300">🔫 Bullet: {myAccount.perfs.bullet.rating}</span>}{myAccount.perfs?.classical&&<span className="text-xs text-green-300">♟ Classical: {myAccount.perfs.classical.rating}</span>}{myAccount.perfs?.puzzle&&<span className="text-xs text-amber-300">🧩 Puzzle: {myAccount.perfs.puzzle.rating}</span>}</div></div><a href={`https://lichess.org/@/${myAccount.username}`} target="_blank" className="text-xs text-blue-400 hover:text-blue-300 shrink-0">Lichess ↗</a></div>)}
                        <div className="flex gap-1 mb-5 flex-wrap">
                            {[['account','👤 Account'],['challenges','⚔ Challenges'],['board','🎮 Board API'],['tournaments','🏆 Tournaments'],['puzzleAct','🧩 Puzzle Activity']].map(([id,lb])=>(<button key={id} onClick={()=>setLichessTab(id)} className="px-3 py-2 rounded-lg text-xs font-semibold transition-all" style={{background:lichessTab===id?'rgba(217,119,6,0.25)':'rgba(30,41,59,0.6)',color:lichessTab===id?'#fbbf24':'#94a3b8',border:lichessTab===id?'1px solid rgba(217,119,6,0.35)':'1px solid rgba(51,65,85,0.4)'}}>{lb}</button>))}
                        </div>

                        {lichessTab==='account'&&(<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-2xl p-5 border border-slate-700/50" style={{background:'rgba(15,23,42,0.7)'}}><h3 className="text-amber-400 font-semibold mb-4 text-sm">Lichess Profile</h3>{!myAccount?(<div className="space-y-3"><p className="text-slate-400 text-sm">Token save karo aur yahan account details dekhein.</p><button onClick={()=>fetchMyAccount()} className="px-4 py-2 bg-amber-700/40 text-amber-300 rounded-lg text-sm hover:bg-amber-700/60">🔄 Refresh Account</button></div>):(<div className="space-y-2 text-sm">{[['Username',myAccount.username],['Title',myAccount.title||'–'],['Country',myAccount.profile?.country||'–'],['Total Games',myAccount.count?.all||0],['Wins',myAccount.count?.win||0],['Losses',myAccount.count?.loss||0],['Draws',myAccount.count?.draw||0]].map(([k,v])=>(<div key={k} className="flex justify-between border-b border-slate-800 pb-1.5"><span className="text-slate-400">{k}</span><span className="text-white font-medium">{v}</span></div>))}<button onClick={()=>fetchMyAccount()} className="mt-3 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700 w-full">🔄 Refresh</button></div>)}</div>
                            <div className="rounded-2xl p-5 border border-slate-700/50" style={{background:'rgba(15,23,42,0.7)'}}><h3 className="text-amber-400 font-semibold mb-4 text-sm">🏁 Puzzle Race</h3><p className="text-slate-400 text-sm mb-4">Ek nayi Puzzle Race create karo aur dosto ko invite karo — browser mein open hoga.</p><button onClick={createPuzzleRace} disabled={lichessLoading.puzzleRace||!lichessToken} className="w-full py-3 rounded-xl font-semibold text-sm transition-all" style={{background:lichessLoading.puzzleRace?'#334155':'linear-gradient(135deg,#d97706,#b45309)',color:'#fff',opacity:!lichessToken?0.5:1}}>{lichessLoading.puzzleRace?'Creating…':'🚀 Create Puzzle Race'}</button><p className="text-slate-600 text-xs mt-3 text-center">lichess.org/racer mein join link milega</p></div>
                        </div>)}

                        {lichessTab==='challenges'&&(<div className="space-y-5">
                            <div className="rounded-2xl p-5 border border-slate-700/50" style={{background:'rgba(15,23,42,0.7)'}}><h3 className="text-amber-400 font-semibold mb-4 text-sm">⚔ Send Challenge</h3><div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4"><div><label className="text-xs text-slate-400 mb-1 block">Username</label><input value={challengeTarget} onChange={e=>setChallengeTarget(e.target.value)} placeholder="lichess username" className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-600 focus:border-amber-500 focus:outline-none text-sm" /></div><div><label className="text-xs text-slate-400 mb-1 block">Time (min)</label><input type="number" value={challengeTime} onChange={e=>setChallengeTime(+e.target.value)} min="1" max="60" className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-600 focus:border-amber-500 focus:outline-none text-sm" /></div><div><label className="text-xs text-slate-400 mb-1 block">Increment (sec)</label><input type="number" value={challengeInc} onChange={e=>setChallengeInc(+e.target.value)} min="0" max="60" className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-600 focus:border-amber-500 focus:outline-none text-sm" /></div><div><label className="text-xs text-slate-400 mb-1 block">Color</label><select value={challengeColor} onChange={e=>setChallengeColor(e.target.value)} className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-600 focus:border-amber-500 focus:outline-none text-sm"><option value="random">Random</option><option value="white">White</option><option value="black">Black</option></select></div><div><label className="text-xs text-slate-400 mb-1 block">Variant</label><select value={challengeVariant} onChange={e=>setChallengeVariant(e.target.value)} className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-600 focus:border-amber-500 focus:outline-none text-sm"><option value="standard">Standard</option><option value="chess960">Chess960</option><option value="crazyhouse">Crazyhouse</option><option value="antichess">Antichess</option><option value="atomic">Atomic</option><option value="horde">Horde</option><option value="kingOfTheHill">King of the Hill</option><option value="racingKings">Racing Kings</option><option value="threeCheck">Three-Check</option></select></div><div className="flex items-end"><button onClick={sendChallenge} disabled={lichessLoading.sendChallenge||!lichessToken} className="w-full py-2 rounded-lg font-semibold text-sm transition-all" style={{background:'#1d4ed8',color:'#fff',opacity:!lichessToken?0.5:1}}>{lichessLoading.sendChallenge?'Sending…':'📤 Send'}</button></div></div></div>
                            <div className="rounded-2xl p-5 border border-slate-700/50" style={{background:'rgba(15,23,42,0.7)'}}><div className="flex items-center justify-between mb-4"><h3 className="text-amber-400 font-semibold text-sm">📥 Incoming ({challenges.in.length})</h3><button onClick={fetchChallenges} className="text-xs text-slate-400 hover:text-slate-300">🔄 Refresh</button></div>{challenges.in.length===0?<p className="text-slate-500 text-sm text-center py-4">Koi incoming challenge nahi</p>:challenges.in.map(c=>(<div key={c.id} className="flex items-center justify-between p-3 rounded-xl mb-2" style={{background:'rgba(30,41,59,0.8)'}}><div><p className="text-white text-sm font-semibold">{c.challenger?.name||'?'}</p><p className="text-slate-400 text-xs">{c.timeControl?.show||''} • {c.variant?.name||'Standard'} • {c.color}</p></div><div className="flex gap-2"><button onClick={()=>acceptChallenge(c.id)} disabled={lichessLoading['ch_'+c.id]} className="px-3 py-1.5 bg-green-700/60 text-green-300 rounded-lg text-xs font-semibold hover:bg-green-700/80">{lichessLoading['ch_'+c.id]?'…':'✅ Accept'}</button><button onClick={()=>declineChallenge(c.id)} disabled={lichessLoading['dc_'+c.id]} className="px-3 py-1.5 bg-red-800/50 text-red-300 rounded-lg text-xs font-semibold hover:bg-red-800/70">{lichessLoading['dc_'+c.id]?'…':'❌ Decline'}</button></div></div>))}</div>
                            <div className="rounded-2xl p-5 border border-slate-700/50" style={{background:'rgba(15,23,42,0.7)'}}><h3 className="text-amber-400 font-semibold mb-4 text-sm">📤 Outgoing ({challenges.out.length})</h3>{challenges.out.length===0?<p className="text-slate-500 text-sm text-center py-4">Koi outgoing challenge nahi</p>:challenges.out.map(c=>(<div key={c.id} className="flex items-center justify-between p-3 rounded-xl mb-2" style={{background:'rgba(30,41,59,0.8)'}}><div><p className="text-white text-sm font-semibold">→ {c.destUser?.name||'?'}</p><p className="text-slate-400 text-xs">{c.timeControl?.show||''} • {c.variant?.name||'Standard'}</p></div><button onClick={()=>cancelChallenge(c.id)} disabled={lichessLoading['cc_'+c.id]} className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs hover:bg-slate-600">{lichessLoading['cc_'+c.id]?'…':'Cancel'}</button></div>))}</div>
                        </div>)}

                        {lichessTab==='board'&&(<div className="space-y-5">
                            <div className="rounded-2xl p-5 border border-slate-700/50" style={{background:'rgba(15,23,42,0.7)'}}><div className="flex items-center justify-between mb-4"><h3 className="text-amber-400 font-semibold text-sm">🎮 Active Board Games</h3><button onClick={fetchBoardGames} className="text-xs text-slate-400 hover:text-slate-300">🔄 Refresh</button></div>{lichessLoading.boardGames?<p className="text-slate-400 text-sm text-center py-4">Loading…</p>:boardGames.length===0?<p className="text-slate-500 text-sm text-center py-4">Koi active game nahi. Lichess pe game start karo.</p>:boardGames.map(g=>(<div key={g.gameId} className="p-4 rounded-xl mb-3 border border-slate-700/40" style={{background:'rgba(30,41,59,0.8)'}}><div className="flex justify-between items-start mb-3"><div><p className="text-white text-sm font-semibold">{g.opponent?.username||'?'} ({g.opponent?.rating||'?'})</p><p className="text-slate-400 text-xs">{g.speed} • {g.variant} • Playing as: <span className={g.color==='white'?'text-white':'text-gray-400'}>{g.color}</span></p>{g.isMyTurn&&<span className="text-green-400 text-xs font-bold">● Your turn</span>}</div><div className="flex gap-2 flex-wrap"><button onClick={()=>streamBoardGame(g.gameId)} className="px-3 py-1.5 bg-blue-700/60 text-blue-300 rounded-lg text-xs hover:bg-blue-700/80">📡 Stream</button><button onClick={()=>abortGame(g.gameId)} className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs hover:bg-slate-600">Abort</button><button onClick={()=>resignGame(g.gameId)} className="px-3 py-1.5 bg-red-800/50 text-red-300 rounded-lg text-xs hover:bg-red-800/70">Resign</button></div></div>{activeGameId===g.gameId&&(<div className="flex gap-2 mt-2"><input value={moveInput} onChange={e=>setMoveInput(e.target.value)} placeholder="Move (e.g. e2e4)" onKeyDown={e=>{if(e.key==='Enter')boardMove(g.gameId,moveInput);}} className="flex-1 px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-600 focus:border-amber-500 focus:outline-none text-sm font-mono" /><button onClick={()=>boardMove(g.gameId,moveInput)} className="px-4 py-2 bg-amber-700 text-white rounded-lg text-sm hover:bg-amber-600 font-semibold">▶ Play</button></div>)}</div>))}</div>
                            {gameEvents.length>0&&(<div className="rounded-2xl p-5 border border-slate-700/50" style={{background:'rgba(15,23,42,0.7)'}}><h3 className="text-amber-400 font-semibold mb-3 text-sm">📡 Live Game Events</h3><div className="max-h-48 overflow-y-auto space-y-1 font-mono text-xs">{gameEvents.map((e,i)=>(<div key={i} className="p-2 rounded" style={{background:'rgba(30,41,59,0.7)'}}><span className="text-amber-400">[{e.type}]</span>{' '}<span className="text-slate-300">{e.moves||JSON.stringify(e).slice(0,80)}</span></div>))}</div></div>)}
                        </div>)}

                        {lichessTab==='tournaments'&&(<div className="space-y-4">
                            <div className="flex gap-3 mb-2"><button onClick={fetchTournaments} disabled={lichessLoading.tournaments} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700">{lichessLoading.tournaments?'Loading…':'🔄 Refresh Tournaments'}</button></div>
                            {tournaments.length===0?<div className="rounded-xl p-6 text-center border border-slate-700/40" style={{background:'rgba(15,23,42,0.7)'}}><p className="text-slate-400 text-sm">Refresh karein ya Lichess pe check karein</p></div>:tournaments.map(t=>(<div key={t.id} className="rounded-xl p-4 border border-slate-700/40" style={{background:'rgba(15,23,42,0.7)'}}><div className="flex justify-between items-start"><div className="flex-1 min-w-0 mr-3"><p className="text-white font-semibold text-sm truncate">{t.fullName||t.name}</p><div className="flex gap-3 flex-wrap mt-1"><span className="text-slate-400 text-xs">⏱ {t.clock?.limit/60}+{t.clock?.increment}</span><span className="text-slate-400 text-xs">👥 {t.nbPlayers||0} players</span><span className={`text-xs font-semibold ${t.status===10?'text-green-400':t.status===20?'text-amber-400':'text-blue-400'}`}>{t.status===10?'● Starting':t.status===20?'● Started':'● Upcoming'}</span></div></div><div className="flex gap-2 shrink-0"><button onClick={()=>joinTournament(t.id)} disabled={lichessLoading['tj_'+t.id]||!lichessToken} className="px-3 py-1.5 bg-green-700/50 text-green-300 rounded-lg text-xs font-semibold hover:bg-green-700/70" style={{opacity:!lichessToken?0.5:1}}>{lichessLoading['tj_'+t.id]?'…':'Join'}</button><a href={`https://lichess.org/tournament/${t.id}`} target="_blank" className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs hover:bg-slate-600">View ↗</a></div></div></div>))}
                        </div>)}

                        {lichessTab==='puzzleAct'&&(<div className="space-y-4">
                            <div className="flex gap-3 mb-2"><button onClick={fetchPuzzleActivity} disabled={lichessLoading.puzzleActivity||!lichessToken} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700" style={{opacity:!lichessToken?0.5:1}}>{lichessLoading.puzzleActivity?'Loading…':'🔄 Load Puzzle Activity'}</button></div>
                            {puzzleActivity.length===0?<div className="rounded-xl p-6 text-center border border-slate-700/40" style={{background:'rgba(15,23,42,0.7)'}}><p className="text-slate-400 text-sm">Load karo apni recent puzzle activity dekhne ke liye</p></div>:puzzleActivity.map((p,i)=>(<div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-700/40" style={{background:'rgba(15,23,42,0.7)'}}><div><p className="text-white text-sm font-semibold">Puzzle #{p.id}</p><p className="text-slate-400 text-xs">Rating: {p.puzzle?.rating||'?'} • Themes: {p.puzzle?.themes?.join(', ')||'–'}</p></div><div className="text-right"><span className={`text-sm font-bold ${p.win?'text-green-400':'text-red-400'}`}>{p.win?'✅ Win':'❌ Loss'}</span><p className="text-slate-500 text-xs">{p.date?new Date(p.date).toLocaleDateString():''}</p></div></div>))}
                        </div>)}
                    </div>
                )}

                {/* ── SETTINGS TAB ── */}
                {activeTab==='settings'&&(<div className="fade-in"><SettingsTab user={user} /></div>)}
            </div>

            {/* Promotion dialog */}
            {promotionPending&&(
                <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-50">
                    <div className="rounded-2xl p-6 border border-amber-500/40" style={{background:'rgba(30,41,59,0.98)'}}>
                        <p className="text-amber-400 text-lg font-semibold mb-4 text-center chess-title">Promote Pawn To:</p>
                        <div className="flex gap-3">
                            {['q','r','b','n'].map(p=>(<button key={p} onClick={()=>handlePromotion(p)} className="w-16 h-16 rounded-xl flex items-center justify-center border border-slate-600 transition-all hover:scale-105" style={{background:'rgba(51,65,85,0.8)'}}><img src={getPieceImg(gameState.turn,p,pieceSet)} alt={p} draggable={false} style={{width:'78%',height:'78%',objectFit:'contain',filter:'drop-shadow(0 2px 3px rgba(0,0,0,0.5))'}} /></button>))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ══════════════════════════════════
   ROOT APP (Auth Gate + Access Check)
══════════════════════════════════ */
const App = () => {
    const [user,    setUser]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [allowed, setAllowed] = useState(false);
    const [checking,setChecking]= useState(false);

    useEffect(()=>{ return auth.onAuthStateChanged(u=>{ setUser(u); setLoading(false); }); },[]);

    // Jab user login ho to whitelist check karo
    useEffect(()=>{
        if (!user) { setAllowed(false); return; }
        // Admin hamesha allowed hai
        if (user.email === ADMIN_EMAIL) { setAllowed(true); return; }
        // Baaki users ke liye Firestore check
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
        <div className="min-h-screen flex items-center justify-center" style={{background:'#020617'}}>
            <div className="text-center">
                <div className="text-7xl float-animate mb-4">♛</div>
                <p className="text-slate-500 text-sm">{checking ? 'Checking access…' : 'Loading ChessGPT Elite…'}</p>
            </div>
        </div>
    );

    if (!user) return <LoginPage />;
    if (!allowed) return <AccessDenied user={user} />;
    return <ChessApp user={user} />;
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
