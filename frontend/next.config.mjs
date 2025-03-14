/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: ['localhost', 'your-backend-domain.com'],
    },
}

export default nextConfig