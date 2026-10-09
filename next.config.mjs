/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server bundle for the Docker image
  output: "standalone",
  images: {
    unoptimized: true,
  },
}

export default nextConfig
