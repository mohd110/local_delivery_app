import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Wali Baba Foods',
    short_name: 'Wali Baba',
    description: 'Order food directly from Wali Baba Foods',
    start_url: '/menu',
    display: 'standalone',
    background_color: '#f8f9fa',
    theme_color: '#b51c00',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
