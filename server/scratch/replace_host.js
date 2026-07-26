const fs = require('fs');
const path = require('path');

const files = [
  'client/src/pages/MyOrders.jsx',
  'client/src/pages/Cart.jsx',
  'client/src/pages/Admin/ManageProducts.jsx',
  'client/src/pages/Admin/ManageCategories.jsx',
  'client/src/pages/Admin/BannerUpload.jsx',
  'client/src/components/Product/ProductCard.jsx',
  'client/src/components/Product/ImageZoom.jsx',
  'client/src/components/Home/HeroSlider.jsx'
];

const workspaceRoot = 'c:/Users/nikhi/OneDrive/Desktop/BLM';

files.forEach(relPath => {
  const fullPath = path.join(workspaceRoot, relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    const target = 'http://localhost:5000';
    const replacement = "${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}";
    if (content.includes(target)) {
      content = content.split(target).join(replacement);
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Successfully updated: ${relPath}`);
    } else {
      console.log(`No instances of target found in: ${relPath}`);
    }
  } else {
    console.log(`File not found: ${relPath}`);
  }
});
console.log('Host replacement test completed.');
