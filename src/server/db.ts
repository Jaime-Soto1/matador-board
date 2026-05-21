import mysql from 'mysql2';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Lakers0318',
  database: 'matadorboard',
})

export default pool;