import React, { useState, useRef, useEffect } from 'react';
import { User, GALLERY_IMAGES, PALETTE_COLORS as initialPalette, COLORING_CATEGORIES } from '../constants';
import { Tool, BrushShape, Pattern, ToolbarMode } from '../types';
import { CanvasPainter } from './CanvasPainter';
import PatternPanel from './PatternPanel';
import { BrushIcon, FillIcon, EraserIcon, DoneIcon, AddIcon, UndoIcon, RedoIcon, ClearIcon, HandIcon, ZoomInIcon, ZoomOutIcon, ResetZoomIcon, BackIcon } from './Icon';
import { BrushMarker, BrushSpray, BrushCalligraphy, BrushChalk, BrushWatercolor, BrushOilPaint, BrushCrayon, BrushTexturedPencil, BrushPen, BrushEraser, BrushRound, BrushSquare } from './NewIcons';
import CustomCursor from './CustomCursor';
import { useSocket } from '../hooks/useSocket';

interface ColoringViewProps {
  user: User;
  onBackToAuth: () => void;
}

const SideImageSelector: React.FC<{
    onSelect: (image: {id: string, src: string, name: string, category: string}) => void;
    isImageSelected: boolean;
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    onBack: () => void;
    user: User;
}> = ({ onSelect, isImageSelected, selectedCategory, onCategoryChange, onBack, user }) => {
    const filteredImages = selectedCategory === 'blank'
        ? []
        : GALLERY_IMAGES.filter(img => img.category === selectedCategory);
    
    return (
        <div className="h-full flex flex-row items-start justify-start p-1 gap-2">
            {/* Выбор категории */}
            <div className="bg-wood-light/80 backdrop-blur-sm shadow-lg rounded-xl p-2 border-2 border-r-4 border-wood-dark/50 w-24 h-full max-h-[90vh] flex flex-col">
               <div className="mb-2 border-b-2 border-wood-dark/20 pb-2">
                   <div className="w-16 h-16 mx-auto rounded-full bg-white p-1 border-2 border-wood-dark/50 shadow-inner overflow-hidden">
                       <img src={user.avatar} alt={user.name} className="w-full h-full object-contain rounded-full" />
                   </div>
                   <div className="text-sm text-wood-dark font-bold text-center mt-2">{user.name}</div>
               </div>
               <div className="text-sm text-wood-dark font-bold text-center mb-3">Категории</div>
               <div className="flex flex-col gap-2 flex-grow">
                   <button
                       onClick={() => onCategoryChange('blank')}
                        className={`w-full px-2 py-2 rounded-lg text-xs font-semibold transition-colors ${
                            selectedCategory === 'blank'
                                ? 'bg-blue-200 text-blue-800'
                                : 'bg-wood-light text-wood-dark hover:bg-yellow-100'
                        }`}
                    >
                        Пустой холст
                    </button>
                    {COLORING_CATEGORIES.map(category => (
                        <button
                            key={category}
                            onClick={() => onCategoryChange(category)}
                            className={`w-full px-2 py-2 rounded-lg text-xs font-semibold transition-colors ${
                                selectedCategory === category
                                    ? 'bg-blue-200 text-blue-800'
                                    : 'bg-wood-light text-wood-dark hover:bg-yellow-100'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
                <div className="mt-auto border-t-2 border-wood-dark/20 pt-2">
                     <button
                        onClick={onBack}
                        className="w-full px-2 py-2 rounded-lg text-xs font-semibold transition-colors bg-red-200 text-red-800 hover:bg-red-300 flex items-center justify-center gap-1"
                    >
                        <BackIcon size={16} />
                        Сменить
                    </button>
                </div>
            </div>
            
            {/* Список раскрасок в 3 колонки */}
            {!isImageSelected && selectedCategory !== 'blank' && (
                <div className="bg-wood-light/80 backdrop-blur-sm shadow-lg rounded-xl p-3 border-2 border-r-4 border-wood-dark/50 h-full max-h-[90vh] w-80 overflow-hidden">
                    <div className="h-full overflow-y-auto">
                        <div className="grid grid-cols-3 gap-2">
                            {filteredImages.map(image => (
                                <div key={image.id} className="cursor-pointer hover:scale-105 transition-transform" onClick={() => onSelect(image)}>
                                    <img src={image.src} alt={image.name} className="rounded-md shadow-sm border-2 border-wood-dark/50 w-full h-auto" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const RightToolbar: React.FC<{
    activeTool: Tool;
    onToolChange: (tool: Tool) => void;
    color: string;
    onColorChange: (color: string) => void;
    onSave: () => void;
    brushSize: number;
    onBrushSizeChange: (size: number) => void;
    brushShape: BrushShape;
    onBrushShapeChange: (shape: BrushShape) => void;
    toolbarMode: ToolbarMode;
    onToolbarModeChange: (mode: ToolbarMode) => void;
    activePattern: Pattern;
    onPatternChange: (pattern: Pattern) => void;
    onUndo: () => void;
    onRedo: () => void;
    onClear: () => void;
}> = ({
    activeTool, onToolChange, color, onColorChange, onSave,
    brushSize, onBrushSizeChange, brushShape, onBrushShapeChange,
    toolbarMode, onToolbarModeChange, activePattern, onPatternChange,
    onUndo, onRedo, onClear
}) => {
    const colorPickerRef = useRef<HTMLInputElement>(null);
    const tools = [
        { id: Tool.Brush, icon: <BrushIcon />, title: "Кисть" },
        { id: Tool.Fill, icon: <FillIcon />, title: "Заливка" },
        { id: Tool.Eraser, icon: <EraserIcon />, title: "Ластик" },
    ];

    return (
        <div className="h-full flex flex-col items-stretch justify-start p-1 gap-2">
            <div className="flex-grow flex flex-row items-start justify-center gap-2" style={{maxHeight: 'calc(100% - 80px)'}}>
                {/* Main Toolbar */}
                <div className="bg-gradient-to-b from-[#a57b54] to-[#d2b48c] shadow-lg rounded-2xl p-2 flex flex-col items-center justify-start gap-3 border-2 border-l-4 border-wood-dark/50 h-full w-20">
                    {tools.map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => onToolChange(tool.id)}
                            className={`size-14 rounded-xl flex items-center justify-center transition-all duration-200 border-2 border-b-4 ${activeTool === tool.id ? 'bg-blue-200 border-blue-400 translate-y-0.5' : 'bg-wood-light border-wood-dark/50 hover:bg-yellow-100'}`}
                            title={tool.title}
                        >
                            {tool.icon}
                        </button>
                    ))}
                    <div className="flex flex-col items-center gap-2 border-t-2 border-wood-dark/20 pt-2 mt-1 flex-grow overflow-y-auto px-2">
                        {initialPalette.map(c => (
                            <button
                                key={c}
                                onClick={() => onColorChange(c)}
                                className={`rounded-full cursor-pointer hover:scale-110 transition-all duration-200 border-2 border-black/20 shadow-md flex-shrink-0 ${color === c ? 'size-11 ring-4 ring-yellow-300 shadow-xl scale-110' : 'size-9'}`}
                                style={{ backgroundColor: c, backgroundImage: 'radial-gradient(circle at 30% 30%, #ffffff88, transparent)' }}
                            />
                        ))}
                        <button onClick={() => colorPickerRef.current?.click()} className="size-9 rounded-full flex items-center justify-center bg-gradient-to-b from-red-500 via-yellow-500 to-blue-500 hover:opacity-90 transition-opacity flex-shrink-0" title="Выбрать свой цвет">
                            <AddIcon />
                            <input ref={colorPickerRef} type="color" value={color} onChange={(e) => onColorChange(e.target.value)} className="w-0 h-0 opacity-0" />
                        </button>
                    </div>
                    <div className="mt-auto pb-1">
                        <button onClick={onSave} className="size-14 rounded-xl flex items-center justify-center bg-green-500 hover:bg-green-600 transition-all border-2 border-b-4 border-green-700 active:border-b-2 active:translate-y-0.5">
                            <DoneIcon />
                        </button>
                    </div>
                </div>

                {/* Dynamic Panel */}
                <div className="bg-wood-light/90 backdrop-blur-md shadow-2xl rounded-xl p-4 border-2 border-wood-dark/50 w-64 h-full flex flex-col">
                    <div className="flex justify-around mb-4 border-b-2 border-wood-dark/20 pb-2">
                        <button onClick={() => onToolbarModeChange(ToolbarMode.Brush)} className={`px-4 py-2 rounded-lg font-bold transition-colors ${toolbarMode === ToolbarMode.Brush ? 'bg-blue-200 text-blue-800' : 'text-wood-dark hover:bg-wood-dark/10'}`}>
                            Кисти
                        </button>
                        <button onClick={() => onToolbarModeChange(ToolbarMode.Pattern)} className={`px-4 py-2 rounded-lg font-bold transition-colors ${toolbarMode === ToolbarMode.Pattern ? 'bg-blue-200 text-blue-800' : 'text-wood-dark hover:bg-wood-dark/10'}`}>
                            Узоры
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {toolbarMode === ToolbarMode.Brush && (
                            <div className="flex flex-col items-center gap-4">
                                <div className='text-lg text-wood-dark font-bold'>Настройки кисти</div>
                                <div className="w-full">
                                    <div className="text-md text-wood-dark font-semibold mb-2">Форма</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button className={`w-13 h-13 rounded-full flex items-center justify-center ${brushShape === BrushShape.Round ? 'bg-blue-200' : ''}`} onClick={() => onBrushShapeChange(BrushShape.Round)}><BrushRound className="w-8 h-8" /></button>
                                        <button className={`w-13 h-13 rounded-full flex items-center justify-center ${brushShape === BrushShape.Square ? 'bg-blue-200' : ''}`} onClick={() => onBrushShapeChange(BrushShape.Square)}><BrushSquare className="w-8 h-8" /></button>
                                        <button className={`w-13 h-13 rounded-full flex items-center justify-center ${brushShape === BrushShape.Spray ? 'bg-blue-200' : ''}`} onClick={() => onBrushShapeChange(BrushShape.Spray)}><BrushSpray className="w-8 h-8" /></button>
                                        <button className={`w-13 h-13 rounded-full flex items-center justify-center ${brushShape === BrushShape.Calligraphy ? 'bg-blue-200' : ''}`} onClick={() => onBrushShapeChange(BrushShape.Calligraphy)}><BrushCalligraphy className="w-8 h-8" /></button>
                                        <button className={`w-13 h-13 rounded-full flex items-center justify-center ${brushShape === BrushShape.Watercolor ? 'bg-blue-200' : ''}`} onClick={() => onBrushShapeChange(BrushShape.Watercolor)}><BrushWatercolor className="w-8 h-8" /></button>
                                        <button className={`w-13 h-13 rounded-full flex items-center justify-center ${brushShape === BrushShape.OilPaint ? 'bg-blue-200' : ''}`} onClick={() => onBrushShapeChange(BrushShape.OilPaint)}><BrushOilPaint className="w-8 h-8" /></button>
                                    </div>
                                </div>
                                <div className="w-full">
                                    <div className="text-md text-wood-dark font-semibold mb-2">Размер: {brushSize}</div>
                                    <input type="range" min="2" max="100" value={brushSize} onChange={(e) => onBrushSizeChange(Number(e.target.value))} className="w-full h-4 bg-wood-light rounded-lg appearance-none cursor-pointer" />
                                </div>
                            </div>
                        )}
                        {toolbarMode === ToolbarMode.Pattern && (
                            <PatternPanel activePattern={activePattern} onPatternChange={onPatternChange} />
                        )}
                    </div>
                </div>
            </div>
            <div className="flex-shrink-0 bg-wood-light/80 backdrop-blur-sm shadow-lg rounded-xl p-2 border-2 border-t-4 border-wood-dark/50 flex flex-row gap-2 justify-center">
                <button onClick={onUndo} className="size-14 rounded-xl flex items-center justify-center bg-wood-light border-2 border-b-4 border-wood-dark/50 hover:bg-yellow-100 transition-all" title="Отменить"><UndoIcon /></button>
                <button onClick={onRedo} className="size-14 rounded-xl flex items-center justify-center bg-wood-light border-2 border-b-4 border-wood-dark/50 hover:bg-yellow-100 transition-all" title="Повторить"><RedoIcon /></button>
                <button onClick={onClear} className="size-14 rounded-xl flex items-center justify-center bg-red-400 border-2 border-b-4 border-red-600 hover:bg-red-500 transition-all" title="Очистить"><ClearIcon className="text-white" /></button>
            </div>
        </div>
    );
};

const ColoringView: React.FC<ColoringViewProps> = ({ user, onBackToAuth }) => {
    const [activeTool, setActiveTool] = useState<Tool>(Tool.Brush);
    const [activeColor, setColor] = useState<string>('#E53935');
    const [brushSize, setBrushSize] = useState(8);
    const [activeBrushShape, setBrushShape] = useState<BrushShape>(BrushShape.Round);
    const [selectedCategory, setSelectedCategory] = useState<string>('blank');
    const [coloringImage, setColoringImage] = useState<{id: string, src: string, name: string, category: string} | null>(null);
    const [isImageSelected, setIsImageSelected] = useState(false);
    const [toolbarMode, setToolbarMode] = useState<ToolbarMode>(ToolbarMode.Brush);
    const [activePattern, setActivePattern] = useState<Pattern>(Pattern.Square);
    
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
    const [isCursorVisible, setIsCursorVisible] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
    const displayCanvasRef = useRef<HTMLCanvasElement>(null);
    const painterRef = useRef<CanvasPainter | null>(null);
    const socket = useSocket();

    useEffect(() => {
        if (!backgroundCanvasRef.current || !displayCanvasRef.current || !containerRef.current) return;

        const painter = new CanvasPainter(backgroundCanvasRef.current, displayCanvasRef.current, user.id, {
            onColorPick: setColor,
            onDraw: (data) => {
                if (socket) {
                    socket.emit('drawing', data);
                }
            },
        });
        painterRef.current = painter;
        
        if (socket) {
            socket.on('drawing', (data) => {
                painterRef.current?.executeDraw(data);
            });
            socket.on('clear', () => painterRef.current?.clear(true));
            socket.on('undo', (data) => painterRef.current?.undoRemote(data.objectId));
            socket.on('redo', (data) => painterRef.current?.redoRemote(data.object));
            socket.on('imageSelected', ({ image }) => {
                setColoringImage(image);
            });
        }

        const container = containerRef.current;

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    painter.setDimensions(width, height);
                    
                    if (coloringImage) {
                        const img = new Image();
                        img.onload = () => painter.setBackgroundImage(img);
                        img.src = coloringImage.src;
                    } else {
                        painter.clear(true);
                    }
                }
            }
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            painter.destroy();
            if(socket) {
                socket.off('draw');
                socket.off('clear');
                socket.off('undo');
                socket.off('redo');
            }
        };

    }, [coloringImage, socket, user.id]);

    useEffect(() => {
        if (painterRef.current) {
            painterRef.current.setTool(activeTool);
            painterRef.current.setColor(activeColor);
            painterRef.current.setBrushSize(brushSize);
            painterRef.current.setBrushShape(activeBrushShape);
            painterRef.current.setPattern(toolbarMode === ToolbarMode.Pattern ? activePattern : null);
        }
    }, [activeTool, activeColor, brushSize, activeBrushShape, toolbarMode, activePattern]);

    useEffect(() => {
        if (toolbarMode === ToolbarMode.Pattern) {
            setActiveTool(Tool.Brush);
        }
    }, [toolbarMode]);

    const handleSave = () => painterRef.current?.save();
    const handleUndo = () => {
        const objectId = painterRef.current?.undo();
        if (socket && objectId) {
            socket.emit('undo', { objectId });
        }
    };
    const handleRedo = () => {
        const object = painterRef.current?.redo();
        if (socket && object) {
            socket.emit('redo', { object });
        }
    };
    const handleClear = () => {
        painterRef.current?.clear();
        if (socket) {
            socket.emit('clear');
        }
    };
    const handleZoomIn = () => painterRef.current?.zoomIn();
    const handleZoomOut = () => painterRef.current?.zoomOut();
    const handleResetView = () => painterRef.current?.resetView();

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseEnter = () => {
        setIsCursorVisible(true);
    };

    const handleMouseLeave = () => {
        setIsCursorVisible(false);
    };

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setColoringImage(null);
        setIsImageSelected(false);
    };

    const handleImageSelect = (image: {id: string, src: string, name: string, category: string}) => {
        setColoringImage(image);
        setIsImageSelected(true);
        if (socket) {
            socket.emit('selectImage', { image });
        }
    }

    const handleBack = () => {
        setIsImageSelected(false);
        onBackToAuth();
    }

    return (
        <div className="relative h-screen w-full overflow-hidden bg-[#e3d5b8] flex items-center justify-center p-2">
            <SideImageSelector
                onSelect={handleImageSelect}
                isImageSelected={isImageSelected}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                onBack={handleBack}
                user={user}
            />

            <main ref={containerRef} className="w-full h-full p-2 flex-grow">
                 <div
                    className="w-full h-full bg-white rounded-3xl shadow-lg flex items-center justify-center border-4 border-b-8 border-black/10 relative overflow-hidden"
                   onMouseMove={handleMouseMove}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                 >
                    <canvas ref={backgroundCanvasRef} className="absolute inset-0" style={{visibility: 'hidden'}} />
                    <canvas
                        ref={displayCanvasRef}
                        className="absolute inset-0 custom-cursor-canvas"
                    />
                 </div>
            </main>

            {/* View Toolbar */}
            <div className="absolute top-4 right-96 bg-wood-light/80 backdrop-blur-sm shadow-lg rounded-xl p-2 border-2 border-t-4 border-wood-dark/50 flex flex-col gap-2">
                <button onClick={() => setActiveTool(Tool.Pan)} className={`size-12 rounded-xl flex items-center justify-center transition-all ${activeTool === Tool.Pan ? 'bg-blue-200' : 'bg-wood-light'}`} title="Перемещение"><HandIcon /></button>
                <button onClick={handleZoomIn} className="size-12 rounded-xl flex items-center justify-center bg-wood-light border-2 border-b-4 border-wood-dark/50 hover:bg-yellow-100 transition-all" title="Приблизить"><ZoomInIcon /></button>
                <button onClick={handleZoomOut} className="size-12 rounded-xl flex items-center justify-center bg-wood-light border-2 border-b-4 border-wood-dark/50 hover:bg-yellow-100 transition-all" title="Отдалить"><ZoomOutIcon /></button>
                <button onClick={handleResetView} className="size-12 rounded-xl flex items-center justify-center bg-wood-light border-2 border-b-4 border-wood-dark/50 hover:bg-yellow-100 transition-all" title="Сбросить вид"><ResetZoomIcon /></button>
            </div>

            {/* Кастомный курсор */}
            <CustomCursor
                x={cursorPosition.x}
                y={cursorPosition.y}
                size={brushSize}
                color={activeColor}
                tool={activeTool}
                isVisible={isCursorVisible}
                isPatternMode={toolbarMode === ToolbarMode.Pattern || activeTool === Tool.Fill}
            />

            <RightToolbar
                activeTool={activeTool}
                onToolChange={setActiveTool}
                color={activeColor}
                onColorChange={setColor}
                onSave={handleSave}
                brushSize={brushSize}
                onBrushSizeChange={setBrushSize}
                brushShape={activeBrushShape}
                onBrushShapeChange={setBrushShape}
                toolbarMode={toolbarMode}
                onToolbarModeChange={setToolbarMode}
                activePattern={activePattern}
                onPatternChange={setActivePattern}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onClear={handleClear}
            />
        </div>
    );
};

export default ColoringView;