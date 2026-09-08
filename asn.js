//get express js
const express = require('express')
const app = express()

const bodyParser = require('body-parser')

require('dotenv').config()

//======== for db connection
const db  = require('./db')

const cors = require('cors')

const http = require('http')

//===== for socket.io
const server_https = http.createServer( app);

//const { Server } = require('socket.io');

//===setting of socket.io
//const io = new Server(server_https);
const io = require("socket.io")( server_https, {
    cors: {
    //origin: "https://asnencinc-web.onrender.com",
      methods: ["GET", "POST","PUT","DELETE"],
      //allowedHeaders: ["vantaztic-header"],
      //credentials: true
    }
  })

const path = require('path')

//=======================
//important, tell express that the data returned is json
app.use(express.json()) 
app.use(express.urlencoded({extended:true}))

// to support URL-encoded bodies
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}))

//=== this is !important for CORS especially for different servers calling====//
//=== this is !important for CORS especially for different servers calling====//
//const allowedOrigins = ["https://app.vantaztic.com","https://app.vantaztic.com","https://osndp1.onrender.com","http://localhost:4001"]

const allowedOrigins = [
  'https://asianowapp.com',
  'https://www.asianowapp.com',
  'http://localhost:4000',      // adjust port to whatever your local frontend uses
  'http://127.0.0.1:5500',      // e.g. Live Server default port
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like Postman, curl, mobile apps)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS: ' + origin));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true
}))

app.options('*', cors()); // Enable pre-flight for all routes

// var allowCrossDomain = function(req, res, next) {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//     res.header('Access-Control-Allow-Headers', 'Content-Type,Origin, X-Requested-With, Content-Type, Accept, Authorization');
//     next();
// }

// app.use(allowCrossDomain);


//======== END NODEJS CORS SETTING
const getRandomPin = (chars, len)=>[...Array(len)].map(
    (i)=>chars[Math.floor(Math.random()*chars.length)]
 ).join('');
 
//======== END NODEJS CORS SETTING
app.get('/test',(req, res)=>{
    const apitest = getRandomPin('0123456789',6)
    console.log(apitest, ' API Ready to Serve')
    res.status(200).send(`${apitest} API ready to serve!`)
    //res.sendFile(path.join(__dirname , 'index.html'))
})

db.getConnection()
  .then(con => {
    console.log('ASIANOW SPX GROUP DATABASE CONNECTED!');
    con.release();
  })
  .catch(err => {
    console.error('DB connection failed:', err);
  });


//===============Main Routes
const usersRouter = require('./routes/api');
const cookieParser = require('cookie-parser');
app.use('/', usersRouter);

app.use(cookieParser())

//===== socket.io connect
let listClient = []
let nLogged = 0
let xmsg
let userMode, userName

let connectedSockets = []


//listen socket.io
io.on('connection', (socket) => {

    if(socket.handshake.query.userName){
		const userNames = socket.handshake.query.userName
		const userNamex = JSON.parse(userNames)
		userName = userNamex.token
		
		userMode = userNamex.mode
		console.log('mode==', userMode)
				
		connectedSockets.push({
				socketId: socket.id,
				mode: userMode,
				userName
		})		
				
		nLogged++
				
		console.log('*** NEW ASIANOW  SOCKET.IO SERVICES STARTED ***\n', connectedSockets)	
		
		console.log(`NEW ASIANOW 12142K24 Connected ${nLogged}`)
		
		
	}//============eif

    socket.on('admin', (msg) => {
        io.emit('admin', msg)
    })

    socket.on('sales', (oMsg) => {
        io.emit('sales', oMsg)
    })

	//console.log('*** SOCKET.IO SERVICES STARTED ***')

    //nLogged++

    //preliminary logged info
    io.emit('logged',`User connected: ${nLogged }`)
    
    console.log(`user connected ${nLogged}`)
    /*
    console.log('=====CONNECTING IO SOCKET.IO=====')

    listClient.push({"id":socket.id })
    nLogged++

    //console.log('NUMBER OF LOGGED USERS : ', nLogged)
    io.emit('logged',`NUMBER OF USERS: ${nLogged }`)

    Object.keys(  listClient ).forEach(key => {
        console.log(`**${listClient[key].id} connected` )
    })
    */
    //if user disconnect
    socket.on('disconnect', (id) => {
		console.log('disconnecting....')
		
		
			nLogged--
		
            if(nLogged <= 0){
                nLogged = 0
            }
		//const togo = connectedSockets.find(o=>o.socketId === socket.id)
        
        const togo = connectedSockets.findIndex( x => x.socketId === socket.id)
        
        connectedSockets.splice(togo, 1 )

        console.log( connectedSockets)

        console.log(`AsiaNow User Connected ${nLogged}`)
        //io.emit('logged',`Zonked connected: ${nLogged }`)
    })


    
})//end io conn
//====== server listen to por

const port = process.env.PORT||10020

server_https.listen( port ,()=>{
    console.log(`ASIANOW ENTERPRISE INC. API -- listening to port ${port}`)
})
