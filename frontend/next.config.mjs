/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: ['localhost', 'your-backend-domain.com','fs'],
    },
}

export default nextConfig