import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, Info, Shuffle } from "lucide-react";
import { MazeConfig, LearningParams, TrainingStats } from "@/pages/maze-solver";

interface ControlPanelProps {
  mazeConfig: MazeConfig;
  learningParams: LearningParams;
  trainingStats: TrainingStats;
  onMazeConfigChange: (config: MazeConfig) => void;
  onLearningParamsChange: (params: LearningParams) => void;
  onGenerateMaze: () => void;
  onStartTraining: () => void;
  onPauseTraining: () => void;
  onResetTraining: () => void;
  onShowParametersInfo: () => void;
}

export default function ControlPanel({
  mazeConfig,
  learningParams,
  trainingStats,
  onMazeConfigChange,
  onLearningParamsChange,
  onGenerateMaze,
  onStartTraining,
  onPauseTraining,
  onResetTraining,
  onShowParametersInfo,
}: ControlPanelProps) {

  return (
    <div className="space-y-6">
      
      {/* Maze Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Maze Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2">Maze Size</Label>
            <Slider
              value={[mazeConfig.size]}
              onValueChange={([value]) => onMazeConfigChange({ ...mazeConfig, size: value })}
              min={10}
              max={30}
              step={1}
              className="w-full"
              data-testid="slider-maze-size"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>10x10</span>
              <span data-testid="text-maze-size">{mazeConfig.size}x{mazeConfig.size}</span>
              <span>30x30</span>
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2">Wall Density</Label>
            <Slider
              value={[mazeConfig.wallDensity]}
              onValueChange={([value]) => onMazeConfigChange({ ...mazeConfig, wallDensity: value })}
              min={0.2}
              max={0.4}
              step={0.05}
              className="w-full"
              data-testid="slider-wall-density"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Sparse</span>
              <span>Dense</span>
            </div>
          </div>
          
          <Button 
            onClick={onGenerateMaze}
            className="w-full bg-blue-600 hover:bg-blue-700"
            data-testid="button-generate-maze"
          >
            <Shuffle className="w-4 h-4 mr-2" />
            Generate New Maze
          </Button>
        </CardContent>
      </Card>

      {/* Learning Parameters Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Learning Parameters</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onShowParametersInfo}
              data-testid="button-parameters-info"
              className="text-slate-400 hover:text-slate-600"
            >
              <Info className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2">Learning Rate (α)</Label>
            <Slider
              value={[learningParams.learningRate]}
              onValueChange={([value]) => onLearningParamsChange({ ...learningParams, learningRate: value })}
              min={0.01}
              max={1}
              step={0.01}
              className="w-full"
              data-testid="slider-learning-rate"
            />
            <div className="text-center text-xs text-slate-500 mt-1" data-testid="text-learning-rate">
              {learningParams.learningRate.toFixed(2)}
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2">Discount Factor (γ)</Label>
            <Slider
              value={[learningParams.discountFactor]}
              onValueChange={([value]) => onLearningParamsChange({ ...learningParams, discountFactor: value })}
              min={0.1}
              max={1}
              step={0.01}
              className="w-full"
              data-testid="slider-discount-factor"
            />
            <div className="text-center text-xs text-slate-500 mt-1" data-testid="text-discount-factor">
              {learningParams.discountFactor.toFixed(2)}
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2">Exploration Rate (ε)</Label>
            <Slider
              value={[learningParams.explorationRate]}
              onValueChange={([value]) => onLearningParamsChange({ ...learningParams, explorationRate: value })}
              min={0.01}
              max={1}
              step={0.01}
              className="w-full"
              data-testid="slider-exploration-rate"
            />
            <div className="text-center text-xs text-slate-500 mt-1" data-testid="text-exploration-rate">
              {learningParams.explorationRate.toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training Controls Card */}
      <Card>
        <CardHeader>
          <CardTitle>Training Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={onStartTraining}
            disabled={trainingStats.isTraining}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            data-testid="button-start-training"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Training
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={onPauseTraining}
              disabled={!trainingStats.isTraining}
              variant="secondary"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              data-testid="button-pause-training"
            >
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </Button>
            <Button 
              onClick={onResetTraining}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-reset-training"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
          
          <div className="border-t border-slate-200 pt-3">
            <Label className="text-sm font-medium text-slate-700 mb-2">Animation Speed</Label>
            <Slider
              value={[learningParams.animationSpeed]}
              onValueChange={([value]) => onLearningParamsChange({ ...learningParams, animationSpeed: value })}
              min={50}
              max={1000}
              step={50}
              className="w-full"
              data-testid="slider-animation-speed"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Fast</span>
              <span>Slow</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
