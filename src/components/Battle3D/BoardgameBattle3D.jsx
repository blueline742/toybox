import React, { useEffect, useState, useRef } from 'react';
import { Client } from 'boardgame.io/react';
import { ToyboxGame } from '../../game/boardgame/game';
import HearthstoneScene from './HearthstoneScene';
import SpellNotification from '../SpellNotification';
import TargetingOverlay from './TargetingOverlay';

// Create the Boardgame.io client
const ToyboxClient = Client({
  game: ToyboxGame,
  numPlayers: 2,
  debug: false // Set to true to see boardgame.io debug panel
});

const BoardgameBattle3D = ({ playerTeam: providedPlayerTeam, aiTeam: providedAiTeam, onBattleEnd }) => {
  // Use test teams if none provided
  const getTestTeams = () => {
    const playerTestTeam = [
      { id: 'robot-1', name: 'RoboWarrior', emoji: '🤖', maxHealth: 120, attack: 25,
        abilities: [
          { name: 'Laser Blast', damage: 30, manaCost: 3, targetType: 'enemy' },
          { name: 'Shield Generator', shield: 20, manaCost: 2, targetType: 'ally' }
        ]
      },
      { id: 'dino-1', name: 'T-Rex', emoji: '🦖', maxHealth: 150, attack: 35,
        abilities: [
          { name: 'Bite', damage: 40, manaCost: 4, targetType: 'enemy' },
          { name: 'Roar', damage: 15, manaCost: 2, targetType: 'all_enemies' }
        ]
      },
      { id: 'bear-1', name: 'Teddy', emoji: '🧸', maxHealth: 100, attack: 20,
        abilities: [
          { name: 'Cuddle', heal: 25, manaCost: 2, targetType: 'ally' },
          { name: 'Bear Hug', damage: 20, freeze: true, manaCost: 3, targetType: 'enemy' }
        ]
      },
      { id: 'rocket-1', name: 'Rocket', emoji: '🚀', maxHealth: 80, attack: 30,
        abilities: [
          { name: 'Pyroblast', damage: 50, manaCost: 5, targetType: 'enemy' },
          { name: 'Boost', heal: 15, manaCost: 1, targetType: 'ally' }
        ]
      }
    ]

    const aiTestTeam = [
      { id: 'alien-1', name: 'Alien', emoji: '👽', maxHealth: 110, attack: 28,
        abilities: [
          { name: 'Mind Control', damage: 25, manaCost: 3, targetType: 'enemy' },
          { name: 'Regenerate', heal: 20, manaCost: 2, targetType: 'ally' }
        ]
      },
      { id: 'dragon-1', name: 'Dragon', emoji: '🐉', maxHealth: 140, attack: 32,
        abilities: [
          { name: 'Fire Breath', damage: 35, manaCost: 4, targetType: 'enemy' },
          { name: 'Dragon Scale', shield: 25, manaCost: 3, targetType: 'ally' }
        ]
      },
      { id: 'unicorn-1', name: 'Unicorn', emoji: '🦄', maxHealth: 90, attack: 22,
        abilities: [
          { name: 'Rainbow Heal', heal: 30, manaCost: 3, targetType: 'ally' },
          { name: 'Horn Strike', damage: 25, manaCost: 2, targetType: 'enemy' }
        ]
      },
      { id: 'ghost-1', name: 'Ghost', emoji: '👻', maxHealth: 95, attack: 26,
        abilities: [
          { name: 'Haunt', damage: 20, freeze: true, manaCost: 3, targetType: 'enemy' },
          { name: 'Phase Shift', shield: 15, manaCost: 2, targetType: 'ally' }
        ]
      }
    ]

    return { playerTestTeam, aiTestTeam }
  }

  const { playerTestTeam, aiTestTeam } = getTestTeams()
  const initialPlayerTeam = providedPlayerTeam || playerTestTeam
  const initialAiTeam = providedAiTeam || aiTestTeam
  // Boardgame.io state and moves will be passed as props from ToyboxClient
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Visual state (derived from G)
  const [playerTeam, setPlayerTeam] = useState([]);
  const [aiTeam, setAiTeam] = useState([]);
  const [activeEffects, setActiveEffects] = useState([]);
  const [damageNumbers, setDamageNumbers] = useState([]);
  const [spellNotification, setSpellNotification] = useState(null);

  // Targeting state
  const [isTargeting, setIsTargeting] = useState(false);
  const [showTargetingOverlay, setShowTargetingOverlay] = useState(false);
  const [validTargets, setValidTargets] = useState([]);
  const [currentAbility, setCurrentAbility] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  // Animation queue processing
  const animationProcessingRef = useRef(false);

  // Render the client directly as a component
  const GameComponent = (props) => {
    console.log('GameComponent props:', props);
    const { G, ctx, moves, isActive, isConnected } = props;

    // Check if Boardgame.io is ready
    if (!G || !ctx || !moves) {
      console.log('Waiting for Boardgame.io initialization...', { G, ctx, moves });
      return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-900 to-purple-900">
          <div className="text-white text-2xl">Initializing game...</div>
        </div>
      );
    }

        // Initialize game on first render
        useEffect(() => {
          if (!isInitialized && moves && moves.initializeCards && initialPlayerTeam && initialAiTeam) {
            console.log('Initializing cards with teams:', { initialPlayerTeam, initialAiTeam });
            moves.initializeCards(initialPlayerTeam, initialAiTeam);
            setIsInitialized(true);
          }
        }, [moves, isInitialized]);

        // Initialize loading buffer
        useEffect(() => {
          if (isLoading) {
            const isMobile = window.innerWidth <= 768;
            const loadTime = isMobile ? 7000 : 5000;
            const interval = 100;
            const increment = 100 / (loadTime / interval);

            const timer = setInterval(() => {
              setLoadingProgress(prev => {
                const next = prev + increment;
                if (next >= 100) {
                  clearInterval(timer);
                  setTimeout(() => {
                    setIsLoading(false);
                  }, 500);
                  return 100;
                }
                return next;
              });
            }, interval);

            return () => clearInterval(timer);
          }
        }, [isLoading]);

        // Sync Boardgame.io state to visual state
        useEffect(() => {
          if (G && G.players && G.players['0'] && G.players['1']) {
            // Map player 0 to playerTeam (bottom)
            const mappedPlayerTeam = G.players['0'].cards.map(card => ({
              ...card,
              instanceId: card.instanceId || card.id,
              isAlive: card.currentHealth > 0,
              team: 'player'
            }));

            // Map player 1 to aiTeam (top)
            const mappedAiTeam = G.players['1'].cards.map(card => ({
              ...card,
              instanceId: card.instanceId || card.id,
              isAlive: card.currentHealth > 0,
              team: 'ai'
            }));

            setPlayerTeam(mappedPlayerTeam);
            setAiTeam(mappedAiTeam);
          }
        }, [G]);

        // Process animation queue
        useEffect(() => {
          if (G && G.animationQueue && G.animationQueue.length > 0 && !animationProcessingRef.current) {
            processAnimations(G.animationQueue, moves);
          }
        }, [G?.animationQueue]);

        // Check for game end
        useEffect(() => {
          if (ctx && ctx.gameover) {
            const winner = ctx.gameover.winner;
            if (onBattleEnd) {
              onBattleEnd(winner === '0' ? 'player' : 'ai');
            }
          }
        }, [ctx?.gameover]);

        const processAnimations = async (queue, moves) => {
          animationProcessingRef.current = true;

          for (const animation of queue) {
            // Create visual effect based on animation type
            const effectId = Date.now() + Math.random();

            if (animation.type === 'ability') {
              // Show spell notification
              setSpellNotification({
                ability: animation.ability,
                caster: animation.caster,
                targets: animation.target ? [animation.target] : []
              });

              // Create spell effect
              const effectType = getEffectType(animation.ability);
              if (effectType) {
                const startPos = getCardPosition(animation.caster);
                const targetPos = animation.target ? getCardPosition(animation.target) : startPos;

                setActiveEffects(prev => [...prev, {
                  id: effectId,
                  type: effectType,
                  startPosition: startPos,
                  targetPosition: targetPos,
                  duration: effectType === 'pyroblast' ? 2500 : 1500
                }]);

                // Remove effect after duration
                setTimeout(() => {
                  setActiveEffects(prev => prev.filter(e => e.id !== effectId));
                }, effectType === 'pyroblast' ? 2500 : 1500);
              }

              // Wait for animation
              await new Promise(resolve => setTimeout(resolve, 2000));
              setSpellNotification(null);
            }

            // Add damage numbers
            if (animation.type === 'damage' || animation.type === 'heal') {
              const pos = getCardPosition(animation.target);
              setDamageNumbers(prev => [...prev, {
                id: effectId,
                value: animation.amount,
                position: pos,
                isHealing: animation.type === 'heal'
              }]);
            }
          }

          // Clear the queue after processing
          if (moves.clearAnimationQueue) {
            moves.clearAnimationQueue();
          }
          animationProcessingRef.current = false;
        };

        const getCardPosition = (card, forSpell = true) => {
          if (!card) return [0, 1.5, 0];

          const isMobile = window.innerWidth <= 768;
          const spacing = isMobile ? 2.5 : 2.2;
          const totalCards = 4;
          const startX = -(totalCards - 1) * spacing / 2;

          const index = card.position || 0;
          const x = startX + index * spacing;
          const y = forSpell ? 1.5 : 0.4;
          const z = card.owner === 0 ? 5.5 : -5.5;

          return [x, y, z];
        };

        const getEffectType = (ability) => {
          if (!ability) return null;
          const name = ability.name?.toLowerCase() || '';
          if (name.includes('pyroblast')) return 'pyroblast';
          if (name.includes('fireball')) return 'fireball';
          if (name.includes('heal')) return 'healing';
          if (name.includes('shield')) return 'shield';
          if (name.includes('freeze')) return 'freeze';
          return 'explosion';
        };

        const handleCardClick = (card) => {
          // If we're in targeting mode
          if (isTargeting && selectedCard && currentAbility) {
            const isValidTarget = validTargets.some(t => t.id === card.id);
            if (isValidTarget) {
              // Execute the move
              moves.playCard(selectedCard.id, card.id, currentAbility.index);

              // Clear targeting
              setIsTargeting(false);
              setShowTargetingOverlay(false);
              setValidTargets([]);
              setCurrentAbility(null);
              setSelectedCard(null);
            }
            return;
          }

          // If it's our turn and we clicked our card
          if (ctx && ctx.currentPlayer === '0' && card.owner === 0 && !card.frozen) {
            // Show ability selection UI
            if (card.abilities && card.abilities.length > 0) {
              // For now, auto-select first ability
              const ability = card.abilities[0];
              const manaCost = ability.manaCost || 2;

              if (G.players['0'].mana >= manaCost) {
                setSelectedCard(card);
                setCurrentAbility({ ...ability, index: 0 });

                // Determine valid targets
                const targets = ability.damage
                  ? aiTeam.filter(c => c.isAlive)
                  : ability.heal || ability.shield
                  ? playerTeam.filter(c => c.isAlive)
                  : [];

                if (targets.length > 0) {
                  setValidTargets(targets);
                  setIsTargeting(true);
                  setShowTargetingOverlay(true);
                } else {
                  // No targets needed, execute immediately
                  moves.playCard(card.id, null, 0);
                }
              }
            }
          }
        };

        const handleCancelTargeting = () => {
          setIsTargeting(false);
          setShowTargetingOverlay(false);
          setValidTargets([]);
          setCurrentAbility(null);
          setSelectedCard(null);
        };

        const handleEndTurn = () => {
          if (ctx && ctx.currentPlayer === '0' && moves && moves.endTurn) {
            console.log('Ending turn');
            moves.endTurn();
          }
        };

        // Get visual states for effects
        const shieldedCharacters = new Map();
        const frozenCharacters = new Map();

        [...playerTeam, ...aiTeam].forEach(card => {
          if (card.shields > 0) {
            shieldedCharacters.set(card.instanceId, {
              type: 'energy',
              amount: card.shields
            });
          }
          if (card.frozen) {
            frozenCharacters.set(card.instanceId, true);
          }
        });

        return (
          <div className="relative w-full h-screen bg-gradient-to-b from-blue-900 to-purple-900">
            {/* Loading Screen */}
            {isLoading && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-blue-900 to-purple-900">
                <div className="text-center">
                  <h2 className="text-4xl font-bold text-white mb-8 animate-pulse">
                    Loading Battle Arena...
                  </h2>
                  <div className="w-80 h-6 bg-gray-700 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-200"
                      style={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                  <p className="text-white text-lg">
                    {Math.round(loadingProgress)}% - {window.innerWidth <= 768 ? 'Optimizing for mobile...' : 'Preparing arena...'}
                  </p>
                </div>
              </div>
            )}

            {/* Targeting Overlay */}
            {showTargetingOverlay && (
              <TargetingOverlay
                activeCard={selectedCard}
                targets={validTargets}
                onTargetSelect={handleCardClick}
                onCancel={handleCancelTargeting}
                selectedAbility={currentAbility}
              />
            )}

            {/* 3D Scene */}
            {!isLoading && (
              <div className={showTargetingOverlay ? 'blur-md scale-105 transition-all duration-300' : 'transition-all duration-300'}>
                <HearthstoneScene
                  playerTeam={playerTeam}
                  aiTeam={aiTeam}
                  onCardClick={handleCardClick}
                  shieldedCharacters={shieldedCharacters}
                  frozenCharacters={frozenCharacters}
                  isTargeting={isTargeting}
                  validTargets={validTargets}
                  activeCharacterIndex={ctx?.currentPlayer === '0' ? 0 : -1}
                  currentTurn={ctx?.currentPlayer === '0' ? 'player' : 'ai'}
                  activeEffects={activeEffects}
                  damageNumbers={damageNumbers}
                />
              </div>
            )}

            {/* Spell Notification */}
            {spellNotification && (
              <SpellNotification
                ability={spellNotification.ability}
                caster={spellNotification.caster}
                targets={spellNotification.targets}
                onComplete={() => setSpellNotification(null)}
              />
            )}

            {/* Game UI */}
            <div className="absolute top-4 left-4 z-20">
              <button
                onClick={() => window.location.href = '/'}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700"
              >
                Back to Menu
              </button>
            </div>

            {/* Turn & Mana Display */}
            {G && ctx && (
              <div className="absolute top-4 right-4 z-20">
                <div className="bg-black/50 text-white px-4 py-2 rounded-lg">
                  <div>Turn: {G.turnNumber}</div>
                  <div className={ctx.currentPlayer === '0' ? 'text-green-400' : 'text-red-400'}>
                    {ctx.currentPlayer === '0' ? 'Your Turn' : 'AI Turn'}
                  </div>
                  {ctx.currentPlayer === '0' && (
                    <>
                      <div className="mt-2">
                        Mana: {G.players['0'].mana} / {G.players['0'].maxMana}
                      </div>
                      <button
                        onClick={handleEndTurn}
                        className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                      >
                        End Turn
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Health Display */}
            {G && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                <div className="flex space-x-8">
                  <div className="bg-green-600/80 text-white px-4 py-2 rounded-lg">
                    Player: {G.players['0'].health} / {G.players['0'].maxHealth}
                  </div>
                  <div className="bg-red-600/80 text-white px-4 py-2 rounded-lg">
                    AI: {G.players['1'].health} / {G.players['1'].maxHealth}
                  </div>
                </div>
              </div>
            )}

            {/* Battle End */}
            {ctx?.gameover && (
              <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/80">
                <div className="bg-gradient-to-b from-purple-900 to-blue-900 p-8 rounded-lg text-white">
                  <h2 className="text-4xl font-bold mb-4">
                    {ctx.gameover.winner === '0' ? '🎉 Victory!' : '💀 Defeat'}
                  </h2>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700"
                  >
                    Return to Menu
                  </button>
                </div>
              </div>
            )}
          </div>
        );
  };

  return <ToyboxClient board={GameComponent} />;
};

export default BoardgameBattle3D;