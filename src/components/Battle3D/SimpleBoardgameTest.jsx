import React from 'react';
import { Client } from 'boardgame.io/react';
import { ToyboxGame } from '../../game/boardgame/game';

// Simple test board component
function ToyboxBoard({ G, ctx, moves }) {
  console.log('ToyboxBoard rendered with:', { G, ctx, moves });

  if (!G) {
    return <div>Loading game state...</div>;
  }

  return (
    <div className="p-8 bg-gradient-to-b from-purple-900 to-blue-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-4">Boardgame.io Test</h1>

      <div className="mb-4">
        <p>Turn: {G.turnNumber || 0}</p>
        <p>Current Player: {ctx?.currentPlayer}</p>
        <p>Phase: {ctx?.phase || 'main'}</p>
      </div>

      {G.players && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/30 p-4 rounded">
            <h2 className="text-xl mb-2">Player 0</h2>
            <p>Health: {G.players['0']?.health || 0}</p>
            <p>Mana: {G.players['0']?.mana || 0}</p>
            <p>Cards: {G.players['0']?.cards?.length || 0}</p>
          </div>

          <div className="bg-black/30 p-4 rounded">
            <h2 className="text-xl mb-2">Player 1</h2>
            <p>Health: {G.players['1']?.health || 0}</p>
            <p>Mana: {G.players['1']?.mana || 0}</p>
            <p>Cards: {G.players['1']?.cards?.length || 0}</p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <button
          onClick={() => {
            console.log('Initializing test cards...');
            if (moves?.initializeCards) {
              const testPlayer = [
                { id: 'test1', name: 'Test Card 1', maxHealth: 100, attack: 20 }
              ];
              const testAI = [
                { id: 'test2', name: 'Test Card 2', maxHealth: 100, attack: 20 }
              ];
              moves.initializeCards(testPlayer, testAI);
            }
          }}
          className="bg-green-600 px-4 py-2 rounded mr-2"
        >
          Initialize Cards
        </button>

        <button
          onClick={() => {
            console.log('Ending turn...');
            if (moves?.endTurn) moves.endTurn();
          }}
          className="bg-blue-600 px-4 py-2 rounded mr-2"
        >
          End Turn
        </button>

        <button
          onClick={() => window.location.href = '/'}
          className="bg-red-600 px-4 py-2 rounded"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}

// Create the client
const SimpleBoardgameClient = Client({
  game: ToyboxGame,
  board: ToyboxBoard,
  numPlayers: 2,
  debug: true // Enable debug panel
});

export default function SimpleBoardgameTest() {
  console.log('SimpleBoardgameTest component mounted');
  return <SimpleBoardgameClient />;
}