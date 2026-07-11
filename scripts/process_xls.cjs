const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '../public/xls');
const outputFile = path.join(__dirname, '../public/attendance_data.json');

const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.XLS'));

const finalData = [];

// Helper to parse time strings like "10:06" to minutes for comparison
function timeToMinutes(tStr) {
  if (!tStr) return null;
  const parts = tStr.trim().split(':');
  if (parts.length !== 2) return null;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

for (const file of files) {
  // Extract YYYY_MM from "YYYY_MM.XLS"
  const match = file.match(/^(\d{4})_(\d{2})\.XLS$/i);
  if (!match) continue;
  
  const year = match[1];
  const month = match[2];

  const filePath = path.join(inputDir, file);
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    
    let currentEmployee = null;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !Array.isArray(row)) continue;

      // Detect employee block start
      // Look for "Name:Usman" in any cell of the row
      for (const cell of row) {
        if (typeof cell === 'string' && cell.startsWith('Name:')) {
          currentEmployee = cell.replace('Name:', '').trim();
          break;
        }
      }

      // Check if it's a date row. A date row starts with something like "01.01" or "02.15"
      // Wait, in the ZKTeco file, it was `01.01` (MM.DD). We just need it to match `^\d{2}\.\d{2}$`
      const isDateCell = (val) => typeof val === 'string' && /^\d{2}\.\d{2}$/.test(val.trim());

      if (currentEmployee) {
        // Parse left block
        if (isDateCell(row[0])) {
          const dayMatch = row[0].trim().split('.')[1]; // get the DD part
          const fullDate = `${year}-${month}-${dayMatch}`;
          
          let ins = [row[2], row[4], row[6]].map(v => typeof v === 'string' ? v.trim() : '').filter(v => v);
          let outs = [row[3], row[5], row[7]].map(v => typeof v === 'string' ? v.trim() : '').filter(v => v);
          
          if (ins.length > 0 || outs.length > 0) {
            // Find earliest IN and latest OUT
            ins.sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
            outs.sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
            
            finalData.push({
              Name: currentEmployee,
              Date: fullDate,
              InTime: ins.length > 0 ? ins[0] : null,
              OutTime: outs.length > 0 ? outs[outs.length - 1] : null,
              WeekStart: null // Will calculate on frontend or here
            });
          }
        }
        
        // Parse right block
        if (isDateCell(row[8])) {
          const dayMatch = row[8].trim().split('.')[1];
          const fullDate = `${year}-${month}-${dayMatch}`;
          
          let ins = [row[10], row[12], row[14]].map(v => typeof v === 'string' ? v.trim() : '').filter(v => v);
          let outs = [row[11], row[13], row[15]].map(v => typeof v === 'string' ? v.trim() : '').filter(v => v);
          
          if (ins.length > 0 || outs.length > 0) {
            ins.sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
            outs.sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
            
            finalData.push({
              Name: currentEmployee,
              Date: fullDate,
              InTime: ins.length > 0 ? ins[0] : null,
              OutTime: outs.length > 0 ? outs[outs.length - 1] : null,
              WeekStart: null
            });
          }
        }
      }
    }
  } catch (err) {
    console.error(`Failed to process ${file}:`, err.message);
  }
}

// Write to JSON
fs.writeFileSync(outputFile, JSON.stringify(finalData, null, 2));
console.log(`Successfully processed ${files.length} files and wrote ${finalData.length} records to attendance_data.json`);
