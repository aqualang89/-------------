const xlsx = require('xlsx');

// Показать структуру 111.xls (остатки)
console.log('=== 111.xls structure ===');
const wb1 = xlsx.readFile('docs/111.xls');
const rows1 = xlsx.utils.sheet_to_json(wb1.Sheets[wb1.SheetNames[0]], { header: 1 });

// Покажем строки где меняются категории
let prevIndent = 0;
rows1.slice(3, 40).forEach((row, i) => {
  const name = row[0] || '';
  const qty = row[3];
  if (name && (String(name).includes('/') || !qty)) {
    console.log(`Row ${i+3}: [CATEGORY] "${name}"`);
  } else if (name && qty) {
    console.log(`Row ${i+3}: [PRODUCT] "${name}" | qty=${qty}`);
  }
});

console.log('\n=== 222.xls structure ===');
const wb2 = xlsx.readFile('docs/222.xls');
const rows2 = xlsx.utils.sheet_to_json(wb2.Sheets[wb2.SheetNames[0]], { header: 1 });

rows2.slice(6, 25).forEach((row, i) => {
  const name = row[0] || '';
  const qty = row[5];
  const total = row[6];
  if (name) {
    console.log(`Row ${i+6}: "${name}" | qty=${qty} | total=${total}`);
  }
});
