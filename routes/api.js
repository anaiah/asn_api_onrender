/*

AUTHOR : CARLO DOMINGUEZ

multiple comment //// => IMPORTANT
*/
const express = require('express')

const Utils = require('./util')//== my func
//const QRPDF = require('./qrpdf')
const asnpdf = require('./asnpdf')//=== my own module

const cookieParser = require('cookie-parser')

const cors = require('cors')

const path = require('path')

const axios = require('axios')

const formdata = require('form-data')

// const jsftp = require("jsftp");

const fetcher = require('node-fetch')

const IP = require('ip')

const iprequest = require('request-ip')

const querystring = require("querystring")

const nodemailer = require("nodemailer")

const router = express.Router()

const fs = require('fs');

const PuppeteerHTMLPDF = require('puppeteer-html-pdf');

const pdf = require('html-pdf');//used for pdf.create

// const PassThrough = require('stream')
const hbar = require('handlebars');
const QRCode = require('qrcode')
const multer = require('multer')
const sharp = require('sharp')

const ftpclient = require('scp2')

const app = express()

app.use( cookieParser() )
const { connectPg, closePg, closeDb, connectDb}  = require('../db')

connectPg() 
.then((pg)=>{
    console.log("====api.js ASIANOW POSTGRESQL CONNECTION SUCCESS!====")
    closePg(pg);
})                        
.catch((error)=>{
    console.log("***ERROR, API.JS CAN'T CONNECT TO POSTGRESQL DB!****",error.code)
}); 

connectDb()
.then((db)=>{
    console.log("====API.JS ASIANOW MYSQL CONNECTION SUCCESS!====")
    closeDb(db);
})                        
.catch((error)=>{
    console.log("***ERROR, CAN'T CONNECT TO MYSQL DB!****",error.code)
});  
//=====CLAIMS UPLOAD
// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

const xlsx = require('xlsx');

const mysqls = require('mysql2/promise')

const dbconfig  ={
	host: 'srv1759.hstgr.io',
	user: 'u899193124_asianow',
	password: 'g12@c3M312c4',
	database: 'u899193124_asianow'
}

// Upload endpoint
router.post('/xlsclaims', upload.single('claims_upload_file'), async (req, res) => {
	
	console.log('==FIRING XLS CLAIMS===')
    try {
        // Read the file buffer
        const workbook = xlsx.read(req.file.buffer);
        
        // Assuming the data is in the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert the sheet to JSON
        const data = xlsx.utils.sheet_to_json(worksheet);
		
		//console.log('json value ', data)
		const insertPromises =[]
 
		
		const conn = await mysqls.createConnection(dbconfig);

			for( const record of data){
				//onst { batch_id,emp_id,full_name, track_number, claims_reason, hubs_location, amt } = record;
				const { batch_id,emp_id,full_name, track_number, claims_reason, category, hubs_location, batch_file, amt } = record ;
				const query = `INSERT INTO asn_claims (batch_id,emp_id,full_name, track_number, claims_reason, category, hubs_location, batch_file, amount) 
							VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
				
				insertPromises.push( await conn.execute( query , [batch_id,emp_id,full_name, track_number, claims_reason, category, hubs_location, batch_file, amt]))
				console.log(query,batch_id,emp_id,full_name, track_number, claims_reason, category, hubs_location, batch_file, amt)
			}
			await Promise.all(insertPromises)
			await conn.end()
		
			console.log('CLOSING STREAM.. EXCEL FILE UPLOADED SUCCESSFULLY!')
			return res.status(200).json({message:'Claims Excel File Upload Successfully!',status:true})

		
		
    } catch (error) {  //end try
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
		
});


//========login post
router.get('/loginpost/:uid/:pwd',async(req,res)=>{
    console.log('login=>',req.params.uid,req.params.pwd)
    
    connectDb()
    .then((db)=>{

		let sql =`SELECT a.id,a.full_name, 
			a.email, GROUP_CONCAT(distinct a.region) as region, 
			a.grp_id,a.pic 
			from asn_users a 
			WHERE a.email='${req.params.uid}' and a.pwd='${req.params.pwd}'` 
        
			console.log(`${sql}`)

        db.query( sql, (err,data) => { 

			console.log( data)
			//console.log(data.length)
            //console.log(sql)
			if ( data[0].full_name == null) {  //data = array 
				console.log('no rec')

				closeDb(db);//CLOSE connection
                //console.log("===MYSQL CONNECTON CLOSED SUCCESSFULLY===")

                return res.status(400).json({
					message: "No Matching Record!",
					voice:"No Matching Record!",
					found:false
				})  
				
				

            }else{  //=========== ON SUCCESS!!! ============

				//get ip address
				const ipaddress = IP.address()

				/*  ===TAKE OUT TEMP  IP ADDRESS FEB 2. 2024
				let ipaddress = iprequest.getClientIp(req)

				if (ipaddress.substring(0, 7) == "::ffff:") {
					ipaddress = ipaddress.substring(7)
				} 
				*/
                console.log('osndp render login data ',data[0])
				//set cookie-parser
				res.writeHead(200, {
						"Set-Cookie": `xfname=${data[0].full_name.toUpperCase()}; HttpOnly`,
						"Access-Control-Allow-Credentials": "true"
	  			})

			  res.write(JSON.stringify({
				email	: 	data[0].email,
				fname   :   data[0].full_name.toUpperCase(),
				message	: 	`Welcome to Asia Now Enterprise Incorporated System, ${data[0].full_name.toUpperCase()}! `,
				voice	: 	`Welcome to Asia Now Enterprise Incorporated System, ${data[0].full_name}! `,		
				grp_id	:	data[0].grp_id,
				pic 	: 	data[0].pic,
				ip_addy :   ipaddress,
				id      :   data[0].id,
				region  :   data[0].region,
				found:true
			}))

			res.send()
			  /*
				//res.cookie('fname', data[0].full_name.toUpperCase(), { maxAge: 60*1000, httpOnly: true});
				res.cookie('grp_id', data[0].grp_id, { maxAge: 60*1000,httpOnly: true});
				res.cookie('f_email',data[0].email, {maxAge: 60*1000,httpOnly: true});
				res.cookie('f_voice', `Welcome to Executive Optical, O S N D P System ${data[0].full_name}! `, {maxAge: 60*1000,httpOnly: true});
				res.cookie('f_pic',data[0].pic, {httpOnly: true});
				
				res.status(200).json({
					email	: 	data[0].email,
                    fname   :   data[0].full_name.toUpperCase(),
                    message	: 	`Welcome to EO-OSNDP ${data[0].full_name.toUpperCase()}! `,
					voice	: 	`Welcome to Executive Optical, O S N D P System ${data[0].full_name}! `,		
                    grp_id	:	data[0].grp_id,
					pic 	: 	data[0].pic,
					ip_addy :   ipaddress,
					found:true
                })
				*/
				//=============== CALL FUNCTION, call express method, call func, call router
				//return res.redirect(`/changepage/${data[0].grp_id}`)

                closeDb(db);//CLOSE connection
                //console.log("===MYSQL CONNECTON CLOSED SUCCESSFULLY===")
                
            }//EIF
           
	   })//END QUERY 
       
    }).catch((error)=>{
        res.status(500).json({error:'No Fetch Docs'})
    }) 
})//== end loginpost



//=== end html routes

//======================ADD NEW EMPLOYEE ====================
// Create a new employee (CREATE)
let myfile

router.post('/newemppost/', async (req, res) => {
    //const { employeeId, full_name, email, phone, birth_date, hire_date, job_title, department, employment_status, address } = req.body;

	myfile = req.body.employeeId
	console.log('data is', req.body.fullName.toUpperCase(), req.body.birthDate , req.body.jobTitle)

	
   	connectDb()
    .then((db)=>{

	//$sql = `INSERT INTO asn_employees (emp_id, full_name, email, phone, birth_date, hire_date, job_title, department, employment_status, address) 
	//VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`
	
			
		$sql = `INSERT INTO asn_employees (emp_id, full_name, email, phone, birth_date, hire_date, job_title, department, employment_status, address) 
		VALUES (?,?,?,?,?,?,?,?,?,?) `
			
		db.query( $sql,
			[	req.body.employeeId, 
				req.body.fullName.toUpperCase(), 
				req.body.email, 
				req.body.phone, 
				req.body.birthDate, 
				req.body.hireDate, 
				req.body.jobTitle,
				req.body.department, 
				req.body.employmentStatus, 
				req.body.address ],
			(error,result)=>{
				console.log('inserting..',result.rowCount)

				//results[0]
				res.json({
					message: "Employee Number " + myfile +" Added Successfully!",
					voice:"Employee Number " + myfile +" Added Successfully!",
					approve_voice:`You have another item added in Inventory`,
					status:true
				})
	
				closeDb(db);//CLOSE connection
			
		})
		
    }).catch((error)=>{
        res.status(500).json({error:'Error'})
    }) 
});

//==============busboy, scp2  for file uploading============
const Busboy = require('busboy')

//================ post image ==================//
router.post('/postimage',   async (req, res) => {
	console.log('===FIRING /postimage===')

	const busboy = Busboy({ headers: req.headers });
		
	busboy.on('file', function(fieldname, file, filename) {

		console.log( 'firing busboy on file() ==', filename, fieldname, path.extname( filename.filename) )
		
		let extname

		if( path.extname(filename.filename) ===".jpg" ||  path.extname(filename.filename) ==='.jpeg' ||  path.extname(filename.filename) ==='.png' ||  path.extname(filename.filename) ==='.gif'){
			extname = ".jpg"
		}else{
			extname = path.extname(filename.filename)
		} 
		
		// fieldname is 'fileUpload'
		var fstream = fs.createWriteStream('ASN-'+ filename + extname);
		
		file.pipe(fstream);
			
		console.log( 'Writing Stream... ', fstream.path )

		file.resume()

		fstream.on('close', function () {
			console.log('Closing Stream, Trying to Up load...')

			console.log('Compacting file size.... ')

			sharp( fstream.path ).jpeg({ quality: 30 }).toFile('FINAL '+fstream.path)

			ftpclient.scp(fstream.path, {
				host: 'gator3142.hostgator.com'	, //--this is orig ->process.env.FTPHOST,
				//port: 3331, // defaults to 21
				username: 'vantazti', // this is orig-> process.env.FTPUSER, // defaults to "anonymous"
				password: `2Timothy@1:9_10`,
				path: 'public_html/vanz/dr'
			}, function(err) {
				console.log("File Uploaded!!!");
				
				//==delete file
				fs.unlink( fstream.path,()=>{
					console.log('Delete temp file ', fstream.path)

					res.status(200).send({ success: true });			
				})
				//=====use 301 for permanent redirect
				//res.status(301).redirect("https://vantaztic.com/app/admin.html")

			})//===end ftpclient
		})//====end fstream
	})//===end busboy on file 
	
	busboy.on('finish',()=>{
		console.log('busboy finish')
	}) //busboy on finish

	//write file
	req.pipe(busboy)
	
}) //==============end post image =============//



//==============busboy, scp2  for file uploading============

router.post('/uploadpdf',  async(req, res)=>{

	console.log('===FIRING uploadpdf()===')

	const busboy = Busboy({ headers: req.headers });
		
	busboy.on('file', function(fieldname, file, filename) {
		console.log( 'firing busboy on file() ==', mycookie,filename)

		// fieldname is 'fileUpload'
		var fstream = fs.createWriteStream(mycookie +'.pdf');
		
		file.pipe(fstream)
			
		console.log( 'Writing Stream... ', fstream.path )

		file.resume()

		fstream.on('close', function () {
			console.log('Closing Stream, Trying to Up load...')
			ftpclient.scp(fstream.path, {
				host: "gator3142.hostgator.com", //--this is orig ->process.env.FTPHOST,
				//port: 3331, // defaults to 21
				username: "vantazti", // this is orig-> process.env.FTPUSER, // defaults to "anonymous"
				password: "2Timothy@1:9_10",
				path: 'public_html/osndp/'
			}, function(err) {
				console.log("File Uploaded!!!");
				
				//==delete file
				fs.unlink( fstream.path,()=>{
					console.log('Delete temp file ', fstream.path)
					res.status(200).send({ success: true });
				})

			})
			
		}); 
	});
	
	busboy.on('finish',()=>{
		console.log('busboy.on.finish() DONE!==')
	}) //busboy on finish

	//write file
	req.pipe(busboy)
		
})//==end upload

const csvParser = require('csv-parser');

//=== FINAL FOR CLAIMS
router.post('/claims', async( req, res) => {
	console.log('===FIRING /postimage===')

	const busboy = Busboy({ headers: req.headers });
		
	busboy.on('file', function(fieldname, file, filename) {

		console.log( 'firing busboy on Excel file() ==', filename, fieldname, path.extname( filename.filename) )
		
		let extname

		if( path.extname(filename.filename) ===".csv"  ){
			extname = ".csv"
		}else{
			extname = path.extname(filename.filename)
		}

		const final_file =`ASN-${getRandomPin('0123456789',4)}.csv`
		
		// fieldname is 'fileUpload'
		var fstream = fs.createWriteStream( final_file );
		
		file.pipe(fstream);
			
		console.log( 'Writing Excel file Stream... ', fstream.path )

		file.resume()

		fstream.on('close', async function () {
			console.log('Closing Stream, Trying to Up load to POSTGRES...')
			
			const dbconfig  ={
                host: 'srv1759.hstgr.io',
                user: 'u899193124_asianow',
                password: 'g12@c3M312c4',
                database: 'u899193124_asianow'
            }
			const conn = await mysqls.createConnection(dbconfig);

			//console.log(conn)
			fs.createReadStream(fstream.path)
				.pipe(csvParser())
				.on('data', async(row)=>{
					//console.log('this is row',row)
					const { batch_id,emp_id,full_name, track_number, claims_reason, category, hubs_location, amt } = row ;
					const query = `INSERT INTO asn_claims (batch_id,emp_id,full_name, track_number, claims_reason, category, hubs_location, amount) 
								VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
					//console.log( query ,batch_id,emp_id,full_name)
					
					await conn.execute( query , [batch_id,emp_id,full_name, track_number, claims_reason, category, hubs_location, amt])
					//await conn.end()							
				})
				.on('end', async()=>{
					fs.unlinkSync(fstream.path); // Remove the file after processing
					
					await conn.end()

			 		console.log('CLOSING STREAM.. CSV UPLOADED SUCCESSFULLY!')
			 		return res.status(200).json({message:'Claims Upload Successfully!',status:true})
				})
				.on('error',(err)=>{
					console.log('Error processing csv')
					res.status(500).send('Error processing csv')
				})

		})//====end fstream
	})//===end busboy on file 
	
	busboy.on('finish',()=>{
		console.log('busboy finish')
	}) //busboy on finish

	//write file
	req.pipe(busboy)
	
})

//===========BULK INSERT CSV================
router.get('/copy-data', async (req, res) => {
	try {
		// You need to have a CSV file available to copy from
		const filePath = '/path/to/your/file.csv';
		
		// You can read the file and use COPY FROM STDIN method
		const client = await pool.connect();
		const query = `COPY your_table FROM STDIN WITH (FORMAT csv)`;

		const stream = client.query(copyFrom(query));
		const fileStream = fs.createReadStream(filePath);

		fileStream.on('error', (error) => {
		console.error('File stream error:', error);
		res.status(500).send('Error reading the file');
		});

		stream.on('end', () => {
		client.release();
		res.status(200).send('Data copied successfully');
		});

		stream.on('error', (error) => {
		client.release();
		console.error('Database stream error:', error);
		res.status(500).send('Error copying data');
		});

		fileStream.pipe(stream);

	} catch (error) {
		console.error('Error in /copy-data:', error);
		res.status(500).send('Error processing request');
	}
});

//============END BULK INSERT CSV ===========

//=================function getting drnumber ======//
const drseq = () => {
	var today = new Date() 
	var dd = String(today.getDate()).padStart(2, '0')
	var mm = String(today.getMonth() + 1).padStart(2, '0') //January is 0!
	var yyyy = today.getFullYear()

	today = yyyy+ mm +dd

	const sqlu = "update dr_seq set sequence = sequence +1;"
	connectDb()
	.then((db)=>{
		db.query(sqlu , null ,(error,results) => {	
			//console.log('UPDATE DR SEQ', results)
		})
	})

	return today
}

///===== get update total claims
router.get('/claimsupdate/:eregion/:email', async (req,res)=>{

	if(req.params.eregion !== 'ALL'){
		sql = `select distinct( DATE_FORMAT(a.uploaded_at,'%M %d, %Y')) as xdate, 
		round(sum(a.amount)) as total,
		b.email 
		from asn_claims a
		join asn_spx_hubs b
		on a.hubs_location = b.hub
		group by a.uploaded_at,b.email,a.pdf_batch
		having b.email = '${req.params.email}' and (a.pdf_batch is null or a.pdf_batch = "")
		order by a.uploaded_at DESC limit 4;`
	}else{

		sql = `
		select distinct( DATE_FORMAT(a.uploaded_at,'%M %d, %Y')) as xdate, 
		format(sum(a.amount),2) as total
		from asn_claims a
		group by a.uploaded_at
		order by a.uploaded_at;
		`
		/*
		sql = `select distinct( DATE_FORMAT(a.uploaded_at,'%M %d, %Y')) as xdate, 
		round(sum(a.amount)) as total
		from asn_claims a
		join asn_spx_hubs b
		on a.hubs_location = b.hub
		group by a.uploaded_at,a.pdf_batch
		having a.pdf_batch is null or a.pdf_batch = ""
		order by a.uploaded_at DESC limit 4;`
		*/
	}
	
	console.log(sql)
	connectDb()
	.then((db)=>{
		db.query(`${sql}`,(error,results) => {	
			if ( results.length == 0) {   //data = array 
				console.log('no rec')
				closeDb(db);//CLOSE connection
		
				res.status(500).send('** No Record Yet! ***')
		
			}else{ 
				let xtable = '', xtotal = 0

				//iterate top 10
				xtable += `<ul>`
				for(let zkey in results){

					xtotal += parseFloat(results[zkey].total.replaceAll(',',''))
					//console.log(results[zkey].total.replaceAll(',',''))
					xtable+= `
					<li class="timeline-item d-flex position-relative overflow-hidden">
					<div class="timeline-time text-dark flex-shrink-0 text-end">${results[zkey].xdate}</div>
					<div class="timeline-badge-wrap d-flex flex-column align-items-center">
						<span class="timeline-badge border-2 border border-primary flex-shrink-0 my-8"></span>
						<span class="timeline-badge-border d-block flex-shrink-0"></span>
					</div>
					<div class="timeline-desc fs-3 text-dark mt-n1">Claims Update <p class='border border-success  text-primary align-right'>
						<b>P ${results[zkey].total}</b></p></div>
					</li>`
				}

				/*
				<div class="timeline-desc fs-3 text-dark mt-n1">Claims Update <p class='border border-success  text-primary align-right'>
						<b>P ${addCommas(parseFloat(results[zkey].total).toFixed(2))}</b></p></div>
					</li>*/

				xtable+=`</ul><input type='text' hidden id='gxtotal' name='gxtotal' value='${addCommas(parseFloat(xtotal).toFixed(2))}'>`

				closeDb(db);//CLOSE connection
			
				res.status(200).send(xtable)				
			
			}

		})
	}).catch((error)=>{
		res.status(500).json({error:'Error'})
	}) 

})

//==========top 10 
router.get('/gethub/:region/:email', async(req, res)=>{
	
	if(req.params.region !== 'ALL'){
		sql = `SELECT distinct(a.hubs_location) as hub, 
			sum( a.amount ) as total ,
			b.region as region,
			b.email
			from asn_claims a
			join asn_spx_hubs b
			on a.hubs_location = b.hub
			group by a.hubs_location,b.region,a.pdf_batch
			having b.email = '${req.params.email}' and (a.pdf_batch is null or a.pdf_batch = "")
			order by sum(a.amount) desc LIMIT 5`
	}else{
		sql = `SELECT distinct(a.hubs_location) as hub, 
		round(sum( a.amount )) as total ,
		 (select distinct x.region from asn_spx_hubs x where x.hub = a.hubs_location limit 1) as region
		from asn_claims a 
		where a.pdf_batch is null or a.pdf_batch = "" 
		group by a.hubs_location 
		order by sum(a.amount) desc LIMIT 5;`
	}
	
	//console.log(sql)
	console.log('Top 5 Hub processing...')
	connectDb()
	.then((db)=>{
		db.query(`${sql}`,(error,results) => {	
		
			if ( results.length == 0) {   //data = array 
				console.log('no rec')
				closeDb(db);//CLOSE connection
		
				res.status(500).send('** No Record Yet! ***')
		
			}else{ 
			
				let xtable = 
				
				`
				<h2>(${req.params.region.toUpperCase()})</h2>
				<div class="col-lg-8">
					<table class="table"> 
					<thead>
						<tr>
						<th>Region</th>
						<th>Hub Location</th>
						<th>Amount</th>
						</tr>
					</thead>
					<tbody>`

					//iterate top 10
					for(let zkey in results){
						xtable+= `<tr>
						<td>${results[zkey].region}</td>
						<td >${results[zkey].hub}</td>
						<td align='right'><b>${addCommas(parseFloat(results[zkey].total).toFixed(2))}</b></td>
						<tr>`

					}//endfor

					xtable+=	
					`</tbody>
					</table>
					</div>`

					closeDb(db);//CLOSE connection
		
					res.status(200).send(xtable)				
				
			}//eif
		
		})

	}).catch((error)=>{
		res.status(500).json({error:'Error'})
	}) 
})

//================= TOP 5 RIDER
router.get('/getrider/:eregion/:email', async(req, res)=>{

	if( req.params.eregion!=='ALL'){
		sql = `SELECT distinct( a.emp_id) as emp_id,
		(a.full_name) as rider, 
		a.hubs_location as hub, 
		b.email,
		sum( a.amount ) as total , 
		b.region as region
		from asn_claims a 
		join asn_spx_hubs b 
		on a.hubs_location = b.hub 
		group by a.emp_id, b.email,a.emp_id ,a.pdf_batch
		having b.email = '${req.params.email}' and (a.pdf_batch is null or a.pdf_batch = "")
		order by sum(a.amount) desc LIMIT 5;`
	}else{
		sql =`SELECT distinct(a.emp_id) as emp_id,
		(a.full_name) as rider,
		round(sum( a.amount )) as total,
        a.hubs_location as hub,
        (select distinct x.region from asn_spx_hubs x where x.hub = a.hubs_location limit 1) as region
		from asn_claims a 
        where  a.pdf_batch is null
		group by a.emp_id,a.pdf_batch
		order by sum(a.amount) desc, a.full_name LIMIT 5;`
	}

	
	
	console.log('Top 5 Rider processing...')
	
	connectDb()
	.then((db)=>{
		db.query(`${sql}`,(error,results) => {	
		
			if ( results.length == 0) {   //data = array 
				console.log('no rec')
				closeDb(db);//CLOSE connection
		
				res.status(500).send('** No Record Yet! ***')
		
			}else{ 
			
				let xtable = 
					`<div class="col-lg-8">
					<h2>(${req.params.eregion.toUpperCase()})</h2>
					<table class="table"> 
					<thead>
						<tr>
						<th>Rider</th>
						<th align=right>Amount</th>
						</tr>
					</thead>
					<tbody>`

					//iterate top 10
					for(let zkey in results){
						xtable+= `<tr>
						<td>
						${results[zkey].rider}<br>
						${results[zkey].emp_id}<br>
						( ${results[zkey].region}, ${results[zkey].hub} )<br> 
						</td>
						<td align='right' valign='bottom'><b>${addCommas(parseFloat(results[zkey].total).toFixed(2))}</b>&nbsp;&nbsp;&nbsp;&nbsp;</td>
						</tr>`

					}//endfor

					xtable+=	
					`</tbody>
					</table>
					</div>`

					closeDb(db);//CLOSE connection
		
					res.status(200).send(xtable)				
				
			}//eif
		
		})

	}).catch((error)=>{
		res.status(500).json({error:'Error'})
	}) 

})
//======= end top 10


router.get('/getfinance/:region/:email', async( req, res) =>{
	
	sql = `SELECT distinct(a.hubs_location) as hub, 
			sum( a.amount ) as total ,
			b.region as region,
			b.email
			from asn_claims a
			join asn_spx_hubs b
			on a.hubs_location = b.hub
			group by a.hubs_location,b.region
			having b.region = '${req.params.region}'
			`

	console.log(sql)
	console.log('LIST OF ATDS FOR CROSSCHEK...')
	connectDb()
	.then((db)=>{
		db.query(`${sql}`,(error,results) => {	
		
			if ( results.length == 0) {   //data = array 
				console.log('no rec')
				closeDb(db);//CLOSE connection
		
				res.status(500).send('** No Record Yet! ***')
		
			}else{ 
			
				let xtable = 
				
				`
				<h2>(${req.params.region.toUpperCase()})</h2>
				<div class="col-lg-8">
						<table class="table"> 
					<thead>
						<tr>
						<th>Region</th>
						<th>Hub Location</th>
						<th>Amount</th>
						</tr>
					</thead>
					<tbody>`

					//iterate top 10
					for(let zkey in results){
						xtable+= `<tr>
						<td>${results[zkey].region}</td>
						<td >${results[zkey].hub}</td>
						<td align='right'><b>${addCommas(parseFloat(results[zkey].total).toFixed(2))}</b></td>
						<tr>`

					}//endfor

					xtable+=	
					`</tbody>
					</table>
					</div>`

					closeDb(db);//CLOSE connection
		
					res.status(200).send(xtable)				
				
			}//eif
		
		})

	}).catch((error)=>{
		res.status(500).json({error:'Error'})
	}) 
})

//search by id or name
router.get('/getrecord/:enum/:ename/:region/:email', async(req, res)=>{
	let sql, sqlz = ""

	if(req.params.region=="2"){
		sqlz = `, (select distinct x.email from asn_spx_hubs x where x.email = '${req.params.email}' limit 1) as email`
	}else{

	}

	if ( req.params.ename!=="blank" &&  req.params.enum!== "blank"){
		sql = 
		`SELECT distinct(a.full_name) as rider, 
		a.hubs_location as hub, 
		b.email, 
		a.emp_id,
		sum( a.amount ) as total , 
		a.category,
		b.region as region ,
		a.pdf_batch,
		a.batch_file
		from asn_claims a 
		join asn_spx_hubs b 
		on a.hubs_location = b.hub 
		group by a.full_name, a.email, a.emp_id  
		having ( a.emp_id like '%${req.params.enum}%' or upper(a.full_name) like '%${req.params.ename.toUpperCase()}%')
		${sqlz}
		order by a.full_name desc LIMIT 10;`	
	
 	}else if( req.params.enum!== "blank"  &&  req.params.ename == "blank"){

		sql = 
		`SELECT distinct(a.emp_id) as emp_id,
		(a.full_name) as rider,
		round(sum( a.amount )) as total,
        a.hubs_location as hub,
		a.batch_file,
		a.pdf_batch,
        (select distinct x.region from asn_spx_hubs x where x.hub = a.hubs_location limit 1) as region
		${sqlz}
		from asn_claims a 
        where  a.emp_id = '${req.params.enum}' 
		group by a.emp_id,a.pdf_batch
		order by sum(a.amount) desc, a.full_name;`	
		
		
	}else if ( req.params.ename!=="blank"  &&  req.params.enum == "blank"){
		sql = `SELECT distinct(a.emp_id) as emp_id,
		(a.full_name) as rider,
		round(sum( a.amount )) as total,
        a.hubs_location as hub,
		a.batch_file,
		a.pdf_batch,
        (select distinct x.region from asn_spx_hubs x where x.hub = a.hubs_location limit 1) as region
		${sqlz}
		from asn_claims a 
        where  upper(a.full_name) like '%${req.params.ename.toUpperCase()}%' 
		group by a.emp_id,a.pdf_batch
		order by sum(a.amount) desc, a.full_name LIMIT 1;`	
	}//eif

	console.log( 'Search Claims processing...')
	console.log(sql)
	
	connectDb()
	.then((db)=>{
		db.query(`${sql}`,(error,results) => {	
		     console.log( results)
			if ( ! results ) {   //data = array 
				console.log('no rec')
				closeDb(db);//CLOSE connection
		
				res.status(500).send('** No Record Yet! ***')
		
			}else{ 
			
				let pdfbatch

				console.log(results)

				
				if( results[0].pdf_batch!==null ){
					pdfbatch = "ATD # " + results[0].pdf_batch
				}else{
					pdfbatch = "ATD PDF NOT YET PROCESSED"
				}
				let xtable = 
				`<div class="col-lg-8">
					<div class='ms-2'><H2 style="color:#dc4e41">${pdfbatch}</H2></div>
				<table class="table w-100	" > 
				<thead>
					<tr>
					<th>Rider</th>
					<th align=right>Amount</th>
					</tr>
				</thead>
				<tbody>`

				//iterate top 10
				let total_amt = 0
				for(let zkey in results){
					total_amt+=parseFloat(results[zkey].total)

					xtable+= `<tr>
					<td>
					<span class='a2'>${results[zkey].rider}</span><br>
					<span class='a3'>${results[zkey].emp_id}</span><br>
					<span class='a3'>${results[zkey].hub}</span><br>
					<span class='a3'>Batch # ${results[zkey].batch_file}</span>
					
					</td>
					<td align='right' valign='bottom'><b>${addCommas(parseFloat(results[zkey].total).toFixed(2))}</b></td>
					</tr>`

				}//endfor
				let visible

				if(results.rowCount>1){
					visible = "disabled"	
				}else{
					visible = ""
				}
				xtable+=

				`<tr>
				<td  align=right><b>TOTAL : </b></td>
				<td align=right><b> ${addCommas(parseFloat(total_amt).toFixed(2))}</b></td>
				</tr>
				<tr>
				<td colspan=2>
				<button id='download-btn' type='button' class='btn btn-primary' onclick="javascript:asn.checkpdf('${results[0].emp_id}')"><i class='ti ti-download'></i>&nbsp;Download PDF</button>
				</td>
				</tr>
				</tbody>
				</table>
				</div>`

				closeDb(db);//CLOSE connection
	
				res.status(200).send(xtable)				
				
			}//eif
		
		})

	}).catch((error)=>{
		res.status(500).json({error:'Error'})
	}) 

})

//=====https://localhost:3000/q/6/2 
router.get('/getlistpdf/:limit/:page', async(req,res) => {
	
	console.log(`firing getlistpdf/${req.params.limit}/${req.params.page}`)

	const limit_num = 30 //take out Mar 27,2025 req.params.limit, make a hard value of 30
	let nStart = 0	
	let page = req.params.page
	
	connectDb() 
	.then((db)=>{
		
		let sql = `SELECT distinct(a.emp_id) as emp_id,
		a.full_name as rider,
		round(sum( a.amount )) as total,
        a.hubs_location as hub,
        (select distinct x.region from asn_spx_hubs x where x.hub = a.hubs_location limit 1) as region
		from asn_claims a 
        group by a.emp_id,a.pdf_batch
		HAVING a.pdf_batch like 'ASN%'
		order by a.pdf_batch asc; `
		
		//console.log(sql)
		
		let reccount = 0
		
		db.query( `${sql}`,null,(err,xresult)=>{
			
			if(!xresult){
				res.send("<span class='text-primary'>** No Data Found!!!**</span>")
			}else{

				reccount = xresult.length
				//==== for next
				let aPage = []
				let pages = Math.ceil( xresult.length / limit_num )
				
				nStart = 0
				
				for (let i = 0; i < pages; i++) {
					aPage.push(nStart)
					nStart += parseInt(limit_num)
				}//==next
				
				//console.log('offset ',aPage)
				//===get from json field 
				let sql2 = 
					`SELECT distinct(a.emp_id) as emp_id,
					a.full_name as rider,
					round(sum( a.amount )) as total,
					a.hubs_location as hub,
					a.pdf_batch,
					(select distinct x.region from asn_spx_hubs x where x.hub = a.hubs_location limit 1) as region
					from asn_claims a 
					group by a.emp_id, a.pdf_batch
					HAVING a.pdf_batch like 'ASN%'
					order by a.pdf_batch asc
					LIMIT ${limit_num} OFFSET ${aPage[page-1]};`
				
				//onsole.log(sql2)
				

				db.query(`${sql2}`,null,(err,xdata)=>{
				
					let  xtable =
					`<div class="col-lg-8">
					<table class="table"> 
					<thead>
						<tr>
						<th>Rider</th>
						<th>Pdf Batch</th>
						<th align=right>Amount</th>
						</tr>
					</thead>
					<tbody>`

					
					let randpct, issues

					for (let zkey in xdata){

						randpct = Math.floor((Math.random() * 100) + 1);
						issues  = Math.floor((Math.random() * 15) + 1);
						//let randpct2 = (100-randpct)y
						//taken out <td>${data.rows[ikey].id}</td>
						
						xtable += `<tr>
						<td>
						${ xdata[zkey].rider}<br>
						${ xdata[zkey].emp_id}<br>
						( ${ xdata[zkey].region}, ${ xdata[zkey].hub} )<br> 
						</td>
						<td> ${ xdata[zkey].pdf_batch} </td>
						<td align='right' valign='bottom'><b>${addCommas(parseFloat( xdata[zkey].total).toFixed(2))}</b></td>
						</tr>`
					}//=======end for
					
					
					//console.log( xtable )
					let xprev = ((page-1)>0?'':'disabled')
					let xnext = ((page>=pages)?'disabled':'')
					let mypagination = "", main = "", xclass = ""
					//===mypagination is for pagination
					
					//===final pagination
					mypagination+=`
					<nav aria-label="Page navigation example">
					  <ul class="pagination">`
					
					//==== previous link
					mypagination += `<li class="page-item ${xprev}">
					<a class="page-link" href="javascript:asn.getListPdf(${parseInt(req.params.page)-1 })">Previous</a></li>`
					
					for(let x=0; x < pages; x++){
						
						if( req.params.page==(x+1)){
							xclass = "disabled"
						}else{
							xclass = ""
						}
						//==== number page
						mypagination += `<li class="page-item ${xclass}">
						<a class="page-link"  href="javascript:asn.getListPdf(${x+1})">${x+1}</a></li>`
						
					}//end for
					
					//=======next link
					mypagination += `<li class="page-item ${xnext}">
					<a class="page-link" href="javascript:asn.getListPdf(${parseInt(req.params.page)+1})">Next</a></li>`
					
					mypagination+=`
					</ul>
					</nav>`
					
					//=== if u add column in tables
					// === add also colspan=??
					xtable += `
						<tr>
						<td colspan=4 align='center'>
						 ${mypagination}<div id='reccount' style='visibility:hidden' >${reccount}</div>
						</td>
						</tr>
						</TBODY>
					</table>
					</div>`
					
					main +=`${xtable}`
							
					aPage.length = 0 //reset array
					
					closeDb(db)

					//console.log( main )
					res.send(main) //output result
				})//endquery
								
			}//eif 
		
		})//==end db.query 
		
	}).catch((error)=>{
		res.status(500).json({error:'No Fetch Docs'})
	})		

})//end pagination


const pdfBatch =  ( emp_id ) =>{
	return new Promise((resolve, reject)=> {
		const sql = `Select sequence from asn_pdf_sequence;`
		let xcode, seq
	
		connectDb()
		.then((db)=>{
			db.query(`${sql}`,(error,results) => {
				if(results.length>0){
					
					seq = results[0].sequence+1
					//console.log(results,seq)
					//console.log( seq.toString().padStart(5,"0") )
					const usql = `update asn_pdf_sequence set sequence = ${seq}`
					
					db.query(`${usql}`,(error,udata) => {
					})
	
					xcode =`ASN-${seq.toString().padStart(5,"0")}`

					
				}
	
				closeDb(db)
				//console.log(xcode)
				resolve( xcode )
				
			})
		}).catch((error)=>{
			reject(error)
			res.status(500).json({error:'Error'})
		})
	})


	 
	/*
		var today = new Date()
    var dd = String(today.getDate()).padStart(2, '0')
    var mm = String(today.getMonth() + 1).padStart(2, '0') //January is 0!
    var yyyy = today.getFullYear()
    var hh = String( today.getHours()).padStart(2,'0')
    var mmm = String( today.getMinutes()).padStart(2,'0')
    var ss = String( today.getSeconds()).padStart(2,'0')

    today = `ASN-${yyyy}${mm}${dd}${hh}${mmm}${ss}-${emp_id}`
    return today
	*/
	
}

router.get('/pdfx', async(req,res)=>{
	
	 let xxx =  await pdfBatch('205214')
	console.log('serial',xxx)
	res.status(200).json({status:'ok'})
})


//======= CHECK PDF FIRST BEFORE CREATING ==============
router.get('/checkpdf/:e_num/:grp_id', async(req, res)=>{

	//console.log(req.params.grp_id)

	if( req.params.grp_id!=="2"){ //if the one checking is not ARE COORDINATOR allow to re-print/download pdf
		const sql = `Select emp_id,pdf_batch from asn_claims
			where emp_id='${req.params.e_num}' 
			order by emp_id`

		connectDb()
		.then((db)=>{
			db.query(`${sql}`,async(error,results) => {	
				if(results.length > 0){
					console.log('OK TO REPRINT')
					
					closeDb(db) //close
					res.status(200).json({status:true, batch:`${results[0].pdf_batch}`})
				}
			})

		}).catch((error)=>{
			res.status(500).json({error:'Error'})
		}) 

	}else{

		const sql = `Select emp_id,pdf_batch from asn_claims
			where emp_id='${req.params.e_num}' and
			pdf_batch <> ''
			order by emp_id`

		connectDb()
		.then((db)=>{
			db.query(`${sql}`,async(error,results) => {	
				if(results.length > 0){
					console.log('FOUND!')
					
					closeDb(db) //close

					res.status(200).json({status:false, batch: results[0].pdf_batch})
				}else{
					const seq = await pdfBatch( req.params.e_num)

					const sql2 = `UPDATE asn_claims SET pdf_batch ='${seq}'
								where emp_id='${req.params.e_num}'`
					
					console.log(sql2)	

					db.query(sql2, null, (error,xdata) => {
						///console.log(xdata) xdata.affectedRows or changedRows
					})

					console.log('UPDATED DATABASE WITH PDFBATCH() GOOD TO DOWNLOAD!')
					
					closeDb(db)
					res.status(200).json({status:true, batch:`${seq}`})
					
				}
			})

		}).catch((error)=>{
			res.status(500).json({error:'Error'})
		}) 

	}//eif
	
	

})

//======= CREATE PDF
router.get('/createpdf/:e_num/:batch', async(req, res)=>{

	console.log('===createpdf()====', req.params.e_num)
	const sql = `SELECT distinct(emp_id) as emp_id,
	full_name as rider,
	category,
	hubs_location as hub, 
	track_number as track,
	claims_reason as reason,
	sum( amount ) as total from asn_claims
	group by full_name,emp_id,category,hubs_location, track_number,claims_reason
	having emp_id='${req.params.e_num}'
	order by full_name`

	//console.log(sql )

	connectDb()
	.then((db)=>{
		db.query(`${sql}`,(error,results) => {	
		
			if ( results.length == 0) {   //data = array 
				console.log('no rec')
				closeDb(db);//CLOSE connection
		
				res.status(500).send('** No Record Yet! ***')
		
			}else{ 
			
				let xdata = []

				xdata = results //get result in array
				const curr_date = strdates()

				let total_amt = 0
				for(let zkey in results){
					
					total_amt+=parseFloat(results[zkey].total)
					results[zkey].total= parseFloat(results[zkey].total).toFixed(2) //change to decimal first
					 
				}//endfor

				let nFormatTotal = addCommas(parseFloat(total_amt).toFixed(2))
				let nTotal = parseFloat(total_amt).toFixed(2)

				//=== CREATE MEDRX ===========
				asnpdf.reportpdf( xdata, curr_date,  nFormatTotal, nTotal, req.params.batch)
				.then( reportfile =>{
					console.log('REPORT PDF SUCCESS!', reportfile)
					
					//============ force download
					res.download( reportfile, reportfile,(err)=>{
						console.log('==downloading pdf===')
						if(err){
							console.error('Error in Downloading ',reportfile,err)

							closeDb(db)

							res.status(500).send(`Error in Downloading ${reportfile}`)
						}else{

							closeDb(db)
							
						}
					}) //===end res.download
				})
			}//eif
		})

	}).catch((error)=>{
		res.status(500).json({error:'Error'})
	}) 
})

//====== CLEANUP PDF
router.get('/deletepdf/:e_num', async(req, res) => {

	let reportfile = `ADT_${req.params.e_num}.pdf`

 	Utils.deletePdf(reportfile)
	.then(x => {
		if(x){
			
			//=== RETURN RESULT ===//
			console.log('*** Deleted temp file ', reportfile)
			
			//update patient record
			//closeDb(db)
			res.status(200).json({status:true})

		}//eif
	})
})//end Utils.deletepdfse{


router.get('/getzap/:eqptid', async(req,res)=>{
	sql = `DELETE from equipment
	where equipment_id = '${req.params.eqptid}'`

	connectDb()
	.then((db)=>{
	
		db.query(sql, null ,(error,data) => {	
			if ( data.length  == 0) {   //data = array 
				console.log('no rec')
				
				closeDb(db);//CLOSE connection
				//console.log("===MYSQL CONNECTON CLOSED SUCCESSFULLY===")


			}else{

				res.status(200).json({ status : true, voice:'Equipment Deleted Successfully', message:'Equipment Deleted Successfully' })			
			}//eif
			closeDb( db )
		}) //end db.query 
	})//tne .then(db)
	
})


const bcrypt = require("bcrypt")
const saltRounds = 10
//======== END NODEJS CORS SETTING
const getRandomPin = (chars, len)=>[...Array(len)].map(
    (i)=>chars[Math.floor(Math.random()*chars.length)]
).join('');


//==========SEND OTP
router.get( '/sendotp/:email/:name', async (req,res)=>{
	
	const otp = getRandomPin('0123456789',6)
	
	bcrypt
	.hash( otp, saltRounds)
	.then(hash => {

		axios.get(`https://vantaztic.com/vanz/mailotp.php?otp=${otp}&name=${req.params.name}&email=${req.params.email}`)
		.then((response) => {
			if (response.status === 200) {
				const html = response.data;
				//mail the otp
				console.log(`https://vantaztic.com/vanz/mailotp.php?otp=${otp}&name=${req.params.name}&email=${req.params.email}`)
				console.log('axios otp/ ', otp, ' ===Hash== ', hash)
				
				//save the otp to db
				let sqlu = `UPDATE vantaztic_users SET private_key='${hash}'
				WHERE email ='${req.params.email}' `
			
				connectDb()
				.then((db)=>{
			
					db.query(sqlu,(error,results) => {	
						console.log('otp update==', sqlu, results.changedRows)
					})
					
					closeDb(db);//CLOSE connection
			

				}).catch((error)=>{
					res.status(500).json({error:'Error'})
				})
				
				res.json({
					status:true
				})	

				
			}
		})
		.catch((err) => {
			throw new Error(err);
		});
	  	
	})
	.catch(err => console.error(err.message))
	
})
 
//===== GET OTP AND COMPARE
router.get( '/getotp/:otp/:email', async (req,res)=>{
	sql = `select private_key from vantaztic_users where email = '${req.params.email}'`
	connectDb()
	.then((db)=>{

		db.query(sql,null, (err,results) => {	
			
			//console.log('inquire data', data, sql )
			
			if(results.length>0){
				//console.log('inquire data', results )
				
				bcrypt
				.compare( req.params.otp, results[0].private_key)
				.then(xres => {
					console.log('OTP Matched?: ',xres) // return true
					
					res.json({
						status:xres
					})
	
				})
				.catch(err => console.error(err.message))			
			}else{
				res.json({
					status:false
				})

			}
		})
		
		closeDb(db);//CLOSE connection


	}).catch((error)=>{
		res.status(500).json({error:'Error'})
	})

})

 
const smsPost = (msgbody) => {
	//number : '09175761186,09985524618,09611164983',
	console.log('***SENDING SMS*** ', msgbody)
	let smsdata = {
		apikey : '20dc879ad17ec2b41ec0dba928b28a69', //Your API KEY
		number : '09611164983',			
		message : msgbody,
		sendername : 'SEMAPHORE'
    }
	
	fetcher('https://semaphore.co/api/v4/messages', {
		method: 'POST',
		body: JSON.stringify(smsdata),
		headers: { 'Content-Type': 'application/json' }
	})    
	.then(res => res.json() )
    .then(json => console.log ('sms ->', json ))
	
}

//========add comma for currency
const addCommas = (nStr) => {
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

//===============get all equipment
router.get('/getall/:type/:status',   async(req,res) => {
	//console.log('getall()',req.params.status)
	const d = new Date();
	const xmonth = ( d.getMonth()+1 );
	
	let sql, br = 0
	let newdata=[], poList = []
	if(req.params.status == "0"){ //on hand
		sql = `select *,
		trim(replace(substring_index(substring(equipment_value,locate('serial',equipment_value)+ length('serial')+ 2),',',1),'"','')
		) as 'xserial'
		from equipment
		where qty > 0 and type = '${req.params.type}'
		ORDER BY xserial desc, type`
	}else if(req.params.status == "2"){ //approved
		sql = `select distinct(b.po_number)
		,c.id
		,b.invoice_number
		,c.transaction
		,a.serial
		,upper(a.eqpt_no) as 'eqpt_no'
		,upper(a.type) as 'type'
		,trim(replace(substring_index(substring(a.equipment_value,locate('eqpt_description',a.equipment_value)+ length('eqpt_description')+ 2),',',1),'"',''))
		as 'description'
		,sum(b.qty) as 'qty'
		,b.price as price
		,a.sale_price 
		,sum(b.total) as 'total'
		,b.approved
		,c.approver_1
		,c.approver_2
		,c.client_info
		,c.date_created
		,c.grand_total
		from equipment_sales b
		join equipment a
		on a.equipment_id = b.id
		join equipment_client c
		on c.po_number = b.po_number
		where  c.approver_1 = 1 and c.approver_2 = 1 and a.type = '${req.params.type}'
		and Month(c.date_created) = '${xmonth}'
		group by b.po_number
		,c.id
		,b.invoice_number
		,c.transaction
		,a.serial
		,a.eqpt_no
		,a.type
		,trim(replace(substring_index(substring(a.equipment_value,locate('eqpt_description',a.equipment_value)+ length('eqpt_description')+ 2),',',1),'"',''))
		,b.price
		,a.sale_price
		,b.approved
		,c.approver_1
		,c.approver_2
		,c.client_info
		,c.date_created
		,c.grand_total 
		ORDER BY c.id DESC`
	}else if(req.params.status == "1"){ //for approval
		sql = `select distinct(b.po_number)
		,c.id
		,b.invoice_number
		,c.transaction
		,a.serial
		,upper(a.eqpt_no) as 'eqpt_no'
		,upper(a.type) as 'type'
		,trim(replace(substring_index(substring(a.equipment_value,locate('eqpt_description',a.equipment_value)+ length('eqpt_description')+ 2),',',1),'"',''))
		as 'description'
		,sum(b.qty) as 'qty'
		,b.price as price
		,a.sale_price
		,sum(b.total) as 'total'
		,b.approved
		,c.approver_1
		,c.approver_2
		,c.client_info
		,c.date_created
		,c.grand_total
		from equipment_sales b
		join equipment a
		on a.equipment_id = b.id
		join equipment_client c
		on c.po_number = b.po_number
		where  ( c.approver_1 = 0 or c.approver_2 = 0 ) and a.type = '${req.params.type}'
		and Month(c.date_created) = '${xmonth}'
		group by b.po_number
		,c.id
		,b.invoice_number
		,c.transaction
		,a.serial
		,a.eqpt_no
		,a.type
		,trim(replace(substring_index(substring(a.equipment_value,locate('eqpt_description',a.equipment_value)+ length('eqpt_description')+ 2),',',1),'"',''))
		,b.price
		,a.sale_price
		,b.approved
		,c.approver_1
		,c.approver_2
		,c.client_info
		,c.date_created
		,c.grand_total 
		ORDER BY c.id DESC`
	
	}else if(req.params.status == "3"){ //released
		sql = `select distinct(b.po_number)
		,c.id
		,b.invoice_number
		,c.transaction
		,a.serial
		,upper(a.eqpt_no) as 'eqpt_no'
		,upper(a.type) as 'type'
		,trim(replace(substring_index(substring(a.equipment_value,locate('eqpt_description',a.equipment_value)+ length('eqpt_description')+ 2),',',1),'"',''))
		as 'description'
		,sum(b.qty) as 'qty'
		,b.price as price
		,a.sale_price
		,sum(b.total) as 'total'
		,b.approved
		,c.approver_1
		,c.approver_2
		,c.client_info
		,c.date_created
		,c.release_date
		,c.grand_total
		from equipment_sales b
		join equipment a
		on a.equipment_id = b.id
		join equipment_client c
		on c.po_number = b.po_number
		where  not isnull(c.release_date) and a.type = '${req.params.type}'
		and Month(c.date_created) = '${xmonth}'
		group by b.po_number
		,c.id
		,b.invoice_number
		,c.transaction
		,a.serial
		,a.eqpt_no
		,a.type
		,trim(replace(substring_index(substring(a.equipment_value,locate('eqpt_description',a.equipment_value)+ length('eqpt_description')+ 2),',',1),'"',''))
		,b.price
		,a.sale_price
		,b.approved
		,c.approver_1
		,c.approver_2
		,c.client_info
		,c.date_created
		,c.release_date
		,c.grand_total 
		ORDER BY c.id DESC`
	
	}
/*
	tanggal muna sa sql

	}else if( req.params.type !=="All" && req.params.status !=="All" ){
		br = 3
		sql = `select *,
		trim(replace(substring_index(substring(equipment_value,locate('serial',equipment_value)+ length('serial')+ 2),',',1),'"','')
		) as 'xserial'
		from equipment		
		where lower(type) = '${req.params.type.toLowerCase()}'
		and status = ${parseInt(req.params.status)}
		and qty > 0
		ORDER BY xserial desc, type`
*/

	console.log(' ===/getall()/ MY SQL route api.js===')

	connectDb()
    .then((db)=>{
        
        db.query( sql , null ,(err,data) => { 
			
			if ( data.length == 0) {  //data = array 
				console.log('===no rec===')	
                res.status(400).json({
					voice:"No Matching Record!",
					found:false
				})  
				
				closeDb(db);//CLOSE connection
            
			}else{
				console.log('===rec ===', data.length)	
                 
				//console.log( '/getAll() *** ',req.params.status, data )
				let newdata = [], poList = []

				if(req.params.status=="2" || req.params.status=="1" || req.params.status=="3" ){
					for (let ikey in data){
						if (!poList.includes(data[ikey].po_number)) {
							// ✅ only runs if value not in array
							poList.push(data[ikey].po_number)
						
						}//eif
						
					}//=======end for
	
					//console.log('first step ',poList)
	
					//sort first
					data.sort((a, b) => {
						return a.po_number - b.po_number;
					});
	
					//console.log(data)
	
					for(let x in poList){
	
						//new set obj, reset
						let obj = {}
						obj.po_number =""
						obj.invoice_number =""
						obj.transaction=""
						obj.eqpt_no=""
						obj.po_date = ""
						obj.details = []
						//check against data
						//et obj2 ={}
	
						for(let i in data){
							
							if( poList[x] == data[i].po_number){
								obj.po_number = data[i].po_number
								obj.invoice_number = data[i].invoice_number
								obj.transaction = data[i].transaction
								obj.eqpt_no = data[i].eqpt_no
								obj.po_date = data[i].date_created

								if(req.params.status=="3"){ //if released
									obj.release_date = data[i].release_date
								
								}//endif 
								
	
								let client = JSON.parse(data[x].client_info)
	
								obj.client_name = client.client_name.toUpperCase()
								obj.client_company = client.company_name.toUpperCase()
								obj.client_address = client.delivery_site.toUpperCase()
								obj.client_phone = client.company_phone
								obj.client_email = client.company_email
								obj.client_remarks = client.client_remarks
								
								let obj2 ={}
								
								if(data[i].po_number.indexOf(poList[x])!=-1){
									
									obj2.serial = data[i].serial
									obj2.type = data[i].type
									obj2.description = data[i].description
									
									obj2.qty = data[i].qty
									obj2.price = data[i].price
									obj2.sale = data[i].sale_price
									obj2.total = data[i].total
									
									obj.details.push( JSON.stringify(obj2) )
								}
	
								obj.grand_total = data[i].grand_total
							
							}//eif
						}//endfor
	
						newdata.push(obj)
						//console.log(poList[i])
					}//=====end for
					res.status(200).json({
						result	: 	newdata,
						found	:	true
					})
				}else{
					//console.log( 'here',data )
					res.status(200).json({
						result	: 	data,
						found	:	true
					})
				}
                closeDb(db);//CLOSE connection
                
            }//EIF
			
		})//END QUERY 
	
	}).catch((error)=>{
        res.status(500).json({error:'No Fetch Docs'})
    })		
})

//===============for super user first batch of data count
router.get('/fetchinitdata',   async(req,res) => {
	
	//clear cookie first
	res.clearCookie(`Rent`, {path : '/'})
	res.clearCookie(`Sales`, {path : '/'})

	connectDb()
    .then((db)=>{

		// Select distinct( b.approve_status  ) as 'status',
		// count(a.status)  as status_count,
		// (case
		//   when b.approve_status = 'FOR RENT APPROVAL' then sum(a.rent_price)
		//   when b.approve_status = 'FOR SALES APPROVAL' then sum(a.sale_price)
		//   when b.approve_status = 'RECEIVED' then sum(a.price)
		// end ) as 'price',
		// (CASE
		// 	when b.approve_status = 'FOR SALES APPROVAL' then ( (sum(a.sale_price)-sum(a.price)) )
		// END
		// )as sales_profit,
		// sum(
		// 	(CASE
		// 		when b.approve_status = 'FOR RENT APPROVAL' then 
		// 		(
		// 		CASE 
		// 			when a.rent_end<now() then 1
		// 		END
		// 		)
		// 	END
		// 	)
		// ) as 'overdue'
		// from
		// equipment_status b 
		// left join equipment a on a.status = b.approve_id
		// where b.approve_status Not in('status','RELEASED')
		// group by b.approve_status
		let sqlt1 = `SELECT Sum(c.price) AS opex 
					FROM equipment_sales as c 
					join equipment_client as x
					on c.po_number = x.po_number 
					where x.transaction <> 'RENT'`
					
        db.query(`SELECT t1.opex, 
						 t2.profit 
					FROM ( ${sqlt1}) AS t1, 
					(SELECT Sum(d.sale_profit) AS profit 
					FROM   equipment_client  d ) AS t2  `, null ,(err,data) => { 
			//console.log(data.length,data)
		   
			if ( data.length == 0) {  //data = array 
				console.log('no rec')
                res.status(400).json({
					voice:"No Matching Record!",
					found:false
				})  
				
				closeDb(db);//CLOSE connection
                //console.log("===MYSQL CONNECTON CLOSED SUCCESSFULLY===")

            }else{ 
				//console.log( data[0].full_name )
				//cookie
				// res.cookie('Rent',`${data[0].status_count}`)
				// res.cookie('Sales',`${data[1].status_count}`)
				
				/////console.log( data[1])
				res.status(200).json({
					result	: 	data
                })
				
                closeDb(db);//CLOSE connection
                //console.log("===MYSQL CONNECTON CLOSED SUCCESSFULLY===")
            }//EIF
			
		})//END QUERY 
	
	}).catch((error)=>{
        res.status(500).json({error:'No Fetch Docs'})
    })
})

const getDate = () =>{
	let today = new Date()
	var dd = String(today.getDate()).padStart(2,'0')
	var mm = String(today.getMonth()+1).padStart(2,'0')
	var yyyy = today.getFullYear()

	today = mm +'/'+dd+'/'+yyyy
	return today
} 

const strdates = () =>{
	let today = new Date()
	var dd = String(today.getDate()).padStart(2,'0')
	var mm = String(today.getMonth()+1).padStart(2,'0')
	var yyyy = today.getFullYear()
	var mos = new Date(`${today.getMonth()+1}/${dd}/${yyyy}`).toLocaleString('en-PH',{month:'long'})

	today = mos + ' '+ dd +', '+yyyy
	return today
}


//======sample pagination
//=====https://localhost:3000/q/6/2 
router.get('/q/:limit/:page',  async(req,res) => {
	
	const limit_num = req.params.limit
	let nStart = 0
	let page = req.params.page
	
	connectDb()
	.then((db)=>{
		
		sql1 = `select * from equipment_client`
							
		db.query(sql1,null,(err,data)=>{
			
			if(data.length==0){
			}else{
				//==== for next
				let aPage = []
				let pages = Math.ceil( data.length / limit_num )
				
				nStart = 0
				
				for (let i = 0; i < pages; i++) {
					aPage.push(nStart)
					nStart += parseInt(limit_num)
				}//==next
				
				console.log('offset ',aPage)
				sql2 = `select * from equipment_client 
						LIMIT ${limit_num} OFFSET ${aPage[page-1]}`
				console.log(sql2)
				
				db.query(`select * from equipment_client 
						LIMIT ${limit_num} OFFSET ${aPage[page-1]}`,null,(err,data)=>{
					
					let mytable = `
							<table class="table p-3 table-striped table-hover">
							<thead>
								<tr>
								  <th scope="col">ID</th>
								  <th scope="col">PO</th>
								  <th scope="col">TRANSACTION</th>
								</tr>
							</thead>
							<tbody>`
							
					for (let ikey in data){
						mytable += `<tr>
							<td>${data[ikey].id}</td>
							<td>${data[ikey].po_number }</td>
							<td>${data[ikey].transaction }</td>
						</tr>`
					}//=======end for
					
					let xprev = ((page-1)>0?'':'disabled')
					let xnext = ((page>=pages)?'disabled':'')
					let mypagination = "", main = "", xclass = ""
					//===mypagination is for pagination
					
					//===final pagination
					mypagination+=`
					<nav aria-label="Page navigation example">
					  <ul class="pagination">`
					
					//$xprev
					mypagination += `<li class="page-item ${xprev}"><a class="page-link" href="${parseInt(req.params.page)-1 }">Previous</a></li>`
					
					for(let x=0; x < pages; x++){
						if(req.params.page==(x+1)){
							xclass = " active"
						}else{
							xclass = ""
						}
						mypagination += `<li class="page-item"><a class="page-link ${xclass}" href="${x+1}">${x+1}</a></li>`
					}//end for
					
					mypagination += `<li class="page-item ${xnext}"><a class="page-link" href="${parseInt(req.params.page)+1}">Next</a></li>`
					
					mypagination+=`
					</ul>
					</nav>`
					
					mytable += `
						<tr>
						<td colspan=3 align='center'>
						 ${mypagination}
						</td>
						</tr>
						</TBODY>
					</table>`
					
					main +=`
					<!doctype html>
					<html lang="en">
					  <head>
						<meta charset="utf-8">
						<meta name="viewport" content="width=device-width, initial-scale=1">
						<title>Bootstrap demo</title>
						<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
					  </head>
					  <body>
						${mytable}
						<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
					  </body>
					</html>`
							
					aPage.length = 0 //reset array
					res.send(main) //output result
				})//endquery
				
			}//eif 
		
		})//==end db.query 
		
	}).catch((error)=>{
		res.status(500).json({error:'No Fetch Docs'})
	})		

	
})

router.get('/handshake', async(req,res) => {

	res.json({status:true})
})

module.exports = router;
