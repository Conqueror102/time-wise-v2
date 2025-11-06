const fs = require('fs');
const path = require('path');

function addDynamicConfig(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already has dynamic config
  if (content.includes("export const dynamic")) {
    console.log(`✓ Skipped (already has config): ${filePath}`);
    return;
  }
  
  // Find the first export async function
  const exportMatch = content.match(/export async function (GET|POST|PUT|DELETE|PATCH)/);
  
  if (!exportMatch) {
    console.log(`⚠ Skipped (no export function): ${filePath}`);
    return;
  }
  
  // Add dynamic config before the first export function
  const insertPosition = content.indexOf(exportMatch[0]);
  const before = content.substring(0, insertPosition);
  const after = content.substring(insertPosition);
  
  const newContent = before + "export const dynamic = 'force-dynamic'\n\n" + after;
  
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`✓ Fixed: ${filePath}`);
}

function findRouteFiles(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findRouteFiles(filePath);
    } else if (file === 'route.ts') {
      addDynamicConfig(filePath);
    }
  });
}

console.log('🔧 Adding dynamic config to all API routes...\n');
findRouteFiles('app/api');
console.log('\n✅ Done!');
