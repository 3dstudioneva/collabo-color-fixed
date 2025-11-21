const puppeteer = require('puppeteer');
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

// Создание безопасного имени файла
function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .toLowerCase()
    .substring(0, 100);
}

// Главная функция
async function main() {
  console.log('Запуск браузера...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const allPages = [];
  
  try {
    for (const category of CATEGORIES) {
      console.log(`Парсинг категории: ${category.name}`);
      console.log(`URL: ${category.url}\n`);
      
      const page = await browser.newPage();
      await page.goto(category.url, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // Извлекаем данные о раскрасках
      const coloringPages = await page.evaluate(() => {
        const items = [];
        // Ищем все ссылки внутри article > list > listitem
        const links = document.querySelectorAll('article ul li a');
        
        links.forEach(link => {
          const img = link.querySelector('img');
          
          if (img && img.alt) {
            const title = img.alt.trim();
            const imageUrl = img.src;
            const pageUrl = link.href; // Store the page URL to navigate later
            
            // Фильтруем только раскраски (не навигационные элементы)
            if (imageUrl.includes('/i/') && !imageUrl.includes('telegram') && !imageUrl.includes('icon')) {
              items.push({
                title,
                imageUrl,
                pageUrl,
              });
            }
          }
        });
        
        return items;
      });
      
      console.log(`Найдено раскрасок: ${coloringPages.length}\n`);
      
      // Создаем папку для категории
      const categoryDir = path.join(__dirname, '..', 'img', category.name);
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
      }
      
      // Скачиваем изображения
      let downloaded = 0;
      for (const item of coloringPages) {
        try {
          // Переходим на страницу конкретной раскраски для получения оригинала
          await page.goto(item.pageUrl, { waitUntil: 'networkidle2', timeout: 60000 });
          
          // Находим оригинальное изображение на странице раскраски
          let originalImageUrl = await page.evaluate(() => {
            // Ищем увеличенное изображение на странице
            const img = document.querySelector('article a img'); // Ссылка на увеличенное изображение
            if (img) {
              // Получаем ссылку на страницу с увеличенным изображением
              const parentLink = img.closest('a');
              if (parentLink && parentLink.href) {
                // Формируем URL для увеличенного изображения
                const zoomUrl = parentLink.href.replace('/zoom/', '/main/'); // Try main first
                return zoomUrl;
              }
            }
            
            // Если не найдено, пробуем найти любое изображение в статье
            const articleImg = document.querySelector('article img');
            if (articleImg) {
              return articleImg.src;
            }
            
            return null;
          });
          
          // If we couldn't get the original from the zoom page, try to get the high-res version
          if (!originalImageUrl) {
            // Try to get the zoom image URL directly
            originalImageUrl = await page.evaluate(() => {
              const link = document.querySelector('article a[href*="/zoom/"]');
              if (link) {
                const zoomPath = link.href;
                // Convert zoom URL to main image URL
                if (zoomPath.includes('/zoom/')) {
                  return zoomPath.replace('/zoom/', '/main/');
                }
                return zoomPath;
              }
              
              // Fallback to any image on the page
              const img = document.querySelector('article img');
              return img ? img.src : null;
            });
          }
          
          // If still no image found, use the original thumbnail
          if (!originalImageUrl) {
            originalImageUrl = item.imageUrl;
          }
          
          const ext = path.extname(new URL(originalImageUrl).pathname) || '.webp';
          const filename = sanitizeFilename(item.title) + ext;
          const filepath = path.join(categoryDir, filename);
          
          // Пропускаем если файл уже существует
          if (fs.existsSync(filepath)) {
            console.log(`Пропуск (уже существует): ${filename}`);
            allPages.push({
              id: sanitizeFilename(item.title),
              src: `/img/${category.name}/${filename}`,
              name: item.title,
              category: category.name,
            });
            continue;
          }
          
          await downloadImage(originalImageUrl, filepath);
          downloaded++;
          console.log(`Скачано [${downloaded}/${coloringPages.length}]: ${filename}`);
          
          // Добавляем в общий список
          allPages.push({
            id: sanitizeFilename(item.title),
            src: `/img/${category.name}/${filename}`,
            name: item.title,
            category: category.name,
          });
          
          // Небольшая задержка
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Возвращаемся к списку раскрасок
          await page.goto(category.url, { waitUntil: 'networkidle2', timeout: 60000 });
          
        } catch (err) {
          console.error(`Ошибка при скачивании ${item.title}:`, err.message);
          // Возвращаемся к списку раскрасок в случае ошибки
          try {
            await page.goto(category.url, { waitUntil: 'networkidle2', timeout: 60000 });
          } catch (navErr) {
            console.error(`Ошибка при возврате к списку:`, navErr.message);
          }
        }
      }
      
      await page.close();
      console.log(`\nКатегория ${category.name} завершена: ${downloaded} новых изображений\n`);
      console.log('='.repeat(60) + '\n');
    }
    
  } finally {
    await browser.close();
  }
  
  // Сохраняем результаты в JSON
  const outputPath = path.join(__dirname, '..', 'parsed-coloring-pages.json');
  fs.writeFileSync(outputPath, JSON.stringify(allPages, null, 2), 'utf-8');
  
  console.log(`\nГотово! Всего раскрасок: ${allPages.length}`);
  console.log(`Результаты сохранены в: ${outputPath}`);
  console.log('\nТеперь можно обновить constants.ts с новыми раскрасками.');
}

main().catch(console.error);