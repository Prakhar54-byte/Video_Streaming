/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites () {
    return [
      {
        source: '/.well-known/:path*',
        destination: '/404'
      }
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**'
      },
      {
        protocol: 'http',
        hostname: 'res.cloudinary.com',
        pathname: '/**'
      }
    ]
  },
  webpack: (config, { isServer }) => {
    // Enable WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true
    }

    // Add rule for .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource'
    })

    return config
  }
}

export default nextConfig
