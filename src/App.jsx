import React, { useState, useRef, useEffect } from 'react';
import { Sliders, Plus, Trash2 } from 'lucide-react';

export default function PerspectiveTileGenerator() {
  const canvasRef = useRef(null);
  const [fov, setFov] = useState(60);
  const [cameraHeight, setCameraHeight] = useState(1.5);
  const [tileHeight, setTileHeight] = useState(200);
  const [depth, setDepth] = useState(50);
  const [stripes, setStripes] = useState([
    { position: 0, color: '#ef4444' },
    { position: 0.4, color: '#3b82f6' },
    { position: 0.7, color: '#10b981' }
  ]);

  const addStripe = () => {
    const newPos = stripes.length > 0 ? Math.min(stripes[stripes.length - 1].position + 0.1, 0.9) : 0;
    setStripes([...stripes, { position: newPos, color: '#6b7280' }]);
  };

  const removeStripe = (index) => {
    setStripes(stripes.filter((_, i) => i !== index));
  };

  const updateStripePosition = (index, value) => {
    const newStripes = [...stripes];
    newStripes[index].position = parseFloat(value);
    newStripes.sort((a, b) => a.position - b.position);
    setStripes(newStripes);
  };

  const updateStripeColor = (index, color) => {
    const newStripes = [...stripes];
    newStripes[index].color = color;
    setStripes(newStripes);
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

    const sortedStripes = [...stripes].sort((a, b) => a.position - b.position);
    
    if (sortedStripes.length === 0) {
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

    // Draw each stripe segment with 1px overdraw
    for (let i = 0; i < sortedStripes.length; i++) {
      const startPos = sortedStripes[i].position;
      const endPos = i < sortedStripes.length - 1 ? sortedStripes[i + 1].position : 1.0;
      const color = sortedStripes[i].color;

      const nearSegTop = nearTop + (nearBottom - nearTop) * startPos;
      const nearSegBottom = nearTop + (nearBottom - nearTop) * endPos + 1; // +1px overdraw

      const farSegTop = farTop + (farBottom - farTop) * startPos;
      const farSegBottom = farTop + (farBottom - farTop) * endPos + 1; // +1px overdraw

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(nearLeft, nearSegTop);
      ctx.lineTo(nearLeft, nearSegBottom);
      ctx.lineTo(farLeft, farSegBottom);
      ctx.lineTo(farLeft, farSegTop);
      ctx.closePath();
      ctx.fill();
    }

  }, [fov, cameraHeight, tileHeight, depth, stripes]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6">
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

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field of View: {fov}°
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
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Color Stripes
              </label>
              <button
                onClick={addStripe}
                className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Stripe
              </button>
            </div>

            <div className="space-y-2">
              {stripes.map((stripe, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">
                      Position: {stripe.position.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={stripe.position}
                      onChange={(e) => updateStripePosition(index, e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Color</label>
                    <input
                      type="color"
                      value={stripe.color}
                      onChange={(e) => updateStripeColor(index, e.target.value)}
                      className="w-16 h-10 rounded cursor-pointer"
                    />
                  </div>
                  <button
                    onClick={() => removeStripe(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    title="Remove stripe"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}