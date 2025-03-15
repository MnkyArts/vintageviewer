import React from 'react';

interface ColorInfo {
  name: string;
  hex: string;
}

interface ColorSelectorProps {
  title: string;
  colors: ColorInfo[];
  selectedColor: string;
  onColorChange: (color: string) => void;
  texturePathTemplate?: string;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({
  title,
  colors,
  selectedColor,
  onColorChange,
  texturePathTemplate
}) => {
  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
      <div className="grid grid-cols-6 gap-2">
        {colors.map((color) => (
          <button
            key={color.name}
            className={`w-8 h-8 rounded-md border-2 transition-all ${
              selectedColor === color.name
                ? 'border-white scale-110'
                : 'border-transparent hover:border-gray-400 hover:scale-105'
            }`}
            style={{
              backgroundColor: color.hex,
              ...(texturePathTemplate && {
                backgroundImage: `url(${texturePathTemplate.replace('{color}', color.name)})`,
                backgroundSize: 'cover',
                imageRendering: 'pixelated'
              })
            }}
            onClick={() => onColorChange(color.name)}
            title={`${color.name.replace(/([A-Z])/g, ' $1').toLowerCase()} (${color.hex})`}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorSelector; 