import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imgDir = path.join(__dirname, '../img');
const constantsFile = path.join(__dirname, '../constants.ts');

const imageFiles = fs.readdirSync(imgDir).filter(file => /\.(jpe?g|png|gif)$/i.test(file));

const galleryImages = imageFiles.map((file) => {
    const name = path.basename(file, path.extname(file));
    // Windows paths use backslashes, but web paths need forward slashes.
    const webPath = path.join('img', file).replace(/\\/g, '/');
    return {
        id: name.toLowerCase().replace(/\s/g, '-'),
        src: `/${webPath}`,
        name: name,
        icon: 'image' // Default icon
    };
});

let constantsContent = fs.readFileSync(constantsFile, 'utf-8');

// This regex finds the GALLERY_IMAGES export and replaces its value.
// It handles single-line and multi-line array definitions.
const newContent = constantsContent.replace(
    /export const GALLERY_IMAGES = \[[^\]]*\];/s,
    `export const GALLERY_IMAGES = ${JSON.stringify(galleryImages, null, 4)};`
);

fs.writeFileSync(constantsFile, newContent, 'utf-8');

console.log('Successfully updated GALLERY_IMAGES in constants.ts');