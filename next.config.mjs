/** @type {import('next').NextConfig} */
const nextConfig = {
  // firebase-admin and its gRPC dependencies must not be bundled into API routes
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
