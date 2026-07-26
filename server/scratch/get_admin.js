const { getTableData } = require('../config/db');
const users = getTableData('users.xlsx');
const admins = users.filter(u => u.role === 'admin');
console.log('Admins found:', JSON.stringify(admins, null, 2));
