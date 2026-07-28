const mongoose = require('mongoose');

const uri = 'mongodb+srv://devutyagi654_db_user:iS7tBEWnM6ybsb2J@cluster0.spzntn1.mongodb.net/bloom_db?retryWrites=true&w=majority';

async function test() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('Connected successfully!');
    
    // Create a temporary model
    const TempSchema = new mongoose.Schema({ name: String }, { strict: false });
    const TempModel = mongoose.model('TempCollection', TempSchema);
    
    console.log('Writing test document...');
    const doc = await TempModel.create({ name: 'Antigravity Test', timestamp: new Date() });
    console.log('Document created:', doc);
    
    console.log('Querying documents...');
    const found = await TempModel.find({ name: 'Antigravity Test' });
    console.log('Documents found:', found.length);
    
    console.log('Cleaning up...');
    await TempModel.deleteMany({ name: 'Antigravity Test' });
    console.log('Cleanup complete!');
    
    await mongoose.disconnect();
    console.log('Disconnected!');
  } catch (err) {
    console.error('Connection failed:', err);
  }
}

test();
