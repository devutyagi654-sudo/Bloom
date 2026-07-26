const path = require('path');
const fs = require('fs');

// Mock req, res
const req = {
  files: [
    {
      filename: 'banner-test-123.jpg',
      path: path.join(__dirname, '../uploads/banners/banner-test-123.jpg'),
      originalname: 'banner-test-123.jpg'
    }
  ]
};

// Create a dummy file to satisfy any exists checks
const dummyPath = path.join(__dirname, '../uploads/banners/banner-test-123.jpg');
const dir = path.dirname(dummyPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}
fs.writeFileSync(dummyPath, 'dummy content');

const res = {
  status: function(code) {
    console.log('Status code set to:', code);
    return this;
  },
  json: function(data) {
    console.log('JSON response:', JSON.stringify(data, null, 2));
    return this;
  }
};

const { uploadBanner } = require('../controllers/bannerController');

uploadBanner(req, res)
  .then(() => {
    console.log('Test completed.');
    // Cleanup
    if (fs.existsSync(dummyPath)) {
      fs.unlinkSync(dummyPath);
    }
  })
  .catch(err => {
    console.error('Fatal error in controller:', err);
  });
