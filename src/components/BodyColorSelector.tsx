import React from 'react';
import ColorSelector from './ColorSelector';

interface BodyColorSelectorProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const bodyColors = [
  { name: 'skin1', hex: '#BBC8D0' },
  { name: 'skin2', hex: '#B0E7D8' },
  { name: 'skin3', hex: '#5A8995' },
  { name: 'skin4', hex: '#366470' },
  { name: 'skin5', hex: '#CAD0D9' },
  { name: 'skin6', hex: '#99A4B8' },
  { name: 'skin7', hex: '#747D8D' },
  { name: 'skin8', hex: '#505761' },
  { name: 'skin9', hex: '#E9EBD8' },
  { name: 'skin10', hex: '#CFD3B9' },
  { name: 'skin11', hex: '#A8985A' },
  { name: 'skin12', hex: '#796A31' },
  { name: 'skin13', hex: '#D0CFC9' },
  { name: 'skin14', hex: '#B6B6B0' },
  { name: 'skin15', hex: '#858580' },
  { name: 'skin16', hex: '#575753' },
  { name: 'skin17', hex: '#C4CCB2' },
  { name: 'skin18', hex: '#ABB39A' },
  { name: 'skin19', hex: '#7B836C' },
  { name: 'skin20', hex: '#555C48' }
];

const BodyColorSelector: React.FC<BodyColorSelectorProps> = ({ selectedColor, onColorChange }) => {
  return (
    <ColorSelector
      title="Body Color"
      colors={bodyColors}
      selectedColor={selectedColor}
      onColorChange={onColorChange}
      texturePathTemplate="/assets/game/textures/entity/humanoid/seraphskinparts/body/{color}.png"
    />
  );
};

export default BodyColorSelector; 