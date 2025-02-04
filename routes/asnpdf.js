const fs = require('fs');

//const PuppeteerHTMLPDF = require('puppeteer-html-pdf');
const pdf = require('html-pdf');
//const PassThrough = require('stream')
const hbar = require('handlebars');

//const QRCode = require('qrcode') 

//const boxview = require('chrome-launcher')
// const multer = require('multer')
const sharp = require('sharp')
const path = require('path');
const { DatabaseError } = require('pg');
const { totalmem } = require('os');
//const ftpclient = require('scp2')

//========add comma for currency

module.exports =  {
    tester: async(req, res) =>{
        console.log(req.params.tester)
        res.status(200).send('TESTER OK!')
    },
    reportpdf:(xdata, xdate, grandtotal)=>{
        return new Promise((resolve, reject)=> {
           
            //===================START CREATE PDF ======================//
            let htmlx = fs.readFileSync(path.join(__dirname, "report.html"

            ), "utf8")
            console.log('OPENING=== report.html*** ')

            //===== Vantaztic Logo========
            const bitmap = fs.readFileSync( path.join(__dirname, "asiaone.png") )
            const logo = bitmap.toString('base64');

            console.log(`CREATING REPORT PDF FILE===..`)
            //console.log('curent path is ', __dirname)
            
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

            console.log(xdata,'xdata')
            ///======================= DATA ============================/
            const pdfData = {
                xdates              :   xdate,
                logos		        :   logo,
                rptdata             :   xdata,
                xname               :   xdata[0].rider,
                xemp_id             :   xdata[0].emp_id,
                gtotal              :   grandtotal
            }
            //===================== END PDF DATA ========================//

            //=====apply handlebars formatting
            let template = hbar.compile(htmlx);
        
            //let content = template(pdfData); // LET THE TEMPLATE HTML'S CONTENT EQUALS PDF DATA
            let contentx = template(pdfData);

            
            pdf.create( contentx, options ).toFile( `ASN_${xdata[0].emp_id}.pdf`,(err, res ) => {
                console.log( path.basename(res.filename), '==created' )

                if(res.filename){
                    resolve( path.basename(res.filename) )        
                }else{
                    reject(err)
                }
            })
            
        })//end return Promis

    },

    
    
}//======end module export 
