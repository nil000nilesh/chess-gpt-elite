import React, { useState, useEffect } from 'react';
import { RotateCcw, Brain, TrendingUp, MessageCircle, Zap, Search, Trophy, User } from 'lucide-react';

const ChessApp = () => {
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [board, setBoard] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
  const [gameStatus, setGameStatus] = useState('idle');
  const [score, setScore] = useState({ solved: 0, attempts: 0, streak: 0 });
  const [activeTab, setActiveTab] = useState('puzzles');
  const [playerUsername, setPlayerUsername] = useState('magnus');
  const [userGames, setUserGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [playerStats, setPlayerStats] = useState(null);

  useEffect(() => {
    fetchPuzzle();
  }, []);

  const fetchPuzzle = async () => {
    try {
      setGameStatus('loading');
      const response = await fetch('https://lichess.org/api/puzzle/daily?_format=json');
      const data = await response.json();
      if (data?.puzzle) {
        setCurrentPuzzle(data.puzzle);
        setGameStatus('playing');
      }
    } catch (err) {
      setGameStatus('error');
    }
  };

  const fetchUserGames = async (username) => {
    try {
      setLoadingGames(true);
      const [gamesRes, statsRes] = await Promise.all([
        fetch(`https://lichess.org/api/games/${username}?max=15`),
        fetch(`https://lichess.org/api/user/${username}`)
      ]);
      const games = await gamesRes.json();
      const stats = await statsRes.json();
      setUserGames(games || []);
      setPlayerStats(stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGames(false);
    }
  };

  const renderBoard = () => {
    const pieces = { 'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔', 'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚' };
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    return (
      <div className="inline-block border-8 border-amber-900 shadow-2xl rounded-xl overflow-hidden board-glow">
        {ranks.map((rank, rankIdx) => (
          <div key={rank} className="flex">
            {files.map((file, fileIdx) => (
              <div key={file + rank} className={`w-16 h-16 flex items-center justify-center text-4xl font-bold ${(rankIdx + fileIdx) % 2 === 0 ? 'bg-amber-100' : 'bg-amber-700'}`}>
                {board && pieces[board[rankIdx * 8 + fileIdx]] && pieces[board[rankIdx * 8 + fileIdx]]}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="text-4xl float-animate">♛</div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">ChessGPT Elite</h1>
          </div>
          <button onClick={fetchPuzzle} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:shadow-lg font-semibold flex items-center gap-2">
            <RotateCcw size={18} />New Puzzle
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-700">
          <button onClick={() => setActiveTab('puzzles')} className={`pb-4 font-semibold ${activeTab === 'puzzles' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400'}`}>🧩 Daily Puzzles</button>
          <button onClick={() => setActiveTab('games')} className={`pb-4 font-semibold ${activeTab === 'games' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400'}`}>🎮 Player Games</button>
        </div>

        {/* Puzzles Tab */}
        {activeTab === 'puzzles' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl p-8 border border-slate-700/50">
              {gameStatus === 'loading' ? (
                <div className="flex items-center justify-center h-96"><div className="text-center"><div className="text-6xl mb-4 animate-pulse">♘</div><p className="text-slate-400">Loading puzzle...</p></div></div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="mb-6">{renderBoard()}</div>
                  {currentPuzzle && <div className="w-full mt-6 p-4 bg-slate-800 rounded-lg border border-amber-500/30"><p className="text-amber-400 font-semibold">Theme: {currentPuzzle.theme}</p><p className="text-slate-300 text-sm mt-2">Rating: {currentPuzzle.rating}</p></div>}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700/50">
                <h2 className="text-xl font-bold text-amber-400 mb-6 flex items-center gap-2"><TrendingUp size={20} />Performance</h2>
                <div className="space-y-4">
                  <div className="flex justify-between p-3 bg-slate-700/50 rounded-lg"><span className="text-slate-400">Solved</span><span className="text-2xl font-bold text-green-400">{score.solved}</span></div>
                  <div className="flex justify-between p-3 bg-slate-700/50 rounded-lg"><span className="text-slate-400">Streak 🔥</span><span className="text-2xl font-bold text-amber-400">{score.streak}</span></div>
                  <div className="flex justify-between p-3 bg-slate-700/50 rounded-lg"><span className="text-slate-400">Accuracy</span><span className="text-2xl font-bold text-purple-400">{score.attempts > 0 ? Math.round((score.solved / score.attempts) * 100) : 0}%</span></div>
                </div>
              </div>
              <button className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg font-semibold flex items-center justify-center gap-2"><MessageCircle size={20} />Get AI Coaching</button>
            </div>
          </div>
        )}

        {/* Games Tab */}
        {activeTab === 'games' && (
          <div>
            <div className="mb-8 bg-slate-900/80 rounded-2xl p-8 border border-slate-700/50">
              <h2 className="text-2xl font-bold text-amber-400 mb-6 flex items-center gap-2"><User size={24} />Player Analysis</h2>
              <div className="flex gap-3 flex-wrap mb-6">
                <input type="text" value={playerUsername} onChange={(e) => setPlayerUsername(e.target.value)} placeholder="Enter username" className="flex-1 min-w-64 px-4 py-3 bg-slate-800 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none" />
                <button onClick={() => fetchUserGames(playerUsername)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:shadow-lg font-semibold flex items-center gap-2" disabled={loadingGames}><Search size={18} />{loadingGames ? 'Loading...' : 'Search'}</button>
              </div>
              <div className="flex gap-2 flex-wrap">{['magnus', 'hikaru', 'fabiano', 'alireza2003', 'penguingim1'].map(p => <button key={p} onClick={() => { setPlayerUsername(p); setTimeout(() => fetchUserGames(p), 100); }} className="px-3 py-1 text-sm bg-slate-800 text-amber-400 rounded hover:bg-slate-700">{p}</button>)}</div>
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
                      <div>
                        <p className="font-semibold text-white mb-2">Game #{idx + 1}</p>
                        <p className="text-slate-300">{game.players.white.name} vs {game.players.black.name}</p>
                      </div>
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
    </div>
  );
};

export default ChessApp;
