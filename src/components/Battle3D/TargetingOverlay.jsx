import React from 'react';

/**
 * 2D Targeting Overlay - Shows active card at bottom and targets at top
 * Replaces 3D view during player's targeting phase
 */
const TargetingOverlay = ({
  activeCard,
  targets,
  onTargetSelect,
  onCancel,
  selectedAbility
}) => {
  // Get NFT image path for a character
  const getNFTPath = (character) => {
    if (character?.image && character.image.includes('/assets/nft/')) {
      return character.image;
    }

    const charName = character?.name?.toLowerCase() || '';

    if (charName.includes('robot') || charName.includes('guardian'))
      return '/assets/nft/newnft/robotnft.png';
    if (charName.includes('arch') && charName.includes('wizard'))
      return '/assets/nft/newnft/archwizardnft.png';
    if (charName.includes('wizard'))
      return '/assets/nft/newnft/wizardnft.png';
    if (charName.includes('duck') || charName.includes('rubber'))
      return '/assets/nft/newnft/duckienft.png';
    if (charName.includes('brick') || charName.includes('teddy'))
      return '/assets/nft/newnft/brickdudenft.png';
    if (charName.includes('wind') || charName.includes('soldier'))
      return '/assets/nft/newnft/winduptoynft.png';
    if (charName.includes('dino') || charName.includes('mecha'))
      return '/assets/nft/newnft/dinonft.png';
    if (charName.includes('voodoo') || charName.includes('curse') || charName.includes('marionette'))
      return '/assets/nft/newnft/voodoonft.png';

    return '/assets/nft/newnft/robotnft.png';
  };

  if (!activeCard) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm">
      {/* Header */}
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold text-white drop-shadow-lg">Choose Your Target</h2>
        {selectedAbility && (
          <p className="text-yellow-400 mt-2 drop-shadow-lg">
            Using: {selectedAbility.name}
          </p>
        )}
      </div>

      {/* Target Cards - Top Section */}
      <div className="flex justify-center items-center gap-4 px-4 mt-8">
        {targets.map((target, index) => (
          <div
            key={target.instanceId}
            className="relative cursor-pointer transform transition-all hover:scale-110 hover:z-10"
            onClick={() => {
              console.log('🔴 Target clicked in overlay:', target);
              console.log('🔴 onTargetSelect function exists?', typeof onTargetSelect);
              if (onTargetSelect) {
                onTargetSelect(target);
              } else {
                console.error('❌ onTargetSelect is not a function!');
              }
            }}
          >
            {/* Card Image */}
            <div className="relative">
              <img
                src={getNFTPath(target)}
                alt={target.name}
                className="w-32 h-48 md:w-40 md:h-60 rounded-lg shadow-2xl border-2 border-red-600 hover:border-yellow-400"
              />

              {/* Health Bar */}
              <div className="absolute bottom-2 left-2 right-2 bg-black/70 rounded p-1">
                <div className="text-white text-xs text-center mb-1">
                  {target.currentHealth}/{target.maxHealth}
                </div>
                <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-red-500 to-red-600 h-full transition-all"
                    style={{ width: `${(target.currentHealth / target.maxHealth) * 100}%` }}
                  />
                </div>
              </div>

              {/* Target Indicator */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </div>

              {/* Frozen/Shield Status */}
              {target.frozen && (
                <div className="absolute inset-0 bg-blue-400/30 rounded-lg flex items-center justify-center">
                  <span className="text-white text-2xl">❄️</span>
                </div>
              )}
              {target.shields > 0 && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">
                  {target.shields}
                </div>
              )}
            </div>

            {/* Target Name */}
            <div className="text-center mt-2">
              <p className="text-white font-semibold text-sm">{target.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active Card - Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center justify-center">
          <div className="relative">
            {/* Active Card Image */}
            <img
              src={getNFTPath(activeCard)}
              alt={activeCard.name}
              className="w-40 h-60 md:w-48 md:h-72 rounded-lg shadow-2xl border-4 border-yellow-400 animate-pulse"
            />

            {/* Card Info */}
            <div className="absolute bottom-2 left-2 right-2 bg-black/80 rounded p-2">
              <div className="text-white text-center">
                <p className="font-bold">{activeCard.name}</p>
                <p className="text-sm">
                  HP: {activeCard.currentHealth}/{activeCard.maxHealth}
                </p>
              </div>
            </div>

            {/* Active Indicator */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold">
              YOUR TURN
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="absolute bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center pointer-events-none">
        <p className="text-lg opacity-70">Click on an enemy card to attack!</p>
      </div>
    </div>
  );
};

export default TargetingOverlay;