import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import { MazeGenerator } from "@/lib/maze-generator";
import { QLearningAgent } from "@/lib/q-learning";
import { TrainingStats } from "@/pages/maze-solver";

interface MazeCanvasProps {
  mazeGenerator: MazeGenerator | null;
  agent: QLearningAgent | null;
  trainingStats: TrainingStats;
  showPath: boolean;
  onToggleShowPath: () => void;
}

export default function MazeCanvas({ mazeGenerator, agent, trainingStats, showPath, onToggleShowPath }: MazeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !mazeGenerator) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const maze = mazeGenerator.getMaze();
    const cellSize = canvas.width / mazeGenerator.getSize();
    
    // Draw maze
    for (let y = 0; y < mazeGenerator.getSize(); y++) {
      for (let x = 0; x < mazeGenerator.getSize(); x++) {
        const cellValue = maze[y][x];
        
        // Set colors based on cell type
        if (cellValue === 1) {
          // Wall - darker for better contrast
          ctx.fillStyle = '#1e293b'; // slate-800
        } else if (x === 0 && y === 0) {
          // Start position - brighter green
          ctx.fillStyle = '#059669'; // emerald-600
        } else if (x === mazeGenerator.getSize() - 1 && y === mazeGenerator.getSize() - 1) {
          // Goal position - brighter red
          ctx.fillStyle = '#dc2626'; // red-600
        } else {
          // Open path - show visit frequency with color intensity (if showPath is enabled)
          const posKey = `${x},${y}`;
          const visitCount = showPath ? (trainingStats.visitCount.get(posKey) || 0) : 0;
          
          if (visitCount === 0) {
            // Unvisited path or path visualization disabled
            ctx.fillStyle = '#f8fafc'; // slate-50
          } else {
            // Color based on visit frequency with much better visibility
            const intensity = Math.min(visitCount / 10, 1); // Lower threshold for quicker color changes
            if (visitCount <= 1) {
              // Very light blue for first visit
              ctx.fillStyle = `rgba(59, 130, 246, 0.4)`;
            } else if (visitCount <= 3) {
              // Bright blue for early visits
              ctx.fillStyle = `rgba(59, 130, 246, 0.7)`;
            } else if (visitCount <= 6) {
              // Green for moderate visits
              ctx.fillStyle = `rgba(34, 197, 94, 0.8)`;
            } else if (visitCount <= 10) {
              // Yellow for frequent visits
              ctx.fillStyle = `rgba(251, 191, 36, 0.9)`;
            } else {
              // Red for very frequent visits
              ctx.fillStyle = `rgba(239, 68, 68, 0.9)`;
            }
          }
          
          // Show explored areas with agent's Q-values if available (overlay)
          if (agent && visitCount > 0) {
            const stateKey = `${x},${y}`;
            const qValues = agent.getQValues(stateKey);
            if (qValues && Object.keys(qValues).length > 0) {
              const maxQ = Math.max(...Object.values(qValues));
              const alpha = Math.min(maxQ / 50, 0.2); // Subtle Q-value overlay
              ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`; // green overlay for Q-values
            }
          }
        }
        
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Draw cell borders with better visibility
        ctx.strokeStyle = cellValue === 1 ? '#0f172a' : '#94a3b8'; // Dark for walls, lighter for paths
        ctx.lineWidth = 1;
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
    
    // Draw robot path trail
    if (trainingStats.robotPath && trainingStats.robotPath.length > 1) {
      ctx.strokeStyle = '#3b82f6'; // blue-500
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Create gradient for trail effect
      for (let i = 1; i < trainingStats.robotPath.length; i++) {
        const prevPos = trainingStats.robotPath[i - 1];
        const currentPos = trainingStats.robotPath[i];
        
        // Calculate alpha based on position in path (newer = more opaque)
        const alpha = Math.max(0.2, i / trainingStats.robotPath.length);
        ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
        
        ctx.beginPath();
        ctx.moveTo(
          prevPos.x * cellSize + cellSize / 2,
          prevPos.y * cellSize + cellSize / 2
        );
        ctx.lineTo(
          currentPos.x * cellSize + cellSize / 2,
          currentPos.y * cellSize + cellSize / 2
        );
        ctx.stroke();
      }
    }

    // Draw robot
    if (trainingStats.robotPosition) {
      const robotX = trainingStats.robotPosition.x * cellSize + cellSize / 2;
      const robotY = trainingStats.robotPosition.y * cellSize + cellSize / 2;
      const robotRadius = cellSize * 0.3;
      
      // Robot body
      ctx.fillStyle = '#f59e0b'; // amber-500
      ctx.beginPath();
      ctx.arc(robotX, robotY, robotRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Robot outline
      ctx.strokeStyle = '#d97706'; // amber-600
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Robot "eye" to show direction
      ctx.fillStyle = '#1f2937'; // gray-800
      ctx.beginPath();
      ctx.arc(robotX, robotY - robotRadius * 0.3, robotRadius * 0.2, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  useEffect(() => {
    const animate = () => {
      draw();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mazeGenerator, agent, trainingStats.robotPosition, trainingStats.robotPath]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const containerWidth = container.offsetWidth - 32; // Account for padding
      let size: number;
      
      if (isFullscreen) {
        // In fullscreen, use half the screen space for better visibility
        const maxSize = Math.min(window.innerWidth - 100, window.innerHeight - 200);
        size = Math.max(maxSize / 2, 400);
      } else {
        size = Math.min(containerWidth, 600);
      }
      
      canvas.width = size;
      canvas.height = size;
      draw();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [mazeGenerator, isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Card className={isFullscreen ? "fixed inset-4 z-50 bg-white shadow-2xl" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Maze Environment</CardTitle>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              data-testid="button-fullscreen"
              className="text-slate-600 hover:text-slate-900"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleShowPath}
              data-testid="button-toggle-path"
              className={`text-xs px-2 py-1 ${showPath ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}
            >
              {showPath ? 'Hide Path' : 'Show Path'}
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded"></div>
              <span className="text-sm text-slate-600">Start</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm text-slate-600">Goal</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-600">Robot</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="border border-slate-300 rounded-lg w-full"
            data-testid="canvas-maze"
          />
          
          {!mazeGenerator && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-slate-600 mt-4">Click "Generate New Maze" to start</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Current Status */}
        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className={`w-2 h-2 rounded-full ${
                  trainingStats.isTraining ? 'bg-green-500 animate-pulse' : 
                  trainingStats.isPaused ? 'bg-yellow-500' : 'bg-gray-500'
                }`}
                data-testid="status-indicator"
              ></div>
              <span className="text-sm font-medium text-slate-700" data-testid="text-status">
                {trainingStats.currentStatus}
              </span>
            </div>
            <div className="text-sm text-slate-500">
              Position: <span className="font-mono" data-testid="text-position">
                ({trainingStats.robotPosition.x}, {trainingStats.robotPosition.y})
              </span>
            </div>
          </div>
        </div>
        
        {/* Path Visualization Legend - moved below canvas */}
        <div className="mt-4 bg-slate-50 p-3 rounded-lg">
          <span className="text-sm font-medium text-slate-700 mb-2 block">Path Frequency:</span>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-slate-50 border border-slate-300 rounded"></div>
              <span className="text-slate-600">Unvisited</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.7)' }}></div>
              <span className="text-slate-600">Few</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.8)' }}></div>
              <span className="text-slate-600">Some</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(251, 191, 36, 0.9)' }}></div>
              <span className="text-slate-600">Many</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.9)' }}></div>
              <span className="text-slate-600">Frequent</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
