const mongoose = require('mongoose');

const uri = 'mongodb+srv://devutyagi654_db_user:iS7tBEWnM6ybsb2J@cluster0.spzntn1.mongodb.net/?retryWrites=true&w=majority';

async function test() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('Connected!');

    const DataRowSchema = new mongoose.Schema({
      tableName: { type: String, required: true },
      rowId: { type: String, required: true },
      data: { type: mongoose.Schema.Types.Mixed, default: {} }
    });
    const DataRow = mongoose.model('DataRow', DataRowSchema);

    console.log('Querying all users.xlsx documents...');
    const users = await DataRow.find({ tableName: 'users.xlsx' }).lean();
    console.log('Total users in MongoDB:', users.length);

    users.forEach(r => {
      console.log(`ID: ${r.rowId} | Name: ${r.data.fullName} | Email: ${r.data.email} | PasswordHash: ${r.data.password} | Role: ${r.data.role}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

test();
