
import React from 'react';
import { User, USERS } from '../constants';

interface UserSelectionProps {
  onUserSelect: (user: User) => void;
}

const UserSelection: React.FC<UserSelectionProps> = ({ onUserSelect }) => {

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#e3d5b8]">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-wood-dark tracking-tight" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif" }}>Collabo-Color</h1>
        <p className="text-wood-dark/80 text-xl mt-2">Выберите художника</p>
      </div>
      <div className="flex gap-8 md:gap-16">
        {USERS.map((user) => (
          <div
            key={user.id}
            onClick={() => onUserSelect(user)}
            className="flex flex-col items-center gap-6 cursor-pointer group"
          >
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-wood-light p-2 border-4 border-wood-dark/50 shadow-lg overflow-hidden transform group-hover:scale-105 transition-transform duration-300 flex items-center justify-center">
              <img src={user.avatar} alt={user.name} className="w-full h-full object-contain rounded-full bg-white" />
            </div>
            <button className="text-2xl md:text-3xl font-bold text-white bg-blue-500 px-8 py-3 rounded-xl shadow-md border-2 border-b-4 border-blue-700 active:translate-y-0.5 active:border-b-2 transition-all duration-150">
              {user.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserSelection;
