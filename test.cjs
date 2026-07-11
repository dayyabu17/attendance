const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const dir = './public/xls';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.XLS'));

const fileMappings = [];

for (const file of files) {
  try {
    const filePath = path.join(dir, file);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    
    // Search for Date string
    let dateStr = null;
    for (let i = 0; i < 10; i++) {
      if (!data[i]) continue;
      for (const cell of data[i]) {
        if (typeof cell === 'string' && cell.startsWith('Date:')) {
          dateStr = cell;
          break;
        }
      }
      if (dateStr) break;
    }
    
    fileMappings.push({ file, dateStr });
  } catch (e) {
    fileMappings.push({ file, error: e.message });
  }
}

console.log(JSON.stringify(fileMappings, null, 2));
