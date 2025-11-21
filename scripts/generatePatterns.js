import fs from 'fs';
import path from 'path';

function generateSvgPattern(name, svgContent) {
    return {
        name: name,
        svg_content: svgContent
    };
}

function generatePatterns() {
    const patternsData = [];

    // Circle
    patternsData.push(generateSvgPattern('Circle', `<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10" fill="none" stroke="black" stroke-width="2"/></svg>`));

    // Square
    patternsData.push(generateSvgPattern('Square', `<svg viewBox="0 0 24 24" width="24" height="24"><rect x="4" y="4" width="16" height="16" fill="none" stroke="black" stroke-width="2"/></svg>`));

    // Star
    patternsData.push(generateSvgPattern('Star', `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="none" stroke="black" stroke-width="2"/></svg>`));

    // Triangle
    patternsData.push(generateSvgPattern('Triangle', `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 2L2 22H22L12 2Z" fill="none" stroke="black" stroke-width="2"/></svg>`));

    // Heart
    patternsData.push(generateSvgPattern('Heart', `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z" fill="none" stroke="black" stroke-width="2"/></svg>`));

    // Cloud
    patternsData.push(generateSvgPattern('Cloud', `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.52 0 11.01 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.33 21.92 10.22 19.35 10.04Z" fill="none" stroke="black" stroke-width="2"/></svg>`));

    // Moon
    patternsData.push(generateSvgPattern('Moon', `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 3C6.48 3 2 7.48 2 13C2 18.52 6.48 23 12 23C16.31 23 19.95 20.31 21.5 16.5C18.6 15.5 15.82 13.91 14.07 11.83C12.32 9.75 11.33 7.07 11.33 3.99C11.33 3.66 11.33 3.33 11.33 3H12Z" fill="none" stroke="black" stroke-width="2"/></svg>`));

    // Lightning
    patternsData.push(generateSvgPattern('Lightning', `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M11 15.5H7.5L13 1L10 8.5H14.5L9 22L11 15.5Z" fill="none" stroke="black" stroke-width="2"/></svg>`));

    const outputDir = path.join(__dirname, '..', 'generated_patterns_svg');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const jsonOutputPath = path.join(outputDir, 'basic_patterns.json');
    fs.writeFileSync(jsonOutputPath, JSON.stringify(patternsData, null, 2));

    console.log(`Базовые SVG-узоры сохранены в: ${jsonOutputPath}`);
}

generatePatterns();