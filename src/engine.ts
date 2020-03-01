import {DOTS_STYLE} from './constants';
import {getCoordinateX, getCoordinateY} from './coordinates';
import {vertexShader, fragmentShader} from './shader';

export class GameOfLifeEngine {
  public life: Life[][];
  public canvas: HTMLCanvasElement;
  public context: WebGLRenderingContext;
  private readonly x: number;
  private readonly y: number;
  private intervalKey: null | number;

  constructor(life: Life[][]) {
    this.life = life;
    this.x = life[0].length;
    this.y = life.length;

    const cvs = this.canvas = document.createElement('canvas');
    const ctx = cvs.getContext('webgl');
    cvs.width = getCoordinateX(this.x);
    cvs.height = getCoordinateY(this.y);

    if (!ctx) {
      throw 'Failed to create context';
    }

    this.context = ctx;
    ctx.clearColor(0, 0, 0, 1);
    ctx.viewport(0, 0, cvs.width, cvs.height);

    const program = this.createProgram(
      this.createShader(ctx.VERTEX_SHADER, vertexShader),
      this.createShader(ctx.FRAGMENT_SHADER, fragmentShader),
    );
    ctx.useProgram(program);
    ctx.bindBuffer(ctx.ARRAY_BUFFER, ctx.createBuffer());

    const positionAttributeLocation = ctx.getAttribLocation(program, 'a_position');
    const resolutionUniformLocation = ctx.getUniformLocation(program, 'u_resolution');
    ctx.enableVertexAttribArray(positionAttributeLocation);
    ctx.vertexAttribPointer(positionAttributeLocation, 2, ctx.FLOAT, false, 0, 0);
    ctx.uniform2f(resolutionUniformLocation, cvs.width, cvs.height);
  }

  public clear(): void {
    const ctx = this.context;
    ctx.clear(ctx.COLOR_BUFFER_BIT);
  }

  public startLife(): void {
    if (!this.intervalKey) {
      this.intervalKey = window.setInterval(() => {
        this.drawDots();

        const life = this.life;
        this.life = life.map((children, i) => (
          children.map((isSurvive, j) => (
            this.isSurviveNextGeneration(j, i, isSurvive)
          ))
        ));
      }, 500);
    }
  }

  public stopLife(): void {
    if (this.intervalKey !== null) {
      clearInterval(this.intervalKey);
      this.intervalKey = null;
    }
  }

  protected drawDot(x: number, y: number): void {
    const coorX = getCoordinateX(x);
    const coorY = getCoordinateX(y);

    const ctx = this.context;
    ctx.bufferData(
      ctx.ARRAY_BUFFER,
      new Float32Array([
        coorX, coorY,
        coorX + DOTS_STYLE.WIDTH, coorY,
        coorX, coorY + DOTS_STYLE.HEIGHT,
        coorX + DOTS_STYLE.WIDTH, coorY + DOTS_STYLE.HEIGHT,
      ] as any),
      ctx.STATIC_DRAW
    );
    ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
  }

  protected drawDots(): void {
    this.clear();
    this.life.forEach((children, i) => {
      children.forEach((isSurvive, j) => {
        // this.context.fillStyle = isSurvive ? DOTS_STYLE.SURVIVE_COLOR : DOTS_STYLE.DEAD_COLOR;
        isSurvive && this.drawDot(j, i);
      });
    });
  }

  protected isSurviveNextGeneration(x: number, y: number, isSurvive: Life): Life {
    const life = this.life;
    const edgeX = this.x - 1;
    const edgeY = this.y - 1;
    const count = (
      Number(0 < y && 0 < x && life[y - 1][x - 1])
      + Number(0 < y && life[y - 1][x])
      + Number(0 < y && x < edgeX && life[y - 1][x + 1])
      + Number(0 < x && life[y][x - 1])
      + Number(x < edgeX && life[y][x + 1])
      + Number(y < edgeY && 0 < x && life[y + 1][x - 1])
      + Number(y < edgeY && life[y + 1][x])
      + Number(y < edgeY && x < edgeX && life[y + 1][x + 1])
    );
    return (isSurvive && (count === 2 || count === 3)) || (!isSurvive && count === 3) ? 1 : 0;
  }

  private createShader(type, source: string): WebGLShader {
    const ctx = this.context;
    const shader = ctx.createShader(type);

    if (!shader) {
      throw 'Failed to create shader';
    }

    ctx.shaderSource(shader, source);
    ctx.compileShader(shader);
    return shader;
  }

  private createProgram(vertextShader, fragmentShader) {
    const ctx = this.context;
    const program = ctx.createProgram();

    if (!program) {
      throw 'Failed to create program';
    }

    ctx.attachShader(program, vertextShader);
    ctx.attachShader(program, fragmentShader);
    ctx.linkProgram(program);
    return program;
  }
}
