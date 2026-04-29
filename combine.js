const fs = require('fs');
const logic = fs.readFileSync('page_logic.tsx', 'utf8');
let jsx = fs.readFileSync('scratch-jsx.txt', 'utf8');

jsx = jsx.replace(/src=\"assets\/images\//g, 'src="/assets/images/');
jsx = jsx.replace(/class=/g, 'className=');
jsx = jsx.replace(/for=/g, 'htmlFor=');

fs.writeFileSync('app/page.tsx', logic + '\n' + jsx + '\n    </>\n  );\n}\n');
