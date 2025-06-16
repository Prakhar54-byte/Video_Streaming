/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    images: {
      domains: ['localhost', 'your-backend-domain.com','fs'],
    },
}

export default nextConfig