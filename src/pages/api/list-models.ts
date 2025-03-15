import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { category } = req.query;

  if (!category || typeof category !== 'string') {
    return res.status(400).json({ error: 'Category parameter is required' });
  }

  try {
    const modelsDir = path.join(process.cwd(), 'public', 'assets', 'game', 'shapes', 'entity', 'humanoid', 'seraphskinparts', category);
    
    // Check if directory exists
    if (!fs.existsSync(modelsDir)) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Read directory and filter for .json files
    const files = fs.readdirSync(modelsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));

    res.status(200).json(files);
  } catch (error) {
    console.error('Error reading models directory:', error);
    res.status(500).json({ error: 'Failed to read models directory' });
  }
} 