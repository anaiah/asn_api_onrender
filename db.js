const mysql = require('mysql2'); //use promise based mysql2
const {Client} = require('pg');

let client


// Option A: optional .env (only if present) 
try { require('dotenv').config(); 
} catch (e) {

}


const config = { 
    host: process.env.DB_HOST,  // or srv696.hstgr.io
    user: process.env.DB_USER, 
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT), 
    waitForConnections: true, 
    connectionLimit: 200,
    queueLimit: 0, 
    multipleStatements: true, 
    connectTimeout: 10000, 
    enableKeepAlive: true, 
    charset: 'utf8mb4', 
    decimalNumbers: true

}; 

const pool = mysql.createPool(config).promise(); 

module.exports = {
     configMysql: config, 
     query: (sql, params) => pool.query(sql, params), 
     getConnection: () => pool.getConnection() 
};
