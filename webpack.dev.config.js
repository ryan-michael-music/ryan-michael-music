const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.config.js');

module.exports = (env) => {
    return merge(common, {
        mode: 'development',
        plugins: [
            new webpack.DefinePlugin({
                "ENVIRONMENT": JSON.stringify("DEV")
            })
        ],
        devtool: 'source-map'
    })
};