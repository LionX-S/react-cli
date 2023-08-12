const path = require("path");
const ESLintWebpackPlugin = require("eslint-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
// react HMR 插件
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
// 获取当前环境变量
const isDevelopment = process.env.NODE_ENV !== "production";

// 抽取样式处理公共部分
const getStyleLoaders = (loader) => {
	return [
		"style-loader",
		"css-loader",
		{
			// 处理css兼容性问题,配合package.json中的browserlist,指定兼容性
			loader: "postcss-loader",
			options: {
				postcssOptions: {
					plugins: ["postcss-preset-env"]
				}
			}
		},
		loader
	].filter(Boolean);
};

module.exports = {
	entry: "./src/main.js",
	output: {
		path: undefined,
		// 代码分割，使用chunk的name命名
		filename: "static/js/[name].js",
		// 打包后多余的chunk，比如动态导入的,node_modules中的代码
		chunkFilename: "static/js/[name].chunk.js",
		// 静态文件，图片资源
		assetModuleFilename: "static/media/[hash:10][ext][query]"
	},
	module: {
		rules: [
			// 处理css
			{
				test: /\.css$/,
				use: getStyleLoaders()
			},
			// 处理less
			{
				test: /\.less$/,
				use: getStyleLoaders("less-loader")
			},
			// 处理sass
			{
				test: /\.s[ac]ss$/,
				use: getStyleLoaders("sass-loader")
			},
			// 处理stylus
			{
				test: /\.styl$/,
				use: getStyleLoaders("stylus-loader")
			},
			// 处理图片
			{
				test: /\.(jpe?g|png|gif|webp|svg)/,
				type: "asset",
				parser: {
					// 小于10k图片转为base64
					dateUrlCondition: {
						maxSize: 10 * 1024
					}
				}
			},
			// 处理其他资源
			{
				test: /\.(ttf|woff2?)$/,
				type: "asset/resource"
			},
			// 处理js
			{
				test: /\.(jsx|js)$/,
				include: path.resolve(__dirname, "../src"),
				loader: "babel-loader",
				options: {
					cacheDirectory: true, // 开启babel编译缓存
					cacheCompression: false, // 缓存文件不要压缩
					plugins: [
						"react-refresh/babel"
					]
				}
			},
			// 处理ts文件
			{
				test: /.(tsx|ts)$/,
				include: path.resolve(__dirname, "../src"),
				use: "ts-loader"
			}
		]
	},
	plugins: [
		new ESLintWebpackPlugin({
			context: path.resolve(__dirname, "../src"),
			exclude: "node_module",
			// 开启缓存
			cache: true,
			// 缓存目录
			cacheLocation: path.resolve(
				__dirname,
				"../node_modules/.cache/.eslintcache"
			)
		}),
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, "../public/index.html")
		}),
		// js 热更新
		new ReactRefreshWebpackPlugin()
	],
	mode: isDevelopment ? "development" : "production",
	// 开启sourcemap
	devtool: "cheap-module-source-map",
	// 代码分割 懒加载的组件会单独打包
	optimization: {
		splitChunks: {
			chunks: "all"
		},
		runtimeChunk: {
			name: (entrypoint) => `runtime~${entrypoint.name}`
		}
	},
	resolve: {
		extensions: [".jsx", ".js", ".tsx", ".ts", ".json"] // 自动补全文件扩展名，让jsx可以使用
	},
	devServer: {
		open: true,
		host: "localhost",
		port: 3000,
		hot: true,
		compress: true,
		historyApiFallback: true // 解决react-router刷新404问题
	}
};
