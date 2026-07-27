const fs = require('fs');
const path = require('path');

const rootDir = 'c:/Users/nikhi/OneDrive/Desktop/BLM';

const replacements = [
  {
    file: 'client/src/pages/Shop.jsx',
    changes: [
      { from: 'The BLC Collection', to: 'The Bloom Luxe Collection' }
    ]
  },
  {
    file: 'client/src/pages/ProductDetail.jsx',
    changes: [
      { from: 'sophisticated styling characteristics of BLC.', to: 'sophisticated styling characteristics of Bloom Luxe Collection.' }
    ]
  },
  {
    file: 'client/src/pages/MyOrders.jsx',
    changes: [
      { from: 'name: "BLC Atelier"', to: 'name: "Bloom Luxe Collection"' }
    ]
  },
  {
    file: 'client/src/pages/Contact.jsx',
    changes: [
      { from: 'submitted to the BLC Atelier Relations team', to: 'submitted to the Bloom Luxe Collection Relations team' },
      { from: 'BLC Luxury Group Ltd.', to: 'Bloom Luxe Collection Group Ltd.' }
    ]
  },
  {
    file: 'client/src/pages/Home.jsx',
    changes: [
      { from: 'Welcome to the BLC Atelier Club', to: 'Welcome to the Bloom Luxe Collection Club' },
      { from: 'Every diamond at BLC is', to: 'Every diamond at Bloom Luxe Collection is' }
    ]
  },
  {
    file: 'client/src/pages/Checkout.jsx',
    changes: [
      { from: 'name: "BLC Atelier"', to: 'name: "Bloom Luxe Collection"' }
    ]
  },
  {
    file: 'client/src/components/Home/FAQ.jsx',
    changes: [
      { from: 'Why choose BLC luxury collection?', to: 'Why choose Bloom Luxe Collection?' },
      { from: 'At BLC, every single piece', to: 'At Bloom Luxe Collection, every single piece' }
    ]
  },
  {
    file: 'client/src/components/Common/Navbar.jsx',
    changes: [
      { from: 'BLC Showroom Locator', to: 'Bloom Luxe Collection Showroom Locator' }
    ]
  },
  {
    file: 'client/src/components/Common/Footer.jsx',
    changes: [
      { from: 'BLC Luxury Group Ltd.', to: 'Bloom Luxe Collection Group Ltd.' },
      { from: 'BLC Group. All rights reserved.', to: 'Bloom Luxe Collection. All rights reserved.' }
    ]
  },
  {
    file: 'server/controllers/orderController.js',
    changes: [
      { from: 'BLC Atelier - Order Placed', to: 'Bloom Luxe Collection - Order Placed' },
      { from: 'BLC Atelier - Order Confirmed', to: 'Bloom Luxe Collection - Order Confirmed' },
      { from: 'BLC Atelier - Order Processing', to: 'Bloom Luxe Collection - Order Processing' },
      { from: 'BLC Atelier - Ready to Ship', to: 'Bloom Luxe Collection - Ready to Ship' },
      { from: 'BLC Atelier - Order Shipped', to: 'Bloom Luxe Collection - Order Shipped' },
      { from: 'BLC Atelier - Out for Delivery', to: 'Bloom Luxe Collection - Out for Delivery' },
      { from: 'BLC Atelier - Order Delivered', to: 'Bloom Luxe Collection - Order Delivered' },
      { from: 'BLC Atelier - Order Cancelled', to: 'Bloom Luxe Collection - Order Cancelled' },
      { from: 'BLC Atelier - Return Requested', to: 'Bloom Luxe Collection - Return Requested' },
      { from: 'BLC Atelier - Order Returned', to: 'Bloom Luxe Collection - Order Returned' },
      { from: 'BLC Atelier - Refund Completed', to: 'Bloom Luxe Collection - Refund Completed' },
      { from: 'BLC Atelier - Payment Failed', to: 'Bloom Luxe Collection - Payment Failed' },
      { from: 'BLC Atelier - Status Update', to: 'Bloom Luxe Collection - Status Update' },
      { from: 'Your BLC Atelier order', to: 'Your Bloom Luxe Collection order' },
      { from: '© 2026 BLC Atelier Luxury E-Commerce.', to: '© 2026 Bloom Luxe Collection.' },
      { from: '"BLC Atelier" <', to: '"Bloom Luxe Collection" <' },
      { from: 'text(\'B L C   A T E L I E R\'', to: 'text(\'BLOOM LUXE COLLECTION\'' },
      { from: 'fontSize(26).fillColor(\'#2e1407\').text(\'BLOOM LUXE COLLECTION\'', to: 'fontSize(22).fillColor(\'#2e1407\').text(\'BLOOM LUXE COLLECTION\'' },
      { from: '07BLCATELIER2026M1Z2', to: '07BLOOM2026M1Z2' },
      { from: 'BLCAP2026M', to: 'BLOOMPAN2026M' },
      { from: 'Thank you for shopping at BLC Atelier.', to: 'Thank you for shopping at Bloom Luxe Collection.' }
    ]
  }
];

replacements.forEach(entry => {
  const fullPath = path.join(rootDir, entry.file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;
    entry.changes.forEach(change => {
      content = content.split(change.from).join(change.to);
    });
    if (content !== original) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Successfully updated: ${entry.file}`);
    } else {
      console.log(`No changes made to: ${entry.file}`);
    }
  } else {
    console.log(`File not found: ${entry.file}`);
  }
});
console.log('BLC Text replacements completed.');
