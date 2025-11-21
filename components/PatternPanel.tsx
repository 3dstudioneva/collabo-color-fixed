import React from 'react';
import { Pattern } from '../types';
import {
    Circle, Square, Star, Triangle, Heart, Cloud, Moon, Zap, Sun, Smile, Frown, Meh,
    Droplet, Award, Bell, Gift, Umbrella, Feather, Anchor, Globe, Home, Map,
    Compass, Book, Lightbulb, PenTool, Gitlab, Twitter, Wind, Wifi, Sunrise, Sunset, Crown, Diamond, Flag, Key, Lock, Music, Gem, Train, Joystick
} from './NewIcons';

interface PatternPanelProps {
  activePattern: Pattern;
  onPatternChange: (pattern: Pattern) => void;
}

const patterns = [
    { id: Pattern.Circle, icon: <Circle />, title: "Круг" },
    { id: Pattern.Square, icon: <Square />, title: "Квадрат" },
    { id: Pattern.Star, icon: <Star />, title: "Звезда" },
    { id: Pattern.Triangle, icon: <Triangle />, title: "Треугольник" },
    { id: Pattern.Heart, icon: <Heart />, title: "Сердце" },
    { id: Pattern.Cloud, icon: <Cloud />, title: "Облако" },
    { id: Pattern.Moon, icon: <Moon />, title: "Луна" },
    { id: Pattern.Lightning, icon: <Zap />, title: "Молния" },
    { id: Pattern.Sun, icon: <Sun />, title: "Солнце" },
    { id: Pattern.Smile, icon: <Smile />, title: "Смайлик" },
    { id: Pattern.Frown, icon: <Frown />, title: "Грустный смайлик" },
    { id: Pattern.Meh, icon: <Meh />, title: "Нейтральный смайлик" },
    { id: Pattern.Droplet, icon: <Droplet />, title: "Капля" },
    { id: Pattern.Award, icon: <Award />, title: "Награда" },
    { id: Pattern.Bell, icon: <Bell />, title: "Колокольчик" },
    { id: Pattern.Gift, icon: <Gift />, title: "Подарок" },
    { id: Pattern.Umbrella, icon: <Umbrella />, title: "Зонт" },
    { id: Pattern.Feather, icon: <Feather />, title: "Перо" },
    { id: Pattern.Anchor, icon: <Anchor />, title: "Якорь" },
    { id: Pattern.Globe, icon: <Globe />, title: "Глобус" },
    { id: Pattern.Home, icon: <Home />, title: "Дом" },
    { id: Pattern.Map, icon: <Map />, title: "Карта" },
    { id: Pattern.Compass, icon: <Compass />, title: "Компас" },
    { id: Pattern.Book, icon: <Book />, title: "Книга" },
    { id: Pattern.Lightbulb, icon: <Lightbulb />, title: "Лампочка" },
    { id: Pattern.PenTool, icon: <PenTool />, title: "Перо" },
    { id: Pattern.Gitlab, icon: <Gitlab />, title: "Gitlab" },
    { id: Pattern.Twitter, icon: <Twitter />, title: "Twitter" },
    { id: Pattern.Wind, icon: <Wind />, title: "Ветер" },
    { id: Pattern.Wifi, icon: <Wifi />, title: "Wifi" },
    { id: Pattern.Sunrise, icon: <Sunrise />, title: "Рассвет" },
    { id: Pattern.Sunset, icon: <Sunset />, title: "Закат" },
    { id: Pattern.Crown, icon: <Crown />, title: "Корона" },
    { id: Pattern.Diamond, icon: <Diamond />, title: "Бриллиант" },
    { id: Pattern.Flag, icon: <Flag />, title: "Флаг" },
    { id: Pattern.Key, icon: <Key />, title: "Ключ" },
    { id: Pattern.Lock, icon: <Lock />, title: "Замок" },
    { id: Pattern.Music, icon: <Music />, title: "Музыка" },
    { id: Pattern.Gem, icon: <Gem />, title: "Драгоценность" },
    { id: Pattern.Train, icon: <Train />, title: "Поезд" },
    { id: Pattern.Joystick, icon: <Joystick />, title: "Джойстик" },
];

const PatternPanel: React.FC<PatternPanelProps> = ({ activePattern, onPatternChange }) => {
  return (
    <div className="w-full">
        <div className="text-md text-wood-dark font-semibold mb-2">Узоры</div>
        <div className="grid grid-cols-4 gap-2">
            {patterns.map(pattern => (
                <button 
                    key={pattern.id} 
                    onClick={() => onPatternChange(pattern.id)} 
                    className={`h-14 rounded-lg flex items-center justify-center transition-all duration-200 border-2 ${activePattern === pattern.id ? 'bg-blue-200 border-blue-400' : 'bg-wood-light border-wood-dark/50'}`} 
                    title={pattern.title}
                >
                    {pattern.icon}
                </button>
            ))}
        </div>
    </div>
  );
};

export default PatternPanel;