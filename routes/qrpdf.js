const fs = require('fs');

const PuppeteerHTMLPDF = require('puppeteer-html-pdf');
const pdf = require('html-pdf');
const PassThrough = require('stream')
const hbar = require('handlebars');

const QRCode = require('qrcode') 

const boxview = require('chrome-launcher')
// const multer = require('multer')
const sharp = require('sharp')
const path = require('path')
const ftpclient = require('scp2')


module.exports =  {
    tester: async(req, res) =>{
        console.log(req.params.tester)
        res.status(200).send('TESTER OK!')
    },

   

    qrpdf : ( req, results, release, drnumber )=>{

        return new Promise((resolve, reject)=> {
            
            let hostname = 'https://vantaztic-api-onrender.onrender.com/release/'+ release +`/${req.params.po_number}/${drnumber}`
            	
            QRCode.toDataURL(hostname, {
                errorCorrectionLevel: 'H',
                type:'image/png', 
                quality: 0.3,
                color: {
                    dark:"#5A5C65",
                    light:"#0000"
                }
            },  (err,url) =>{
                if (err){
                    console.log('QR ERR',err)
                }else{
                    console.log('=== QR SUCCESS!!! ===',`/${req.params.po_number}`)
                    //console.log('===QR Code .png is ', url)

                    //===================START CREATE PDF ======================//
                    let htmlx = fs.readFileSync(path.join(__dirname, "temp.html"), "utf8")
                    console.log('OPENING=== temp.html*** ')

                    //===== Vantaztic Logo========
                    const bitmap = fs.readFileSync( path.join(__dirname, "vantaztic_logo.png") )
                    const logo = bitmap.toString('base64');

                    console.log(`CREATING PDF FILE===.. ${req.params.po_number}`)
                    //console.log('curent path is ', __dirname)
                    
                    //== get data
                    let xclient = JSON.parse(results[1][0].client_info)
                    let xd = new Date(req.params.dateapprove).toLocaleString('en-us',{month:'long',day:'numeric', year:'numeric'})
                
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
                    }
                   
                    //data
                    const pdfData = {
                        qr			: 	url.toString(),
                        logos		:	logo,
                        data		: 	results[1],
                        transaction :   results[1][0].transaction,
                        dr_number 	: 	drnumber,
                        po_number	:	req.params.po_number,
                        date_approve: 	xd,
                        client		: 	xclient.client_name.toUpperCase(),
                        company     :   xclient.company_name.toUpperCase(), 
                        address		: 	xclient.delivery_site.toUpperCase(),
                        trucking	: 	xclient.delivery_truck.toUpperCase(),
                        driver		: 	xclient.delivery_driver.toUpperCase(),
                        plateno		: 	xclient.delivery_plateno.toUpperCase(),
                        phone		: 	xclient.company_phone,
                        email		: 	xclient.company_email.toLowerCase(),
                        remarks		: 	xclient.client_remarks
                    }
                    
                    //=====apply handlebars formatting
                    let template = hbar.compile(htmlx);
                
                    let content = template(pdfData);
                
                    //===========create the PDF
                    pdf.create( content, options ).toStream( (err, stream ) => {
                   
                        let fstream= fs.createWriteStream(`./DR_${req.params.po_number}.pdf`);
    
                        stream.pipe( fstream )

                        console.log( 'Writing Stream... ', fstream.path )

                        stream.resume()
                    
                        fstream.on('close', function () {
                            console.log('Closing Stream, Trying to Up load...')

                            ftpclient.scp(fstream.path, {
                                host: process.env.FTPHOST, //--this is orig ->process.env.FTPHOST,
                                //port: 3331, // defaults to 21
                                username: process.env.FTPUSER, // this is orig-> process.env.FTPUSER, // defaults to "anonymous"
                                password: process.env.FTPPWD,
                                path: process.env.FTPPATH
                            }, function(err) {
                                if(!err){ 
                                    console.log("==== File Uploaded!!! ", fstream.path);
                                    
                                    resolve(fstream.path)
                                                                        
                                }else{
                                    reject(err)
                                }
                            
                            //=====use 301 for permanent redirect
                            //res.status(301).redirect("http://localhost:4000/admin.html")
                
                            })//end ftpclient
                        })//end fstream onclose
                    })//====end create PDF
                    //==================END CREATE PDF================//
                }//============eif error ===============//
            })//========== END QR CODE =============//
        
        })//end return Promise

    }//=======end object qrpdf()
}//======end module export 
