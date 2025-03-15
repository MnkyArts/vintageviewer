# 🎮 Vintage Story Model Viewer
![Vintage Story Model Viewer](https://i.imgur.com/b9BUEub.png)

A specialized web viewer for previewing and customizing Vintage Story player character models, focusing on the Seraph (player character) model and its various customizable parts.

## ⚠️ Known Issues

This project is still in development and has some issues with rendering faces and hair rotations. If you encounter inaccuracies, please be aware that these are known limitations (pls make a pr and fix it).

## 💡 Contribute

We welcome pull requests to help improve face rendering, hair rotations, and other aspects of the project. If you have a fix or an enhancement, feel free to submit a PR!

## 📝 Description

Vintage Viewer is a web-based tool designed specifically for Vintage Story player models. It allows you to preview and customize the Seraph character model (the player character in Vintage Story) with all its customizable features like eye textures, face expressions, and other character parts. This viewer makes it easier to work with and preview the complex JSON-based shape definitions used in Vintage Story's character system.

## ✨ Features

- Preview Vintage Story player models in real-time
- Customize Seraph character appearances
- Support for Vintage Story's texture system
- Compatible with Vintage Story's JSON shape definitions
- Handles Vintage Story's UV mapping system
- Preview different character expressions and parts

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Web browser (Chrome, Firefox, Safari, or Edge)
- Basic understanding of Vintage Story's model structure

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mnkyarts/vintageviewer.git
cd vintageviewer
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## 🎨 Asset Setup

### Vintage Story Assets Structure

Your assets should follow this structure:
```
public/
  assets/
    # Add your assets/game folder here.
    # Best practice: Include only the necessary directories:
    #   - game/shapes/entity/humanoid/
    #   - game/textures/blocks/
    #   - game/textures/entity/humanoid/
```

### Making the Eye Color Selection work

To enable eye colors, add the following entry to the `"textures"` section in your eye (face) JSON files:

```json
"textures": {
    "eye": "entity/humanoid/seraphskinparts/eyes/your-eye-texture"
}
```

Then, in all eye (face) JSON files, update the `"faces"` texture in both `"R eye"` and `"L eye2"` from `#seraph` to `#eye`.

## 👯‍♂️ Support

If you encounter any issues or have questions:
1. Check the existing issues
2. Create a new issue with a detailed description
3. Include your model configurations and Vintage Story version if relevant

---

Made with ❤️ by MnkyArts