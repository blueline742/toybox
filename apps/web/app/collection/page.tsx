'use client';

import { useState, useEffect } from 'react';
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

export default function CollectionPage() {
  const { publicKey } = useWallet();
  const [toys, setToys] = useState<Toy[]>([]);
  const [filteredToys, setFilteredToys] = useState<Toy[]>([]);
  const [selectedRarity, setSelectedRarity] = useState<Rarity | 'all'>('all');
  const [sortBy, setSortBy] = useState<'power' | 'rarity' | 'name'>('power');
  const [selectedToy, setSelectedToy] = useState<Toy | null>(null);

  useEffect(() => {
    loadCollection();
  }, [publicKey]);

  useEffect(() => {
    filterAndSortToys();
  }, [toys, selectedRarity, sortBy]);

  const loadCollection = () => {
    // Load starters
    const starters = JSON.parse(localStorage.getItem('tbb_starters_v1') || '[]');
    
    // Load NFT toys
    const nftToys = JSON.parse(localStorage.getItem('tbb_nft_toys') || '[]');
    
    const allToys = [...starters, ...nftToys];
    setToys(allToys);
  };

  const filterAndSortToys = () => {
    let filtered = [...toys];
    
    // Filter by rarity
    if (selectedRarity !== 'all') {
      filtered = filtered.filter(toy => toy.rarity === selectedRarity);
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'power':
          const powerA = a.stats.atk + a.stats.def + a.stats.hp + a.stats.speed;
          const powerB = b.stats.atk + b.stats.def + b.stats.hp + b.stats.speed;
          return powerB - powerA;
        case 'rarity':
          const rarityOrder = { mythic: 5, legendary: 4, epic: 3, rare: 2, common: 1 };
          return rarityOrder[b.rarity as keyof typeof rarityOrder] - rarityOrder[a.rarity as keyof typeof rarityOrder];
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
    
    setFilteredToys(filtered);
  };

  const getTotalPower = (toy: Toy) => {
    return toy.stats.atk + toy.stats.def + toy.stats.hp + toy.stats.speed;
  };

  const getRarityStyle = (rarity: string) => {
    const styles = {
      common: 'border-gray-400 bg-gray-50',
      rare: 'border-blue-400 bg-blue-50',
      epic: 'border-purple-400 bg-purple-50',
      legendary: 'border-orange-400 bg-orange-50',
      mythic: 'border-red-400 bg-red-50 animate-pulse'
    };
    return styles[rarity];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 p-8">
      <nav className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Collection</h1>
        <ClientWalletButton className="!bg-purple-600 hover:!bg-purple-700" />
      </nav>

      {/* Stats Overview */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{toys.length}</p>
            <p className="text-gray-600">Total Toys</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-600">
              {toys.filter(t => t.rarity === 'common').length}
            </p>
            <p className="text-gray-600">Common</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {toys.filter(t => t.rarity === 'rare').length}
            </p>
            <p className="text-blue-600">Rare</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              {toys.filter(t => t.rarity === 'epic').length}
            </p>
            <p className="text-purple-600">Epic</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-600">
              {toys.filter(t => t.rarity === 'legendary').length}
            </p>
            <p className="text-orange-600">Legendary</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-lg mb-8">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-sm text-gray-600 mr-2">Filter:</label>
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value as Rarity | 'all')}
              className="px-4 py-2 rounded-lg border border-gray-300"
            >
              <option value="all">All Rarities</option>
              <option value="common">Common</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
              <option value="mythic">Mythic</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm text-gray-600 mr-2">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'power' | 'rarity' | 'name')}
              className="px-4 py-2 rounded-lg border border-gray-300"
            >
              <option value="power">Power</option>
              <option value="rarity">Rarity</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Collection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredToys.map((toy) => (
          <button
            key={toy.id}
            onClick={() => setSelectedToy(toy)}
            className={`
              relative p-3 rounded-xl border-2 transition-all hover:scale-105
              ${getRarityStyle(toy.rarity)}
            `}
          >
            {toy.isNFT && (
              <div className="absolute top-1 right-1 bg-purple-600 text-white text-xs px-1 rounded">
                NFT
              </div>
            )}
            
            <div className="w-full aspect-square bg-gradient-to-br from-red-400 to-pink-400 rounded-lg mb-2" />
            
            <p className="text-xs font-bold truncate">{toy.name}</p>
            <p 
              className="text-xs capitalize font-semibold"
              style={{ color: `#${RARITY_COLORS[toy.rarity].toString(16)}` }}
            >
              {toy.rarity}
            </p>
            
            <div className="text-xs mt-1 space-y-0.5">
              <div className="flex justify-between">
                <span>PWR:</span>
                <span className="font-bold">{getTotalPower(toy)}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {filteredToys.length === 0 && (
        <div className="text-center py-12">
          <p className="text-2xl text-gray-500">No toys found</p>
          <p className="text-gray-400 mt-2">Try adjusting your filters or mint some packs!</p>
        </div>
      )}

      {/* Toy Details Modal */}
      {selectedToy && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedToy(null)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold">{selectedToy.name}</h3>
              <button
                onClick={() => setSelectedToy(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="w-32 h-32 bg-gradient-to-br from-red-400 to-pink-400 rounded-xl mx-auto mb-4" />
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Rarity:</span>
                <span 
                  className="font-bold capitalize"
                  style={{ color: `#${RARITY_COLORS[selectedToy.rarity].toString(16)}` }}
                >
                  {selectedToy.rarity}
                </span>
              </div>
              
              <div className="border-t pt-3">
                <p className="font-bold mb-2">Stats:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>ATK:</span>
                    <span className="font-bold">{selectedToy.stats.atk}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DEF:</span>
                    <span className="font-bold">{selectedToy.stats.def}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>HP:</span>
                    <span className="font-bold">{selectedToy.stats.hp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SPD:</span>
                    <span className="font-bold">{selectedToy.stats.speed}</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <p className="font-bold mb-2">Moves:</p>
                {selectedToy.moves.map((move, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{move.name}</span>
                    <span className="text-gray-600">DMG: {move.damage}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Power:</span>
                  <span className="font-bold text-lg">{getTotalPower(selectedToy)}</span>
                </div>
              </div>
              
              {selectedToy.isNFT && (
                <div className="border-t pt-3">
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                    NFT Verified
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}