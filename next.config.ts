import { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ['@napi-rs/canvas'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externals = config.externals || []
      config.externals = Array.isArray(externals)
        ? [...externals, '@napi-rs/canvas']
        : [externals, '@napi-rs/canvas']
    }

    return config
  },
}

export default nextConfig
