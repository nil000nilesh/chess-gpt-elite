import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Brain, TrendingUp, Clock, Zap, MessageCircle, RotateCcw, Volume2, Search, Trophy, User } from 'lucide-react';

// Chess Training App with Puzzles + User Games Analysis
const ChessTrainingApp = () => {
  // ==================== PUZZLE STATE ====================
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [board, setBoard] = useState(generateStartingBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [gameStatus, setGameStatus] = useState('idle');
  const [score, setScore] = useState({ solved: 0, attempts: 0, streak: 0 });
  const [engineAnalysis, setEngineAnalysis] = useState(null);
  const [showCoach, setShowCoach] = useState(false);
  const [coachMessage, setCoachMessage] = useState('');
  const [difficulty, setDifficulty] = useState('1200');

  // ==================== USER GAMES STATE ====================
  const [playerUsername, setPlayerUsername] = useState('magnus');
  const [userGames, setUserGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [playerStats, setPlayerStats] = useState(null);
  const [activeTab, setActiveTab] = useState('puzzles');
  const [gamesFilter, setGamesFilter] = useState('all');
  
  const boardRef = useRef(null);

  // Initialize on mount
  useEffect(() => {
    fetchPuzzle();
  }, []);

  // Generate starting board
  function generateStartingBoard() {
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
  }

  // Fetch Lichess Puzzle
  const fetchPuzzle = async () => {
    try {
      setGameStatus('loading');
      const response = await fetch(`https://lichess.org/api/puzzle/daily?_format=json`);
      const data = await response.json();
      
      if (data && data.puzzle) {
        setCurrentPuzzle(data.puzzle);
        boardFromFEN(data.puzzle.fen);
        setGameStatus('playing');
        setSelectedSquare(null);
        analyzePosition(data.puzzle.fen);
      }
    } catch (err) {
      console.error('Puzzle fetch error:', err);
      setGameStatus('error');
    }
  };

  // Parse FEN
  const boardFromFEN = (fen) => {
    setBoard(fen);
  };

  // Analyze position
  const analyzePosition = (fen) => {
    const analysis = {
      bestMove: 'e2e4',
      evaluation: 0.5,
      depth: 20,
      suggestion: 'Standard opening move. Controls center and opens lines for pieces.',
    };
    setEngineAnalysis(analysis);
  };

  // Get AI coaching
  const getCoachingFeedback = async (moveQuality, puzzleTheme) => {
    try {
      const prompt = `Hindi mein ek brief chess coaching message do (2-3 lines):
      Move quality: ${moveQuality}
      Puzzle theme: ${puzzleTheme || 'tactics'}
      Keep it encouraging and instructive.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await response.json();
      if (data.content && data.content[0]) {
        setCoachMessage(data.content[0].text);
        setShowCoach(true);
      }
    } catch (err) {
      setCoachMessage('Chess khel raha hu? Shukriya playing ke liye! 🎯');
      setShowCoach(true);
    }
  };

  // Handle square click
  const handleSquareClick = (square) => {
    if (selectedSquare === square) {
      setSelectedSquare(null);
      setLegalMoves([]);
    } else if (selectedSquare) {
      const move = selectedSquare + square;
      validateAndMakeMove(move);
      setSelectedSquare(null);
      setLegalMoves([]);
    } else {
      setSelectedSquare(square);
    }
  };

  // Validate move
  const validateAndMakeMove = (move) => {
    if (currentPuzzle && move === currentPuzzle.solution[0]) {
      setScore(prev => ({
        ...prev,
        solved: prev.solved + 1,
        streak: prev.streak + 1,
        attempts: prev.attempts + 1
      }));
      getCoachingFeedback('excellent', currentPuzzle.theme);
      setTimeout(() => fetchPuzzle(), 2000);
    } else {
      setScore(prev => ({
        ...prev,
        streak: 0,
        attempts: prev.attempts + 1
      }));
      getCoachingFeedback('incorrect', currentPuzzle?.theme);
    }
  };

  // ==================== USER GAMES FUNCTIONS ====================

  const fetchUserGames = async (username) => {
    try {
      setLoadingGames(true);
      setPlayerUsername(username);
      
      const gamesResponse = await fetch(
        `https://lichess.org/api/games/${username}?max=15&rated=true`
      );
      const games = await gamesResponse.json();
      setUserGames(games || []);
      
      const statsResponse = await fetch(
        `https://lichess.org/api/user/${username}`
      );
      const stats = await statsResponse.json();
      setPlayerStats(stats);
    } catch (error) {
      console.error('Error fetching user games:', error);
      setUserGames([]);
      setPlayerStats(null);
    } finally {
      setLoadingGames(false);
    }
  };

  const getFilteredGames = () => {
    if (!userGames || userGames.length === 0) return [];
    
    switch(gamesFilter) {
      case 'blitz':
        return userGames.filter(g => g.speed === 'blitz');
      case 'rapid':
        return userGames.filter(g => g.speed === 'rapid');
      case 'rated':
        return userGames.filter(g => g.rated);
      default:
        return userGames;
    }
  };

  const calculateWinRate = () => {
    if (userGames.length === 0) return 0;
    
    const wins = userGames.filter(g => {
      if (g.players.white.userId === playerUsername) {
        return g.winner === 'white';
      }
      return g.winner === 'black';
    }).length;
    
    return Math.round((wins / userGames.length) * 100);
  };

  const getGameStatusEmoji = (status) => {
    const statusMap = {
      'mate': '♔',
      'timeout': '⏰',
      'draw': '🤝',
      'resign': '🏳️',
      'aborted': '❌',
      'outoftime': '⏱️'
    };
    return statusMap[status] || '?';
  };

  const getWinnerName = (game) => {
    if (game.winner === 'white') return game.players.white.name;
    if (game.winner === 'black') return game.players.black.name;
    return 'Draw';
  };

  // Render board
  const renderBoard = () => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const pieces = {
      'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔',
      'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚'
    };

    return (
      <div className="inline-block border-8 border-amber-900 shadow-2xl rounded-xl overflow-hidden board-glow">
        {ranks.map((rank, rankIdx) => (
          <div key={rank} className="flex">
            {files.map((file, fileIdx) => {
              const squareId = file + rank;
              const isLight = (rankIdx + fileIdx) % 2 === 0;
              const isSelected = selectedSquare === squareId;

              return (
                <div
                  key={squareId}
                  onClick={() => handleSquareClick(squareId)}
                  className={`w-16 h-16 flex items-center justify-center text-4xl font-bold cursor-pointer transition-all
                    ${isLight ? 'bg-amber-100 hover:bg-amber-200' : 'bg-amber-700 hover:bg-amber-600'}
                    ${isSelected ? 'ring-4 ring-blue-400 ring-inset shadow-lg shadow-blue-400/50' : ''}
                  `}
                >
                  <span className={isLight ? 'text-amber-900' : 'text-amber-50'}>
                    {board && board[rankIdx * 8 + fileIdx] && pieces[board[rankIdx * 8 + fileIdx]]}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="text-4xl animate-bounce">♛</div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
              ChessGPT Elite
            </h1>
          </div>
          <button
            onClick={fetchPuzzle}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all font-semibold flex items-center gap-2"
          >
            <RotateCcw size={18} />
            New Puzzle
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('puzzles')}
            className={`pb-4 font-semibold transition-colors ${
              activeTab === 'puzzles'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🧩 Daily Puzzles
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`pb-4 font-semibold transition-colors ${
              activeTab === 'games'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🎮 Player Games
          </button>
        </div>
      </div>

      {/* ==================== PUZZLES TAB ==================== */}
      {activeTab === 'puzzles' && (
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-3 mb-6">
            {['800', '1200', '1800', '2000'].map(level => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  difficulty === level
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chess Board Section */}
            <div className="lg:col-span-2">
              <div className="bg-slate-900/80 backdrop-blur rounded-2xl p-8 border border-slate-700/50">
                {gameStatus === 'loading' ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="text-6xl mb-4 animate-pulse">♘</div>
                      <p className="text-slate-400">Puzzle load ho raha hai...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="mb-6">{renderBoard()}</div>
                    
                    {currentPuzzle && (
                      <div className="w-full mt-6 p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-amber-500/30">
                        <div className="flex items-center gap-2 text-amber-400 font-semibold mb-2">
                          <Zap size={18} />
                          Theme: {currentPuzzle.theme || 'Strategy'}
                        </div>
                        <p className="text-slate-300 text-sm">
                          Rating: {currentPuzzle.rating || '1200'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel */}
            <div className="space-y-6">
              {/* Score Card */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
                <h2 className="text-xl font-bold text-amber-400 mb-6 flex items-center gap-2">
                  <TrendingUp size={20} />
                  Performance
                </h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-400">Solved</span>
                    <span className="text-2xl font-bold text-green-400">{score.solved}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-400">Streak 🔥</span>
                    <span className="text-2xl font-bold text-amber-400">{score.streak}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-400">Attempts</span>
                    <span className="text-2xl font-bold text-blue-400">{score.attempts}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-400">Accuracy</span>
                    <span className="text-2xl font-bold text-purple-400">
                      {score.attempts > 0 ? Math.round((score.solved / score.attempts) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Engine Analysis */}
              {engineAnalysis && (
                <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-2xl p-6 border border-blue-700/50 shadow-xl">
                  <h2 className="text-xl font-bold text-blue-300 mb-4 flex items-center gap-2">
                    <Brain size={20} />
                    Engine
                  </h2>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-800/50 rounded-lg">
                      <p className="text-blue-200 text-sm font-semibold">Best Move</p>
                      <p className="text-blue-100 text-lg font-bold mt-1">{engineAnalysis.bestMove}</p>
                    </div>
                    <div className="p-3 bg-blue-800/50 rounded-lg">
                      <p className="text-blue-200 text-sm font-semibold">Evaluation</p>
                      <p className="text-blue-100 text-lg">{engineAnalysis.evaluation.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Coach */}
              <button
                onClick={() => getCoachingFeedback('thinking', 'strategy')}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} />
                Get Coaching
              </button>

              {showCoach && (
                <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl p-6 border border-purple-500/50 shadow-xl">
                  <p className="text-purple-100 text-sm">{coachMessage}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== GAMES TAB ==================== */}
      {activeTab === 'games' && (
        <div className="max-w-7xl mx-auto">
          {/* Player Search */}
          <div className="mb-8 bg-slate-900/80 backdrop-blur rounded-2xl p-8 border border-slate-700/50">
            <h2 className="text-2xl font-bold text-amber-400 mb-6 flex items-center gap-2">
              <User size={24} />
              Player Analysis
            </h2>

            <div className="flex gap-3 flex-wrap mb-6">
              <input
                type="text"
                value={playerUsername}
                onChange={(e) => setPlayerUsername(e.target.value)}
                placeholder="Enter username (e.g., magnus)"
                className="flex-1 min-w-64 px-4 py-3 bg-slate-800 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={() => fetchUserGames(playerUsername)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold flex items-center gap-2"
                disabled={loadingGames}
              >
                <Search size={18} />
                {loadingGames ? 'Loading...' : 'Search'}
              </button>
            </div>

            {/* Quick buttons */}
            <div className="flex gap-2 flex-wrap">
              {['magnus', 'hikaru', 'fabiano', 'alireza2003', 'penguingim1'].map(player => (
                <button
                  key={player}
                  onClick={() => {
                    setPlayerUsername(player);
                    setTimeout(() => fetchUserGames(player), 100);
                  }}
                  className="px-3 py-1 text-sm bg-slate-800 text-amber-400 rounded hover:bg-slate-700"
                >
                  {player}
                </button>
              ))}
            </div>
          </div>

          {/* Player Stats */}
          {playerStats && (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-2xl p-6 border border-blue-700/50">
                <p className="text-blue-300 text-sm font-semibold mb-2">Player</p>
                <p className="text-2xl font-bold text-blue-100">{playerStats.username}</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-900 to-purple-950 rounded-2xl p-6 border border-purple-700/50">
                <p className="text-purple-300 text-sm font-semibold mb-2">Blitz Rating</p>
                <p className="text-2xl font-bold text-purple-100">
                  {playerStats.perfs?.blitz?.rating || 'N/A'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-pink-900 to-pink-950 rounded-2xl p-6 border border-pink-700/50">
                <p className="text-pink-300 text-sm font-semibold mb-2">Rapid Rating</p>
                <p className="text-2xl font-bold text-pink-100">
                  {playerStats.perfs?.rapid?.rating || 'N/A'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-900 to-green-950 rounded-2xl p-6 border border-green-700/50">
                <p className="text-green-300 text-sm font-semibold mb-2">Classical Rating</p>
                <p className="text-2xl font-bold text-green-100">
                  {playerStats.perfs?.classical?.rating || 'N/A'}
                </p>
              </div>
            </div>
          )}

          {/* Games Filter */}
          {userGames.length > 0 && (
            <div className="mb-6 flex gap-2 flex-wrap">
              {['all', 'rated', 'blitz', 'rapid'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setGamesFilter(filter)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    gamesFilter === filter
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)} ({getFilteredGames().length})
                </button>
              ))}
            </div>
          )}

          {/* Games List */}
          <div className="space-y-4">
            {loadingGames ? (
              <div className="text-center py-12">
                <p className="text-slate-400">Loading games...</p>
              </div>
            ) : getFilteredGames().length > 0 ? (
              <>
                <div className="mb-6 p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm">Total Games</p>
                      <p className="text-2xl font-bold text-amber-400">{getFilteredGames().length}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Win Rate</p>
                      <p className="text-2xl font-bold text-green-400">{calculateWinRate()}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Avg Rating</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {Math.round(
                          getFilteredGames().reduce((sum, g) => {
                            const rating = playerUsername === g.players.white.userId 
                              ? g.players.black.rating 
                              : g.players.white.rating;
                            return sum + rating;
                          }, 0) / getFilteredGames().length
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {getFilteredGames().map((game, idx) => (
                  <div
                    key={game.id}
                    className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-amber-500/50 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-semibold text-slate-400">Game #{idx + 1}</span>
                          <span className="text-sm px-2 py-1 bg-slate-700 rounded">
                            {game.speed.toUpperCase()}
                          </span>
                          {game.rated && (
                            <span className="text-sm px-2 py-1 bg-green-900/30 text-green-400 rounded">
                              ⭐ Rated
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className={`p-3 rounded-lg ${
                            playerUsername === game.players.white.userId
                              ? 'bg-amber-900/30 border border-amber-700/50'
                              : 'bg-slate-700/50'
                          }`}>
                            <p className="text-slate-400 text-sm mb-1">White</p>
                            <p className="font-semibold text-white">{game.players.white.name}</p>
                            <p className="text-amber-400 text-sm mt-1">⭐ {game.players.white.rating}</p>
                          </div>

                          <div className={`p-3 rounded-lg ${
                            playerUsername === game.players.black.userId
                              ? 'bg-blue-900/30 border border-blue-700/50'
                              : 'bg-slate-700/50'
                          }`}>
                            <p className="text-slate-400 text-sm mb-1">Black</p>
                            <p className="font-semibold text-white">{game.players.black.name}</p>
                            <p className="text-blue-400 text-sm mt-1">⭐ {game.players.black.rating}</p>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 text-right">
                        <div className={`px-6 py-3 rounded-lg font-bold text-lg mb-2 ${
                          game.winner === 'white'
                            ? 'bg-amber-900/40 text-amber-300'
                            : game.winner === 'black'
                            ? 'bg-blue-900/40 text-blue-300'
                            : 'bg-gray-800/40 text-gray-300'
                        }`}>
                          {getGameStatusEmoji(game.status)} {getWinnerName(game)}
                        </div>
                        <p className="text-sm text-slate-400">{game.status.toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-400 pt-4 border-t border-slate-700">
                      <div>📖 {game.opening?.name || 'Unknown'}</div>
                      <div>⏰ {new Date(game.createdAt).toLocaleDateString()}</div>
                      <div>⏱️ {Math.round((game.lastMoveAt - game.createdAt) / 1000 / 60)}m</div>
                    </div>
                  </div>
                ))}
              </>
            ) : playerStats ? (
              <div className="text-center py-12">
                <p className="text-slate-400">No games found</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400">Search for a player</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="max-w-7xl mx-auto mt-12 text-center text-slate-500 text-sm">
        <p>♟️ Lichess API + AI Coaching ♟️</p>
      </div>
    </div>
  );
};
