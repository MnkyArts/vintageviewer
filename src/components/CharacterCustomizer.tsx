import React, { useState, useEffect } from 'react';
import HairColorSelector from './HairColorSelector';
import BodyColorSelector from './BodyColorSelector';
import EyeColorSelector from './EyeColorSelector';

interface CustomizationOption {
  id: string;
  label: string;
  options: string[];
}

interface CharacterCustomizerProps {
  onCustomizationChange: (customization: { [key: string]: string }) => void;
}

const CharacterCustomizer: React.FC<CharacterCustomizerProps> = ({ onCustomizationChange }) => {
  const [options, setOptions] = useState<CustomizationOption[]>([]);
  const [customization, setCustomization] = useState<{[key: string]: string}>({
    haircolor: 'lightgray',
    'hair-base-color': 'lightgray',
    'hair-extra-color': 'lightgray',
    baseskin: 'skin1',
    eyecolor: 'azure',
    underwear: 'breeches'
  });

  useEffect(() => {
    const loadOptions = async () => {
      // Load available options from the model directories
      const categories = {
        face: 'Face Style',
        'hair-base': 'Hair Base',
        'hair-extra': 'Hair Extra',
        'hair-face': 'Facial Hair'
      };

      const loadedOptions: CustomizationOption[] = [];

      for (const [dir, label] of Object.entries(categories)) {
        try {
          const response = await fetch(`/api/list-models?category=${dir}`);
          const files = await response.json();
          
          loadedOptions.push({
            id: dir,
            label,
            options: files.map((f: string) => f.replace('.json', ''))
          });
        } catch (error) {
          console.error(`Error loading options for ${dir}:`, error);
        }
      }

      setOptions(loadedOptions);
      
      // Set initial values
      const initialValues = {
        ...loadedOptions.reduce((acc, option) => {
          acc[option.id] = option.options[0] || 'none';
          return acc;
        }, {} as {[key: string]: string}),
        haircolor: 'lightgray',
        'hair-base-color': 'lightgray',
        'hair-extra-color': 'lightgray',
        baseskin: 'skin1',
        eyecolor: 'azure',
        underwear: 'breeches'
      };
      
      setCustomization(initialValues);
      onCustomizationChange(initialValues);
    };

    loadOptions();
  }, [onCustomizationChange]);

  const handleOptionChange = (optionId: string, value: string) => {
    const newCustomization = {
      ...customization,
      [optionId]: value,
    };

    // If changing hair color, update all hair-related colors
    if (optionId === 'haircolor') {
      newCustomization['hair-base-color'] = value;
      newCustomization['hair-extra-color'] = value;
    }

    setCustomization(newCustomization);
    onCustomizationChange(newCustomization);
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">Character Customization</h2>
      
      <BodyColorSelector
        selectedColor={customization.baseskin || 'skin1'}
        onColorChange={(color) => handleOptionChange('baseskin', color)}
      />

      <EyeColorSelector
        selectedColor={customization.eyecolor || 'azure'}
        onColorChange={(color) => handleOptionChange('eyecolor', color)}
      />
      
      <HairColorSelector
        selectedColor={customization.haircolor || 'lightgray'}
        onColorChange={(color) => handleOptionChange('haircolor', color)}
      />

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Underwear
          </label>
          <select
            value={customization.underwear || 'none'}
            onChange={(e) => handleOptionChange('underwear', e.target.value)}
            className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">None</option>
            <option value="breeches">Breeches</option>
            <option value="leotard">Leotard</option>
            <option value="twopiece">Two Piece</option>
          </select>
        </div>
        {options.map((option) => (
          <div key={option.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              {option.label}
            </label>
            <select
              value={customization[option.id] || ''}
              onChange={(e) => handleOptionChange(option.id, e.target.value)}
              className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">None</option>
              {option.options.map((value) => (
                <option key={value} value={value}>
                  {value.charAt(0).toUpperCase() + value.slice(1).replace(/([A-Z])/g, ' $1')}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterCustomizer; 