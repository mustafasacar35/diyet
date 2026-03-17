const fs = require('fs');
if (fs.existsSync('src/app/api')) {
    fs.renameSync('src/app/api', 'src/api_temp');
    console.log('Temporarily disabled API folder for mobile static export.');
}
