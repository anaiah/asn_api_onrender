const mysql = require('mysql2/promise'); //use promise based mysql2
const {Client} = require('pg');

 
//const uri = process.env.DB_URL+process.env.DB_NAME

module.exports={

    connectDb :()=>{
        return new Promise((resolve,reject)=>{
            const con = mysql.createConnection( {
                host: process.env.MYSQL_HOST,
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PWD,
                database: process.env.MYSQL_DB,
                multipleStatements: true
            });
            con.connect((err) => {
                if(err){
                    reject(err);
                }
                    resolve(con);
            });
        
        })//END RETURN ,
    },
    closeDb : (con)=> {
        con.destroy();
    },

    connectPg :()=>{
        return new Promise((resolve,reject)=>{
            const dbconfig ={
                //host:"dpg-cnjiar2cn0vc73c211h0-a.singapore-postgres.render.com",
                //host:"postgresql://osndproot03052k24:Sa2tCwB3apVozuuzqcQiyF2xFqILFqgX@dpg-cnjiar2cn0vc73c211h0-a.singapore-postgres.render.com:5432/osndp?ssl=true",
                //user:"osndproot03052k24",
                //password:"Sa2tCwB3apVozuuzqcQiyF2xFqILFqgX",
                //database:"osndp",
                //render.com
                //host: "dpg-cqa9lciju9rs73bfl3u0-a.singapore-postgres.render.com",
                //user:"zonked_thesisgrp",
                //password:"3oHb9CTV1WqT91u1XJPOXeNnLEEVFR85",
                //database:"zonked",/zonked
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


