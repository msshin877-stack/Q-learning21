import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Eye } from "lucide-react";
import { TrainingStats } from "@/pages/maze-solver";

interface StatsPanelProps {
  trainingStats: TrainingStats;
  episodeHistory: number[];
  onVisualizeQTable: () => void;
  onExportData: () => void;
}

export default function StatsPanel({
  trainingStats,
  episodeHistory,
  onVisualizeQTable,
  onExportData,
}: StatsPanelProps) {
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);

  const drawLearningChart = () => {
    const canvas = chartCanvasRef.current;
    if (!canvas || episodeHistory.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const padding = 20;

    if (episodeHistory.length < 2) return;

    // Calculate chart bounds
    const maxSteps = Math.max(...episodeHistory);
    const minSteps = Math.min(...episodeHistory);
    const stepRange = maxSteps - minSteps || 1;

    // Draw axes
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();

    // Draw learning curve
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    episodeHistory.forEach((steps, index) => {
      const x = padding + (index / (episodeHistory.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((steps - minSteps) / stepRange) * (height - 2 * padding);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // Add moving average
    if (episodeHistory.length > 10) {
      const windowSize = Math.min(10, Math.floor(episodeHistory.length / 5));
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let i = windowSize - 1; i < episodeHistory.length; i++) {
        const avgSteps = episodeHistory.slice(i - windowSize + 1, i + 1)
          .reduce((sum, steps) => sum + steps, 0) / windowSize;
        
        const x = padding + (i / (episodeHistory.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((avgSteps - minSteps) / stepRange) * (height - 2 * padding);
        
        if (i === windowSize - 1) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
    }
  };

  useEffect(() => {
    drawLearningChart();
  }, [episodeHistory]);

  const episodeProgress = trainingStats.totalEpisodes > 0 
    ? (trainingStats.currentEpisode / trainingStats.totalEpisodes) * 100 
    : 0;

  const avgStepsProgress = trainingStats.avgSteps > 0 
    ? Math.min((trainingStats.avgSteps / 100) * 100, 100) 
    : 0;

  return (
    <div className="space-y-6">
      
      {/* Training Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle>Training Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">Current Episode</span>
              <span className="text-sm font-bold text-blue-600" data-testid="text-current-episode">
                {trainingStats.currentEpisode}
              </span>
            </div>
            <Progress value={episodeProgress} className="w-full" />
            <div className="text-xs text-slate-500 mt-1" data-testid="text-episode-progress">
              {trainingStats.currentEpisode} / {trainingStats.totalEpisodes} episodes
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900" data-testid="text-total-steps">
                {trainingStats.totalSteps}
              </div>
              <div className="text-xs text-slate-600">Total Steps</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600" data-testid="text-successful-runs">
                {trainingStats.successfulRuns}
              </div>
              <div className="text-xs text-slate-600">Successful</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-slate-600">Success Rate</span>
              <span className="text-sm font-semibold text-emerald-600" data-testid="text-success-rate">
                {trainingStats.successRate.toFixed(1)}%
              </span>
            </div>
            <Progress value={trainingStats.successRate} className="w-full" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-slate-600">Avg. Steps per Episode</span>
              <span className="text-sm font-semibold text-slate-700" data-testid="text-avg-steps">
                {trainingStats.avgSteps.toFixed(1)}
              </span>
            </div>
            <Progress value={avgStepsProgress} className="w-full" />
          </div>
          
          <div className="pt-2 border-t border-slate-200">
            <div className="text-center">
              <div className="text-xl font-bold text-slate-900" data-testid="text-best-time">
                {trainingStats.bestTime > 0 ? trainingStats.bestTime : '--'}
              </div>
              <div className="text-xs text-slate-600">Best Completion Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Q-Table Insights Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Q-Table Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">States Explored</span>
            <span className="text-sm font-semibold text-slate-700" data-testid="text-states-explored">
              {trainingStats.statesExplored}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Total Q-Values</span>
            <span className="text-sm font-semibold text-slate-700" data-testid="text-total-q-values">
              {trainingStats.totalQValues}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Max Q-Value</span>
            <span className="text-sm font-semibold text-blue-600" data-testid="text-max-q-value">
              {trainingStats.maxQValue.toFixed(2)}
            </span>
          </div>
          
          <Button 
            onClick={onVisualizeQTable}
            variant="secondary"
            className="w-full mt-3 bg-slate-100 hover:bg-slate-200 text-slate-700"
            data-testid="button-visualize-qtable"
          >
            <Eye className="w-4 h-4 mr-2" />
            Visualize Q-Table
          </Button>
        </CardContent>
      </Card>

      {/* Learning History Mini Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-24 mb-4">
            <canvas 
              ref={chartCanvasRef}
              className="w-full h-full"
              data-testid="canvas-learning-chart"
            />
            {episodeHistory.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50 rounded">
                <span className="text-sm text-slate-500">No training data yet</span>
              </div>
            )}
          </div>
          
          <div className="text-center">
            <Button 
              onClick={onExportData}
              variant="ghost"
              className="text-blue-600 hover:text-blue-700"
              data-testid="button-export-data"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Training Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
