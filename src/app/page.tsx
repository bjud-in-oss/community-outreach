'use client';

import { AdaptiveLayout } from '@/components/layout'

export default function Home() {
  return (
    <AdaptiveLayout 
      defaultView="samtalet"
      onViewChange={(view) => console.log('View changed to:', view)}
      onLayoutModeChange={(mode) => console.log('Layout mode changed to:', mode)}
    />
  )
}