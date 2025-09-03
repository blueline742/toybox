import React, { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'

const ResultsScreen = ({ result, onPlayAgain, onBackToMenu }) => {
  const { publicKey, signTransaction, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const [rewardClaimed, setRewardClaimed] = useState(false)
  const [claimingReward, setClaimingReward] = useState(false)
  const [transactionSignature, setTransactionSignature] = useState(null)

  const isWinner = result.winner === 'player'
  const rewardAmount = isWinner ? 0.001 : 0.0005 // SOL rewards (testnet amounts)

  // Calculate battle stats
  const battleStats = {
    damageDealt: result.aiCharacter.maxHealth - result.finalAiHealth,
    damageTaken: result.playerCharacter.maxHealth - result.finalPlayerHealth,
    accuracyPercent: Math.floor(Math.random() * 20) + 80, // Mock accuracy
    battleDuration: '2:34' // Mock duration
  }

  // Simulate reward claiming (in production, this would interact with your game's smart contract)
  const claimReward = async () => {
    if (!publicKey || !signTransaction) return

    setClaimingReward(true)
    try {
      // This is a mock transaction - in production you'd interact with your game contract
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey, // Self-transfer for demo
          lamports: Math.floor(rewardAmount * LAMPORTS_PER_SOL),
        })
      )

      // Set recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      // This would normally be handled by your backend/smart contract
      console.log('Mock reward claim transaction created')
      setRewardClaimed(true)
      setTransactionSignature('mock_signature_' + Math.random().toString(36).substring(7))
      
    } catch (error) {
      console.error('Error claiming reward:', error)
    } finally {
      setClaimingReward(false)
    }
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {isWinner ? (
          <>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 opacity-80"></div>
            {/* Confetti effect */}
            <div className="absolute top-10 left-10 w-4 h-4 bg-toy-yellow rounded-full animate-bounce opacity-70"></div>
            <div className="absolute top-20 right-20 w-3 h-3 bg-toy-pink rounded-full animate-pulse opacity-70"></div>
            <div className="absolute bottom-20 left-20 w-5 h-5 bg-toy-blue rounded-full animate-bounce opacity-70"></div>
            <div className="absolute bottom-30 right-30 w-4 h-4 bg-toy-green rounded-full animate-pulse opacity-70"></div>
          </>
        ) : (
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-600 via-blue-700 to-purple-800 opacity-80"></div>
        )}
      </div>

      <div className="text-center z-10 max-w-md w-full">
        {/* Result Title */}
        <div className="mb-8">
          {isWinner ? (
            <>
              <h1 className="text-6xl font-toy text-toy-yellow mb-4 drop-shadow-2xl animate-bounce">
                VICTORY!
              </h1>
              <div className="text-8xl mb-4 animate-pulse">🎉</div>
              <p className="text-2xl text-white font-comic">
                Congratulations, Champion!
              </p>
            </>
          ) : (
            <>
              <h1 className="text-5xl font-toy text-white mb-4 drop-shadow-2xl">
                DEFEAT
              </h1>
              <div className="text-8xl mb-4">😤</div>
              <p className="text-xl text-white font-comic">
                Better luck next time!
              </p>
            </>
          )}
        </div>

        {/* Battle Results */}
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6 mb-6">
          <h3 className="text-xl font-bold text-white mb-4 font-comic">Battle Summary</h3>
          
          <div className="grid grid-cols-2 gap-4 text-white font-comic">
            <div className="text-center">
              <div className="text-4xl mb-2" style={{ color: result.playerCharacter.color }}>
                {result.playerCharacter.emoji}
              </div>
              <div className="text-sm">{result.playerCharacter.name}</div>
              <div className="text-lg font-bold">
                {result.finalPlayerHealth}/{result.playerCharacter.maxHealth}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-2" style={{ color: result.aiCharacter.color }}>
                {result.aiCharacter.emoji}
              </div>
              <div className="text-sm">{result.aiCharacter.name}</div>
              <div className="text-lg font-bold">
                {result.finalAiHealth}/{result.aiCharacter.maxHealth}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 space-y-2 text-sm text-white font-comic">
            <div className="flex justify-between">
              <span>Damage Dealt:</span>
              <span className="text-red-300">{battleStats.damageDealt}</span>
            </div>
            <div className="flex justify-between">
              <span>Damage Taken:</span>
              <span className="text-red-300">{battleStats.damageTaken}</span>
            </div>
            <div className="flex justify-between">
              <span>Accuracy:</span>
              <span className="text-green-300">{battleStats.accuracyPercent}%</span>
            </div>
          </div>
        </div>

        {/* Rewards Section */}
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6 mb-6">
          <h3 className="text-xl font-bold text-white mb-4 font-comic">Rewards</h3>
          
          <div className="text-center">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-lg text-toy-yellow font-bold font-comic">
              +{rewardAmount} SOL
            </div>
            <div className="text-xs text-white opacity-70 font-comic mb-4">
              {isWinner ? 'Victory Bonus!' : 'Participation Reward'}
            </div>

            {publicKey && !rewardClaimed && !claimingReward && (
              <button
                onClick={claimReward}
                className="toy-button font-comic text-lg px-6 py-3"
              >
                Claim Reward
              </button>
            )}

            {claimingReward && (
              <div className="text-white font-comic">
                <div className="animate-spin text-2xl mb-2">⏳</div>
                Claiming reward...
              </div>
            )}

            {rewardClaimed && (
              <div className="text-green-400 font-comic">
                <div className="text-2xl mb-2">✅</div>
                Reward claimed!
                {transactionSignature && (
                  <div className="text-xs mt-2 opacity-70">
                    TX: {transactionSignature.substring(0, 8)}...
                  </div>
                )}
              </div>
            )}

            {!publicKey && (
              <div className="text-white opacity-70 font-comic text-sm">
                Connect wallet to claim rewards
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={onPlayAgain}
            className="toy-button text-xl font-comic px-8 py-4 w-full"
          >
            Play Again
          </button>
          
          <button
            onClick={onBackToMenu}
            className="toy-button-blue text-lg font-comic px-6 py-3 w-full"
          >
            Back to Menu
          </button>
        </div>

        {/* Share Results (Mock) */}
        <div className="mt-6 text-center">
          <p className="text-white opacity-60 font-comic text-sm mb-2">
            Share your victory!
          </p>
          <div className="flex justify-center gap-4">
            <button className="text-white hover:text-toy-blue transition-colors text-2xl">
              📱
            </button>
            <button className="text-white hover:text-toy-pink transition-colors text-2xl">
              🔗
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultsScreen