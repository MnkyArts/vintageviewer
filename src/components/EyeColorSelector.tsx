import React from 'react';
import ColorSelector from './ColorSelector';

interface EyeColorSelectorProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const eyeColors = [
  { name: 'acid-green', hex: '#919E2F' },
  { name: 'aquamarine', hex: '#87B8BF' },
  { name: 'azure', hex: '#3B7DA3' },
  { name: 'bitter-lemon', hex: '#A9AE30' },
  { name: 'cadmium-orange', hex: '#A27C3A' },
  { name: 'citron', hex: '#73772C' },
  { name: 'dark-green', hex: '#174B23' },
  { name: 'forest-green', hex: '#3D7829' },
  { name: 'goldenrod', hex: '#A49D3C' },
  { name: 'jade', hex: '#5A9A94' },
  { name: 'lavander', hex: '#9688BF' },
  { name: 'malachite', hex: '#53A33B' },
  { name: 'mantis', hex: '#90AC69' },
  { name: 'midnight', hex: '#543BA3' },
  { name: 'phthalo-blue', hex: '#3B3DA3' },
  { name: 'purple', hex: '#7A3BA3' },
  { name: 'sand', hex: '#BEB687' },
  { name: 'sapphire', hex: '#3B5DA3' }
];

const EyeColorSelector: React.FC<EyeColorSelectorProps> = ({ selectedColor, onColorChange }) => {
  return (
    <ColorSelector
      title="Eye Color"
      colors={eyeColors}
      selectedColor={selectedColor}
      onColorChange={onColorChange}
      texturePathTemplate="/assets/game/textures/entity/humanoid/seraphskinparts/eyes/{color}.png"
    />
  );
};

export default EyeColorSelector; 