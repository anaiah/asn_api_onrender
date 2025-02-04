/* utility module ===*/
const fs = require('fs')


module.exports = {
    deletePdf: (file)=>{
        return new Promise((resolve, reject) => {
            fs.unlink(file, (err) => {
                if (err) reject(err);
                resolve(true)
            })
        })
    },
}//end module export
