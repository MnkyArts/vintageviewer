import React, { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import CharacterCustomizer from '../components/CharacterCustomizer';

const ModelViewer = dynamic(() => import('../components/ModelViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center">
      <div className="text-2xl">Loading 3D Viewer...</div>
    </div>
  ),
});

export default function Home() {
  const [customization, setCustomization] = useState<{[key: string]: string}>({});

  return (
    <main className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold text-white">
          Vintage Story Skin Viewer
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 h-[600px] bg-gray-800 rounded-lg" style={{
            position: "fixed",
            width: "calc(60% - 2rem)",
            maxWidth: "1200px",
            zIndex: 10
          }}>
            <Suspense fallback={<div>Loading...</div>}>
              <ModelViewer customization={customization} />
            </Suspense>
          </div>
          <div className="lg:col-span-3 h-[600px]">
            {/* Spacer div to maintain layout */}
          </div>
          <div className="lg:col-span-1" style={{ position: "relative", zIndex: 20 }}>
            <CharacterCustomizer onCustomizationChange={setCustomization} />
          </div>
        </div>
      </div>
    </main>
  );
} 