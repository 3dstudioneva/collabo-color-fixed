'use client';

import React from 'react';
import { GAMES } from '../constants';
import { useNavigate } from 'react-router-dom';

const GameMenu: React.FC = () => {
  const navigate = useNavigate();

  const handleGameSelect = (path: string) => {
    navigate(path);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#e3d5b8]">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-wood-dark tracking-tight" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif" }}>Выберите игру</h1>
      </div>
      <div className="grid grid-cols-3 gap-8 md:gap-16">
        {GAMES.map((game) => (
          <div
            key={game.id}
            onClick={() => handleGameSelect(game.path)}
            className="flex flex-col items-center gap-6 cursor-pointer group"
          >
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-wood-light p-2 border-4 border-wood-dark/50 shadow-lg overflow-hidden transform group-hover:scale-105 transition-transform duration-300 flex items-center justify-center">
              <span className="text-wood-dark w-16 h-16 md:w-24 md:h-24">
                <game.icon size="100%" />
              </span>
            </div>
            <span className="text-2xl md:text-3xl font-bold text-wood-dark">
              {game.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameMenu;