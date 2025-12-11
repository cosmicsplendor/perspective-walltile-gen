import React, { useState, useRef, useEffect } from 'react';
import { Sliders, Plus, Trash2, Eye, EyeOff, Layers, ArrowRightLeft } from 'lucide-react';

export default function PerspectiveWallGenerator() {
  const canvasRef = useRef(null);
  
  // Rendering Parameters
  const [fov, setFov] = useState(60); 
  const [cameraHeight, setCameraHeight] = useState(1500);
  const [distance, setDistance] = useState(1000); // Start Z Position
  const [wallLength, setWallLength] = useState(1000); // Depth (Length of the segment)
  const [originY, setOriginY] = useState(0.5); 
  const [roadWidth, setRoadWidth] = useState(3000); 
  const [wallHeight, setWallHeight] = useState(1500); 
  const [showGround, setShowGround] = useState(true);
  const [side, setSide] = useState(1); // 1 = Right, -1 = Left
  
  const [stripes, setStripes] = useState([
    { position: 0, color: '#78350f' }, // Dark Brown
    { position: 0.4, color: '#92400e' }, // Medium Brown
    { position: 0.8, color: '#b45309' }  // Light Brown
  ]);

  // --- Stripe Management ---
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

  // --- Rendering Logic ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);
    
    // Sky
    ctx.fillStyle = '#bfdbfe'; // Light sky blue
    ctx.fillRect(0, 0, width, height);
    
    // Horizon Line visual helper
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(0, height * originY);
    ctx.lineTo(width, height * originY);
    ctx.stroke();

    const fovRad = (fov * Math.PI) / 180;
    const cameraDepth = 1 / Math.tan(fovRad / 2);
    
    // --- Projection Helper ---
    // worldX: Offset from center of road
    // worldY: Height from ground
    // worldZ: Distance from camera
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

    // --- Draw Ground (Road Reference) ---
    if (showGround) {
      // Draw the main road surface
      const roadZStart = 100;
      const roadZEnd = 10000;
      const rW = roadWidth / 2;

      const p1 = project(-rW, 0, roadZStart);
      const p2 = project(rW, 0, roadZStart);
      const p3 = project(rW, 0, roadZEnd);
      const p4 = project(-rW, 0, roadZEnd);

      if (p1 && p2 && p3 && p4) {
        // Road surface
        ctx.fillStyle = '#9ca3af';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.fill();

        // Center line
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

    // --- Draw The Wall Segment (YZ Plane) ---
    
    // X position is fixed at the edge of the road
    const wallX = (roadWidth / 2) * side; 
    
    // Z positions
    const zNear = distance;
    const zFar = distance + wallLength;

    const sortedStripes = [...stripes].sort((a, b) => a.position - b.position);
    const segments = sortedStripes.length > 0 ? sortedStripes : [{ position: 0, color: '#78350f' }];

    // Draw stripes from bottom to top
    segments.forEach((stripe, index) => {
      const nextStripePos = index < segments.length - 1 ? segments[index + 1].position : 1.0;
      
      const yBottom = wallHeight * stripe.position;
      const yTop = wallHeight * nextStripePos;

      // Calculate 4 corners of the stripe on the YZ plane
      // Note: X is constant (wallX)
      
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
        
        // Slight stroke to clean edges
        ctx.strokeStyle = stripe.color; //stripe.color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Draw Wireframe Outline for clarity
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

  }, [fov, cameraHeight, distance, wallLength, originY, roadWidth, wallHeight, stripes, showGround, side]);

  return (
    <div className="bg-gray-100 min-h-screen w-full flex flex-col items-center p-6">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left: Canvas */}
        <div className="flex-1 bg-gray-50 p-4 flex flex-col items-center justify-center border-r border-gray-200 relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full h-auto bg-white shadow-sm border border-gray-300 rounded"
          />
          <div className="absolute top-6 left-6 bg-white/80 p-2 rounded text-xs font-mono text-gray-500">
             Perspective: Pseudo-3D (YZ Plane)
          </div>
        </div>

        {/* Right: Controls */}
        <div className="w-full md:w-96 bg-white p-6 h-auto md:h-[600px] overflow-y-auto">
          <div className="mb-6 pb-4 border-b border-gray-100">
             <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Side Wall Generator
             </h1>
          </div>

          <div className="space-y-6">
            
            {/* Dimensions */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Geometry</h3>
              
              <div className="grid grid-cols-2 gap-2">
                 <div className="col-span-2">
                    <label className="text-xs text-gray-600">Road Width (X Offset)</label>
                    <input type="range" min="1000" max="6000" step="100" value={roadWidth} onChange={(e) => setRoadWidth(Number(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    <div className="text-right text-xs font-mono text-gray-400">{roadWidth}</div>
                 </div>

                 <div>
                    <label className="text-xs text-gray-600">Start Z</label>
                    <input type="range" min="100" max="5000" step="50" value={distance} onChange={(e) => setDistance(Number(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                 </div>
                 
                 <div>
                    <label className="text-xs text-gray-600">Length (Z)</label>
                    <input type="range" min="100" max="5000" step="50" value={wallLength} onChange={(e) => setWallLength(Number(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                 </div>

                 <div>
                    <label className="text-xs text-gray-600">Height (Y)</label>
                    <input type="range" min="100" max="5000" step="50" value={wallHeight} onChange={(e) => setWallHeight(Number(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                 </div>

                 <div>
                    <label className="text-xs text-gray-600">Cam Height</label>
                    <input type="range" min="100" max="4000" step="50" value={cameraHeight} onChange={(e) => setCameraHeight(Number(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                 </div>
              </div>

               <div className="flex gap-2 mt-2">
                <button 
                    onClick={() => setSide(side * -1)}
                    className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded flex items-center justify-center gap-1"
                >
                    <ArrowRightLeft className="w-3 h-3" /> Flip Side
                </button>
                <button 
                    onClick={() => setShowGround(!showGround)}
                    className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded flex items-center justify-center gap-1"
                >
                    {showGround ? <Eye className="w-3 h-3"/> : <EyeOff className="w-3 h-3"/>} Floor
                </button>
               </div>

            </div>

            <hr className="border-gray-100" />

            {/* Stripes */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Texture Stripes</h3>
                 <button onClick={addStripe} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add
                 </button>
              </div>

              <div className="space-y-2">
                {stripes.map((stripe, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
                    <div className="flex-1">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={stripe.position}
                            onChange={(e) => updateStripePosition(index, e.target.value)}
                            className="w-full h-1 bg-gray-300 rounded appearance-none cursor-pointer"
                        />
                    </div>
                    <input
                      type="color"
                      value={stripe.color}
                      onChange={(e) => updateStripeColor(index, e.target.value)}
                      className="w-6 h-6 rounded border-none cursor-pointer"
                    />
                    <button onClick={() => removeStripe(index)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}