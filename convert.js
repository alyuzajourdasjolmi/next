const fs = require('fs');
let html = fs.readFileSync('scratch-body.txt', 'utf8');

// Convert class to className
html = html.replace(/class=/g, 'className=');

// Convert for to htmlFor
html = html.replace(/for=/g, 'htmlFor=');

// Convert SVG attributes
html = html.replace(/stroke-width=/g, 'strokeWidth=');
html = html.replace(/stroke-linecap=/g, 'strokeLinecap=');
html = html.replace(/stroke-linejoin=/g, 'strokeLinejoin=');
html = html.replace(/viewbox=/gi, 'viewBox=');

// Convert styles
html = html.replace(/style=\"([^\"]+)\"/g, (match, styleString) => {
  const styles = styleString.split(';').filter(s => s.trim().length > 0).reduce((acc, style) => {
    const [key, value] = style.split(':').map(s => s.trim());
    if(!key || !value) return acc;
    const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
    acc[camelKey] = value;
    return acc;
  }, {});
  return 'style={' + JSON.stringify(styles) + '}';
});

// Remove onclick, onsubmit, etc. as we will attach them in React
html = html.replace(/onclick=\"[^\"]*\"/gi, '');
html = html.replace(/onsubmit=\"[^\"]*\"/gi, '');

// Self-closing tags
html = html.replace(/<img([^>]*[^\/])>/g, '<img$1 />');
html = html.replace(/<input([^>]*[^\/])>/g, '<input$1 />');
html = html.replace(/<hr([^>]*[^\/])>/g, '<hr$1 />');
html = html.replace(/<br([^>]*[^\/])>/g, '<br$1 />');
html = html.replace(/<source([^>]*[^\/])>/g, '<source$1 />');

// Clean up attributes
html = html.replace(/allowfullscreen/g, 'allowFullScreen');

// Convert HTML comments to JSX comments
html = html.replace(/<!--(.*?)-->/g, '{/* $1 */}');

fs.writeFileSync('scratch-jsx.txt', html);
