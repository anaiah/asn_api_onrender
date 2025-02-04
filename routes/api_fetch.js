/*

AUTHOR : CARLO DOMINGUEZ

multiple comment //// => IMPORTANT
*/
const express = require('express')

const multer = require('multer')

const cookieParser = require('cookie-parser')

const path = require('path')

const sharp = require('sharp')

const formdata = require('form-data')

const jsftp = require("jsftp");

const fetch = require('node-fetch')

const IP = require('ip')

const iprequest = require('request-ip')

const chrome = require('chrome-launcher')

const querystring = require("querystring")

const nodemailer = require("nodemailer")

const router = express.Router()

const fs = require('fs');

const pdf = require('pdf-creator-node')

const QRCode = require('qrcode')

const { connectDb,closeDb}  = require('../db');

const app = express()

app.use( cookieParser() )


connectDb()
.then((db)=>{
  console.log("====API.JS VANTAZTIC-TWO ROUTER MYSQL CONNECTION SUCCESS!====");
      closeDb(db);
})                        
.catch((error)=>{
    console.log("***API.JS ERROR, CAN'T CONNECT TO MYSQL DB!****",error.code);
});


//==========serve index
router.get('/', async ( req, res)=>{
	console.log('MAIN PAGE LOADING... INDEX.HTML')

	//===delete cookie on path
	res.clearCookie(`the_voice`, {path : '/'})
	res.clearCookie(`fname`, {path : '/'})
	res.clearCookie(`pic`, {path : '/'})
	res.clearCookie(`approver_type`, {path : '/'})
	res.clearCookie(`ip_addy`, {path : '/'})
	
	//res.end("WOW CONGRATS, PRAISE GOD")
	///res.sendFile(path.join(__dirname , '../srctwo/index_orig.html'));
	res.sendFile(path.join(__dirname , '../srctwo/login.html'));

})


router.get('/xapi/booga',async(req,res)=>{
	connectDb()
    .then((db)=>{
        db.query(`select distinct(MONTHNAME(a.date_add)) as 'xmonth',
		a.type,
		count(a.date_add) as 'count'
		from equipment a
		where status in (1,2)
		group by MONTHNAME(a.date_add),a.type`, null ,(err,data) => { 
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
				//res.cookie('Rent',`${data[0].status_count}`)
				//res.cookie('Sales',`${data[1].status_count}`)
				
				console.log( data)
				res.status(200).json({
					result	: 	data
                })
				
                closeDb(db);//CLOSE connection
                //console.log("===MYSQL CONNECTON CLOSED SUCCESSFULLY===")
            }//EIF
			
		})//END QUERY 
	
	}).catch((error)=>{
        res.status(500).json({error:'No Fetch Docs'})
    })})


//===login
router.get('/xapi/loginpost/:uid/:pwd',async(req,res)=>{
    //console.log('login=>',req.params.uid,req.params.pwd)
    
	connectDb()
    .then((db)=>{

		let sql =`select * from vantaztic_users where email='${req.params.uid}' and pwd='${req.params.pwd}'` 
        
        db.query( sql, null ,(err,data) => { 
			//console.log(data.length)
		   console.log(sql)
			if ( data.length == 0) {  //data = array 
				console.log('no rec')
                res.status(400).json({
					message: "No Matching Record!",
					voice:"No Matching Record!",
					found:false
				})  
				
				closeDb(db);//CLOSE connection
                //console.log("===MYSQL CONNECTON CLOSED SUCCESSFULLY===")

            }else{  //=========== ON SUCCESS!!! ============

				//get ip address
				//const ipaddress = IP.address()
				let ipaddress = iprequest.getClientIp(req)

				if (ipaddress.substring(0, 7) == "::ffff:") {
					ipaddress = ipaddress.substring(7)
				  }

				//console.log( data[0].full_name )
				//cookie
				res.cookie(`the_voice`,`Welcome to Vehn-tehztic ${data[0].full_name}! `)
				res.cookie('fname',`${data[0].full_name.toUpperCase()}`)
				res.cookie('pic', `assets/img/avatars/${data[0].pic}`)
				res.cookie('approver_type',`${data[0].approver_type}`)
				res.cookie('ip_addy',`${ipaddress}`)

				res.status(200).json({
					email	: 	data[0].email,
                    message	: 	`Welcome to Vantaztic ${data[0].full_name.toUpperCase()}! `,
					voice	: 	`Welcome to Vehn-tehztic ${data[0].full_name}! `,		
                    grp_id	:	data[0].grp_id,
					pic 	: 	data[0].pic,
					ip_addy :   ipaddress,
					found:true
                })
				
				//call express method, call func
				//return res.redirect(`/xapi/changepage/${data[0].grp_id}`)

                closeDb(db);//CLOSE connection
                //console.log("===MYSQL CONNECTON CLOSED SUCCESSFULLY===")
                
            }//EIF
		
	   })//END QUERY 
       
    }).catch((error)=>{
        res.status(500).json({error:'No Fetch Docs'})
    }) 
})


//=== html routes
router.get('/admin' , async (req,res)=>{
	res.sendFile(path.join(__dirname , '../srctwo/admin.html'))
})

router.get('/dashboard' , async (req,res)=>{
	res.sendFile(path.join(__dirname , '../srctwo/dashboard.html'))
})

//=== end html routes


//=== post image 

//pic storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './srctwo/assets')
    },
  
    filename: function(req, file, cb) {
		///file.fieldname = form input field name='uploaded_file'
    	cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
		///cb(null, req.body.serial_image+path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage })

router.post('/xapi/postimage', upload.single('uploaded_file') ,  async (req, res) => {
	
	console.log('===FIANAL N ATLAGA', req.body.serial_image,'extenson',path.extname(req.file.originalname) )
	
	let extname 

	if(path.extname(req.file.originalname)===".jpg" || path.extname(req.file.originalname)==='.jpeg' || path.extname(req.file.originalname)==='.png' || path.extname(req.file.originalname)==='.gif'){
		extname = ".jpg"
	}else{
		extname = path.extname(req.file.originalname)
	}
	
	req.file.filename = req.body.serial_image + extname // rename file + file extension (path.extname)

	console.log('ETO NA FILENAME ', req.file.filename )

	const { filename: image } = req.file;

	///console.log('REQ FILE TO===',req.file,'===REQ FILE PATH==', req.file.path, image)

	await sharp(req.file.path)
	 //.resize(200, 200)
	 .jpeg({ quality: 30 })
	 .toFile(
		 path.resolve(req.file.destination,'resized',image)
	 )
	 fs.unlinkSync(req.file.path)

	 res.redirect('/admin')

})



//===========for IAN / KAT'Z APPROVAL ==============
router.put('/xapi/equipmentapprove/:po_number/:atype/:dateapprove', async (req, res) => {
	
	////console.log("PO",req.params.po_number)
	
	let aParams, sql, sqli
	
	if(req.params.atype=="1"){
		cstr = ` approver_1 = 1, approver_1_date ='${req.params.dateapprove}' `
	}else{
		cstr = ` approver_2 = 1, approver_2_date ='${req.params.dateapprove}' `
	}
	
	
			//=== update first , approve
			sql = `UPDATE equipment_client SET ${cstr}
			WHERE po_number =?`
			
			sqli = `select distinct(b.po_number)
			,b.invoice_number
			,a.serial
			,upper(a.eqpt_no) as 'eqpt_no'
			,upper(a.type) as 'type'
			,trim(replace(substring_index(substring(a.equipment_value,locate('eqpt_description',a.equipment_value)+ length('eqpt_description')+ 2),',',1),'"',''))
			as 'description'
			,sum(b.qty) as 'qty'
			,b.price as price
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
			where c.po_number = ? 
			and ( approver_1 = 1 and approver_2 = 1 ) 
			group by b.po_number
			,b.invoice_number
			,a.serial
			,a.eqpt_no
			,a.type
			,trim(replace(substring_index(substring(a.equipment_value,locate('eqpt_description',a.equipment_value)+ length('eqpt_description')+ 2),',',1),'"',''))
			,b.price
			,b.approved
			,c.approver_1
			,c.approver_2
			,c.client_info
			,c.date_created
			,c.grand_total
			`
			connectDb()
			.then((db)=>{
				db.query(`${sql}; ${sqli}`, [ req.params.po_number, req.params.po_number ] ,(error,results) => {	
					
					///console.log("eto resulta ", sqli, "results=>",results)
					let bitmaps, logos

					if(results[1].length>0){

						let release;
						do {
							release = Math.floor(Math.random() * 999);
						} while ( release < 100);

						////console.log('pdf',results[1])
						const hostname = 'http://'+req.headers.host +'/xapi/release/'+ release +`/${req.params.po_number}`
						console.log(hostname)

						//===== create QR code first ===========//
						QRCode.toFile( 'x.png', hostname, {
							errorCorrectionLevel: 'H',
							quality: 0.3,
							color: {
								dark:"#5A5C65",
								light:"#0000"
							}
							
						},  (err) =>{
							if (err){
								console.log('QR ERR',err)
							}else{
								console.log('=== QR SUCCESS!!! ===')

								//===================START CREATE PDF ======================//
								let html = fs.readFileSync("template.html", "utf8")

								const bitmap = fs.readFileSync( path.join(__dirname ,'..','vantaztic_logo.png') );
								const logo = bitmap.toString('base64');

								//console.log('QR File', logos)

								let options = {
									format: "A4",
									orientation: "portrait",
									border: "5mm",
									header: {
										height: "5mm"
									},
									footer: {
										height: "9mm",
										contents: {
											first: '<span class="pagex">Page 1</span>',
											2: '<span class="pagex">Page 2</span>',// Any page number is working. 1-based index
											default: '<span class="pagex">{{page}}</span>/<span class="pagex">{{pages}}</span>', // fallback value
											last: 'Last Page'
										}
									}
								};

								let xclient

								xclient = JSON.parse(results[1][0].client_info)
								let xd = new Date(req.params.dateapprove).toLocaleString('en-us',{month:'long',day:'numeric', year:'numeric'})

								bitmaps = fs.readFileSync('x.png');
								logos = bitmaps.toString('base64');

								let document = {
									html: html,
									childProcessOptions: {
										env: {
										OPENSSL_CONF: '/dev/null',
										},
									},
									
									data: {

										qr: logos,
										logos:logo,
										data: results[1],
										po_number:req.params.po_number,
										date_approve: xd,
										client: xclient.client_name.toUpperCase(),
										address: xclient.delivery_site.toUpperCase(),
										trucking: xclient.delivery_truck.toUpperCase(),
										driver: xclient.delivery_driver.toUpperCase(),
										plateno: xclient.delivery_plateno.toUpperCase(),
										phone: xclient.company_phone,
										email: xclient.company_email,
										remarks: xclient.client_remarks
									},
									path: path.join(__dirname, '..', 'dr', `DR_${req.params.po_number}.pdf`),
									type: "",
								}

								pdf
								.create(document, options)
								.then((res) => {
									console.log('pdf', res);
									fname = res.filename

									const xpath = path.join(__dirname, '..', 'dr', `DR_${req.params.po_number}.pdf`)
									
									fs.access(xpath, fs.F_OK, (err) => {
										if (err) {
											console.error('FILE ERR',err)
											return
										}
										console.log('=== PDF FILE EXISTS!!! ===')

										//======== beta test upload to vantaztic.com =====//
										let imageBuffer = fs.createReadStream( path.join(__dirname, '..',`/dr/DR_${req.params.po_number}.pdf` ) )
																				
										const ftp = new jsftp({
											host: "vantaztic.com",
											//port: 3331, // defaults to 21
											user: "vantazti", // defaults to "anonymous"
											pass: "13lyth3Rup1d0" // defaults to "@anonymous"
										});
										
										fs.readFile( path.join(__dirname, '..',`/dr/DR_${req.params.po_number}.pdf`) , (err, buffer)=> {
											if(err) {
												console.error(err);
												callback(err);
											}
											else {
												ftp.put(buffer, `public_html/vanz/dr/DR_${req.params.po_number}.pdf`, (err)=> {
													if (err) {
														console.error(err)
													}
													else {
														console.log (`=== DR_${req.params.po_number}.pdf - uploaded successfuly!!!===`);
														let seq= Math.floor(Math.random() * 999)
														chrome.launch({
															startingUrl: `https://vantaztic.com/vanz/mail.php?f=DR_${req.params.po_number}.pdf&seq=${seq}&po=${req.params.po_number}`,
															chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
														}).then(chrome => {
															console.log(`Chrome debugging port executing vantaztic @ ${chrome.port}`);
														})

														ftp.raw("quit", (err, data) => {
															if (err) {
															  return console.error('ERROR FTP'+ err);
															}
														   
															console.log("==Bye!!!");
														})
													 
														/*
														//===== fire PHP =====//
														fetch(`https://vantaztic.com/vanz/mail.php?f=DR_${req.params.po_number}.pdf&seq=${seq}&po=${req.params.po_number}`, {
															method: "get"
														})
														.then(res => res.text())
														.then(ret=>{
															console.log('====PHP ',ret);

														});
														*/
														
														//=================END PHP ==============//
													}
												}) // ============== END FTP ====================//
											}
										})
										
									})//end check if pdf exist
									
								})
								.catch((error) => {
									console.error(error);
								});
								//==================END CREATE PDF================//
							}//============eif ===============//
							
						}) //========== END QR CODE =============//
					}//eif both approver approved
					
					closeDb(db);//CLOSE connection
					
				})
			}).catch((error)=>{
				res.status(500).json({error:'Error'})
			}) 

	//=== RETURN RESULT ===//
	res.json({
		message: "UPDATED Successfully!",
		voice:"Equipment Updated Successfully!"
	})

})

///==========TAG FOR RELEASE =======///
router.get('/xapi/release/:random/:po_number', async (req, res) => {
	
	sql = `select * from equipment_client
			where isnull(release_date) and po_number = ${req.params.po_number}`
		
	connectDb()
	.then((db)=>{
	
		db.query(sql, null ,(error,data) => {	
			if(data.length >0){
	
				//console.log( new date())
				let today = new Date() 
				const dd = String(today.getDate()).padStart(2, '0')
				const mm = String(today.getMonth() + 1).padStart(2, '0') //January is 0!
				const yyyy = today.getFullYear()

				today = yyyy+'-'+ mm + '-' + dd
						
				sql = `update equipment_client set release_date = '${today}'`
				
				db.query(sql, null ,(error,data) => {	
				})
				
				closeDb(db)

				res.send(`<!DOCTYPE html>
				<html lang="en">
					<head>
						<meta charset="UTF-8">
						<meta http-equiv="X-UA-Compatible" content="IE=edge">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<title>Vantaztic Inc</title>
						<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0/dist/css/bootstrap.min.css" rel="stylesheet">
					</head>
					<body>
						<div class="vh-100 d-flex justify-content-center align-items-center">
							<div class="col-md-4">
								<div class="border border-3 border-success"></div>
								<div class="card  bg-white shadow p-5">
									<div class="mb-4 text-center">
										<svg xmlns="http://www.w3.org/2000/svg" class="text-success" width="75" height="75"
											fill="currentColor" class="bi bi-check-circle" viewBox="0 0 16 16">
											<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
											<path
												d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z" />
										</svg>
									</div>
									<div class="text-center">
										<h1>PO ${req.params.po_number} OK FOR RELEASE</h1>
									</div>
								</div>
							</div>
						</div>
					</body>
				</html>`)
			}else{
				res.send(`<!DOCTYPE html>
				<html lang="en">
					<head>
						<meta charset="UTF-8">
						<meta http-equiv="X-UA-Compatible" content="IE=edge">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<title>Vantaztic Inc</title>
						<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0/dist/css/bootstrap.min.css" rel="stylesheet">
					</head>
					<body>
						<div class="vh-100 d-flex justify-content-center align-items-center">
							<div class="col-md-4">
								<div class="border border-3 border-danger"></div>
								<div class="card  bg-white shadow p-5">
									<div class="mb-4 text-center">
										<svg xmlns="http://www.w3.org/2000/svg" class="text-danger" width="75" height="75"
											fill="currentColor" class="bi bi-x-circle" viewBox="0 0 16 16">
											<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
											<path
												d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z" />
										</svg>
									</div>
									<div class="text-center">
										<h1>ATTENTION!!! PO ${req.params.po_number} WAS ALREADY TAGGED FOR RELEASE!</h1>
									</div>
								</div>
							</div>
						</div>
					</body>
				</html>`)
			}
		})
	}).catch((error)=>{
		res.status(500).json({error:'No Fetch Docs'})
	})
	
})

//===========UPDATE EQUIPMENT SALES FOR PURCHASE ORDER =================//
router.put('/xapi/equipmenttagpost/:datecreate', async (req, res) => {
		
	let mydata = JSON.parse( req.body.post_data )
	let clientinsert = 0

		////console.log('equipmenttagpost()',mydata)
		
		clientinsert = 1

		//========LOOP IN SHOPPING CART =============//
		for (let key in mydata) {
			
			let xdata  = JSON.parse(mydata[key].data)
			///console.log(xdata.serial)
			sqli = `INSERT INTO equipment_sales (id, po_number, invoice_number, qty, price, sale_price, total ) 
			VALUES(?,?,?,?,?,?,?)`
			
			let aParams_i = [
				parseInt(mydata[key].id),
				req.body.client_po,
				req.body.client_invoice,
				parseInt(mydata[key].qty),
				parseFloat(mydata[key].price),
				parseFloat(mydata[key].sale),
				( parseInt(mydata[key].qty) * mydata[key].sale )  
			]

			//===========insert into equipment_sales table
			connectDb()
			.then((db)=>{	
				console.log( 'equipmenttagpost()',sqli ,aParams_i )

				db.query(sqli, aParams_i, (err, result)=>{
					if(err){
					}else{
						////console.log( 'equipmenttagpost() ETO RESULT NG QUIPMENT SALES', result)
						return result
					}
				})

				closeDb(db)

			}).catch((error)=>{
				res.status(500).json({error:'Error'})
			})

			/*  orig
			sqlu = `UPDATE equipment SET qty = (qty-${parseInt(mydata[key].qty)}) , 
					total_price = ( qty * price )
					*/
			sqlu = `UPDATE equipment SET qty = (qty-${parseInt(mydata[key].qty)})	
			WHERE equipment_id=?`

			let aParams_u = [ mydata[key].id ]
			
			new Promise( resolves =>{
				setTimeout( ()=>{
					
					//===========insert into equipment_CLIENT table once only
					if(clientinsert == "1"){
						connectDb()
						.then((db)=>{	
							//console.log( sqlu ,aParams, xdata.serial )
							let sqlc = `INSERT INTO equipment_client (po_number, invoice_number, client_info, grand_total,date_created ) 
							VALUES(?,?,?,?,?)`

							let obj ={}
							obj.client_name = req.body.client_name.toUpperCase()
							obj.company_name = req.body.company_name.toUpperCase()
							obj.delivery_site = req.body.delivery_site.toUpperCase()
							obj.delivery_truck = req.body.trucking_name.toUpperCase()
							obj.delivery_plateno = req.body.plate_number.toUpperCase()
							obj.delivery_driver = req.body.driver_name.toUpperCase()
							obj.company_phone = req.body.company_phone
							obj.company_email = req.body.company_email
							obj.client_remarks = req.body.client_remarks
							
							let aParams_c =[ req.body.client_po,
								req.body.client_invoice,
								JSON.stringify(obj),
								req.body.grand_total,
								req.params.datecreate]

							db.query(sqlc, aParams_c, (err, result)=>{
								if(err){
								}else{
									return result
								}
							})

							closeDb(db)

						}).catch((error)=>{
							res.status(500).json({error:'Error'})
						})
					}//endif

					clientinsert++

					resolves() //=============RESOLVES=============

					//===============update equipment table 
					connectDb()
					.then((db)=>{	
						//console.log( sqlu ,aParams, xdata.serial )

						db.query(sqlu, aParams_u, (err, result)=>{
							if(err){
							}else{
								return result
							}
						})
						
						closeDb(db)
		
					}).catch((error)=>{
						res.status(500).json({error:'Error'})
					})	
				
				}, 2000)
			}) //end promise
			
		}//================END FOR LOOP============//

		res.json({
			message: "UPDATED Successfully!",
			voice:"Record Updated Successfully!",
			approve_voice:`You have For Approval!`,
			transaction :'2',
			status:true
		})
		
})


//=========== FOR ADDING NEW EQUIPMENT IN INVENTORY ==================
router.post('/xapi/equipmentpost/:dateadd', async (req, res) => {
   
    //console.log( req.body.serial, req.body )

	connectDb()
    .then((db)=>{
		db.query(`INSERT INTO equipment (type,serial,eqpt_no,equipment_value,qty,price,sale_price,total_price,date_add) 
				VALUES (?,?,?,?,?,?,?,?,?)`, 
		[ req.body.equipment_type, req.body.serial, req.body.eqpt_no, JSON.stringify(req.body), req.body.eqpt_qty, req.body.price, req.body.sale_price, (req.body.eqpt_qty*req.body.sale_price),req.params.dateadd ],(error,results) => {
			
			res.json({
				message: "Serial No. " + req.body.serial +" Added Successfully!",
				voice:"Record Added Successfully!",
				approve_voice:`You have another item added in Inventory`,
				status:true
			})

			closeDb(db);//CLOSE connection
			
		})
    }).catch((error)=>{
        res.status(500).json({error:'Error'})
    }) 
	
})

//================get PO for approval
router.get('/xapi/getpo/:approver_type', async(req,res) =>{
	let cStr = ""
	if(req.params.approver_type=="1"){
		cStr = " c.approver_1 = 0"
	}else{
		cStr = " c.approver_2 = 0"
	}

	sql = `select distinct(b.po_number)
	,upper(b.invoice_number) as 'invoice_number'
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
	where ${cStr}
	group by b.po_number
	,b.invoice_number
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
	`

	/////console.log(sql)
	connectDb()
    .then((db)=>{
        
		let newdata=[], poList = []

        db.query( sql , null ,(err,data) => { 
			
			if ( data.length == 0) {  //data = array 
				console.log('getPO() no rec')	
                res.status(400).json({
					voice:"No Matching Record!",
					found:false
				})  
				
				closeDb(db);//CLOSE connection
            
			}else{ 
				//console.log( data )
				
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

					//new set obj
					let obj = {}
					obj.po_number =""
					obj.invoice_number =""
					obj.eqpt_no=""
					obj.po_date = ""
					obj.details = []
					//check against data
					//et obj2 ={}

					for(let i in data){
						
						if( poList[x] == data[i].po_number){
							obj.po_number = data[i].po_number
							obj.invoice_number = data[i].invoice_number
							obj.eqpt_no = data[i].eqpt_no
							obj.po_date = data[i].date_created

							let client = JSON.parse(data[x].client_info)

							obj.client_name = client.client_name.toUpperCase()
							obj.client_company = client.company_name.toUpperCase()
							obj.client_address = client.delivery_site.toUpperCase()
							obj.client_trucking = client.delivery_truck.toUpperCase()
							obj.client_driver = client.delivery_driver.toUpperCase()
							obj.client_plateno = client.delivery_plateno.toUpperCase()
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
				////console.log('getPO',newdata)
				
				res.status(200).json({
					result	: 	newdata,
					found	:	true
                })
							
                closeDb(db);//CLOSE connection
                
            }//EIF
			
		})//END QUERY 
	
	}).catch((error)=>{
        res.status(500).json({error:'No Fetch Docs'})
    })
	
	//console.log('xapi/getPo/',sql )
})


//===============get all equipment
router.get('/xapi/getall/:type/:status', async(req,res) => {
	//console.log(req.params.status)
	let sql, br = 0
	let newdata=[], poList = []

	if(req.params.type !=="All" && req.params.status =="All"){
		br = 1
		sql = `select *,
		trim(replace(substring_index(substring(equipment_value,locate('serial',equipment_value)+ length('serial')+ 2),',',1),'"','')
		) as 'xserial'
		from equipment
		where lower(type) = '${req.params.type.toLowerCase()}'
		and qty > 0
		ORDER BY xserial desc, type`

	//main 
	}else if( req.params.type =="All" && req.params.status !=="All" ){
		br = 2
		if(req.params.status == "0"){ //on hand
			sql = `select *,
			trim(replace(substring_index(substring(equipment_value,locate('serial',equipment_value)+ length('serial')+ 2),',',1),'"','')
			) as 'xserial'
			from equipment
			where qty > 0
			ORDER BY xserial desc, type`
		}else if(req.params.status == "2"){ //approved
			sql = `select distinct(b.po_number)
			,b.invoice_number
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
			where  c.approver_1 = 1 and c.approver_2 = 1
			group by b.po_number
			,b.invoice_number
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
			,c.grand_total `
		}else if(req.params.status == "1"){ //for approval
			sql = `select distinct(b.po_number)
			,b.invoice_number
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
			where  c.approver_1 = 0 and c.approver_2 =0
			group by b.po_number
			,b.invoice_number
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
			,c.grand_total `
		
		}

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
	}else if (req.params.type =="All" && req.params.status =="All"){
		br = 4
		sql = `select *,
		trim(replace(substring_index(substring(equipment_value,locate('serial',equipment_value)+ length('serial')+ 2),',',1),'"','')
		) as 'xserial'
		from equipment
		where status<=2 
		ORDER BY xserial desc, type `
	}//eif 

	console.log('===MY SQL route api.js===',br,sql)

	connectDb()
    .then((db)=>{
        
        db.query( sql , null ,(err,data) => { 
			
			if ( data.length == 0) {  //data = array 
				console.log('no rec')	
                res.status(400).json({
					voice:"No Matching Record!",
					found:false
				})  
				
				closeDb(db);//CLOSE connection
            
			}else{ 
				console.log( 'xapi/getAll()',data )
				let newdata = [], poList = []
				if(req.params.status=="2" || req.params.status=="1" ){
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
	
						//new set obj
						let obj = {}
						obj.po_number =""
						obj.invoice_number =""
						obj.eqpt_no=""
						obj.po_date = ""
						obj.details = []
						//check against data
						//et obj2 ={}
	
						for(let i in data){
							
							if( poList[x] == data[i].po_number){
								obj.po_number = data[i].po_number
								obj.invoice_number = data[i].invoice_number
								obj.eqpt_no = data[i].eqpt_no
								obj.po_date = data[i].date_created
								
	
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
router.get('/xapi/fetchinitdata', async(req,res) => {
	//clear cookie first
	res.clearCookie(`Rent`, {path : '/'})
	res.clearCookie(`Sales`, {path : '/'})
	connectDb()
    .then((db)=>{
        db.query(`Select distinct( b.approve_status  ) as 'status',
		count(a.status)  as status_count,
		(case
		  when b.approve_status = 'FOR RENT APPROVAL' then sum(a.rent_price)
		  when b.approve_status = 'FOR SALES APPROVAL' then sum(a.sale_price)
		  when b.approve_status = 'RECEIVED' then sum(a.price)
		end ) as 'price',
		(CASE
			when b.approve_status = 'FOR SALES APPROVAL' then ( (sum(a.sale_price)-sum(a.price)) )
		END
		)as sales_profit,
		sum(
			(CASE
				when b.approve_status = 'FOR RENT APPROVAL' then 
				(
				CASE 
					when a.rent_end<now() then 1
				END
				)
			END
			)
		) as 'overdue'
		from
		equipment_status b 
		left join equipment a on a.status = b.approve_id
		where b.approve_status Not in('status','RELEASED')
		group by b.approve_status `, null ,(err,data) => { 
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
				res.cookie('Rent',`${data[0].status_count}`)
				res.cookie('Sales',`${data[1].status_count}`)
				
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


//get equipment for dropdown selection 
router.get('/xapi/getequipment/:equipment', async(req,res) => {
	connectDb()
    .then((db)=>{
        //console.log(`/xapi/getequpment select * from equipment_type where equipment_type ='${req.params.equipment}'`)
        db.query(`select * from equipment_type where Upper(equipment_type) ='${req.params.equipment.toUpperCase()}'`, null ,(err,data) => { 
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
				res.status(200).json({
					result	: 	data,
					found	:	true
                })
				
                closeDb(db);//CLOSE connection
                //console.log("===MYSQL CONNECTON CLOSED SUCCESSFULLY===")
            }//EIF
			
		})//END QUERY 
	
	}).catch((error)=>{
        res.status(500).json({error:'No Fetch Docs'})
    })		
})

module.exports = router;