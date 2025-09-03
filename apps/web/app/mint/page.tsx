'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import ClientWalletButton from '../../components/ClientWalletButton';
import { Toy } from '../../lib/game';

type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

const RARITY_COLORS = {
  common: 0x888888,
  rare: 0x4A90E2,
  epic: 0x9B59B6,
  legendary: 0xF39C12,
  mythic: 0xE74C3C
};

export default function MintPage() {
  const { publicKey } = useWallet();
  const [isMinting, setIsMinting] = useState(false);
  const [packResult, setPackResult] = useState<Toy[] | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [revealedCards, setRevealedCards] = useState<number[]>([]);

  const PACK_PRICE = 0.5; // SOL

  const mintPack = async () => {
    if (!publicKey) {
      alert('Please connect your wallet first!');
      return;
    }

    setIsMinting(true);
    try {
      // Simulate minting delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate random pack contents
      const rarities: Rarity[] = [];
      for (let i = 0; i < 5; i++) {
        const roll = Math.random();
        if (roll < 0.65) rarities.push('common');
        else if (roll < 0.9) rarities.push('rare');
        else if (roll < 0.98) rarities.push('epic');
        else if (roll < 0.999) rarities.push('legendary');
        else rarities.push('mythic');
      }
      
      // Ensure at least one rare (pity system)
      if (!rarities.some(r => r !== 'common')) {
        rarities[0] = 'rare';
      }
      
      // Generate toys
      const toyNames = ['Robot', 'Dino', 'Duck', 'Army Man', 'Yo-Yo', 'RC Car', 'Jack', 'Teddy'];
      const toys: Toy[] = rarities.map((rarity, i) => ({
        id: `toy_${Date.now()}_${i}`,
        name: toyNames[Math.floor(Math.random() * toyNames.length)],
        rarity,
        stats: {
          hp: 20 + Math.floor(Math.random() * 30),
          maxHp: 50,
          atk: 10 + Math.floor(Math.random() * 20),
          def: 10 + Math.floor(Math.random() * 20),
          speed: 10 + Math.floor(Math.random() * 30),
          critChance: 10
        },
        sprite: 'toy.png',
        moves: [],
        statusEffects: [],
        statusDuration: 0,
        isNFT: true
      }));
      
      // Save to localStorage
      const nftKey = 'tbb_nft_toys';
      const existingNFTs = JSON.parse(localStorage.getItem(nftKey) || '[]');
      localStorage.setItem(nftKey, JSON.stringify([...existingNFTs, ...toys]));
      
      setPackResult(toys);
      setShowAnimation(true);
      setRevealedCards([]);
      
      // Reveal animation
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          setRevealedCards(prev => [...prev, i]);
        }, 1000 + i * 400);
      }
    } catch (error) {
      console.error('Minting failed:', error);
      alert('Minting failed. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  const collectToys = () => {
    setPackResult(null);
    setShowAnimation(false);
    setRevealedCards([]);
    alert('Toys added to your collection!');
  };

  const getRarityGlow = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'shadow-gray-400',
      rare: 'shadow-blue-400',
      epic: 'shadow-purple-400',
      legendary: 'shadow-orange-400',
      mythic: 'shadow-red-400 animate-pulse'
    };
    return colors[rarity] || 'shadow-gray-400';
  };

  if (showAnimation && packResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="relative">
          {revealedCards.length === 0 && (
            <div className="animate-bounce">
              <div className="w-40 h-40 bg-gradient-to-b from-yellow-600 to-yellow-800 rounded-lg shadow-2xl mx-auto mb-8">
                <div className="w-full h-12 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-t-lg" />
              </div>
            </div>
          )}

          {revealedCards.length > 0 && (
            <div className="flex gap-4 justify-center">
              {packResult.map((toy, index) => {
                const isRevealed = revealedCards.includes(index);
                const rarityColor = RARITY_COLORS[toy.rarity as Rarity] || 0x888888;
                return (
                  <div
                    key={index}
                    className={`
                      relative w-32 h-44 transition-all duration-500
                      ${isRevealed ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
                    `}
                  >
                    <div className={`
                      w-full h-full bg-gradient-to-b from-white to-gray-100 rounded-xl p-3
                      shadow-2xl ${getRarityGlow(toy.rarity)} border-4
                    `} style={{ borderColor: `#${rarityColor.toString(16)}` }}>
                      <div className="w-full h-20 bg-gradient-to-br from-red-400 to-pink-400 rounded-lg mb-2" />
                      <p className="text-xs font-bold text-center">{toy.name}</p>
                      <p className="text-xs text-center capitalize" style={{ color: `#${rarityColor.toString(16)}` }}>
                        {toy.rarity}
                      </p>
                      <div className="text-xs mt-1">
                        <p>ATK: {toy.stats.atk}</p>
                        <p>DEF: {toy.stats.def}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {revealedCards.length === 5 && (
            <button
              onClick={collectToys}
              className="mt-8 px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition animate-pulse mx-auto block"
            >
              Tap to Collect
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-500 to-purple-600 p-8">
      <nav className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-bold text-white">Mint Toy Packs</h1>
        <ClientWalletButton className="!bg-purple-700 hover:!bg-purple-800" />
      </nav>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white/90 backdrop-blur rounded-3xl p-8 shadow-2xl mb-8">
          <h2 className="text-3xl font-bold text-center mb-6">Toy Pack</h2>
          
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-48 h-64 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-2xl shadow-2xl p-4">
                <div className="text-center text-white">
                  <p className="text-6xl mb-2">📦</p>
                  <p className="text-2xl font-bold">TOY PACK</p>
                  <p className="text-sm mt-2">5 Random Toys</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-2xl font-bold">{PACK_PRICE} SOL</p>
          </div>

          <button
            onClick={mintPack}
            disabled={!publicKey || isMinting}
            className={`
              w-full py-4 rounded-xl font-bold text-lg transition-all
              ${publicKey && !isMinting
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isMinting ? 'Minting...' : !publicKey ? 'Connect Wallet' : 'Mint Toy Pack'}
          </button>
        </div>

        <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold mb-4">Drop Rates</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Common</span>
              <span className="font-bold">65%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600">Rare</span>
              <span className="font-bold">25%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-600">Epic</span>
              <span className="font-bold">8%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-600">Legendary</span>
              <span className="font-bold">1.9%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600 font-bold">Mythic</span>
              <span className="font-bold">0.1%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}