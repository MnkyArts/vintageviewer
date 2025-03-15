import React from 'react';
import ColorSelector from './ColorSelector';

interface HairColorSelectorProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const hairColors = [
  { name: 'lightgray', hex: '#C9CED5' },
  { name: 'silverchalice', hex: '#9B9B9F' },
  { name: 'slategray', hex: '#353638' },
  { name: 'eerieblack', hex: '#232322' },
  { name: 'mossgreen', hex: '#827C6D' },
  { name: 'seagreen', hex: '#656B55' },
  { name: 'wintergreendream', hex: '#7A654B' },
  { name: 'steelblue', hex: '#8D9074' },
  { name: 'queenblue', hex: '#6A7C84' },
  { name: 'indigodye', hex: '#857F7C' },
  { name: 'heliotropegray', hex: '#A99B81' },
  { name: 'palatinatepurple', hex: '#493326' },
  { name: 'darkpurple', hex: '#3D3325' },
  { name: 'wheat', hex: '#CFBEAD' },
  { name: 'ecru', hex: '#B6B09A' },
  { name: 'sanddune', hex: '#B09352' },
  { name: 'harvestgold', hex: '#9B762F' },
  { name: 'cordovan', hex: '#854F31' },
  { name: 'rosewood', hex: '#733618' },
  { name: 'russet', hex: '#6D4126' },
  { name: 'liver', hex: '#502714' },
  { name: 'oldburgundy', hex: '#362012' },
  { name: 'aged', hex: '#A19B9A' }
];

const HairColorSelector: React.FC<HairColorSelectorProps> = ({ selectedColor, onColorChange }) => {
  return (
    <ColorSelector
      title="Hair Color"
      colors={hairColors}
      selectedColor={selectedColor}
      onColorChange={onColorChange}
      texturePathTemplate="/assets/game/textures/entity/humanoid/seraphskinparts/hair/{color}.png"
    />
  );
};

export default HairColorSelector; 