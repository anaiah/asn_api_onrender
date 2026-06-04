const mysql = require('mysql2'); //use promise based mysql2
const {Client} = require('pg');

let client

// FIXED: Added Keep-Alive pings and reduced limit so the database doesn't choke
const pool = mysql.createPool({
    host: '153.92.15.50',
    user: 'u899193124_asianow',
    password:'G125c3@M312c4',
    database: 'u899193124_asianow',
    port:3306,
    waitForConnections: true, 
    connectionLimit: 50,       // <-- Reduced from 200 to protect server slots
    queueLimit: 0,      
    multipleStatements: true,
    enableKeepAlive: true,     // <-- CRITICAL: Prevents ECONNRESET by pinging server
    keepAliveInitialDelay: 10000 // Pings every 10 seconds
});

// Promisify for async/await
const poolPromise = pool.promise();

module.exports={

    query: (sql, params) => poolPromise.query(sql, params),
 
    // optionally, add a method to get a connection if needed:
    getConnection: () => poolPromise.getConnection(),

    // FIXED: Now borrows a healthy connection from the pool safely instead of spawning an unmanaged one
    connectDb: async () => {
        try {
            const connection = await poolPromise.getConnection();
            return connection;
        } catch (err) {
            throw err;
        }
    },
    
    // FIXED: Releases the pool connection back into the cluster instead of destroying the track
    closeDb: (con) => {
        if (con && typeof con.release === 'function') {
            con.release(); // Releases back to pool gracefully
        } else if (con && typeof con.destroy === 'function') {
            con.destroy();
        }
    },

    connectPg :()=>{
        return new Promise((resolve,reject)=>{
            const dbconfig ={
                host: "ep-still-star-a5s7o7wh-pooler.us-east-2.aws.neon.tech",
                user:"neondb_owner",
                password:"npg_s7LehAjy9Ipv",
                database:"asianow",
                port:5432,
                ssl:{
                    rejectUnauthorized:false,
                },
                min: 4,
                max: 10,
                idleTimeoutMillis: 1000,
                multipleStatements:true
            }
           
            const client = new Client(dbconfig);
            client.connect((err) => {
                if(err){
                    reject(err);
                }
                    resolve(client);
            });
       
           
        })//END RETURN
    },
    closePg: (client)=> {
        client.end();
    },
}//END EXPORT
