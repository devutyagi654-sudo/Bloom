const fs = require('fs');
const path = require('path');

const rootDir = 'c:/Users/nikhi/OneDrive/Desktop/BLM';

const files = [
  'client/src/pages/Shop.jsx',
  'client/src/pages/ProductDetail.jsx',
  'client/src/pages/MyOrders.jsx',
  'client/src/pages/Contact.jsx',
  'client/src/pages/Home.jsx',
  'client/src/pages/Checkout.jsx',
  'client/src/components/Home/FAQ.jsx',
  'client/src/components/Common/Navbar.jsx',
  'client/src/components/Common/Footer.jsx',
  'client/src/pages/Wishlist.jsx',
  'server/controllers/orderController.js',
  'server/server.js'
];

files.forEach(relPath => {
  const fullPath = path.join(rootDir, relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;

    // 1. Rename Branding text: remove spaces and lowercase
    content = content.split('Bloom Luxe Collection').join('bloomluxecollection');
    content = content.split('BLOOM LUXE COLLECTION').join('bloomluxecollection');

    // 2. Rename Category "Necklaces" to "Hamper" in code files
    if (relPath === 'client/src/components/Common/Navbar.jsx') {
      content = content.split("name: 'Necklaces'").join("name: 'Hamper'");
    }
    if (relPath === 'client/src/components/Common/Footer.jsx') {
      content = content.split('category=Necklaces').join('category=Hamper');
      content = content.split('Necklaces & Pendants').join('Hampers');
    }
    if (relPath === 'client/src/pages/Wishlist.jsx') {
      content = content.split('and necklaces').join('and hampers');
    }
    if (relPath === 'server/server.js') {
      // Update seeds in server.js
      content = content.split("name: 'Necklaces'").join("name: 'Hamper'");
      content = content.split("category: 'Necklaces'").join("category: 'Hamper'");
      content = content.split("p.category === 'Necklaces'").join("p.category === 'Hamper'");
      content = content.split("'Luxury pendants, gold chokers, and diamond chains.'").join("'Premium curated luxury hampers and customized gift sets.'");
    }

    if (content !== original) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Updated: ${relPath}`);
    } else {
      console.log(`No changes made to: ${relPath}`);
    }
  } else {
    console.log(`File not found: ${relPath}`);
  }
});
console.log('Branding and Category replacements complete.');
