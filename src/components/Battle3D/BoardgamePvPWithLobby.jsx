import React, { useEffect, useState, useRef } from 'react';
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

  // Handle page refresh/navigation/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (matchID && isJoined) {
        // Show browser confirmation dialog
        e.preventDefault();
        e.returnValue = 'Leaving this page will end your battle. Are you sure?';

        // Notify server immediately about potential leave
        if (lobbySocket) {
          lobbySocket.emit('player_leaving_battle', {
            battleId,
            playerID,
            playerNumber,
            matchID
          });
        }
      }
    };

    const handleUnload = () => {
      if (matchID && isJoined) {
        // Send synchronous request to notify server
        const data = JSON.stringify({
          battleId,
          playerID,
          playerNumber,
          matchID,
          reason: 'page_unload'
        });

        // Use sendBeacon for reliable delivery during page unload
        if (navigator.sendBeacon) {
          navigator.sendBeacon('http://localhost:4001/player-left', data);
        } else {
          // Fallback to sync XHR
          const xhr = new XMLHttpRequest();
          xhr.open('POST', 'http://localhost:4001/player-left', false);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(data);
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      // Clean up event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [matchID, isJoined, battleId, playerID, playerNumber, lobbySocket]);

  // Store refs to avoid stale closures
  const matchIDRef = useRef(matchID);
  const playerIDRef = useRef(playerID);
  const battleIdRef = useRef(battleId);
  const playerNumberRef = useRef(playerNumber);
  const lobbySocketRef = useRef(lobbySocket);

  useEffect(() => {
    matchIDRef.current = matchID;
    playerIDRef.current = playerID;
    battleIdRef.current = battleId;
    playerNumberRef.current = playerNumber;
    lobbySocketRef.current = lobbySocket;
  }, [matchID, playerID, battleId, playerNumber, lobbySocket]);

  // Clean up match ONLY when component truly unmounts
  useEffect(() => {
    console.log('🟫 BoardgamePvPWithLobby mounted with matchID:', matchID);

    return () => {
      console.log('🔴 BoardgamePvPWithLobby UNMOUNTING! matchID:', matchIDRef.current);

      // Only clean up if we have a valid match and the game is actually ending
      if (matchIDRef.current && window.performance.navigation.type !== 1) { // Not a page reload
        console.log('🧹 Cleaning up match on true unmount:', matchIDRef.current);

        // Use sendBeacon for reliable cleanup during page unload
        const cleanupData = JSON.stringify({
          battleId: battleIdRef.current,
          playerID: playerIDRef.current,
          playerNumber: playerNumberRef.current,
          matchID: matchIDRef.current,
          reason: 'component_unmount'
        });

        // Try sendBeacon first for page unload scenarios
        if (navigator.sendBeacon) {
          navigator.sendBeacon('http://localhost:4001/player-left', cleanupData);
        }

        // Also do async cleanup for normal unmounts (not page unload)
        fetch(`http://localhost:4001/match/${matchIDRef.current}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerID: playerIDRef.current,
            reason: 'component_unmount'
          })
        }).catch(err => console.error('Failed to delete match:', err));

        // Clear stored credentials
        localStorage.removeItem(`boardgame_creds_${matchIDRef.current}_${playerIDRef.current}`);
      }
    };
  }, []); // Empty dependency array ensures this only runs on mount/unmount

  // Handle opponent disconnect/leave events from lobby socket
  useEffect(() => {
    if (lobbySocket) {
      const handleOpponentDisconnected = ({ matchID: abandonedMatchID, disconnectedPlayer }) => {
        if (abandonedMatchID === matchID) {
          console.log('⚠️ Opponent disconnected from battle!');
          // Show notification to user
        }
      };

      const handleOpponentLeft = ({ matchID: abandonedMatchID, playerNumber: leftPlayer, reason }) => {
        if (abandonedMatchID === matchID) {
          console.log('🚪 Opponent left the battle:', reason);
        }
      };

      const handleBattleComplete = ({ matchID: completedMatchID, winner, reason }) => {
        if (completedMatchID === matchID) {
          console.log('🏁 Battle completed:', reason, 'Winner:', winner);

          // On mobile, add extra verification before ending game
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          if (isMobile) {
            console.log('📱 Mobile device - verifying disconnect before ending game');
            // Don't immediately end on mobile - the connection might just be slow
            return;
          }

          // Only handle battle completion for disconnect/leave reasons
          // Normal game endings are handled by the boardgame.io game state
          if (reason === 'opponent_disconnected' || reason === 'opponent_left' || reason === 'opponent_timeout') {
            // Clean up and return to menu after delay
            setTimeout(() => {
              if (onBattleEnd) {
                onBattleEnd({ winner, reason });
              } else {
                window.location.href = '/';
              }
            }, 3000);
          }
        }
      };

      lobbySocket.on('opponent_disconnected', handleOpponentDisconnected);
      lobbySocket.on('opponent_left', handleOpponentLeft);
      lobbySocket.on('battle_complete', handleBattleComplete);

      return () => {
        lobbySocket.off('opponent_disconnected', handleOpponentDisconnected);
        lobbySocket.off('opponent_left', handleOpponentLeft);
        lobbySocket.off('battle_complete', handleBattleComplete);
      };
    }
  }, [lobbySocket, matchID, onBattleEnd]);

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
        lobbySocket={lobbySocket}  // Pass lobby socket for disconnect detection
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