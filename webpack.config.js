const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');

let commonConfig = {
	module: {
		rules: [
			{
				test: /\.m?js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [
							['@babel/preset-env', { targets: 'defaults' }]
						]
					}
				}
			}
		],
	},
	mode: 'production',
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					mangle: false
				}
			})
		]
	}
}

let workletConfig = Object.assign({}, commonConfig, {
	entry: './src/sln.worklet.js',
	output: {
		filename: 'sln.worklet.js',
		path: path.resolve(__dirname, 'dist')
	},
});

let moduleConfig = Object.assign({}, commonConfig, {
	entry: './src/index.js',
	output: {
		filename: 'silence-listener-node.js',
		path: path.resolve(__dirname, 'dist'),
		library: 'SilenceListenerNode',
		libraryTarget: 'umd',
		globalObject: 'this'
	},
});

module.exports = [
	moduleConfig,
	workletConfig
];