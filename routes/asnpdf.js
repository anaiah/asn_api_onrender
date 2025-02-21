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

const Codes = ( emp_id ) =>{
    var today = new Date()
    var dd = String(today.getDate()).padStart(2, '0')
    var mm = String(today.getMonth() + 1).padStart(2, '0') //January is 0!
    var yyyy = today.getFullYear()
    var hh = String( today.getHours()).padStart(2,'0')
    var mmm = String( today.getMinutes()).padStart(2,'0')
    var ss = String( today.getSeconds()).padStart(2,'0')


    today = `VAN${yyyy}${mm}${dd}${hh}${mmm}${ss}-${emp_id}`
    return today
}

module.exports =  {
    tester: async(req, res) =>{
        console.log(req.params.tester)
        res.status(200).send('TESTER OK!')
    },

    reportpdf:(xdata, xdate, format_grandtotal, grandtotal)=>{
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

            
            //console.log(xdata,'xdata')
            ///======================= DATA ============================/
            const pdfData = {
                xdates              :   xdate,
                logos		        :   logo,
                rptdata             :   xdata,
                xname               :   xdata[0].rider,
                xemp_id             :   xdata[0].emp_id,
                serialno            :   Codes(xdata[0].emp_id),
                second_term         :   addCommas(parseFloat(grandtotal/2).toFixed(2)) ,
                third_term          :   addCommas(parseFloat(grandtotal/4).toFixed(2)) ,
                fourth_term         :   addCommas(parseFloat(grandtotal/6).toFixed(2)),
                fifth_term          :   addCommas(parseFloat(grandtotal/8).toFixed(2)) ,
                sixth_term          :   addCommas(parseFloat(grandtotal/10).toFixed(2)) ,
                gtotal              :   addCommas(grandtotal),
                format_gtotal       :   format_grandtotal
            }
            //===================== END PDF DATA ========================//

            //=====apply handlebars formatting
            let template = hbar.compile(htmlx);
        
            //let content = template(pdfData); // LET THE TEMPLATE HTML'S CONTENT EQUALS PDF DATA
            let contentx = template(pdfData);

            
            pdf.create( contentx, options ).toFile( `ADT_${xdata[0].emp_id}.pdf`,(err, res ) => {
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
