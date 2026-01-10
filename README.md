# SimVerse25 - Gravity Sandbox

A mesmerizing 3D gravity simulation sandbox built with React and Three.js. Watch as celestial bodies orbit around a central black hole, with adjustable gravitational parameters that let you explore the dynamics of space!

## 🌌 Features

- **Interactive 3D Gravity Simulation**: Experience realistic gravitational physics with 50 orbiting stars around a central black hole
- **Adjustable Gravity Parameter**: Control the gravitational constant (G) from 0.01 to 1.0 to see how it affects orbital mechanics
- **Real-time Physics Engine**: Custom-built physics engine implementing Newtonian gravity with symplectic Euler integration
- **Visual Trails**: Stars leave beautiful motion trails as they orbit, creating stunning visual patterns
- **Orbital Controls**: Rotate, pan, and zoom to view the simulation from any angle
- **Reset Functionality**: Easily reset the simulation to its initial state

## 🚀 Live Demo

Check out the live demo [here](https://orbiting-canvas-3.onrender.com/) .

## 🛠️ Tech Stack

- **React**: Component-based UI framework
- **Three.js**: 3D graphics library for rendering the simulation
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers and abstractions for Three.js
- **Vite**: Next-generation frontend tooling

## 📋 How It Works

The simulation features:
1. A central massive black hole (invisible but gravitationally influential)
2. 50 stars initialized with orbital velocities to create stable orbits
3. Real-time gravitational calculations using Newton's law of universal gravitation
4. Softening parameter to prevent singularities when bodies get too close
5. Symplectic Euler integration for stable orbital mechanics

The physics engine calculates gravitational forces between all bodies and updates their positions and velocities in real-time, creating beautiful orbital patterns that respond dynamically to changes in the gravity parameter.

## 🏗️ Project Structure

```
src/
├── components/
│   ├── BlackHole.jsx     # Invisible central gravitational anchor
│   ├── Stars.jsx         # Visual representation of orbiting bodies
│   └── UI.jsx           # Controls for adjusting gravity and resetting
├── App.jsx              # Main application component
├── Scene.jsx            # Main 3D scene containing physics simulation
├── PhysicsEngine.js     # Core physics calculations and integration
└── main.jsx             # Entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Panav-Payappagoudar/SimVerse25.git
```

2. Navigate to the project directory:
```bash
cd SimVerse25
```

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and visit `http://localhost:5173`

### Building for Production

To build the project for production:

```bash
npm run build
```

The built files will be placed in the `dist/` directory.

## ⚙️ Configuration

The simulation parameters can be adjusted in the UI:
- **Gravity (G)**: Adjust the gravitational constant from 0.01 to 1.0
- **Reset Button**: Restart the simulation with original orbital configurations

## 🧮 Physics Implementation

The simulation implements:
- Newtonian gravity: F = G × (m₁ × m₂) / r²
- Velocity Verlet integration for stable orbits
- Softening parameter to handle close encounters
- Conservation of momentum considerations

The central black hole has a mass of 500 units while orbiting stars have a mass of 1 unit each.

## 🔧 Customization

You can customize the simulation by modifying:
- Number of stars in `Scene.jsx`
- Initial positions and velocities in `Scene.jsx`
- Physics parameters in `PhysicsEngine.js`
- Visual properties in the component files

## 🤝 Contributing

Contributions are welcome! Here are some ideas for enhancements:
- Add collision detection
- Implement different celestial body types
- Add export functionality for simulation states
- Include preset scenarios (binary star systems, etc.)

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/) and [React](https://react.dev/)
- Powered by [Three.js](https://threejs.org/) for 3D rendering
- Uses [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) and [@react-three/drei](https://github.com/pmndrs/drei)

## 🐛 Issues

If you encounter any issues or have suggestions for improvements, please open an issue on GitHub.
