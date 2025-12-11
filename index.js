import React, { useState, useRef, useEffect } from 'react';
import { Sliders } from 'lucide-react';

export default function PerspectiveTileGenerator() {
  const canvasRef = useRef(null);
  const [fov, setFov] = useState(60);
  const [cameraHeight, setCameraHeight] = useState(1.5);
  const [tileHeight, setTileHeight] = useState(200);
  const [depth, setDepth] = useState(50);
  const [stripesInput, setStripesInput] = useState('0: #ef4444\n0.4: #3b82f6\n0.7: #10b981');

  const parseStripes = (input) => {
    const lines = input.trim().split('\n');
    const stripes = [];
    
    for (const line of lines) {
      const parts = line.split(':').map(s => s.trim());
      if (parts.length === 2) {
        const position = parseFloat(parts[0]);
        const color = parts[1];
        if (!isNaN(position)) {
          stripes.push({ position, color });
        }
      }
    }
    
    stripes.sort((a, b) => a.position - b.position);
    return stripes;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const centerY = h / 2;
    const centerX = w / 2;
    
    const fovRad = (fov * Math.PI) / 180;
    const perspectiveFactor = Math.tan(fovRad / 2) * cameraHeight;
    
    const nearLeft = centerX - depth / 2;
    const nearScale = 1 + perspectiveFactor * 0.15;
    const nearTop = centerY - (tileHeight / 2) * nearScale;
    const nearBottom = centerY + (tileHeight / 2) * nearScale;

    const farLeft = nearLeft + depth;
    const farScale = nearScale - (perspectiveFactor * (depth / 200));
    const farTop = centerY - (tileHeight / 2) * farScale;
    const farBottom = centerY + (tileHeight / 2) * farScale;

    // Parse stripes
    const stripes = parseStripes(stripesInput);
    
    if (stripes.length === 0) {
      // Draw solid quad if no stripes
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(nearLeft, nearTop);
      ctx.lineTo(nearLeft, nearBottom);
      ctx.lineTo(farLeft, farBottom);
      ctx.lineTo(farLeft, farTop);
      ctx.closePath();
      ctx.fill();
      return;
    }

    // Draw each stripe segment
    for (let i = 0; i < stripes.length; i++) {
      const startPos = stripes[i].position;
      const endPos = i < stripes.length - 1 ? stripes[i + 1].position : 1.0;
      const color = stripes[i].color;

      // Calculate Y positions for this stripe on near side
      const nearSegTop = nearTop + (nearBottom - nearTop) * startPos;
      const nearSegBottom = nearTop + (nearBottom - nearTop) * endPos;

      // Calculate Y positions for this stripe on far side
      const farSegTop = farTop + (farBottom - farTop) * startPos;
      const farSegBottom = farTop + (farBottom - farTop) * endPos;

      // Draw the stripe segment
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(nearLeft, nearSegTop);
      ctx.lineTo(nearLeft, nearSegBottom);
      ctx.lineTo(farLeft, farSegBottom);
      ctx.lineTo(farLeft, farSegTop);
      ctx.closePath();
      ctx.fill();
    }

  }, [fov, cameraHeight, tileHeight, depth, stripesInput]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Sliders className="w-6 h-6" />
          Perspective Wall Tile Generator
        </h1>
        <p className="text-gray-600">
          Generates a perspective-corrected quad with horizontal color stripes.
        </p>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="w-full border-2 border-gray-300 rounded-lg mb-6 bg-white"
      />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field of View (FOV): {fov}°
          </label>
          <input
            type="range"
            min="30"
            max="120"
            value={fov}
            onChange={(e) => setFov(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Camera Height: {cameraHeight.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={cameraHeight}
            onChange={(e) => setCameraHeight(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tile Height: {tileHeight}px
          </label>
          <input
            type="range"
            min="50"
            max="400"
            value={tileHeight}
            onChange={(e) => setTileHeight(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Depth: {depth}px
          </label>
          <input
            type="range"
            min="10"
            max="200"
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color Stripes (position: color)
          </label>
          <textarea
            value={stripesInput}
            onChange={(e) => setStripesInput(e.target.value)}
            className="w-full h-32 p-3 border-2 border-gray-300 rounded-lg font-mono text-sm"
            placeholder="0: #ff0000&#10;0.5: #00ff00"
          />
          <p className="text-xs text-gray-500 mt-1">
            Define horizontal stripes by position (0-1) and color. Each stripe extends to the next position.
          </p>
        </div>
      </div>
    </div>
  );
}