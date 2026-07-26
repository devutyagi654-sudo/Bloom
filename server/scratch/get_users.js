const { getTableData } = require('../config/db');
const users = getTableData('users.xlsx');
console.log('All Users:', JSON.stringify(users.map(u => ({ id: u.id, email: u.email, role: u.role })), null, 2));
