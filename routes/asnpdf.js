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


module.exports =  {
    tester: async(req, res) =>{
        console.log(req.params.tester)
        res.status(200).send('TESTER OK!')
    },

    //==== this is the final
    newCreatePDF:( rows, name, totalFormatted, totalFixed, curr_date, res, batch )=>{

        //FOR OPTIONS
        /*
        300 BELOW 1 INST
        301 - 500 1 TO 2
        501- 1000  1 TO 4
        1001 - 2000 1 TO 6
        2001 - 3000 1 TO 9
        3001 - AND ABOVE 1 TO  10
        */
 
        let numOption = 0,  aAmt = []
        //********************** OPTIONS ****************/
        switch (true){
            case ( parseInt( totalFixed  ) <= 300):
                numOption = 1
                //aAmt.push( parseInt(totalFixed) )
               // aAmt.push( totalFixed)
            break

            case ( parseInt( totalFixed ) >= 301 && parseInt( totalFixed ) <= 500 ):
                numOption = 2
            break

            case ( parseInt( totalFixed ) >= 501 && parseInt( totalFixed) <= 1000 ):
                numOption = 4
            break

            case ( parseInt( totalFixed ) >= 1001 && parseInt( totalFixed) <= 2000 ):
                numOption = 6
            break

            case ( parseInt( totalFixed ) >= 2001 && parseInt( totalFixed) <= 3000 ):
                numOption = 9
            break

            case ( parseInt( totalFixed ) >= 3001 ):
                numOption = 10
            break

        }//end switch

        console.log(numOption, 'howmany hulog')

        //if(numOption > 1){
            for( x=1; x <= numOption; x++){
                aAmt.push( parseInt(totalFixed) / x)
            }
        //}
        

        const totalRecords = rows.length;
        const recordsPerPage = 20;
        const totalPages = Math.ceil(totalRecords / recordsPerPage) + 1;

        // Load logo as base64
        const logoPath = path.join(__dirname, 'asiaone.png');
        const logoImage = fs.readFileSync(logoPath).toString('base64');

        const fontmain = '9px' //orig is 10jpx
        const fontaddy = '9px'
        const fonttable='8px'

        //=== CREATE PDF ===========
        let htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>

            <style>
            
            body {
                font-family: 'Arial', sans-serif;
                font-size: ${fontmain};
            }
            .addy{
                font-size: ${fontmain};
            }
            table.blueTable {
            font-family: "Courier New", Courier, monospace;
            border: 0px solid #1C6EA4;
            /*background-color: #fff8f8ff*/
            width: 100%;
            border-collapse: collapse;
            }
            table.blueTable td, table.blueTable th {
            border: 1px solid #AAAAAA;
            padding: 3px 2px;
            
            }
            table.blueTable tbody td {
            font-size: 7px;
            color: #333333;
            border: 1px solid #D0E4F5;
            }
            table.blueTable thead {
            background: #C1B9B8;
            border-bottom: 0px solid black;
            }
            table.blueTable thead th {
            font-size: 8px;
            text-align:center;
            font-weight: bold;
            color: #3B3B3B;
            border-left: 1px solid #D0E4F5;
            }
            table.blueTable thead th:first-child {
            border-left: none;
            }

            
            
            .pagex{
                font-size:7px;
            }

            .mycontainer{
                font-size :8px;
            }
            
            .record-group {
                font-size:7px;
                display: block; /* Default, kept for clarity */
                /* optional margin for clarity in debugging */
                /* margin-bottom: 10px; */
            }
        
            .page-break {
                page-break-after: always;
                break-inside: avoid;
            }

            hr{
                border:none;
                height:1px;
                background-color:#000000;
                margin:20px auto;
            }
        </style>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    
        </head>
        <body>`;

        //=========GENERATE THE FIRST PAGE 
        htmlContent += `
        <div class="pagex ">
                <div  class="mb-2">
                    <div style="text-align:center"> 
                        <img src="data:image/png;base64,${logoImage}" height="29px" /><br>
                        <span class="addy">
                        <B>ASIA NOW ENTERPRISES INC.</B><br>
                        20F Arthaland Century Pacific Tower<br>
                        4th Ave. 30th St., Taguig, Metro Manila<br>
                        <b>#${batch}</b>
                        </span>
                        <hr>
                    </div>
                </div>
            
                <div class="" style="text-align:center; width:100%;">
                
                    <span>
                    <b>AUTHORITY TO DEDUCT</b>
                    </span>
                </div>

                <br><br><br><br>

                <b>${curr_date}</b><br><br><br>
                Ako si <b>${name}</b>, bilang isang empleyado / contractor ng AsiaNow Enterprises Inc ("Kumpanya"), sa pamamagitan nito ay isinasaad at pinapayagan
                ko ang sumusunod:<br><br><br>
                <ul>

                <li>
                Ang Natukoy na claim(s) na naka-tag sa ilalim ng aking pangalan ay napapailalim sa mga patakaran ng Kumpanya.<br>
                </li>
                <li>
                Ang aking Awtorisasyon para sa Kumpanya na ibawas ang halagang <b>PhP ${totalFormatted}</b> ng claim(s) na nakalakip sa dokumentong ito <b>(Annex A)</b>.<br>
                </li>
                <li>
                Kaugnay ng claim(s) na nakalakip sa dokumentong ito (Annex A), pinapayagan ko na regular na ibawas mula sa aking lingguhan / kalahating Buwanang suweldo / kumisyon
                simula sa pinakamalapit na petsa ng pay-out matapos ko na maisumite ang Authority To Deduct (ATD) na ito.    
                </ul><br>

                <div class="ms-2">`
                
                aAmt.forEach((element,idx) => {
                    const seq = idx + 1;
                     htmlContent+=`
                    <p style="width:100% ; margin-left: 20px; display: table;">
                    <span style="display: table-cell; width:10%; border-bottom: 1px solid black;"></span>
                    <span style="display: table-cell; width: 90%;">Option ${seq} - Ibawas sa ${seq} hulog ng halagang <b><u>PhP ${addCommas(element.toFixed(2))}</u></b> bawat hulog.</span>
                    </p>`
                });

                
                htmlContent+=`</div>

                <div class="mt-3">
                    Isinasagawa ko ang Awtorisasyong ito nang malaya at kusang-loob, at pagkatapos kong lubos na maunawaan at tanggapin ang aking mga obligasyon.
                    <br><br><br><br><br>

                    <p style="width:45% ; display: table;">
                        <span style="text-align:center; display: table-cell; width:45%; border-top: 1px solid black;">
                        <b>(mm/dd/yyyy) Taguig City, Philippines</b></span>
                    </p>
                    <br><br><br><br>

                    <p style="width:45% ; display: table;">
                        <span style="text-align:center; display: table-cell; width:45%; border-top: 1px solid black;">
                        <b>Pangalan at Lagda ng Employee / Contractor</b></span>
                        
                    </p>
                </div>

            </div>
            </div>
            <!--//end my container//-->
            <div class="page-break"></div>
                    
        `
        //============END GENERATE FIRST PAGE 

    
        //======================== Generate record groups with page breaks
        for (let i = 0; i < totalRecords; i += recordsPerPage) {
            //create header
            
            htmlContent += `
                <div  class="mb-1">
                    <div style="text-align:left"> 
                        <img src="data:image/png;base64,${logoImage}" height="29px" /><br>
                        <span class="pagex"><br>
                            <b>ANNEX A.</b>
                        </span>
                    </div>
                </div>`;
           
            htmlContent += `
            <div class="record-group" style="width:100%;">
                <br>
                <table class="blueTable">
                <thead>
                <tr>

                <th>Rider Information</th>
                <th>Track No.</th>
                <th>Reason</th>
                <th align="right">Amount&nbsp;&nbsp;&nbsp;</th>
                </tr>

                <thead>
                <tbody>`;
                
            const group = rows.slice(i, i + recordsPerPage);

            //===iterate records.rows
            group.forEach(rec => {
                htmlContent += `
                    <tr>
                    <td>
                        ${rec.rider}<br>
                        ${rec.category}<br>
                        ${rec.hub}
                    </td>

                    <td>${rec.track}</td>
                    <td>${rec.reason}</td>
                    <td align=right>${rec.total}&nbsp;&nbsp;&nbsp;</td>
                    
                    </tr>`;
            });

            htmlContent += `
                </tbody>    
                </table>
                </div>`;


            // Add page break unless it's the last group
            if (i + recordsPerPage < totalRecords)
            htmlContent += `<div class="page-break"></div>`;
        }

        htmlContent += `
        <div class="mt-2" style="text-align:right">
            <b>GRAND TOTAL :</b> &nbsp;&nbsp;&nbsp;
            &nbsp;&nbsp;&nbsp;
            &nbsp;&nbsp;&nbsp;
            &nbsp;&nbsp;&nbsp;
            &nbsp;&nbsp;&nbsp;
            <b>${totalFormatted}</b>
            &nbsp;&nbsp;&nbsp;&nbsp;
        </div>

        </body>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>

        </html>`;

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
                    //first: '<span class="pagex">Page 1</span>',
                    //2: '<span class="pagex">Page 2</span>',// Any page number is working. 1-based index
                    default: '<span class="pagex">Page {{page}} of '+ totalPages +'</span>', // fallback value
                    last: 'Last Page' 
                }
            }
        }//====end options


        //.tostream is to stream esp for downloading
        //.toFile is to save a pdf in path then download
        pdf.create(htmlContent, options).toStream((err, stream) => {
        
            if (err) return res.status(500).send(err);
            
            res.setHeader('Content-Disposition', `attachment; filename=${batch}.pdf`);
            res.setHeader('Content-Type', 'application/pdf');
            stream.pipe(res);
        });

    },

    reportpdf:(xdata, xdate, format_grandtotal, grandtotal, batch_code)=>{
        return new Promise((resolve, reject)=> {
           
            //===================START CREATE PDF ======================//
            let htmlx = fs.readFileSync(path.join(__dirname, "report.html"

            ), "utf8")
            console.log('=====OPENING=== report.html*** ')

            //===== Vantaztic Logo========
            const bitmap = fs.readFileSync( path.join(__dirname, "asiaone.png") )
            const logo = bitmap.toString('base64');

            console.log(`=======CREATING REPORT PDF FILE===..`)
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

            /*** beta 08/23/2k25 */

            
            //console.log(xdata,'xdata')
            ///======================= DATA ============================/
            const pdfData = {
                xdates              :   xdate,
                logos		        :   logo,
                rptdata             :   xdata,
                xname               :   xdata[0].rider,
                xemp_id             :   xdata[0].emp_id,
                serialno            :   batch_code,
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

            
            pdf.create( contentx, options ).toFile( `${batch_code}.pdf`,(err, res ) => {
                console.log( path.basename(res.filename), '=== //CREATED//====' )

                if(res.filename){
                    resolve( path.basename(res.filename) )        
                }else{
                    reject(err)
                }
            })
            
        })//end return Promis

    },

    
    
}//======end module export 
