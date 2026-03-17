const fs = require('fs');
if (fs.existsSync('src/api_temp')) {
    fs.renameSync('src/api_temp', 'src/app/api');
    console.log('Restored API folder after mobile export.');
}
