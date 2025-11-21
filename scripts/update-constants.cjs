const fs = require('fs');
const path = require('path');

// Читаем parsed-coloring-pages.json
const jsonPath = path.join(__dirname, '..', 'parsed-coloring-pages.json');
const coloringPages = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// Группируем по категориям
const categories = {};
coloringPages.forEach(page => {
  if (!categories[page.category]) {
    categories[page.category] = [];
  }
  categories[page.category].push(page);
});

// Генерируем TypeScript код
let tsCode = `
export interface User {
  id: 'dad' | 'daughter';
  name: string;
  avatar: string;
}

export const USERS: User[] = [
  { id: 'dad', name: 'Папа', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2PQbPH-7Y6c3wo5qLKhpDuiZ8RRhn_NSBKTjK3Kg_kTr8_CXqldKtF57lIEpp-yzOTq1rpbzdLAjxNIC4eOFPeuFE4KLnKd8n5azm1rY7HO2w8-zCsMk-wCUNJaHWo_MFOMSZPH8PnGPrlWXEReV-jOU1V4sRlCkTiCjaGs4hSZh-aKLFn6ra16WJxOxSdvDgnOuU-ihMA3o2pgCI4tFLPbwviQNLOb62lpjGyRuuVdHaLomAGq9NfjPjKr_RsSjmdeNW-5EC' },
  { id: 'daughter', name: 'Дочка', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWwFf9M0PUqO-hxkdnCdCCjZWC8sD07oy_V6U4Y8FesDp92oCmfA08QhIbSsOu2r9gvzsD38cIaaHi8nNoyR7yXJHZS-ILXAE2Q2_SDliDt7o9sV29G4SvRpH0nlmILkXoTbfzLkxwgHHoMs1WIgMMspGAfP2aTIB7mxyDaawTGe_5aEFuXnwwORnliiZg0pjOV4xgiZk5rcV3izBKRQ4uVKM1TTCu8ox3iYBXqzZHvYy7hb8fPc36AC1P2TwbW9QhOb9KBVy_' },
];

export const PALETTE_COLORS = [
    '#E53935', '#1E88E5', '#43A047', '#FDD835', 
    '#8E24AA', '#FB8C00', '#D81B60', '#00ACC1',
    '#FF5722', '#3F51B5'
];

export interface ColoringImage {
  id: string;
  src: string;
  name: string;
  category: string;
}

export const COLORING_CATEGORIES = ${JSON.stringify(Object.keys(categories), null, 2)};

export const GALLERY_IMAGES: ColoringImage[] = ${JSON.stringify(coloringPages, null, 2)};
`;

// Сохраняем в constants.ts
const constantsPath = path.join(__dirname, '..', 'constants.ts');
fs.writeFileSync(constantsPath, tsCode, 'utf-8');

console.log(`✅ Обновлен constants.ts`);
console.log(`📊 Всего раскрасок: ${coloringPages.length}`);
console.log(`📁 Категорий: ${Object.keys(categories).length}`);
Object.entries(categories).forEach(([cat, pages]) => {
  console.log(`   - ${cat}: ${pages.length} раскрасок`);
});