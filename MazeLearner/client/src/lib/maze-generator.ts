export class MazeGenerator {
  private maze: number[][];
  private size: number;
  private wallDensity: number;
  private startPosition: { x: number; y: number };
  private goalPosition: { x: number; y: number };

  constructor(size: number, wallDensity: number) {
    this.size = size;
    this.wallDensity = wallDensity;
    this.startPosition = { x: 0, y: 0 };
    this.goalPosition = { x: size - 1, y: size - 1 };
    this.maze = this.generateMaze();
  }

  private generateMaze(): number[][] {
    // Use recursive backtracker algorithm to generate maze
    const maze = Array(this.size).fill(null).map(() => Array(this.size).fill(1)); // Start with all walls
    const visited = Array(this.size).fill(null).map(() => Array(this.size).fill(false));
    
    // Stack-based recursive backtracker to avoid stack overflow
    const stack: { x: number; y: number }[] = [];
    
    // Directions: up, right, down, left
    const directions = [
      { dx: 0, dy: -1 }, // Up
      { dx: 1, dy: 0 },  // Right
      { dx: 0, dy: 1 },  // Down  
      { dx: -1, dy: 0 }  // Left
    ];

    // Start from top-left corner (start position)
    let currentX = this.startPosition.x;
    let currentY = this.startPosition.y;
    
    // Mark starting cell as visited and path
    visited[currentY][currentX] = true;
    maze[currentY][currentX] = 0;
    
    do {
      // Find unvisited neighbors
      const neighbors: { x: number; y: number; wallX: number; wallY: number }[] = [];
      
      for (const dir of directions) {
        const neighborX = currentX + dir.dx * 2; // Skip one cell for wall
        const neighborY = currentY + dir.dy * 2;
        const wallX = currentX + dir.dx;
        const wallY = currentY + dir.dy;
        
        // Check if neighbor is valid and unvisited
        if (this.isValidPosition(neighborX, neighborY) && !visited[neighborY][neighborX]) {
          neighbors.push({ x: neighborX, y: neighborY, wallX, wallY });
        }
      }
      
      if (neighbors.length > 0) {
        // Choose a random neighbor
        const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
        
        // Push current cell to stack
        stack.push({ x: currentX, y: currentY });
        
        // Remove wall between current cell and chosen neighbor
        maze[randomNeighbor.wallY][randomNeighbor.wallX] = 0;
        maze[randomNeighbor.y][randomNeighbor.x] = 0;
        visited[randomNeighbor.y][randomNeighbor.x] = true;
        
        // Move to the chosen neighbor
        currentX = randomNeighbor.x;
        currentY = randomNeighbor.y;
      } else if (stack.length > 0) {
        // Backtrack
        const backtrack = stack.pop()!;
        currentX = backtrack.x;
        currentY = backtrack.y;
      }
    } while (stack.length > 0);
    
    // Apply wall density modification to create more open areas
    this.applyWallDensityModification(maze);
    
    // Ensure start and goal positions are accessible
    maze[this.startPosition.y][this.startPosition.x] = 0;
    maze[this.goalPosition.y][this.goalPosition.x] = 0;
    
    // Create additional connections to ensure path exists
    this.ensureConnectivity(maze);
    
    // Final check - ensure there's always a path from start to goal
    if (!this.hasPath(maze)) {
      this.createPathToGoal(maze);
    }

    return maze;
  }

  private applyWallDensityModification(maze: number[][]): void {
    // Modify the maze based on wall density setting
    // Lower density = remove more walls, Higher density = keep more walls
    const removalProbability = Math.max(0.1, (1 - this.wallDensity) * 0.3); // Limit removal to maintain maze structure
    
    for (let y = 1; y < this.size - 1; y++) {
      for (let x = 1; x < this.size - 1; x++) {
        // Skip if it's already a path
        if (maze[y][x] === 0) continue;
        
        // Don't modify positions near start or goal
        if ((Math.abs(x - this.startPosition.x) <= 2 && Math.abs(y - this.startPosition.y) <= 2) ||
            (Math.abs(x - this.goalPosition.x) <= 2 && Math.abs(y - this.goalPosition.y) <= 2)) {
          continue;
        }
        
        // Count adjacent paths to avoid creating large open areas
        const adjacentPaths = this.countAdjacentPaths(maze, x, y);
        
        // Randomly remove walls based on density setting, but avoid creating too many openings
        if (Math.random() < removalProbability && adjacentPaths < 3) {
          maze[y][x] = 0;
        }
      }
    }
  }

  private countAdjacentPaths(maze: number[][], x: number, y: number): number {
    let count = 0;
    const directions = [
      { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
      { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
    ];
    
    for (const dir of directions) {
      const newX = x + dir.dx;
      const newY = y + dir.dy;
      if (this.isValidPosition(newX, newY) && maze[newY][newX] === 0) {
        count++;
      }
    }
    return count;
  }

  private ensureConnectivity(maze: number[][]): void {
    // Add some random connections to make the maze less linear
    const numConnections = Math.floor(this.size * 0.1); // 10% of maze size
    
    for (let i = 0; i < numConnections; i++) {
      const x = Math.floor(Math.random() * (this.size - 2)) + 1;
      const y = Math.floor(Math.random() * (this.size - 2)) + 1;
      
      // Only modify walls that are not on the border
      if (maze[y][x] === 1 && this.countAdjacentPaths(maze, x, y) >= 2) {
        maze[y][x] = 0;
      }
    }
  }

  private hasPath(maze: number[][]): boolean {
    const visited = Array(this.size).fill(null).map(() => Array(this.size).fill(false));
    const queue: { x: number; y: number }[] = [this.startPosition];
    visited[this.startPosition.y][this.startPosition.x] = true;

    const directions = [
      { dx: 0, dy: -1 }, // Up
      { dx: 1, dy: 0 },  // Right
      { dx: 0, dy: 1 },  // Down
      { dx: -1, dy: 0 }  // Left
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.x === this.goalPosition.x && current.y === this.goalPosition.y) {
        return true;
      }

      for (const dir of directions) {
        const newX = current.x + dir.dx;
        const newY = current.y + dir.dy;

        if (this.isValidPosition(newX, newY) && 
            !visited[newY][newX] && 
            maze[newY][newX] === 0) {
          visited[newY][newX] = true;
          queue.push({ x: newX, y: newY });
        }
      }
    }

    return false;
  }

  private createPathToGoal(maze: number[][]): void {
    // Create a simple L-shaped path from start to goal
    let x = this.startPosition.x;
    let y = this.startPosition.y;

    // Move horizontally first
    while (x < this.goalPosition.x) {
      maze[y][x] = 0;
      x++;
    }

    // Then move vertically
    while (y < this.goalPosition.y) {
      maze[y][x] = 0;
      y++;
    }

    // Ensure goal is accessible
    maze[this.goalPosition.y][this.goalPosition.x] = 0;
  }

  private isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  public getMaze(): number[][] {
    return this.maze;
  }

  public getSize(): number {
    return this.size;
  }

  public getStartPosition(): { x: number; y: number } {
    return this.startPosition;
  }

  public getGoalPosition(): { x: number; y: number } {
    return this.goalPosition;
  }

  public isWall(x: number, y: number): boolean {
    if (!this.isValidPosition(x, y)) return true;
    return this.maze[y][x] === 1;
  }

  public isGoal(x: number, y: number): boolean {
    return x === this.goalPosition.x && y === this.goalPosition.y;
  }
}
