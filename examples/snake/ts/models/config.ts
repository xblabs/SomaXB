// Configuration for the snake game
export interface CanvasConfig {
    width: number;
    height: number;
}

export interface GridConfig {
    width: number;
    height: number;
}

export interface DebugConfig {
    drawGrid: boolean;
}

export interface Config {
    fps: number;
    speed: number;
    canvas: CanvasConfig;
    grid: GridConfig;
    debug: DebugConfig;
}

export const Config: Config = {
    fps: 60,
    speed: 0.15,
    canvas: {
        width: 800,
        height: 576
    },
    grid: {
        width: 32,
        height: 32
    },
    debug: {
        drawGrid: true
    }
};
