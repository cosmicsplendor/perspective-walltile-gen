import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sliders, Plus, Trash2, Eye, EyeOff, Layers, ArrowRightLeft, Camera, Download, Image as ImageIcon } from 'lucide-react';

export default function PerspectiveWallGenerator() {
  const canvasRef = useRef(null);
  
  // --- State ---
  const [fov, setFov] = useState(60); 
  const [originY, setOriginY] = useState(0.5); 
  const [cameraHeight, setCameraHeight] = useState(1500);

  // Geometry
  const [distance, setDistance] = useState(3000); 
  const [wallLength, setWallLength] = useState(1000); 
  const [roadWidth, setRoadWidth] = useState(3000); 
  const [wallHeight, setWallHeight] = useState(1500); 
  const [side, setSide] = useState(1); 
  const [showGround, setShowGround] = useState(true);
  
  // Export
  const [exportScale, setExportScale] = useState(1);

  // Stripes
  const [stripes, setStripes] = useState([
    { position: 0, color: '#78350f' }, 
    { position: 0.4, color: '#92400e' }, 
    { position: 0.8, color: '#b45309' } 
  ]);

  // --- Handlers ---
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

  // --- Core Rendering Logic ---
  const renderScene = useCallback((ctx, width, height, isExport = false) => {
    // 1. Setup Environment
    if (!isExport) {
      ctx.fillStyle = '#bfdbfe'; 
      ctx.fillRect(0, 0, width, height);
      
      const horizonY = height * originY;
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(width, horizonY);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    const fovRad = (fov * Math.PI) / 180;
    const cameraDepth = 1 / Math.tan(fovRad / 2);
    
    // Projection Helper
    const project = (worldX, worldY, worldZ) => {
      const camX = worldX;
      const camY = worldY - cameraHeight;
      const camZ = worldZ; 

      if (camZ <= 0) return null;

      const scale = cameraDepth / camZ;
      const projectionX = scale * camX;
      const projectionY = scale * camY;

      const screenX = (1 + projectionX) * (width / 2);
      const screenY = (1 - projectionY) * height * originY;

      return { x: screenX, y: screenY, scale };
    };

    // Draw Ground (Skip if exporting transparent wall)
    if (showGround && !isExport) {
      const roadZStart = 100;
      const roadZEnd = 50000;
      const rW = roadWidth / 2;

      const p1 = project(-rW, 0, roadZStart);
      const p2 = project(rW, 0, roadZStart);
      const p3 = project(rW, 0, roadZEnd);
      const p4 = project(-rW, 0, roadZEnd);

      if (p1 && p2 && p3 && p4) {
        ctx.fillStyle = '#9ca3af';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#d1d5db'; 
        ctx.setLineDash([20, 15]);
        ctx.beginPath();
        const c1 = project(0, 0, roadZStart);
        const c2 = project(0, 0, roadZEnd);
        if(c1 && c2) {
            ctx.moveTo(c1.x, c1.y);
            ctx.lineTo(c2.x, c2.y);
            ctx.stroke();
        }
        ctx.setLineDash([]);
      }
    }

    // Draw The Wall Segment
    const wallX = (roadWidth / 2) * side; 
    const zNear = distance;
    const zFar = distance + wallLength;

    const sortedStripes = [...stripes].sort((a, b) => a.position - b.position);
    const segments = sortedStripes.length > 0 ? sortedStripes : [{ position: 0, color: '#78350f' }];

    segments.forEach((stripe, index) => {
      const nextStripePos = index < segments.length - 1 ? segments[index + 1].position : 1.0;
      
      const yBottom = wallHeight * stripe.position;
      const yTop = wallHeight * nextStripePos;

      const pNearBot = project(wallX, yBottom, zNear);
      const pFarBot = project(wallX, yBottom, zFar);
      const pFarTop = project(wallX, yTop, zFar);
      const pNearTop = project(wallX, yTop, zNear);

      if (pNearBot && pFarBot && pFarTop && pNearTop) {
        ctx.fillStyle = stripe.color;
        
        ctx.beginPath();
        ctx.moveTo(pNearBot.x, pNearBot.y);
        ctx.lineTo(pFarBot.x, pFarBot.y);
        ctx.lineTo(pFarTop.x, pFarTop.y);
        ctx.lineTo(pNearTop.x, pNearTop.y);
        ctx.closePath();
        
        ctx.fill();
        
        ctx.strokeStyle = stripe.color; 
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Wireframe (Preview only)
    if (!isExport) {
        const corners = [
            project(wallX, 0, zNear),
            project(wallX, 0, zFar),
            project(wallX, wallHeight, zFar),
            project(wallX, wallHeight, zNear)
        ];

        if (corners.every(c => c)) {
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(corners[0].x, corners[0].y);
            ctx.lineTo(corners[1].x, corners[1].y);
            ctx.lineTo(corners[2].x, corners[2].y);
            ctx.lineTo(corners[3].x, corners[3].y);
            ctx.closePath();
            ctx.stroke();
        }
    }
  }, [fov, cameraHeight, distance, wallLength, originY, roadWidth, wallHeight, stripes, showGround, side]);


  // --- Render Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    renderScene(ctx, canvas.width, canvas.height, false);
  }, [renderScene]);


  // --- Trimming Helper ---
  const trimCanvas = (c) => {
    const ctx = c.getContext('2d');
    const w = c.width;
    const h = c.height;
    
    // Get raw pixel data
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    
    let minX = w, minY = h, maxX = 0, maxY = 0;
    let found = false;

    // Scan for non-transparent pixels
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const alpha = data[(y * w + x) * 4 + 3];
        if (alpha > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }

    if (!found) return c; // Return original if empty

    // Add padding
    const padding = 2;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(w, maxX + padding);
    maxY = Math.min(h, maxY + padding);

    const croppedWidth = maxX - minX;
    const croppedHeight = maxY - minY;

    // Create cropped canvas
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = croppedWidth;
    croppedCanvas.height = croppedHeight;
    const croppedCtx = croppedCanvas.getContext('2d');

    // Draw just the content from the original
    croppedCtx.drawImage(c, minX, minY, croppedWidth, croppedHeight, 0, 0, croppedWidth, croppedHeight);
    
    return croppedCanvas;
  };

  // --- Export ---
  const handleDownload = () => {
    const baseWidth = 800;
    const baseHeight = 800;
    const scaledWidth = baseWidth * exportScale;
    const scaledHeight = baseHeight * exportScale;

    // 1. Draw to full size canvas first
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = scaledWidth;
    tempCanvas.height = scaledHeight;
    const ctx = tempCanvas.getContext('2d');

    ctx.scale(exportScale, exportScale);
    renderScene(ctx, baseWidth, baseHeight, true);

    // 2. Trim empty space
    const finalCanvas = trimCanvas(tempCanvas);

    // 3. Download
    const link = document.createElement('a');
    link.download = `wall-segment-z${distance}-len${wallLength}.png`;
    link.href = finalCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="bg-gray-200 h-screen w-screen flex flex-col overflow-hidden font-sans">
      
      {/* Main Container */}
      <div className="flex flex-1 h-full max-w-[1600px] mx-auto w-full shadow-2xl bg-white overflow-hidden rounded-lg my-4 md:my-6 md:mx-6 border border-gray-300">
        
        {/* LEFT: Canvas */}
        <div className="flex-1 bg-gray-50 flex flex-col relative overflow-hidden">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow-sm border border-gray-200 text-xs font-mono text-gray-600">
                <div className="font-bold mb-1">Preview Info</div>
                <div>Z-Dist: {distance}</div>
                <div>Z-Len: {wallLength}</div>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
             <canvas
              ref={canvasRef}
              width={800}
              height={800}
              className="max-w-full max-h-full bg-white shadow-lg border border-gray-300 rounded"
              style={{ aspectRatio: '800/800' }}
            />
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
          
          <div className="p-5 border-b border-gray-100 bg-white z-10">
            <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Generator
            </h1>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
            
            {/* Camera */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-3 h-3" /> Camera Settings
              </h3>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                <ControlRow label="Field of View" value={fov + '°'}>
                   <input type="range" min="30" max="120" value={fov} onChange={(e) => setFov(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </ControlRow>
                <ControlRow label="Horizon Y" value={originY.toFixed(2)}>
                   <input type="range" min="0.1" max="0.9" step="0.01" value={originY} onChange={(e) => setOriginY(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </ControlRow>
                <ControlRow label="Camera Height" value={cameraHeight}>
                   <input type="range" min="100" max="4000" step="50" value={cameraHeight} onChange={(e) => setCameraHeight(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </ControlRow>
              </div>
            </section>

            {/* Geometry */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-3 h-3" /> Wall Geometry
              </h3>
              
              <div className="space-y-4 px-1">
                 <ControlRow label="Road Width (X)" value={roadWidth}>
                    <input type="range" min="1000" max="8000" step="100" value={roadWidth} onChange={(e) => setRoadWidth(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                 </ControlRow>
                 
                 <ControlRow label="Start Z (Distance)" value={distance}>
                    <input type="range" min="100" max="10000" step="100" value={distance} onChange={(e) => setDistance(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                 </ControlRow>

                 <ControlRow label="Length Z (Depth)" value={wallLength}>
                    <input type="range" min="100" max="5000" step="100" value={wallLength} onChange={(e) => setWallLength(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                 </ControlRow>

                 <ControlRow label="Wall Height" value={wallHeight}>
                    <input type="range" min="100" max="5000" step="50" value={wallHeight} onChange={(e) => setWallHeight(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                 </ControlRow>

                 <div className="flex gap-2 pt-2">
                  <button 
                      onClick={() => setSide(side * -1)}
                      className="flex-1 py-2 px-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                      <ArrowRightLeft className="w-3 h-3" /> {side === 1 ? 'Right Side' : 'Left Side'}
                  </button>
                  <button 
                      onClick={() => setShowGround(!showGround)}
                      className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm border ${showGround ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600'}`}
                  >
                      {showGround ? <Eye className="w-3 h-3"/> : <EyeOff className="w-3 h-3"/>} Floor
                  </button>
                 </div>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Stripes */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Textures</h3>
              
              <button 
                  onClick={addStripe} 
                  style={{ backgroundColor: '#2563eb', color: 'white' }} 
                  className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold shadow-md hover:opacity-90 transition-opacity"
               >
                  <Plus className="w-4 h-4" /> Add New Stripe
               </button>

              <div className="space-y-2 pt-2">
                {stripes.map((stripe, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm group hover:border-indigo-300 transition-colors">
                    <div className="flex-1">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={stripe.position}
                            onChange={(e) => updateStripePosition(index, e.target.value)}
                            className="w-full h-1 bg-gray-200 rounded appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="text-[10px] text-gray-400 font-mono mt-1">POS: {stripe.position.toFixed(2)}</div>
                    </div>
                    <div className="h-8 w-8 rounded-full overflow-hidden border border-gray-200 shadow-inner relative">
                        <input
                        type="color"
                        value={stripe.color}
                        onChange={(e) => updateStripeColor(index, e.target.value)}
                        className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 border-0"
                        />
                    </div>
                    <button 
                        onClick={() => removeStripe(index)} 
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                        title="Remove"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-200 bg-gray-50">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
               <ImageIcon className="w-3 h-3" /> Export Isolated Quad
            </h3>
            <div className="flex gap-2">
                <select 
                    value={exportScale} 
                    onChange={(e) => setExportScale(Number(e.target.value))}
                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                >
                    <option value="1">1x Scale</option>
                    <option value="2">2x Scale</option>
                    <option value="4">4x Scale</option>
                </select>
                <button 
                    onClick={handleDownload}
                    style={{ backgroundColor: '#000', color: 'white' }}
                    className="flex-1 font-bold rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center justify-center gap-2 transition-opacity shadow-lg shadow-gray-300 hover:opacity-90"
                >
                    <Download className="w-4 h-4" />
                    Download PNG
                </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 text-center">
                Downloads auto-cropped, transparent PNG of the wall only.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

function ControlRow({ label, value, children }) {
    return (
        <div>
            <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-gray-600">{label}</span>
                <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 rounded">{value}</span>
            </div>
            {children}
        </div>
    )
}