const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.config.js');

module.exports = (env) => {
    return merge(common, {
        mode: 'production',
        plugins: [
            new webpack.DefinePlugin({
                "ENVIRONMENT": JSON.stringify("PROD")
            })
        ]
    })
};