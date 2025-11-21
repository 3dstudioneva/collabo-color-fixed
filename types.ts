export enum Tool {
    Brush = 'BRUSH',
    Fill = 'FILL',
    Eraser = 'ERASER',
    Pipette = 'PIPETTE',
    Pan = 'PAN',
}

export enum BrushShape {
    Round = 'round',
    Square = 'square',
    Spray = 'spray',
    Marker = 'marker',
    Calligraphy = 'calligraphy',
    Chalk = 'chalk',
    Watercolor = 'watercolor',
    OilPaint = 'oilPaint',
    Crayon = 'crayon',
    TexturedPencil = 'texturedPencil',
    Pen = 'pen',
    Eraser = 'eraser',
}

export enum Pattern {
    Circle = 'Circle',
    Square = 'Square',
    Star = 'Star',
    Triangle = 'Triangle',
    Heart = 'Heart',
    Cloud = 'Cloud',
    Moon = 'Moon',
    Lightning = 'Lightning',
    Snowflake = 'snowflake',
    Spiral = 'spiral',
    Cross = 'cross',
    Rhombus = 'rhombus',
    Hexagon = 'hexagon',
    Wave = 'wave',
    Zigzag = 'zigzag',
    Flower = 'flower',
    Paw = 'paw',
    Clover = 'clover',
    Diamond = 'diamond',
    MusicNote = 'music-note',
    Bubble = 'bubble',
    Sun = 'Sun',
    Smile = 'Smile',
    Frown = 'Frown',
    Meh = 'Meh',
    Zap = 'Zap',
    Droplet = 'Droplet',
    Award = 'Award',
    Bell = 'Bell',
    Gift = 'Gift',
    Umbrella = 'Umbrella',
    Feather = 'Feather',
    Anchor = 'Anchor',
    Globe = 'Globe',
    Home = 'Home',
    Map = 'Map',
    Compass = 'Compass',
    Book = 'Book',
    Lightbulb = 'Lightbulb',
    PenTool = 'PenTool',
    Gitlab = 'Gitlab',
    Twitter = 'Twitter',
    Wind = 'Wind',
    Wifi = 'Wifi',
    Sunrise = 'Sunrise',
    Sunset = 'Sunset',
    Crown = 'Crown',
    Flag = 'Flag',
    Key = 'Key',
    Lock = 'Lock',
    Music = 'Music',
    Gem = 'Gem',
    Train = 'Train',
    Joystick = 'Joystick',
}

export enum ToolbarMode {
    Brush = 'BRUSH',
    Pattern = 'PATTERN',
}

export interface DrawEvent {
    type: 'segment' | 'pattern' | 'fill' | 'clear' | 'undo' | 'redo';
    userId: string;
    id?: string;
    [key: string]: any;
}
