import React, { useEffect, useState } from 'react';
import BoardgamePvP from './BoardgamePvP';

// Special version that works with the PvP lobby matchmaking
const BoardgamePvPWithLobby = ({ battleData, selectedTeam, onBattleEnd }) => {
  const { battleId, opponent, opponentTeam, playerNumber, socket: lobbySocket, credentials: serverCredentials } = battleData;

  // CRITICAL FIX: Map playerNumber correctly to boardgame.io playerID
  // Server sends: playerNumber 1 or 2
  // Boardgame.io expects: playerID "0" or "1" (as strings)
  const playerID = String(playerNumber - 1);
  const matchID = battleId;

  // Use credentials from server (they already joined us)
  const [credentials, setCredentials] = useState(() => {
    // Prefer server-provided credentials (from on-demand match creation)
    if (serverCredentials) {
      localStorage.setItem(`boardgame_creds_${matchID}_${playerID}`, serverCredentials);
      return serverCredentials;
    }
    // Fallback to stored credentials
    const storedCreds = localStorage.getItem(`boardgame_creds_${matchID}_${playerID}`);
    return storedCreds || null;
  });
  const [isJoined, setIsJoined] = useState(!!serverCredentials); // Already joined if we have server credentials

  console.log('🎮 BoardgamePvPWithLobby initialized:', {
    battleId,
    playerNumber,  // From server: 1 or 2
    playerID,      // For boardgame.io: "0" or "1"
    selectedTeam: selectedTeam?.length,
    opponentTeam: opponentTeam?.length,
    hasCredentials: !!credentials
  });

  // Setup match connection
  useEffect(() => {
    if (!isJoined) {
      // If somehow we don't have credentials yet, mark as joined anyway
      // The server has already joined us to the match
      console.log(`🎮 Ready to connect to match ${matchID} as player ${playerID}`);
      console.log('🔑 Using server-provided credentials');
      setIsJoined(true);
    }
  }, [matchID, playerID, isJoined]);

  // Notify lobby socket after joining boardgame.io
  useEffect(() => {
    if (lobbySocket && battleId && isJoined) {
      lobbySocket.emit('boardgame_battle_joined', {
        battleId,
        playerID,
        playerNumber
      });
    }
  }, [lobbySocket, battleId, playerID, playerNumber, isJoined]);

  // Don't render the game until we've joined the match
  if (!isJoined) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Joining battle...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      <BoardgamePvP
        matchID={matchID}
        playerID={playerID}  // Pass the correct playerID ("0" or "1")
        credentials={credentials}   // Pass stored credentials for reconnection
        selectedTeam={selectedTeam}
        opponentTeam={opponentTeam}
        onBattleEnd={onBattleEnd}
        onCredentialsUpdate={(newCreds) => {
          // Store credentials for reconnection
          if (newCreds && newCreds !== credentials) {
            localStorage.setItem(`boardgame_creds_${matchID}_${playerID}`, newCreds);
            setCredentials(newCreds);
            console.log('✅ Credentials stored for reconnection');
          }
        }}
      />

      {/* Battle info overlay */}
      <div className="absolute top-4 left-4 z-50 bg-black/50 p-2 rounded text-white text-xs">
        <p>Battle ID: {matchID}</p>
        <p>You are: Player {playerNumber} (ID: {playerID}, {playerID === '0' ? 'Blue' : 'Red'})</p>
        <p>Opponent: {opponent?.slice(0, 8)}...</p>
      </div>
    </div>
  );
};

export default BoardgamePvPWithLobby;