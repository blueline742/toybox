import React from 'react';
import { Canvas } from '@react-three/fiber';
import { useTexture, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Minimal test card to verify NFT texture loading works
 */
function TestCard() {
  // Test with one specific NFT image
  const texture = useTexture('/assets/nft/newnft/robotnft.png');

  return (
    <mesh>
      <planeGeometry args={[2, 3]} /> {/* 512x768 aspect ratio */}
      <meshBasicMaterial
        map={texture}
        transparent
        side={THREE.DoubleSide}
        alphaTest={0.1}
      />
    </mesh>
  );
}

/**
 * Grid of all NFT cards for testing
 */
function NFTGrid() {
  const nftPaths = [
    '/assets/nft/newnft/robotnft.png',
    '/assets/nft/newnft/wizardnft.png',
    '/assets/nft/newnft/archwizardnft.png',
    '/assets/nft/newnft/duckienft.png',
    '/assets/nft/newnft/brickdudenft.png',
    '/assets/nft/newnft/winduptoynft.png',
    '/assets/nft/newnft/dinonft.png',
    '/assets/nft/newnft/voodoonft.png'
  ];

  return (
    <>
      {nftPaths.map((path, index) => {
        const row = Math.floor(index / 4);
        const col = index % 4;
        const x = (col - 1.5) * 2.5;
        const y = (row - 0.5) * -3.5;

        return (
          <SingleNFT key={path} path={path} position={[x, y, 0]} />
        );
      })}
    </>
  );
}

function SingleNFT({ path, position }) {
  const texture = useTexture(path);

  return (
    <mesh position={position}>
      <planeGeometry args={[2, 3]} />
      <meshBasicMaterial
        map={texture}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/**
 * Test scene to verify NFT loading in isolation
 */
export default function TestNFTScene() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      <Canvas camera={{ position: [0, 0, 12], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={1.0} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />

        {/* Debug helpers */}
        <axesHelper args={[10]} />
        <gridHelper args={[20, 20]} />

        {/* Test single card */}
        {/* <TestCard /> */}

        {/* Test all NFTs in grid */}
        <React.Suspense fallback={
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="red" />
          </mesh>
        }>
          <NFTGrid />
        </React.Suspense>

        {/* Camera controls */}
        <OrbitControls />
      </Canvas>

      {/* Debug info */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        color: 'white',
        fontFamily: 'monospace',
        background: 'rgba(0,0,0,0.7)',
        padding: '10px'
      }}>
        <h3>NFT Test Scene</h3>
        <p>✅ If you see 8 NFT cards = textures work</p>
        <p>❌ If you see red cube = loading failed</p>
        <p>❌ If blank = positioning/camera issue</p>
      </div>
    </div>
  );
}