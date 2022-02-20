let webpack = require('webpack');

module.exports = (env) => {
    console.log(env);
    console.log(env["DEV"] ? "DEV" : "PROD");
    return {
        entry: './src/app.js',
        output: {
            path: './src',
            filename: 'bundle.js'
        }
    }
};