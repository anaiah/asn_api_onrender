//get express js
const express = require('express')
const app = express()

const bodyParser = require('body-parser')

//======== for db connection
const { connectPg, closePg, connectDb, closeDb }  = require('./db')

connectPg() 
.then((pg)=>{
    console.log("====ASN.JS ASIANOW POSTGRESQL CONNECTION SUCCESS!====")
    closePg(pg);
})                        
.catch((error)=>{
    console.log("***ERROR, CAN'T CONNECT TO POSTGRESQL DB!****",error.code)
});  

connectDb()
.then((db)=>{
    console.log("====ASN.JS ASIANOW MYSQL CONNECTION SUCCESS!====")
    closeDb(db);
})                        
.catch((error)=>{
    console.log("***ERROR, ASN.JS CAN'T CONNECT TO MYSQL DB!****",error.code)
});  

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

const allowedOrigins = "*"
/*
app.use(function(req, res, next) {
    let origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin); // restrict it to the required domain
    }
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});
*/

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
}


app.use(allowCrossDomain);


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

//===local routing
/*
app.get('/',(req, res)=>{
    res.send('API ready to serve!')
    //res.sendFile(path.join(__dirname , 'index.html'))
})

app.get('/test',(req, res)=>{
    res.send(`Enuff with the test it's working fine!`)
    //res.sendFile(path.join(__dirname , 'index.html'))
})
*/

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

const port = process.env.PORT||10000

server_https.listen( port ,()=>{
    console.log(`ASIANOW ENTERPRISE INC. API -- listening to port ${port}`)
})
