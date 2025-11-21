import { Tool, BrushShape, Pattern } from '../types';
import featherPatterns from '../generated_patterns_svg/feather_icons_patterns.json';

interface Point {
    x: number;
    y: number;
    pressure?: number;
}

export interface CanvasPainterOptions {
    onColorPick: (color: string) => void;
    onDraw: (data: any) => void;
}

interface PatternData {
    name: string;
    svg_content: string;
}

interface CanvasObject {
    id: string;
    userId: string;
    type: 'stroke' | 'pattern' | 'fill';
    data: any;
}

export class CanvasPainter {
    private backgroundCanvas: HTMLCanvasElement;
    private displayCanvas: HTMLCanvasElement;
    private displayCtx: CanvasRenderingContext2D;
    private drawingCanvas: HTMLCanvasElement;
    public drawingCtx: CanvasRenderingContext2D;
    private strokeCanvas: HTMLCanvasElement;
    private strokeCtx: CanvasRenderingContext2D;
    private compositeCanvas: HTMLCanvasElement;
    private compositeCtx: CanvasRenderingContext2D;

    public tool: Tool = Tool.Brush;
    public color: string = '#000000';
    public brushSize: number = 8;
    public brushShape: BrushShape = BrushShape.Round;
    public pattern: Pattern | null = null;
    public brushAlpha: number = 1;
    private userId: string;

    private isDrawing = false;
    private lastPoint: Point | null = null;
    
    private history: CanvasObject[] = [];
    private redoStacks: { [userId: string]: CanvasObject[] } = {};
    private currentStroke: any[] = [];
    private preDrawImageData: ImageData | null = null;
    
    private zoom = 1;
    private offset = { x: 0, y: 0 };
    private isPanning = false;
    private lastPanPoint: Point | null = null;
    
    private patternImages: Map<string, HTMLImageElement> = new Map();
    private backgroundImage: HTMLImageElement | null = null;
    private isInitialized = false;

    private options: CanvasPainterOptions;

    constructor(
        backgroundCanvas: HTMLCanvasElement,
        displayCanvas: HTMLCanvasElement,
        userId: string,
        options: CanvasPainterOptions
    ) {
        this.backgroundCanvas = backgroundCanvas;
        this.displayCanvas = displayCanvas;
        this.displayCtx = displayCanvas.getContext('2d')!;
        this.userId = userId;
        this.options = options;

        this.drawingCanvas = document.createElement('canvas');
        this.drawingCtx = this.drawingCanvas.getContext('2d')!;
        this.strokeCanvas = document.createElement('canvas');
        this.strokeCtx = this.strokeCanvas.getContext('2d')!;
        this.compositeCanvas = document.createElement('canvas');
        this.compositeCtx = this.compositeCanvas.getContext('2d')!;
        
        this.redoStacks[this.userId] = [];

        this.loadPatterns();
        this.attachEvents();
    }

    private loadPatterns() {
        (featherPatterns as PatternData[]).forEach(pattern => {
            const img = new Image();
            const svgBlob = new Blob([pattern.svg_content], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(svgBlob);
            img.onload = () => {
                this.patternImages.set(pattern.name, img);
                URL.revokeObjectURL(url);
            };
            img.src = url;
        });
    }

    private attachEvents() {
        this.displayCanvas.addEventListener('pointerdown', this.handlePointerDown);
        this.displayCanvas.addEventListener('pointermove', this.handlePointerMove);
        this.displayCanvas.addEventListener('pointerup', this.handlePointerUp);
        this.displayCanvas.addEventListener('pointerleave', this.handlePointerUp);
    }

    public destroy() {
        this.displayCanvas.removeEventListener('pointerdown', this.handlePointerDown);
        this.displayCanvas.removeEventListener('pointermove', this.handlePointerMove);
        this.displayCanvas.removeEventListener('pointerup', this.handlePointerUp);
        this.displayCanvas.removeEventListener('pointerleave', this.handlePointerUp);
    }

    public setDimensions(width: number, height: number) {
        const dpr = window.devicePixelRatio || 1;
        
        const setupCanvas = (canvas: HTMLCanvasElement) => {
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            const ctx = canvas.getContext('2d')!;
            ctx.scale(dpr, dpr);
        };

        setupCanvas(this.backgroundCanvas);
        setupCanvas(this.displayCanvas);
        setupCanvas(this.drawingCanvas);
        setupCanvas(this.strokeCanvas);
        this.compositeCanvas.width = width * dpr;
        this.compositeCanvas.height = height * dpr;
        this.compositeCtx.scale(dpr, dpr);
        this.isInitialized = true;
    }

    private applyTransforms(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.offset.x, this.offset.y);
        ctx.scale(this.zoom, this.zoom);
    }

    private resetTransforms(ctx: CanvasRenderingContext2D) {
        ctx.restore();
    }

    public render = () => {
        if (!this.isInitialized) return;
        const dpr = window.devicePixelRatio || 1;
        
        this.displayCtx.save();
        this.displayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.displayCtx.clearRect(0, 0, this.displayCanvas.width, this.displayCanvas.height);
        this.displayCtx.restore();

        this.applyTransforms(this.displayCtx);
        this.displayCtx.drawImage(this.backgroundCanvas, 0, 0);
        this.displayCtx.drawImage(this.drawingCanvas, 0, 0);
        this.resetTransforms(this.displayCtx);
    }
    public renderWithStroke = () => {
        if (!this.isInitialized) return;
        this.render();
        this.applyTransforms(this.displayCtx);
        this.displayCtx.drawImage(this.strokeCanvas, 0, 0);
        this.resetTransforms(this.displayCtx);
    }

    public zoomIn = () => { this.zoom *= 1.2; this.render(); }
    public zoomOut = () => { this.zoom /= 1.2; this.render(); }
    public pan = (dx: number, dy: number) => { this.offset.x += dx; this.offset.y += dy; this.render(); }
    public resetView = () => { this.zoom = 1; this.offset = { x: 0, y: 0 }; this.render(); }

    public setBackgroundImage(image: HTMLImageElement) {
        this.backgroundImage = image;
        const ctx = this.backgroundCanvas.getContext('2d')!;
        const dpr = window.devicePixelRatio || 1;
        
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
        ctx.restore();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
        
        const padding = 20;
        const canvasWidth = this.backgroundCanvas.width / dpr - padding * 2;
        const canvasHeight = this.backgroundCanvas.height / dpr - padding * 2;
        const canvasAspect = canvasWidth / canvasHeight;
        const imageAspect = image.width / image.height;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasAspect > imageAspect) {
            drawHeight = canvasHeight;
            drawWidth = drawHeight * imageAspect;
            offsetX = (this.backgroundCanvas.width / dpr - drawWidth) / 2;
            offsetY = padding;
        } else {
            drawWidth = canvasWidth;
            drawHeight = drawWidth / imageAspect;
            offsetX = padding;
            offsetY = (this.backgroundCanvas.height / dpr - drawHeight) / 2;
        }

        ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
        // this.clear(true);
        this.render();
    }
    
    public setTool = (tool: Tool) => this.tool = tool;
    public setColor = (color: string) => this.color = color;
    public setBrushSize = (size: number) => this.brushSize = size;
    public setBrushShape = (shape: BrushShape) => this.brushShape = shape;
    public setPattern = (pattern: Pattern | null) => this.pattern = pattern;
    public setBrushAlpha = (alpha: number) => this.brushAlpha = alpha;

    public clear = (isRemote: boolean = false) => {
        if (!isRemote) {
            this.options.onDraw({ type: 'clear' });
        }
        this.history = [];
        this.redoStacks = {};
        this.redrawAll();
    }

    private pushToHistory(object: CanvasObject) {
        this.history.push(object);
        if (this.redoStacks[object.userId]) {
            this.redoStacks[object.userId] = [];
        }
    }
    
    public undo(): string | null {
        const userHistory = this.history.filter(obj => obj.userId === this.userId).reverse();
        if (userHistory.length === 0) return null;
    
        const lastObject = userHistory[0];
        this.history = this.history.filter(obj => obj.id !== lastObject.id);
        
        if (!this.redoStacks[this.userId]) {
            this.redoStacks[this.userId] = [];
        }
        this.redoStacks[this.userId].push(lastObject);
        
        this.redrawAll();
        return lastObject.id;
    }
    
    public redo(): CanvasObject | null {
        if (!this.redoStacks[this.userId] || this.redoStacks[this.userId].length === 0) return null;
    
        const nextObject = this.redoStacks[this.userId].pop();
        if (nextObject) {
            this.history.push(nextObject);
            this.redrawAll();
        }
        return nextObject || null;
    }

    public undoRemote(objectId: string) {
        const objectToUndo = this.history.find(obj => obj.id === objectId);
        if (objectToUndo) {
            this.history = this.history.filter(obj => obj.id !== objectId);
            if (!this.redoStacks[objectToUndo.userId]) {
                this.redoStacks[objectToUndo.userId] = [];
            }
            this.redoStacks[objectToUndo.userId].push(objectToUndo);
            this.redrawAll();
        }
    }

    public redoRemote(object: CanvasObject) {
        if (object) {
            this.history.push(object);
            if (this.redoStacks[object.userId]) {
                this.redoStacks[object.userId] = this.redoStacks[object.userId].filter(obj => obj.id !== object.id);
            }
            this.redrawAll();
        }
    }
    
    public redrawAll = () => {
        this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        this.history.forEach(obj => {
            this.executeDraw(obj.data, true);
        });
        this.render();
    }

    public save = () => {
        this.updateCompositeCanvas();
        const link = document.createElement('a');
        link.download = 'coloring-page.png';
        link.href = this.compositeCanvas.toDataURL();
        link.click();
    }

    private getCanvasPoint = (evt: PointerEvent): Point => {
        const rect = this.displayCanvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const x = (evt.clientX - rect.left - this.offset.x) / this.zoom;
        const y = (evt.clientY - rect.top - this.offset.y) / this.zoom;
        return {
            x: x / (this.drawingCanvas.width / dpr),
            y: y / (this.drawingCanvas.height / dpr),
            pressure: evt.pressure
        };
    }

    private getAbsoluteX = (x: number) => x * (this.drawingCanvas.width / (window.devicePixelRatio || 1));
    private getAbsoluteY = (y: number) => y * (this.drawingCanvas.height / (window.devicePixelRatio || 1));

    private updateCompositeCanvas() {
        this.compositeCtx.clearRect(0, 0, this.compositeCanvas.width, this.compositeCanvas.height);
        this.compositeCtx.drawImage(this.backgroundCanvas, 0, 0, this.compositeCanvas.width, this.compositeCanvas.height);
        this.compositeCtx.drawImage(this.drawingCanvas, 0, 0, this.compositeCanvas.width, this.compositeCanvas.height);
    }
    
    private handlePointerDown = (evt: PointerEvent) => {
        this.displayCanvas.setPointerCapture(evt.pointerId);
        this.lastPoint = this.getCanvasPoint(evt);

        if (this.tool === Tool.Pan) {
            this.isPanning = true;
            this.lastPanPoint = { x: evt.clientX, y: evt.clientY };
            return;
        }

        if (this.tool === Tool.Pipette) {
            this.pickColor(this.lastPoint);
            return;
        }

        if (this.tool === Tool.Fill) {
            const fillData = {
                type: 'fill',
                point: this.lastPoint,
                color: this.color,
                userId: this.userId,
                id: `fill-${Date.now()}`
            };
            this.executeDraw(fillData);
            this.options.onDraw(fillData);
            return;
        }
        
        this.isDrawing = true;
        if (this.pattern) {
            this.preDrawImageData = this.drawingCtx.getImageData(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        } else if (this.tool === Tool.Brush || this.tool === Tool.Eraser) {
            this.currentStroke = [];
        }
    };

    private handlePointerMove = (evt: PointerEvent) => {
        if (this.isPanning && this.lastPanPoint) {
            const dx = evt.clientX - this.lastPanPoint.x;
            const dy = evt.clientY - this.lastPanPoint.y;
            this.pan(dx, dy);
            this.lastPanPoint = { x: evt.clientX, y: evt.clientY };
            return;
        }

        if (!this.isDrawing) return;
        const currentPoint = this.getCanvasPoint(evt);
        
        if (this.pattern && this.preDrawImageData) {
            this.drawingCtx.putImageData(this.preDrawImageData, 0, 0);
            const size = Math.hypot(this.getAbsoluteX(currentPoint.x) - this.getAbsoluteX(this.lastPoint!.x), this.getAbsoluteY(currentPoint.y) - this.getAbsoluteY(this.lastPoint!.y)) * 2;
            this.drawPattern(this.drawingCtx, this.lastPoint!, size, this.color, this.pattern);
        } else if (this.tool === Tool.Brush || this.tool === Tool.Eraser) {
            const segment = { from: this.lastPoint!, to: currentPoint };
            this.currentStroke.push(segment);

            // Draw on the temporary stroke canvas
            this.strokeCtx.clearRect(0, 0, this.strokeCanvas.width, this.strokeCanvas.height);
            this.currentStroke.forEach(seg => {
                this.drawSegment(this.strokeCtx, seg.from, seg.to, {
                    tool: this.tool,
                    color: this.color,
                    brushSize: this.brushSize,
                    brushShape: this.brushShape,
                    brushAlpha: this.brushAlpha,
                });
            });
            
            // Render everything including the temporary stroke
            this.renderWithStroke();
            this.lastPoint = currentPoint;
        }
    };

    private handlePointerUp = (evt: PointerEvent) => {
        if (this.isDrawing) {
            if (this.tool === Tool.Brush && this.currentStroke.length > 0 && !this.pattern) {
                // Draw the final stroke to the main drawing canvas
                this.currentStroke.forEach(segment => {
                    this.drawSegment(this.drawingCtx, segment.from, segment.to, {
                        tool: this.tool,
                        color: this.color,
                        brushSize: this.brushSize,
                        brushShape: this.brushShape,
                        brushAlpha: this.brushAlpha,
                    });
                });
                
                // Clear the temporary stroke canvas
                this.strokeCtx.clearRect(0, 0, this.strokeCanvas.width, this.strokeCanvas.height);

                const strokeData = {
                    type: 'stroke',
                    segments: this.currentStroke,
                    color: this.color,
                    brushSize: this.brushSize,
                    brushShape: this.brushShape,
                    tool: this.tool,
                    brushAlpha: this.brushAlpha,
                    userId: this.userId,
                    id: `stroke-${Date.now()}`
                };
                this.pushToHistory({ id: strokeData.id, userId: this.userId, type: 'stroke', data: strokeData });
                this.options.onDraw(strokeData);
                this.render();
            } else if (this.pattern) {
                if (this.preDrawImageData) {
                    this.drawingCtx.putImageData(this.preDrawImageData, 0, 0);
                }
                const currentPoint = this.getCanvasPoint(evt);
                const size = Math.hypot(this.getAbsoluteX(currentPoint.x) - this.getAbsoluteX(this.lastPoint!.x), this.getAbsoluteY(currentPoint.y) - this.getAbsoluteY(this.lastPoint!.y)) * 2;
                const patternData = {
                    type: 'pattern',
                    center: this.lastPoint!,
                    size,
                    color: this.color,
                    pattern: this.pattern,
                    userId: this.userId,
                    id: `pattern-${Date.now()}`
                };
                this.executeDraw(patternData);
                this.options.onDraw(patternData);
            }

            this.isDrawing = false;
            this.lastPoint = null;
            this.currentStroke = [];
            this.preDrawImageData = null;
        }

        if (this.isPanning) {
            this.isPanning = false;
            this.lastPanPoint = null;
        }
        
        this.displayCanvas.releasePointerCapture(evt.pointerId);
    };

    public executeDraw(data: any, isRedrawing: boolean = false) {
        if (!isRedrawing) {
            this.pushToHistory({ id: data.id, userId: data.userId, type: data.type, data: data });
        }
        
        const ctx = this.drawingCtx;
        
        const settings = {
            tool: data.tool,
            color: data.color,
            brushSize: data.brushSize,
            brushShape: data.brushShape,
            brushAlpha: data.brushAlpha,
            pattern: data.pattern,
        };

        if (data.type === 'stroke') {
            data.segments.forEach((segment: any) => {
                this.drawSegment(ctx, segment.from, segment.to, settings);
            });
        } else if (data.type === 'fill') {
            this.floodFill(ctx, data.point, data.color);
        } else if (data.type === 'pattern') {
            this.drawPattern(ctx, data.center, data.size, settings.color, settings.pattern);
        }
        
        if (!isRedrawing) {
            this.render();
        }
    }

    private drawSegment(ctx: CanvasRenderingContext2D, from: Point, to: Point, settings: any) {
        ctx.save();
        const isEraser = settings.tool === Tool.Eraser;
        ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
        ctx.strokeStyle = isEraser ? 'rgba(0,0,0,1)' : settings.color;
        
        this.applyBrushStyleToContext(ctx, to.pressure, settings);

        const fromX = this.getAbsoluteX(from.x);
        const fromY = this.getAbsoluteY(from.y);
        const toX = this.getAbsoluteX(to.x);
        const toY = this.getAbsoluteY(to.y);

        if(settings.brushShape === BrushShape.Spray){
            ctx.fillStyle = settings.color;
            const distance = Math.hypot(toX - fromX, toY - fromY);
            const angle = Math.atan2(toY - fromY, toX - fromX);
            for (let i = 0; i < distance; i+=2) {
                const x = fromX + Math.cos(angle) * i;
                const y = fromY + Math.sin(angle) * i;
                const radius = (settings.brushSize * (to.pressure || 0.5)) / 2;
                for (let j = 0; j < 15; j++) {
                    const randAngle = Math.random() * 2 * Math.PI;
                    const randRadius = Math.random() * radius;
                    const px = x + Math.cos(randAngle) * randRadius;
                    const py = y + Math.sin(randAngle) * randRadius;
                    ctx.globalAlpha = Math.random() * 0.5;
                    ctx.fillRect(px, py, 1, 1);
                }
            }
        } else {
            const distance = Math.hypot(toX - fromX, toY - fromY);
            const angle = Math.atan2(toY - fromY, toX - fromX);
            let lastInterpolatedPoint = { x: fromX, y: fromY };

            for (let i = 0; i < distance; i++) {
                const x = fromX + Math.cos(angle) * i;
                const y = fromY + Math.sin(angle) * i;
                const currentInterpolatedPoint = { x, y };

                ctx.beginPath();
                ctx.moveTo(lastInterpolatedPoint.x, lastInterpolatedPoint.y);
                ctx.lineTo(currentInterpolatedPoint.x, currentInterpolatedPoint.y);
                ctx.stroke();
                
                lastInterpolatedPoint = currentInterpolatedPoint;
            }
        }
        ctx.restore();
    }

    private applyBrushStyleToContext(ctx: CanvasRenderingContext2D, pressure: number = 0.5, settings: any) {
        let size = settings.brushSize * (pressure || 0.5);
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 0;
        
        ctx.globalAlpha = settings.brushAlpha;

        switch (settings.brushShape) {
            case BrushShape.Round:
                break;
            case BrushShape.Square:
                ctx.lineCap = 'square';
                ctx.lineJoin = 'miter';
                break;
            case BrushShape.Marker:
                ctx.globalAlpha = 0.7;
                ctx.lineWidth = settings.brushSize;
                break;
            case BrushShape.Spray:
                break;
            case BrushShape.Calligraphy:
                ctx.lineCap = 'butt';
                ctx.lineWidth = size * 0.5;
                break;
            case BrushShape.Chalk:
                ctx.globalAlpha = 0.6 + Math.random() * 0.3;
                ctx.lineWidth = size * (0.8 + Math.random() * 0.4);
                break;
            case BrushShape.Watercolor:
                ctx.shadowColor = settings.color;
                ctx.shadowBlur = settings.brushSize / 2;
                ctx.strokeStyle = this.hexToRgba(settings.color, 0.5);
                break;
            case BrushShape.OilPaint:
                ctx.globalAlpha = 0.9;
                ctx.shadowColor = settings.color;
                ctx.shadowBlur = settings.brushSize * 0.1;
                break;
            case BrushShape.Crayon:
                ctx.globalAlpha = 0.7 + Math.random() * 0.2;
                ctx.lineWidth = size * (0.9 + Math.random() * 0.2);
                ctx.lineCap = 'round';
                break;
            case BrushShape.TexturedPencil:
                ctx.globalAlpha = 0.5 + Math.random() * 0.3;
                ctx.lineWidth = size * 0.6 * (0.85 + Math.random() * 0.3);
                ctx.lineCap = 'round';
                break;
            case BrushShape.Pen:
                ctx.globalAlpha = 1;
                ctx.lineWidth = size * 0.4;
                ctx.lineCap = 'round';
                break;
            default:
                break;
        }
    }
    
    private pickColor(point: Point) {
        this.updateCompositeCanvas();
        const dpr = window.devicePixelRatio || 1;
        const pixel = this.compositeCtx.getImageData(this.getAbsoluteX(point.x) * dpr, this.getAbsoluteY(point.y) * dpr, 1, 1).data;
        const color = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3] / 255})`;
        this.options.onColorPick(color);
    }
    
    private floodFill(ctx: CanvasRenderingContext2D, point: Point, color: string) {
        this.updateCompositeCanvas();
        const dpr = window.devicePixelRatio || 1;
        const x = Math.floor(this.getAbsoluteX(point.x) * dpr);
        const y = Math.floor(this.getAbsoluteY(point.y) * dpr);

        const compositeImageData = this.compositeCtx.getImageData(0, 0, this.compositeCanvas.width, this.compositeCanvas.height);
        const drawingImageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);

        const width = compositeImageData.width;
        const height = compositeImageData.height;

        const getPixel = (data: Uint8ClampedArray, i: number) => [data[i], data[i+1], data[i+2], data[i+3]];

        const startIndex = (y * width + x) * 4;
        const startColor = getPixel(compositeImageData.data, startIndex);

        const targetRgb = this.hexToRgb(color);
        if (!targetRgb) return;
        
        // Don't fill if the start color is the same as the target color
        if (startColor[0] === targetRgb.r && startColor[1] === targetRgb.g && startColor[2] === targetRgb.b) return;

        // A more robust check for black/dark outlines
        if (startColor[0] < 20 && startColor[1] < 20 && startColor[2] < 20 && startColor[3] > 200) return;

        const stack: [number, number][] = [[x, y]];
        const visited = new Set<number>();
        visited.add(startIndex);

        const colorMatch = (pixel: number[]) => {
             const tolerance = 30;
             return Math.abs(pixel[0] - startColor[0]) < tolerance &&
                    Math.abs(pixel[1] - startColor[1]) < tolerance &&
                    Math.abs(pixel[2] - startColor[2]) < tolerance &&
                    Math.abs(pixel[3] - startColor[3]) < tolerance;
        }

        while (stack.length) {
            const [cx, cy] = stack.pop()!;
            if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;

            const index = (cy * width + cx) * 4;

            const currentPixel = getPixel(compositeImageData.data, index);
            const isAlreadyDrawnOn = drawingImageData.data[index+3] > 0;

            if (isAlreadyDrawnOn || !colorMatch(currentPixel)) {
                continue;
            }

            drawingImageData.data[index] = targetRgb.r;
            drawingImageData.data[index + 1] = targetRgb.g;
            drawingImageData.data[index + 2] = targetRgb.b;
            drawingImageData.data[index + 3] = 255;
            
            const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
            for (const [nx, ny] of neighbors) {
                const nIndex = (ny * width + nx) * 4;
                if (!visited.has(nIndex)) {
                    stack.push([nx, ny]);
                    visited.add(nIndex);
                }
            }
        }
        ctx.putImageData(drawingImageData, 0, 0);
    }
    
    private hexToRgb(hex: string) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    private hexToRgba(hex: string, alpha: number): string {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    }

    private drawPattern(ctx: CanvasRenderingContext2D, center: Point, size: number, color: string, pattern: Pattern) {
        const patternImage = this.patternImages.get(pattern);
        if (!patternImage) return;

        const finalSize = Math.max(5, size);

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = finalSize;
        tempCanvas.height = finalSize;
        const tempCtx = tempCanvas.getContext('2d')!;

        tempCtx.drawImage(patternImage, 0, 0, finalSize, finalSize);

        tempCtx.globalCompositeOperation = 'source-in';
        tempCtx.fillStyle = color;
        tempCtx.fillRect(0, 0, finalSize, finalSize);
        
        ctx.drawImage(tempCanvas, this.getAbsoluteX(center.x) - finalSize / 2, this.getAbsoluteY(center.y) - finalSize / 2, finalSize, finalSize);
    }
}