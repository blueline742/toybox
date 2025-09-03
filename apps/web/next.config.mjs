import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@game': path.resolve(__dirname, '../../packages/game/src'),
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
    };
    config.resolve.extensions = ['.ts', '.tsx', '.js', '.jsx'];
    return config;
  },
};

export default nextConfig;
