const mongoose = require('mongoose');

const uri = 'mongodb+srv://devutyagi654_db_user:iS7tBEWnM6ybsb2J@cluster0.spzntn1.mongodb.net/?retryWrites=true&w=majority';

async function test() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    const client = await mongoose.connect(uri);
    console.log('Connected!');

    const adminDb = mongoose.connection.db.admin();
    const dbsList = await adminDb.listDatabases();
    console.log('\n--- DATABASES ---');
    dbsList.databases.forEach(db => {
      console.log(`- ${db.name} (${db.sizeOnDisk} bytes)`);
    });

    for (const dbInfo of dbsList.databases) {
      const dbName = dbInfo.name;
      if (dbName === 'admin' || dbName === 'local') continue;
      
      const dbConnection = mongoose.connection.useDb(dbName);
      const collections = await dbConnection.db.listCollections().toArray();
      console.log(`\nCollections in ${dbName}:`);
      collections.forEach(c => console.log(`  - ${c.name}`));
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

test();
