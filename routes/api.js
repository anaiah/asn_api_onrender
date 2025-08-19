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

const db  = require('../db')// your pool module

//=====CLAIMS UPLOAD
// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

const xlsx = require('xlsx');
const { v4: uuid } = require('uuid'); // for generating unique IDs//
//const { v4: uuidv4 } = require('uuid'); // for generating unique IDs

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
		let empId;

			for( const record of data){
				const { batch_id,emp_id,full_name, track_number, claims_reason, category, hubs_location, batch_file, amt, transaction_year } = record ;
				
				empId = uuid();

				const query = `INSERT INTO asn_claims (batch_id,emp_id,full_name, track_number, claims_reason, category, hubs_location, batch_file, amount, transaction_year) 
							VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
				
				insertPromises.push( await conn.execute( query , [batch_id, empId ,full_name, 
					track_number, claims_reason, category, hubs_location, 
					batch_file, amt, transaction_year]))

				console.log(query,batch_id,empId,full_name, track_number, claims_reason, category, hubs_location, batch_file, amt, transaction_year)
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
    console.log('firing login=>',req.params.uid,req.params.pwd)
    	
	try {
		const {uid,pwd} = req.params

		const sql =`SELECT a.id,a.full_name, 
			a.email, GROUP_CONCAT(distinct a.region) as region, 
			a.grp_id,a.pic 
			from asn_users a 
			WHERE a.email=? and a.pwd=?` 

		const [data, fields] = await db.query(sql,[uid,pwd]);

		//console.log(data[0])
		if (data.length > 0) {
			// record exists, proceed
			// e.g., login success
			if(data[0].full_name === null){
				return res.status(200).json({
					message : "No Matching Record!",
					voice   : "No Matching Record!",
					found   : false
				})  

			}else{
				return res.status(200).json({
					email	: 	data[0].email,
					fname   :   data[0].full_name.toUpperCase(),
					message	: 	`Welcome to Asia Now , ${data[0].full_name.toUpperCase()}! `,
					voice	: 	`Welcome to Asia Now , ${data[0].full_name}! `,		
					grp_id	:	data[0].grp_id,
					pic 	: 	data[0].pic,
					ip_addy :   null,
					id      :   data[0].id,
					region  :   data[0].region,
					found   :   true
				})
			}
 			
		} else {
			// handle no record
			// e.g., invalid credentials
			return res.status(200).json({
				message : "No Matching Record!",
				voice   : "No Matching Record!",
				found   : false
			})  
		}//eif

	} catch (err) {
		console.error('Error:', err);
		res.status(500).send('Error occurred');
	}//eif

   
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
    .then((xdb)=>{

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
	
				closeDb(xdb);//CLOSE connection
			
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
	.then((xdb)=>{
		xdb.query(sqlu , null ,(error,results) => {	
			//console.log('UPDATE DR SEQ', results)
		})
	})

	return today
}

////= get printed atds
router.get('/getprintpdf/:region/:grpid/:email', async (req,res)=>{

		if( req.params.region!=='ALL'){
			switch( req.params.grpid){
				case "6": //head coord
					sqlins = ` and b.head_coordinator_email = '${req.params.email}' `
				break

				case "7": //coord
					sqlins = ` and b.coordinator_email = '${req.params.email}' `
				break

			}//endcase
			

			sql = `SELECT a.emp_id as emp_id,
			a.full_name as rider, 
			a.hubs_location as hub, 
			round(sum( a.amount)) as total, 
			b.region,
			a.pdf_batch
			from asn_claims a 
			left join asn_spx_hubs b on a.hubs_location = b.hub  
			where a.pdf_batch like 'ASN%' 
			${sqlins}
			and a.transaction_year='2025' 
			group by a.pdf_batch
			order by a.pdf_batch+0 desc;`
		}else{
			sql =`SELECT 
			a.emp_id as emp_id,
			a.full_name as rider,
			a.hubs_location as hub, 
			round(sum( a.amount)) as total, 
			b.region,
			a.pdf_batch
			from asn_claims a 
			left join asn_spx_hubs b on a.hubs_location = b.hub 
			where a.pdf_batch like 'ASN%' 
			and a.transaction_year='2025' 
			group by a.pdf_batch
			order by a.pdf_batch+0 desc;`
		}

		console.log('==getprintpdf== ')
		connectDb()
		.then((xdb)=>{
			xdb.query(sql,(error,results) => {	
				//console.log(error,results)
				if ( results.length == 0) {   //data = array 
					console.log('no rec')
					closeDb(xdb);//CLOSE connection
			
					res.status(500).send({error:'NO RECORD'})
			
				}else{ 
					
					//xtable+=`<input type='text' hidden id='gxtotal' name='gxtotal' value='${addCommas(parseFloat(xtotal).toFixed(2))}'>`

					closeDb(xdb);//CLOSE connection
				
					results.sort((a, b) => {
						return a.pdf_batch - b.pdf_batch;
					});

					//console.log( results )
	
					res.status(200).json(results)
				}

			})
		}).catch((error)=>{
			res.status(500).json({error:'Error'})
		}) 


})		
//=================== END GET PRINTED ATDS ===============//


///===== get update grid total claims
router.get('/claimsupdate/:region/:grpid/:email', async (req,res)=>{
	console.log('===FIRED CLAIMSUPDATE()====')
	if(req.params.region !== 'ALL'){

		switch( req.params.grpid){
			case "6": //head coord
				sqljoin = ` head_coordinator_email `
				sqlins = ` and b.head_coordinator_email = '${req.params.email}' `
			break

			case "7": //coord
				sqljoin = ` coordinator_email `
				sqlins = ` and b.coordinator_email = '${req.params.email}' `
			break

		}//endcase


		sql = `select distinct( DATE_FORMAT(a.uploaded_at,'%M %d, %Y')) as xdate, 
		round(sum(a.amount)) as total
		from asn_claims a
		 join asn_spx_hubs b 
		on b.hub = a.hubs_location
		where (a.pdf_batch is null or a.pdf_batch = "") 
		${sqlins}
		and a.transaction_year='2025'
		group by a.uploaded_at
        order by a.uploaded_at DESC`

		// sql = `select distinct( DATE_FORMAT(a.uploaded_at,'%M %d, %Y')) as xdate, 
		// round(sum(a.amount)) as total
		// from asn_claims a
		// join (select distinct hub, ${sqljoin} from asn_spx_hubs ) b
		// on a.hubs_location = b.hub
		// where (a.pdf_batch is null or a.pdf_batch = "") and a.transaction_year='2025'
		// ${sqlins}
		// group by a.uploaded_at
        // order by a.uploaded_at DESC`
	}else{

		sql = `
		select distinct( DATE_FORMAT(a.uploaded_at,'%M %d, %Y')) as xdate, 
		round(sum(a.amount)) as total
		from asn_claims a
		where (a.pdf_batch is null or a.pdf_batch = "")
		and a.transaction_year = '2025'
		group by a.uploaded_at
		order by a.uploaded_at DESC`
		
	}
	
	//console.log(sql)
	connectDb()
	.then((xdb)=>{
		xdb.query(sql,(error,result) => {	
			//console.log(error,results)
			if ( result[0].length == 0) {   //data = array 
				console.log('no rec')
				closeDb(xdb);//CLOSE connection
		
				res.status(500).send('** No Record Yet! ***')
		
			}else{ 
				
				//xtable+=`<input type='text' hidden id='gxtotal' name='gxtotal' value='${addCommas(parseFloat(xtotal).toFixed(2))}'>`

				closeDb(xdb);//CLOSE connection
			
				res.status(200).json(result)				
				
			}

		})
	}).catch((error)=>{
		res.status(500).json({error:'Error'})
	}) 

})

//==========TOP 5 HUB 
router.get('/gethub/:region/:grpid/:email', async (req, res) => {
  
  let sql;

  try {
    if (req.params.region !== 'ALL') {
      let sqlIns = '';
      switch (req.params.grpid) {
        case "6": // head coord
          sqlIns = ` AND a.head_coordinator_email = '${req.params.email}' `;
          break;
        case "7": // coord
          sqlIns = ` AND a.coordinator_email = '${req.params.email}' `;
          break;
      }
      sql = `
        SELECT  
          b.hubs_location AS hub, 
          a.region, 
          COALESCE(ROUND(SUM(b.amount),2),0) AS total
        FROM asn_claims b 
        LEFT JOIN asn_spx_hubs a ON a.hub = b.hubs_location 
		WHERE (b.pdf_batch IS NULL OR b.pdf_batch = '')
        ${sqlIns}  
		AND b.transaction_year='2025'
        GROUP BY b.hubs_location, a.region
        ORDER BY total DESC LIMIT 5;
      `
    } else {
      sql = `
        SELECT  
          b.hubs_location AS hub, 
          a.region, 
          COALESCE(ROUND(SUM(b.amount),2),0) AS total
        FROM asn_claims b 
        LEFT JOIN asn_spx_hubs a ON a.hub = b.hubs_location
        WHERE (b.pdf_batch IS NULL OR b.pdf_batch = '')
          AND b.transaction_year='2025'
        GROUP BY b.hubs_location, a.region
        ORDER BY total DESC LIMIT 5;
      `
    }

    console.log('=======Top 5 Hub processing...');

    // get connection from pool
    const [results] = await db.query(sql);
    
	if (!results || results.length === 0) {
      res.status(200).send('** No Record Yet! ***');
      return;
    }

    // Build your HTML table
    let xtable = `<h2>(${req.params.region.toUpperCase()})</h2>
    <div class="col-lg-8">
      <table class="table"> 
        <thead>
          <tr>
            <th>Region</th>
            <th>Hub Location</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>`;
    results.forEach(row => {
      xtable += `<tr>
        <td>${row.region}</td>
        <td>${row.hub}</td>
        <td align='right'><b>${addCommas(parseFloat(row.total).toFixed(2))}</b></td>
      </tr>`;
    });
    xtable += `</tbody></table></div>`;

    res.status(200).send(xtable);
  } catch (err) {
    console.error('Error processing request:', err);
    res.status(500).json({ error: 'Error' });
  }
});



//================= TOP 5 RIDER
// Your db is already imported
// const db = require('../db'); 

router.get('/getrider/:region/:grpid/:email', async (req, res) => {
  let sql;

  try {
    // Build your SQL
    if (req.params.region !== 'ALL') {
      let sqlIns = '';
      switch (req.params.grpid) {
        case "6": // head coord
          sqlIns = ` AND a.head_coordinator_email = '${req.params.email}' `;
          break;
        case "7": // coord
          sqlIns = ` AND a.coordinator_email = '${req.params.email}' `;
          break;
      }
      sql = `
        SELECT b.full_name AS rider, 
               b.emp_id, 
               b.hubs_location AS hub, 
               a.region, 
               COALESCE(ROUND(SUM(b.amount), 2), 0) AS total,
               b.pdf_batch, 
               b.batch_file,
			   b.transaction_year
        FROM asn_claims b 
        LEFT JOIN asn_spx_hubs a ON a.hub = b.hubs_location 
		WHERE (b.pdf_batch IS NULL OR b.pdf_batch = '')
        ${sqlIns}
        AND b.transaction_year='2025'
        GROUP BY b.full_name,b.emp_id
        ORDER BY total DESC LIMIT 5;
      `;
    } else {
      sql = `
        SELECT b.full_name AS rider, 
               b.emp_id, 
               b.hubs_location AS hub, 
               a.region, 
               COALESCE(ROUND(SUM(b.amount), 2), 0) AS total,
               b.pdf_batch, 
               b.batch_file,
			   b.transaction_year
        FROM asn_claims b
        LEFT JOIN asn_spx_hubs a ON a.hub = b.hubs_location
        WHERE (b.pdf_batch IS NULL OR b.pdf_batch = '')
          AND b.transaction_year='2025'
        GROUP by b.full_name, b.emp_id 		
        ORDER BY total DESC LIMIT 5;
      `;
    }
	
	console.log('=======Top 5 Rider processing...' );

    // Simply use db.query() because `db` is already your pool object
    const [results] = await db.query(sql);

    if (!results || results.length === 0) {
      return res.status(200).send('** No Record Yet! ***');
    }

    let xtable = `<div class="col-lg-8">
      <h2>(${req.params.region.toUpperCase()})</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Rider</th>
            <th align='right'>Amount</th>
          </tr>
        </thead>
        <tbody>`;
      
    results.forEach(row => {
      xtable += `<tr>
        <td>
          ${row.rider}<br>
          ${row.emp_id}<br>
          (${row.region}, ${row.hub})<br>
		  ${row.transaction_year}
        </td>
        <td align='right' valign='bottom'><b>${addCommas(parseFloat(row.total).toFixed(2))}</b>&nbsp;&nbsp;&nbsp;&nbsp;</td>
      </tr>`;
    });
    xtable += `</tbody></table></div>`;

    res.status(200).send(xtable);
  } catch (err) {
    console.error('Error in getrider:', err);
    res.status(500).json({ error: 'Error' });
  }
});

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
	.then((xdb)=>{
		xdb.query(`${sql}`,(error,results) => {	
		
			if ( results.length == 0) {   //data = array 
				console.log('no rec')
				closeDb(xdb);//CLOSE connection
		
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

					closeDb(xdb);//CLOSE connection
		
					res.status(200).send(xtable)				
				
			}//eif
		
		})

	}).catch((error)=>{
		res.status(500).json({error:'Error'})
	}) 
})

const os = require('os')

const getServerIp = () =>{
	const interfaces = os.networkInterfaces();
	const addresses = []

	for ( const name in interfaces){
		for( const iface of interfaces[name]){
			if(iface.family==='IPv4' && !iface.internal ){
				addresses.push(iface.address)
			}
		}
	}//===endfor

	return addresses
}


//============search by id or name
router.get('/getrecord/:enum/:ename/:region/:grpid/:email/:filter', async (req, res) => {
	const { enum: emp_id, ename, region, grpid, email, filter} = req.params;

	let sqlins = '', sqlzins = '',sqlfilter='', sqlgroup = ''

	// Build search condition
	if (ename !== 'blank' && emp_id !== 'blank') {
		sqlzins = `(b.emp_id LIKE '%${emp_id}%' OR UPPER(b.full_name) LIKE '%${ename.toUpperCase()}%')`;
	} else if (emp_id !== 'blank') {
		sqlzins = `b.emp_id = '${emp_id}'`;
	} else if (ename !== 'blank') {
		sqlzins = `UPPER(b.full_name) LIKE '%${ename.toUpperCase()}%'`;
	}

	//filter type
	if (filter === 'new') {
		sqlfilter = ' b.pdf_batch IS NULL' 
		sqlgroup = ' b.batch_file '
	}else{
		sqlfilter = ` b.pdf_batch IS NOT NULL OR  b.pdf_batch <> '' `;
		sqlgroup =	' b.pdf_batch '
	}


	try {
		// Build conditional SQL for region and group
		if (region !== 'ALL') {
			switch (grpid) {
				case '6': // head coord
				sqlins = ` AND a.head_coordinator_email = '${email}' `;
				break;
				case '7': // coord
				sqlins = ` AND a.coordinator_email = '${email}' `;
				break;
			}

			var sql = `
			SELECT 
					b.id,
					b.full_name AS rider, 
					b.emp_id, 
					b.hubs_location AS hub, 
					a.region, 
					count(b.id) as id_count,
					COALESCE(ROUND(SUM(b.amount), 2), 0) AS total,
					b.pdf_batch,
					b.batch_file,
					b.transaction_year,
					c.full_name as downloaded_by
				FROM asn_claims b
				LEFT JOIN asn_spx_hubs a ON a.hub = b.hubs_location
				left join asn_users c on c.id = b.download_empid
				WHERE ${sqlzins}
					${sqlins}
					AND (b.pdf_batch IS NULL OR b.pdf_batch <> '')
					AND b.transaction_year='2025'
				GROUP BY b.emp_id,b.full_name,b.pdf_batch  
				ORDER BY b.batch_file, b.full_name;`;

		} else {

			// No region filter, show all SUPER-USERS here 
			var sql = `
				SELECT 
					b.id,
					b.full_name AS rider, 
					b.emp_id, 
					b.hubs_location AS hub, 
					a.region, 
					count(b.id) as id_count,
					COALESCE(ROUND(SUM(b.amount), 2), 0) AS total,
					b.pdf_batch,
					b.batch_file,
					b.transaction_year,
					b.download_empid,
					c.full_name as downloaded_by
				FROM asn_claims b
				LEFT JOIN asn_spx_hubs a ON a.hub = b.hubs_location
				left join asn_users c on c.id = b.download_empid
				WHERE ${sqlzins}
					AND ( ${sqlfilter} )
					AND b.transaction_year='2025'
				GROUP BY b.full_name, ${sqlgroup}
				ORDER BY b.batch_file, b.full_name;`;
		}

		console.log('===get Employee id/name Processing:', sql);

		// Use your existing db pool
		const [results] = await db.query(sql);

		if (!results || results.length === 0) {
			return res.status(200).send('**No Record Found***');
		}

		console.log('===get Employee id/name Results:', results.length);
		let totalAmt = 0;
		
		results.forEach(r => {
			r.total = parseFloat(r.total).toFixed(2);
			totalAmt += parseFloat(r.total);
		});

		/**** take out sorting of totals
		// Sort by:
		results.sort((a, b) => {
		// descending for total
		if (b.total !== a.total) {
			return b.total - a.total;
		}
		// ascending for emp_id
		return a.emp_id.localeCompare(b.emp_id);
		// add more criteria if needed
		});
		****/ 
		const totalFormatted = addCommas(parseFloat(totalAmt).toFixed(2));
		const curr_date = strdates();
		let xpdfbatch, xpdfbutton;
		
		// Build the HTML table for output
		let xtable = `
		<h2>(${region.toUpperCase()}) </h2>
		<table class='table' width='60%'>
			<thead>
			<tr>
				<th>Rider</th>
				<th align='right'>Amount</th>
			</tr>
			</thead>
			<tbody>`;

		results.forEach(r => {

			if( r.pdf_batch!==null ){

				xpdfbatch = 	`ATD # ${r.pdf_batch}<br>
				Downloaded by: ${(r.downloaded_by==null?'NO ID':r.downloaded_by)}`
				xpdfbutton =` <a href='javascript:void(0)' onclick="asn.printPdf('${r.pdf_batch}','${r.download_empid}')" class='btn btn-primary btn-sm'>RE-PRINT ${r.pdf_batch}</a>
				 <a href='javascript:void(0)' onclick="asn.resetPdf('${r.pdf_batch}','${r.download_empid}')" class='btn btn-danger btn-sm'>RESET ${r.pdf_batch}</a>
				`
				
			}else{
				xpdfbatch = "ATD PDF NOT YET PROCESSED"	
				xpdfbutton =` <a href='javascript:void(0)' onclick="asn.addtoprint('${r.id}','${r.rider}','${r.emp_id}')" class='btn btn-primary btn-sm'>Add to Print</a>`
			}//eif

			xtable += `<tr>
				<td>
				Rec# ${r.id}<br>
				Rec Count: ${r.id_count}<br>
				<b>${r.rider.toUpperCase()}</b>&nbsp;<i style='color:green;font-size:2em;' class='ti ti-circle-check lets-hide' id='${r.id}'></i><br>
				${r.emp_id}<br>
				(${r.region || 'NO REGION'}, ${r.hub})<br>
				${r.batch_file}<br>
				${r.transaction_year}<br>
				<span style='color:red'>${xpdfbatch}</span><br>
				${xpdfbutton}&nbsp;
				
				</td>
				<td align='right'><b>${addCommas(parseFloat(r.total).toFixed(2))}</b></td>
			</tr>`;
		});// ===end results.forEach



		xtable += `
			<tr>
				<td align='right'><b>TOTAL :</b></td>
				<td align='right'><b>${addCommas(parseFloat(totalAmt).toFixed(2))}</b></td>
			</tr>
			<tr>
				<td colspan='2'>
				<button id='download-all-btn' type='button' class='btn btn-primary' onclick="asn.printPdf('new','0')"><i class='ti ti-download'></i>&nbsp;Download ALL PDF</button>
				<button id='download-btn' type='button' class='btn btn-primary' disabled onclick="asn.printPdf('new','0')"><i class='ti ti-download'></i>&nbsp;Download PDF</button>
					<!-- Continuation from previous code snippet -->
				<button id='download-close-btn' type='button' class='btn btn-warning' onclick="asn.hideSearch()"><i class='ti ti-x'></i>&nbsp;Close</button>
				</td>
			</tr>
			</tbody>
			</table>
			`;

		// Send the constructed HTML as response
		res.status(200).json({text:xtable, xdata:results});
	} catch (err) {
		console.error('Error processing request:', err);
		res.status(500).json({ error: 'Error' });
	}
});
//=================END GET RECORD BY ID OR NAME =============//


router.get('/getchart', async (req, res) => {
	console.log('===FIRING getchart() ====')
	try {

		const sql = `SELECT
				( case when  b.region is  not null  then b.region  ELSE 'NO REGION' END )  as region ,
					-- Sum where pdf_batch is not empty
					ROUND(SUM(CASE WHEN (c.pdf_batch <> '' or pdf_batch is not null) THEN c.amount END), 0) AS with_atd,
					-- Sum where pdf_batch is empty
					ROUND(SUM(CASE WHEN (c.pdf_batch = '' or c.pdf_batch is null) THEN c.amount END), 0) AS no_atd
				FROM
					asn_claims c
				LEFT JOIN
					asn_spx_hubs b ON c.hubs_location = b.hub
				WHERE c.transaction_year = '2025'	
				GROUP BY
					b.region;`

		const [chartrow] = await db.query(sql);

		// Your chart generation logic here
		res.status(200).send(chartrow);

	} catch (err) {
		console.error('Error processing request:', err);
		res.status(500).json({ error: 'Error' });
	}
});

//================ RESET PDF=================//
router.get('/resetpdf/:batch',async(req,res)=>{


	//res.status(200).json({status:true})
	console.log('**** RESET PDF **** ', req.params.batch)
	
	let sql2 = 	`UPDATE asn_claims SET download_empid = null , pdf_batch = null WHERE pdf_batch = ? ` // Use the update conditions
	console.log('==UPDATING ==', req.params.batch)
	
	// // Step 1: Update download_empid with whois
	try {
		const [rows] = await db.query( sql2,[ req.params.batch]);
		
		if(rows.affectedRows > 0){
			return res.status(200).json({status:true})
		}//eif


	} catch (err) {
		console.error(`Error updating ${newbatch}:`, err);
		return res.status(500).json({ error: `Failed to update for batch ${newbatch}` });
	}
})



//================= GET LIST PDF =================//

router.get('/getlistpdf/:limit/:page', async(req,res) => {
	
	console.log(`firing getlistpdf/${req.params.limit}/${req.params.page}`)

	const limit_num = 30 //take out Mar 27,2025 req.params.limit, make a hard value of 30
	let nStart = 0	
	let page = req.params.page
	
	connectDb() 
	.then((xdb)=>{
		
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
					
					closeDb(xdb)

					//console.log( main )
					res.send(main) //output result
				})//endquery
								
			}//eif 
		
		})//==end db.query 
		
	}).catch((error)=>{
		res.status(500).json({error:'No Fetch Docs'})
	})		

})//end pagination


//=======================function to get pdf batch number=================//
//this is used to get the next pdf batch number
const pdfBatch =   () =>{
	return new Promise((resolve, reject)=> {
		const sql = `Select sequence from asn_pdf_sequence;`
		let xcode, seq
	
		connectDb()
		.then((xdb)=>{
			xdb.query(`${sql}`,(error,results) => {

				if(results.length > 0){
					
					seq = results[0].sequence+1
					//console.log( seq.toString().padStart(5,"0") )
					const usql = `update asn_pdf_sequence set sequence = ${seq}`
					
					xdb.query(`${usql}`,(error,udata) => {
					})
	
					xcode =`ASN-${seq.toString().padStart(5,"0")}`
					
					//onsole.log('==inside pdfBatch()===',seq, xcode )
					
					closeDb(xdb)

					//console.log(xcode)
					resolve( xcode )
				}else{
					reject(error)
				}//eif
				
			})
		}).catch((error)=>{
			reject(error)
			res.status(500).json({error:'Error'})
		})
	})


}

router.get('/getbatch', async(req,res)=>{
	
	 let xxx =  await pdfBatch()
	console.log('getting batch',xxx)
	res.status(200).json({batch:xxx})
})



//======= CHECK PDF FIRST BEFORE CREATING ==============
router.post('/printpdf/:grp_id/:whois/:batch/:xbatch', async(req, res)=>{

	const {grp_id, whois, batch, xbatch} = req.params;

	console.log('printPDF()===', batch,xbatch, whois, grp_id)

	try{

		//**************************if blank batch this is fresh print
		//******************************* FOR NEW RECORDS ****************************** */
		if(xbatch==="" || xbatch === 'undefined' || xbatch === null || xbatch === 'new') {

			const myObjects = req.body.myObjects

			if(!Array.isArray(myObjects) || myObjects.length === 0) {
				return res.status(400).json({ error: 'Invalid input data' });
			}

			// Build the WHERE clause dynamically and prepare the values for the query
			let conditions = [];
			let updateconditions = [];
			let values = [];

			for (const obj of myObjects) {
				if (obj.name && obj.empid) { // Validate that both properties exist
					conditions.push('(full_name = ? AND emp_id = ?)');
					updateconditions.push(`(full_name = '${obj.name}' and emp_id = '${obj.empid}')`); // Prepare for update
					values.push(obj.name, obj.empid); // Add the values in the correct order
				} else {
					console.warn("Skipping object with missing name or id:", obj);
				}
			}

			//Combine the conditions with OR
			let whereClause = conditions.length > 0 ? conditions.join(' OR ') : '1=0';  // If conditions is empty return 1=0 which will always return nothing

			//whereClause += ` AND (pdf_batch is null or pdf_batch = "") AND transaction_year = '2025'`; // Add the transaction year condition
			// Build the complete SQL query
			let sql = `
				SELECT
				emp_id,
				full_name as rider,
				category,
				hubs_location as hub, 
				track_number as track,
				claims_reason as reason,
				round(SUM(amount),2) as total,
				pdf_batch
				FROM asn_claims WHERE ${whereClause}
				GROUP BY emp_id, full_name,track_number,pdf_batch`; // Use parameterized query
				
			// Execute the query
			const [rows, fields] = await db.query(sql, values );// Pass values as an array

			const newbatch = batch; // Get the new batch number	
			//console.log( sql, newbatch, rows)

			let sql2 = 	`UPDATE asn_claims SET download_empid = ? , pdf_batch = ? WHERE ${updateconditions.join(' OR ')}`; // Use the update conditions
			console.log('==UPDATING ==', newbatch )
			
			// // Step 1: Update download_empid with whois
			try {
				await db.query( sql2,[whois, newbatch]);
			} catch (err) {
				console.error(`Error updating ${newbatch}:`, err);
				return res.status(500).json({ error: `Failed to update for batch ${newbatch}` });
			}

			let total_amt = 0;

			rows.forEach(r => {
				r.total = parseFloat(r.total).toFixed(2);
				total_amt += parseFloat(r.total);
			});

			const totalFormatted = addCommas(parseFloat(total_amt).toFixed(2));
			const totalFixed = parseFloat(total_amt).toFixed(2);
			const curr_date = strdates();
			
			//=== CREATE PDF ===========
			asnpdf.reportpdf( rows, curr_date, totalFormatted, totalFixed, newbatch)
			.then(  reportfile =>{

				console.log('==REPORT PDF SUCCESS!===', reportfile)

				// *******************Download PDF******************************
				const pdfDirectory = path.join(__dirname, '..'); //Correct // Go up one level to the project root
				const fullFilePath = path.join(pdfDirectory, reportfile);  // Create the full path
				const reportfileName = 'http://10.202.213.221:10020/' + path.basename(reportfile); // Get the file name from the path


				console.log("Full PDF Path:", fullFilePath, reportfileName);  // Check the full path!

				console.log('=====update val', values)

				//============ force download

				res.download(fullFilePath, (err) => {  // Use fullFilePath and reportfile name
					if (err) {
						console.error('Error in Downloading',  err);
						// Optionally, handle cleanup if needed
						return res.status(500).send(`Error in Downloading ${reportfile}`);
					}else{
						
						console.log('Successfully downloaded NEW FILE :', fullFilePath);
						
						fs.unlink(fullFilePath, (unlinkerr) => {
							if (unlinkerr) {
								console.error('Error deleting temporary file:', unlinkerr);
							} else {
								console.log('Successfully deleted temporary NEW FILE:', fullFilePath);
							}
						});
						

					}
					
				});

				
			})

			
			//******************END DOWNLOAD ******************* */
				

		}else{
			//************ REPRINT WITH BATCH FILE EXISTING ***************** */
			// If batch is defined, fetch records for the given emp_id and pdf_batch
			console.log('==REPRINT / NEW BATCH ==', batch, whois)
			const sql = `
				SELECT emp_id,
						emp_id,
					full_name as rider,
					category,
					hubs_location as hub, 
					track_number as track,
					claims_reason as reason,
					round(SUM(amount),2) as total,
					pdf_batch
				FROM asn_claims
				WHERE pdf_batch = ? 
				GROUP BY emp_id, full_name,track_number,pdf_batch
				ORDER BY full_name;`;

			try {
				const [rows] = await db.query(sql, [ batch]);

				if (rows.length === 0) {
					return res.status(404).json({ error: 'No records found' });
				}

				
				let total_amt = 0;
				
				rows.forEach(r => {
					r.total = parseFloat(r.total).toFixed(2);
					total_amt += parseFloat(r.total);
				});

				const totalFormatted = addCommas(parseFloat(total_amt).toFixed(2));
				const totalFixed = parseFloat(total_amt).toFixed(2);
				const curr_date = strdates();

				//=== CREATE PDF ===========
				asnpdf.reportpdf( rows, curr_date, totalFormatted, totalFixed, batch)
				.then( async reportfile =>{

					console.log('==REPORT PDF SUCCESS!===', reportfile)

					// *******************Download PDF******************************
					const pdfDirectory = path.join(__dirname, '..'); //Correct // Go up one level to the project root
					const fullFilePath = path.join(pdfDirectory, reportfile);  // Create the full path

					console.log("Full PDF Path:", fullFilePath);  // Check the full path!

					let sql2 = 	`UPDATE asn_claims SET download_empid = ?  WHERE pdf_batch = ?`; // Use the update conditions
					console.log('==UPDATING==', batch )
					
					// Step 1: Update download_empid with whois
					try {
						await db.query( sql2,[whois, batch]);
					} catch (err) {
						console.error(`Error updating download_empid: ${batch}`, err);
						return res.status(500).json({ error: `Failed to update download_empid ${batch}` });
					}
	 				
					//============ force download

					res.download(fullFilePath, (err) => {  // Use fullFilePath and reportfile name
						if (err) {
							console.error('Error in Downloading',  err);
							// Optionally, handle cleanup if needed
							return res.status(500).send(`Error in Downloading ${reportfile}`);
						}else{
							
							console.log('Successfully downloaded REPRINT FILE:', fullFilePath);
							
							fs.unlink(fullFilePath, (unlinkerr) => {
								if (unlinkerr) {
									console.error('Error deleting temporary REPRINT file:', unlinkerr);
								} else {
									console.log('Successfully deleted temporary REPRINT file:', fullFilePath);
								}
							});
						}//eif 
						
					});

					
				}) //=========end asndf.reportpdf

			
				//******************END DOWNLOAD ******************* */

			} catch (err) {
				console.error('Error generating report:', err);
				res.status(500).json({ error: 'Error generating report' });
			}//=========== end try

		}//eif

	}catch(error){
		console.error('Error in checkpdf:', error);
		res.status(500).json({error:'Error'})
	}	//====end try

})


//====== CLEANUP PDF

router.get('/deletepdf/:batch', async(req, res) => {

	const batchFile = req.params.batch
	const batchFileName = batchFile.includes('.pdf') ? batchFile : `${batchFile}.pdf`

 	Utils.deletePdf( `${batchFileName}`)
	.then(x => {
		if(x){
			
			//=== RETURN RESULT ===//
			console.log('*** Deleted temp file ', batchFile)
			
			//update patient record
			//closeDb(xdb)
			res.status(200).json({status:true})

		}//eif
	})
})//end Utils.deletepdfse{



//===test menu-submenu array->json--->
router.get('/menu/:grpid', async(req,res)=>{
	console.log('=== menu()')


	connectDb()
    .then((xdb)=>{ 

		sql2 = `SELECT menu,
			menu_icon,
			grouplist, 
			JSON_ARRAYAGG( 
			JSON_OBJECT( 'sub', submenu, 'icon', submenu_icon, 'href', href )) AS list 
			FROM asn_menu 
			WHERE FIND_IN_SET('${req.params.grpid}', grouplist)> 0 
			GROUP BY menu 
			ORDER BY sequence;`
		//console.log(sql)
		//console.log(sql2)

		xdb.query( sql2 ,  (error, results)=>{
			//console.log( error,results )
			res.status(200).json( results )
		})

	}).catch((error)=>{
        res.status(500).json({error:'Error'})
    }) 

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
				.then((xdb)=>{
			
					db.query(sqlu,(error,results) => {	
						console.log('otp update==', sqlu, results.changedRows)
					})
					
					closeDb(xdb);//CLOSE connection
			
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
	.then((xdb)=>{

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
		
		closeDb(xdb);//CLOSE connection


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
    .then((xdb)=>{
        
        db.query( sql , null ,(err,data) => { 
			
			if ( data.length == 0) {  //data = array 
				console.log('===no rec===')	
                res.status(400).json({
					voice:"No Matching Record!",
					found:false
				})  
				
				closeDb(xdb);//CLOSE connection
            
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
                closeDb(xdb);//CLOSE connection
                
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
    .then((xdb)=>{

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
				
				closeDb(xdb);//CLOSE connection
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
				
                closeDb(xdb);//CLOSE connection
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
	.then((xdb)=>{
		
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
