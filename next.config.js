/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glb|gltf|json|png|jpg|jpeg)$/,
      type: 'asset/resource',
    });
    return config;
  },
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig; 