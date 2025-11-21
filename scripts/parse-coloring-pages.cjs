const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Категории для парсинга
const CATEGORIES = [
  { url: 'https://deti-online.com/raskraski/raskraski-dlja-devochek/4-5-let/', name: '4-5-лет' },
  { url: 'https://deti-online.com/raskraski/raskraski-dlja-devochek/2-3-let/', name: '2-3-года' },
  { url: 'https://deti-online.com/raskraski/raskraski-dlja-devochek/6-7-let/', name: '6-7-лет' },
];

// Функция для загрузки HTML страницы
function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Функция для скачивания изображения
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    protocol.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Парсинг HTML для извлечения раскрасок
function parseColoringPages(html) {
  const pages = [];
  // Регулярное выражение для поиска ссылок на раскраски
  const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>\s*<img[^>]+src="([^"]+)"[^>]+alt="([^"]+)"/g;
  
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const [, pageUrl, imageUrl, title] = match;
    
    // Фильтруем только раскраски (не навигационные элементы)
    if (imageUrl.includes('/i/') && !imageUrl.includes('telegram') && !imageUrl.includes('icon')) {
      pages.push({
        title: title.trim(),
        imageUrl: imageUrl.startsWith('http') ? imageUrl : `https://deti-online.com${imageUrl}`,
        pageUrl: pageUrl.startsWith('http') ? pageUrl : `https://deti-online.com${pageUrl}`,
      });
    }
  }
  
  return pages;
}

// Создание безопасного имени файла
function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 100);
}

// Главная функция
async function main() {
  console.log('Начинаем парсинг раскрасок...\n');
  
  const allPages = [];
  
  for (const category of CATEGORIES) {
    console.log(`Парсинг категории: ${category.name}`);
    console.log(`URL: ${category.url}\n`);
    
    try {
      const html = await fetchPage(category.url);
      const pages = parseColoringPages(html);
      
      console.log(`Найдено раскрасок: ${pages.length}\n`);
      
      // Создаем папку для категории
      const categoryDir = path.join(__dirname, '..', 'img', category.name);
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
      }
      
      // Скачиваем изображения
      let downloaded = 0;
      for (const page of pages) {
        try {
          const ext = path.extname(new URL(page.imageUrl).pathname) || '.webp';
          const filename = sanitizeFilename(page.title) + ext;
          const filepath = path.join(categoryDir, filename);
          
          // Пропускаем если файл уже существует
          if (fs.existsSync(filepath)) {
            console.log(`Пропуск (уже существует): ${filename}`);
            continue;
          }
          
          await downloadImage(page.imageUrl, filepath);
          downloaded++;
          console.log(`Скачано [${downloaded}/${pages.length}]: ${filename}`);
          
          // Добавляем в общий список
          allPages.push({
            id: sanitizeFilename(page.title),
            src: `/img/${category.name}/${filename}`,
            name: page.title,
            category: category.name,
          });
          
          // Небольшая задержка чтобы не перегружать сервер
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (err) {
          console.error(`Ошибка при скачивании ${page.title}:`, err.message);
        }
      }
      
      console.log(`\nКатегория ${category.name} завершена: ${downloaded} новых изображений\n`);
      console.log('='.repeat(60) + '\n');
      
    } catch (err) {
      console.error(`Ошибка при парсинге категории ${category.name}:`, err.message);
    }
  }
  
  // Сохраняем результаты в JSON
  const outputPath = path.join(__dirname, '..', 'parsed-coloring-pages.json');
  fs.writeFileSync(outputPath, JSON.stringify(allPages, null, 2), 'utf-8');
  
  console.log(`\nГотово! Всего раскрасок: ${allPages.length}`);
  console.log(`Результаты сохранены в: ${outputPath}`);
  console.log('\nТеперь можно обновить constants.ts с новыми раскрасками.');
}

main().catch(console.error);