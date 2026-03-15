import fs from 'fs';
import path from 'path';

const srcDir = 'c:/Users/ajeer/Documents/Project Process Flow/src';

const walk = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
};

const files = walk(srcDir);
let modifiedCount = 0;

for (const file of files) {
    if (file.replace(/\\/g, '/').endsWith('lib/prisma.ts')) continue; // Skip the new file we just made
    
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Check if it creates a new PrismaClient
    if (content.includes('new PrismaClient()')) {
        // Remove the old import
        content = content.replace(/import\s+\{\s*PrismaClient\s*\}\s+from\s+['"]@prisma\/client['"];?\s*?\n/g, '');
        // Remove const prisma = new PrismaClient();
        content = content.replace(/const\s+prisma\s*=\s*new\s+PrismaClient\(\s*\);?\s*?\n/g, '');

        // Now, we need to inject the import for our new prisma client.
        const importStatement = `import prisma from '@/app/lib/prisma';\n`;
        
        // Find the block of imports to append to
        const lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
            const endOfLine = content.indexOf('\n', lastImportIndex);
            content = content.slice(0, endOfLine + 1) + importStatement + content.slice(endOfLine + 1);
        } else {
            // No imports, just put at the top (after 'use server' if present)
            if (content.startsWith("'use server'") || content.startsWith('"use server"')) {
                const eol = content.indexOf('\n') + 1;
                content = content.slice(0, eol) + importStatement + content.slice(eol);
            } else {
                content = importStatement + content;
            }
        }

        content = content.replace(/^\s*$(?:\r\n?|\n)/gm, '\n'); // Remove extra blank lines
        
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
        console.log('Updated: ' + file);
    }
}

console.log('Total files updated: ' + modifiedCount);
