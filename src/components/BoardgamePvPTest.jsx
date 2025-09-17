import React, { useState } from 'react';
import BoardgamePvP from './Battle3D/BoardgamePvP';
import PvPTeamSelect from './PvPTeamSelect';

const BoardgamePvPTest = () => {
  // Use a fixed match ID for testing
  const matchID = 'test-match-001';
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showTeamSelect, setShowTeamSelect] = useState(true);
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);

  // Determine player ID based on localStorage to remember which player this window is
  const [playerID, setPlayerID] = useState(() => {
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const urlPlayerID = urlParams.get('player');
    if (urlPlayerID === '0' || urlPlayerID === '1') {
      return urlPlayerID;
    }

    // Check localStorage
    const stored = localStorage.getItem('boardgame-player-id');
    if (stored === '0' || stored === '1') {
      return stored;
    }

    // Default to asking user or using first available
    const existingPlayer = sessionStorage.getItem('boardgame-existing-player');
    if (!existingPlayer) {
      // First window to open gets player 0
      sessionStorage.setItem('boardgame-existing-player', '0');
      localStorage.setItem('boardgame-player-id', '0');
      return '0';
    } else if (existingPlayer === '0') {
      // Second window gets player 1
      localStorage.setItem('boardgame-player-id', '1');
      return '1';
    }
    return '0'; // Fallback
  });

  const switchPlayer = () => {
    const newID = playerID === '0' ? '1' : '0';
    localStorage.setItem('boardgame-player-id', newID);
    setPlayerID(newID);
    window.location.reload(); // Reload to reconnect as new player
  };

  const resetMatch = () => {
    localStorage.removeItem('boardgame-player-id');
    localStorage.removeItem('boardgame-second-player');
    window.location.reload();
  };

  const handleTeamSelected = (team) => {
    setSelectedTeam(team);
    setShowTeamSelect(false);
  };

  const handleBack = () => {
    setShowTeamSelect(true);
    setSelectedTeam(null);
  };

  // Show player selection if not set
  if (!playerID || showPlayerSelect) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-900 to-blue-900">
        <div className="bg-black/50 p-8 rounded-lg text-white text-center">
          <h2 className="text-3xl font-bold mb-6">Select Your Player</h2>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                localStorage.setItem('boardgame-player-id', '0');
                setPlayerID('0');
                setShowPlayerSelect(false);
              }}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl"
            >
              Player 1 (Blue)
            </button>
            <button
              onClick={() => {
                localStorage.setItem('boardgame-player-id', '1');
                setPlayerID('1');
                setShowPlayerSelect(false);
              }}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-lg text-xl"
            >
              Player 2 (Red)
            </button>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('boardgame-player-id');
              sessionStorage.clear();
              window.location.reload();
            }}
            className="mt-4 text-sm opacity-70 hover:opacity-100"
          >
            Clear All Settings
          </button>
        </div>
      </div>
    );
  }

  // Show team selection screen after player selection
  if (showTeamSelect) {
    return <PvPTeamSelect onTeamSelected={handleTeamSelected} onBack={() => setShowPlayerSelect(true)} maxTeamSize={4} />;
  }

  return (
    <>
      <div className="absolute top-4 left-4 z-50 bg-black/50 p-2 rounded text-white">
        <p>You are: Player {playerID}</p>
        <button
          onClick={switchPlayer}
          className="text-xs bg-blue-600 px-2 py-1 rounded mt-1 mr-2"
        >
          Switch to Player {playerID === '0' ? '1' : '0'}
        </button>
        <button
          onClick={resetMatch}
          className="text-xs bg-red-600 px-2 py-1 rounded mt-1"
        >
          Reset Match
        </button>
        <button
          onClick={handleBack}
          className="text-xs bg-yellow-600 px-2 py-1 rounded mt-1 ml-2"
        >
          Change Team
        </button>
      </div>

      <BoardgamePvP
        matchID={matchID}
        playerID={playerID}
        credentials={null} // No authentication for testing
        selectedTeam={selectedTeam}
      />
    </>
  );
};

export default BoardgamePvPTest;