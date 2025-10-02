import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Info, Play, Pause, RotateCcw, Download, Brain, Lightbulb, Zap } from "lucide-react";
import MazeCanvas from "@/components/maze-canvas";
import ControlPanel from "@/components/control-panel";
import StatsPanel from "@/components/stats-panel";
import { MazeGenerator } from "@/lib/maze-generator";
import { QLearningAgent } from "@/lib/q-learning";
import Swal from "sweetalert2";

export interface MazeConfig {
  size: number;
  wallDensity: number;
}

export interface LearningParams {
  learningRate: number;
  discountFactor: number;
  explorationRate: number;
  animationSpeed: number;
}

export interface TrainingStats {
  currentEpisode: number;
  totalEpisodes: number;
  totalSteps: number;
  successfulRuns: number;
  successRate: number;
  avgSteps: number;
  bestTime: number;
  statesExplored: number;
  totalQValues: number;
  maxQValue: number;
  isTraining: boolean;
  isPaused: boolean;
  robotPosition: { x: number; y: number };
  currentStatus: string;
  visitCount: Map<string, number>;
  robotPath: { x: number; y: number }[];
}

export default function MazeSolver() {
  const [mazeConfig, setMazeConfig] = useState<MazeConfig>({
    size: 15,
    wallDensity: 0.3,
  });

  const [learningParams, setLearningParams] = useState<LearningParams>({
    learningRate: 0.1,
    discountFactor: 0.9,
    explorationRate: 0.1,
    animationSpeed: 200,
  });

  const [trainingStats, setTrainingStats] = useState<TrainingStats>({
    currentEpisode: 0,
    totalEpisodes: 1000,
    totalSteps: 0,
    successfulRuns: 0,
    successRate: 0,
    avgSteps: 0,
    bestTime: 0,
    statesExplored: 0,
    totalQValues: 0,
    maxQValue: 0,
    isTraining: false,
    isPaused: false,
    robotPosition: { x: 0, y: 0 },
    currentStatus: "Ready to start training",
    visitCount: new Map(),
    robotPath: [],
  });

  const [showPath, setShowPath] = useState(true);

  const mazeGeneratorRef = useRef<MazeGenerator | null>(null);
  const agentRef = useRef<QLearningAgent | null>(null);
  const trainingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const episodeHistoryRef = useRef<number[]>([]);

  const showInfoDialog = useCallback(() => {
    Swal.fire({
      title: 'Reinforcement Learning Maze Solver',
      html: `
        <div class="text-left">
          <p class="mb-4">This demo shows how an AI agent learns to navigate a maze using Q-Learning:</p>
          <ul class="list-disc list-inside space-y-2 text-sm">
            <li><strong>Q-Learning:</strong> A model-free reinforcement learning algorithm</li>
            <li><strong>Exploration:</strong> The robot tries random actions to discover the environment</li>
            <li><strong>Exploitation:</strong> The robot uses learned knowledge to make optimal decisions</li>
            <li><strong>Rewards:</strong> +100 for reaching the goal, -1 for each step, -10 for hitting walls</li>
          </ul>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Got it!',
      confirmButtonColor: '#3B82F6'
    });
  }, []);

  const showParametersInfo = useCallback(() => {
    Swal.fire({
      title: 'Learning Parameters',
      html: `
        <div class="text-left text-sm">
          <div class="mb-3">
            <strong>Learning Rate (α):</strong><br>
            Controls how much new information overrides old information. Higher values make the agent learn faster but may be unstable.
          </div>
          <div class="mb-3">
            <strong>Discount Factor (γ):</strong><br>
            Determines the importance of future rewards. Higher values make the agent more farsighted.
          </div>
          <div>
            <strong>Exploration Rate (ε):</strong><br>
            Probability of choosing a random action vs the best known action. Higher values increase exploration.
          </div>
        </div>
      `,
      icon: 'question',
      confirmButtonText: 'Understood!',
      confirmButtonColor: '#10B981'
    });
  }, []);

  const generateNewMaze = useCallback(() => {
    Swal.fire({
      title: 'Generating Maze',
      text: 'Creating a new maze environment...',
      allowOutsideClick: false,
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true
    });

    // Stop any ongoing training
    if (trainingIntervalRef.current) {
      clearInterval(trainingIntervalRef.current);
      trainingIntervalRef.current = null;
    }

    setTimeout(() => {
      mazeGeneratorRef.current = new MazeGenerator(mazeConfig.size, mazeConfig.wallDensity);
      agentRef.current = new QLearningAgent(
        mazeConfig.size,
        learningParams.learningRate,
        learningParams.discountFactor,
        learningParams.explorationRate
      );

      // Reset stats
      setTrainingStats(prev => ({
        ...prev,
        currentEpisode: 0,
        totalSteps: 0,
        successfulRuns: 0,
        successRate: 0,
        avgSteps: 0,
        bestTime: 0,
        statesExplored: 0,
        totalQValues: 0,
        maxQValue: 0,
        isTraining: false,
        isPaused: false,
        robotPosition: { x: 0, y: 0 },
        currentStatus: "New maze generated. Ready to train!",
        visitCount: new Map(),
        robotPath: [],
      }));

      episodeHistoryRef.current = [];
      
      Swal.fire({
        icon: 'success',
        title: 'Maze Generated!',
        text: 'New maze created with recursive backtracker algorithm.',
        timer: 1500,
        showConfirmButton: false
      });
    }, 1000);
  }, [mazeConfig, learningParams]);

  const trainingActiveRef = useRef(false);

  const startTraining = useCallback(() => {
    if (!mazeGeneratorRef.current || !agentRef.current) {
      Swal.fire({
        icon: 'warning',
        title: 'No Maze Available',
        text: 'Please generate a maze first!',
        confirmButtonColor: '#F59E0B'
      });
      return;
    }

    if (trainingStats.isTraining) return;

    trainingActiveRef.current = true;

    setTrainingStats(prev => ({
      ...prev,
      isTraining: true,
      isPaused: false,
      currentStatus: "Training in progress...",
    }));

    Swal.fire({
      icon: 'success',
      title: 'Training Started!',
      text: 'The robot will now learn to navigate the maze.',
      timer: 2000,
      showConfirmButton: false
    });

    // Start training loop with real-time robot movement
    let currentEpisode = 0;
    
    const runEpisode = () => {
      if (!trainingActiveRef.current) return;
      
      const maze = mazeGeneratorRef.current!;
      const agent = agentRef.current!;
      
      const episodeResult = agent.runEpisode(maze.getMaze(), maze.getStartPosition(), maze.getGoalPosition());
      
      // Update episode history
      episodeHistoryRef.current.push(episodeResult.steps);
      if (episodeHistoryRef.current.length > 100) {
        episodeHistoryRef.current.shift();
      }

      currentEpisode++;

      // Animate robot movement through the path
      const animatePath = (pathIndex: number = 0) => {
        if (pathIndex < episodeResult.path.length && trainingActiveRef.current) {
          // Update robot position, visit count, and path trail for current step
          setTrainingStats(prev => {
            const newVisitCount = new Map(prev.visitCount);
            const position = episodeResult.path[pathIndex];
            const posKey = `${position.x},${position.y}`;
            newVisitCount.set(posKey, (newVisitCount.get(posKey) || 0) + 1);
            
            // Add current position to robot path trail
            let newRobotPath = [...prev.robotPath, position];
            
            // Clear path if robot returns to entrance (0, 0)
            if (position.x === 0 && position.y === 0 && prev.robotPath.length > 0) {
              newRobotPath = [position]; // Keep only the current position at entrance
            }
            
            return {
              ...prev,
              robotPosition: position,
              currentStatus: `Episode ${currentEpisode}: Step ${pathIndex + 1}/${episodeResult.path.length}`,
              visitCount: newVisitCount,
              robotPath: newRobotPath,
            };
          });

          // Move to next step
          setTimeout(() => {
            if (pathIndex + 1 < episodeResult.path.length) {
              animatePath(pathIndex + 1);
            } else {
              // Path animation complete, update final stats
              updateEpisodeStats();
            }
          }, Math.max(10, learningParams.animationSpeed / 10)); // Fast animation for individual steps
        }
      };

      const updateEpisodeStats = () => {
        setTrainingStats(prev => {
          const newStats = {
            ...prev,
            currentEpisode,
            totalSteps: prev.totalSteps + episodeResult.steps,
            successfulRuns: prev.successfulRuns + (episodeResult.success ? 1 : 0),
            robotPosition: episodeResult.finalPosition,
            statesExplored: agent.getStatesExplored(),
            totalQValues: agent.getTotalQValues(),
            maxQValue: agent.getMaxQValue(),
          };

          newStats.successRate = (newStats.successfulRuns / currentEpisode) * 100;
          newStats.avgSteps = newStats.totalSteps / currentEpisode;
          
          if (episodeResult.success && (prev.bestTime === 0 || episodeResult.steps < prev.bestTime)) {
            newStats.bestTime = episodeResult.steps;
          }

          return newStats;
        });

        // Continue to next episode after a brief pause
        setTimeout(() => {
          if (currentEpisode < trainingStats.totalEpisodes && trainingActiveRef.current) {
            runEpisode();
          } else {
            // Training complete
            trainingActiveRef.current = false;
            setTrainingStats(prev => ({
              ...prev,
              isTraining: false,
              currentStatus: `Training completed! ${prev.successfulRuns} successful runs out of ${currentEpisode} episodes.`,
            }));

            Swal.fire({
              icon: 'success',
              title: 'Training Complete!',
              text: `The agent completed ${currentEpisode} episodes with ${((prev.successfulRuns / currentEpisode) * 100).toFixed(1)}% success rate.`,
              confirmButtonColor: '#10B981'
            });
          }
        }, learningParams.animationSpeed);
      };

      // Start path animation
      animatePath();
    };

    runEpisode();
  }, [trainingStats.isTraining, trainingStats.isPaused, trainingStats.currentEpisode, trainingStats.totalEpisodes, learningParams.animationSpeed]);

  const pauseTraining = useCallback(() => {
    trainingActiveRef.current = false;
    setTrainingStats(prev => ({
      ...prev,
      isTraining: false,
      isPaused: true,
      currentStatus: "Training paused",
    }));
  }, []);

  const resetTraining = useCallback(() => {
    // Stop any ongoing training
    trainingActiveRef.current = false;
    
    if (trainingIntervalRef.current) {
      clearInterval(trainingIntervalRef.current);
      trainingIntervalRef.current = null;
    }

    if (agentRef.current) {
      agentRef.current.reset();
    }

    setTrainingStats(prev => ({
      ...prev,
      currentEpisode: 0,
      totalSteps: 0,
      successfulRuns: 0,
      successRate: 0,
      avgSteps: 0,
      bestTime: 0,
      statesExplored: 0,
      totalQValues: 0,
      maxQValue: 0,
      isTraining: false,
      isPaused: false,
      robotPosition: { x: 0, y: 0 },
      currentStatus: "Training reset. Ready to start!",
      visitCount: new Map(),
      robotPath: [],
    }));

    episodeHistoryRef.current = [];

    Swal.fire({
      icon: 'info',
      title: 'Training Reset',
      text: 'All learning progress has been cleared.',
      timer: 1500,
      showConfirmButton: false
    });
  }, []);

  const visualizeQTable = useCallback(() => {
    if (!agentRef.current) {
      Swal.fire({
        icon: 'warning',
        title: 'No Training Data',
        text: 'Please start training first to generate Q-table data.',
        confirmButtonColor: '#F59E0B'
      });
      return;
    }

    Swal.fire({
      title: 'Q-Table Visualization',
      html: `
        <div class="text-left">
          <p class="mb-3">The Q-table contains learned values for each state-action pair:</p>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="bg-gray-100 p-2 rounded">
              <strong>States Explored:</strong><br>${trainingStats.statesExplored}
            </div>
            <div class="bg-gray-100 p-2 rounded">
              <strong>Total Q-Values:</strong><br>${trainingStats.totalQValues}
            </div>
            <div class="bg-gray-100 p-2 rounded">
              <strong>Max Q-Value:</strong><br>${trainingStats.maxQValue.toFixed(3)}
            </div>
            <div class="bg-gray-100 p-2 rounded">
              <strong>Learning Progress:</strong><br>${trainingStats.successRate.toFixed(1)}%
            </div>
          </div>
          <p class="mt-3 text-xs text-gray-600">Higher Q-values indicate more valuable state-action pairs.</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Close',
      confirmButtonColor: '#6366F1'
    });
  }, [trainingStats]);

  const exportTrainingData = useCallback(() => {
    if (!agentRef.current || episodeHistoryRef.current.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Training Data',
        text: 'Please complete some training episodes first.',
        confirmButtonColor: '#F59E0B'
      });
      return;
    }

    const data = {
      mazeConfig,
      learningParams,
      trainingStats,
      episodeHistory: episodeHistoryRef.current,
      qTable: agentRef.current.exportQTable(),
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maze-training-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    Swal.fire({
      icon: 'success',
      title: 'Data Exported!',
      text: 'Training data has been downloaded as JSON file.',
      timer: 2000,
      showConfirmButton: false
    });
  }, [mazeConfig, learningParams, trainingStats]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Reinforcement Learning Maze Solver</h1>
              <p className="text-slate-600 mt-2">Watch an AI agent learn to navigate through mazes using Q-learning algorithm</p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                Educational Demo
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={showInfoDialog}
                data-testid="button-info"
                className="bg-slate-100 hover:bg-slate-200"
              >
                <Info className="h-5 w-5 text-slate-600" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Control Panel */}
          <div className="lg:col-span-1">
            <ControlPanel
              mazeConfig={mazeConfig}
              learningParams={learningParams}
              trainingStats={trainingStats}
              onMazeConfigChange={setMazeConfig}
              onLearningParamsChange={setLearningParams}
              onGenerateMaze={generateNewMaze}
              onStartTraining={startTraining}
              onPauseTraining={pauseTraining}
              onResetTraining={resetTraining}
              onShowParametersInfo={showParametersInfo}
            />
          </div>

          {/* Maze Visualization */}
          <div className="lg:col-span-2">
            <MazeCanvas
              mazeGenerator={mazeGeneratorRef.current}
              agent={agentRef.current}
              trainingStats={trainingStats}
              showPath={showPath}
              onToggleShowPath={() => setShowPath(!showPath)}
            />
          </div>

          {/* Stats Panel */}
          <div className="lg:col-span-1">
            <StatsPanel
              trainingStats={trainingStats}
              episodeHistory={episodeHistoryRef.current}
              onVisualizeQTable={visualizeQTable}
              onExportData={exportTrainingData}
            />
          </div>
        </div>

        {/* Educational Content */}
        <div className="mt-12">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Understanding Q-Learning</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 border border-blue-100">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Lightbulb className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Exploration vs Exploitation</h3>
                <p className="text-sm text-slate-600">The robot balances between exploring new paths (exploration) and using known good paths (exploitation) based on the epsilon parameter.</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 border border-blue-100">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Reward System</h3>
                <p className="text-sm text-slate-600">The agent receives rewards for reaching the goal and penalties for hitting walls, learning to associate actions with their consequences.</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 border border-blue-100">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Q-Value Updates</h3>
                <p className="text-sm text-slate-600">The Q-table stores expected future rewards for each state-action pair, updating with each experience using the Bellman equation.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
