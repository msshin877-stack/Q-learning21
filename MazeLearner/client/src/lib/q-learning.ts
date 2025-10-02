export interface QTableEntry {
  [action: string]: number;
}

export interface EpisodeResult {
  success: boolean;
  steps: number;
  totalReward: number;
  finalPosition: { x: number; y: number };
  path: { x: number; y: number }[];
}

export class QLearningAgent {
  private qTable: Map<string, QTableEntry>;
  private learningRate: number;
  private discountFactor: number;
  private explorationRate: number;
  private mazeSize: number;
  private actions: string[];

  constructor(
    mazeSize: number,
    learningRate: number = 0.1,
    discountFactor: number = 0.9,
    explorationRate: number = 0.1
  ) {
    this.qTable = new Map();
    this.learningRate = learningRate;
    this.discountFactor = discountFactor;
    this.explorationRate = explorationRate;
    this.mazeSize = mazeSize;
    this.actions = ['up', 'right', 'down', 'left'];
  }

  private getStateKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  private initializeQValues(stateKey: string): void {
    if (!this.qTable.has(stateKey)) {
      const qValues: QTableEntry = {};
      this.actions.forEach(action => {
        qValues[action] = 0;
      });
      this.qTable.set(stateKey, qValues);
    }
  }

  private chooseAction(x: number, y: number): string {
    const stateKey = this.getStateKey(x, y);
    this.initializeQValues(stateKey);

    // Epsilon-greedy action selection
    if (Math.random() < this.explorationRate) {
      // Exploration: choose random action
      return this.actions[Math.floor(Math.random() * this.actions.length)];
    } else {
      // Exploitation: choose best action
      const qValues = this.qTable.get(stateKey)!;
      let bestAction = this.actions[0];
      let bestValue = qValues[bestAction];

      for (const action of this.actions) {
        if (qValues[action] > bestValue) {
          bestValue = qValues[action];
          bestAction = action;
        }
      }

      return bestAction;
    }
  }

  private getNextPosition(x: number, y: number, action: string): { x: number; y: number } {
    switch (action) {
      case 'up':
        return { x, y: y - 1 };
      case 'right':
        return { x: x + 1, y };
      case 'down':
        return { x, y: y + 1 };
      case 'left':
        return { x: x - 1, y };
      default:
        return { x, y };
    }
  }

  private isValidMove(x: number, y: number, maze: number[][]): boolean {
    return (
      x >= 0 && 
      x < this.mazeSize && 
      y >= 0 && 
      y < this.mazeSize && 
      maze[y][x] === 0
    );
  }

  private calculateReward(
    x: number, 
    y: number, 
    newX: number, 
    newY: number, 
    maze: number[][],
    goalX: number,
    goalY: number
  ): number {
    // Hit wall or boundary
    if (!this.isValidMove(newX, newY, maze)) {
      return -10;
    }

    // Reached goal
    if (newX === goalX && newY === goalY) {
      return 100;
    }

    // Regular step (small penalty to encourage shorter paths)
    return -1;
  }

  private updateQValue(
    state: string,
    action: string,
    reward: number,
    nextState: string
  ): void {
    this.initializeQValues(state);
    this.initializeQValues(nextState);

    const currentQ = this.qTable.get(state)![action];
    const nextQValues = this.qTable.get(nextState)!;
    const maxNextQ = Math.max(...Object.values(nextQValues));

    // Q-learning update rule: Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
    const newQ = currentQ + this.learningRate * (reward + this.discountFactor * maxNextQ - currentQ);
    this.qTable.get(state)![action] = newQ;
  }

  public runEpisode(
    maze: number[][],
    startPos: { x: number; y: number },
    goalPos: { x: number; y: number },
    maxSteps: number = 1000
  ): EpisodeResult {
    let x = startPos.x;
    let y = startPos.y;
    let steps = 0;
    let totalReward = 0;
    const path: { x: number; y: number }[] = [{ x, y }];

    while (steps < maxSteps) {
      const currentState = this.getStateKey(x, y);
      const action = this.chooseAction(x, y);
      const nextPos = this.getNextPosition(x, y, action);
      
      const reward = this.calculateReward(x, y, nextPos.x, nextPos.y, maze, goalPos.x, goalPos.y);
      totalReward += reward;

      // Update position only if valid move
      let actualNextX = x;
      let actualNextY = y;
      
      if (this.isValidMove(nextPos.x, nextPos.y, maze)) {
        actualNextX = nextPos.x;
        actualNextY = nextPos.y;
      }

      const nextState = this.getStateKey(actualNextX, actualNextY);
      
      // Update Q-value
      this.updateQValue(currentState, action, reward, nextState);

      // Move to next position
      x = actualNextX;
      y = actualNextY;
      steps++;
      
      // Record the path
      path.push({ x, y });

      // Check if goal reached
      if (x === goalPos.x && y === goalPos.y) {
        return {
          success: true,
          steps,
          totalReward,
          finalPosition: { x, y },
          path
        };
      }
    }

    return {
      success: false,
      steps,
      totalReward,
      finalPosition: { x, y },
      path
    };
  }

  public getQValues(stateKey: string): QTableEntry | null {
    return this.qTable.get(stateKey) || null;
  }

  public getStatesExplored(): number {
    return this.qTable.size;
  }

  public getTotalQValues(): number {
    let total = 0;
    this.qTable.forEach(qValues => {
      total += Object.keys(qValues).length;
    });
    return total;
  }

  public getMaxQValue(): number {
    let maxQ = 0;
    this.qTable.forEach(qValues => {
      const localMax = Math.max(...Object.values(qValues));
      if (localMax > maxQ) {
        maxQ = localMax;
      }
    });
    return maxQ;
  }

  public updateParameters(
    learningRate?: number,
    discountFactor?: number,
    explorationRate?: number
  ): void {
    if (learningRate !== undefined) this.learningRate = learningRate;
    if (discountFactor !== undefined) this.discountFactor = discountFactor;
    if (explorationRate !== undefined) this.explorationRate = explorationRate;
  }

  public exportQTable(): { [stateKey: string]: QTableEntry } {
    const exported: { [stateKey: string]: QTableEntry } = {};
    this.qTable.forEach((qValues, stateKey) => {
      exported[stateKey] = { ...qValues };
    });
    return exported;
  }

  public reset(): void {
    this.qTable.clear();
  }
}
