'use client';

import Link from 'next/link';
import ClientWalletButton from '../components/ClientWalletButton';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-yellow-400">
      <nav className="p-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white drop-shadow-lg">
          🎮 Toy Box Brawl
        </h1>
        <ClientWalletButton className="!bg-purple-600 hover:!bg-purple-700" />
      </nav>

      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-6xl font-extrabold text-white mb-4 drop-shadow-lg">
            TOY BOX BRAWL
          </h2>
          <p className="text-2xl text-white/90 drop-shadow">
            Epic 2D Toy Battles on Solana
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Link
            href="/play"
            className="bg-white/90 backdrop-blur rounded-3xl p-8 text-center hover:scale-105 transition-transform shadow-xl"
          >
            <div className="text-6xl mb-4">⚔️</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Battle</h3>
            <p className="text-gray-600">Jump into quick AI battles</p>
          </Link>

          <Link
            href="/mint"
            className="bg-white/90 backdrop-blur rounded-3xl p-8 text-center hover:scale-105 transition-transform shadow-xl"
          >
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Mint Packs</h3>
            <p className="text-gray-600">Open toy packs for NFTs</p>
          </Link>

          <Link
            href="/collection"
            className="bg-white/90 backdrop-blur rounded-3xl p-8 text-center hover:scale-105 transition-transform shadow-xl"
          >
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Collection</h3>
            <p className="text-gray-600">View your toy fighters</p>
          </Link>
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white/80 backdrop-blur rounded-2xl p-8 max-w-2xl mx-auto shadow-xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">How to Play</h3>
            <ol className="text-left space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Get 3 free starter toys instantly</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>Battle AI opponents in turn-based combat</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>Earn rewards and mint toy pack NFTs</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span>Collect rare toys with unique abilities</span>
              </li>
            </ol>
          </div>
        </div>
      </main>

      <footer className="mt-20 p-6 text-center text-white/80">
        <p>Built on Solana • Powered by Metaplex</p>
        <div className="mt-2 space-x-4">
          <a href="#" className="hover:text-white">Discord</a>
          <a href="#" className="hover:text-white">Twitter</a>
          <a href="#" className="hover:text-white">Docs</a>
        </div>
      </footer>
    </div>
  );
}
