const path = require("path");
const ESLintWebpackPlugin = require("eslint-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
// 提取css为单独文件
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
// 压缩css
const CssMinimizerWebpackPlugin = require("css-minimizer-webpack-plugin");
// 压缩js
const TerserWebpackPlugin = require("terser-webpack-plugin");
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
// 复制静态文件夹下内容
const CopyPlugin = require("copy-webpack-plugin");
// 获取当前环境变量
const isDevelopment = process.env.NODE_ENV !== "production";

// 抽取样式处理公共部分
const getStyleLoaders = (loader) => {
	return [
		MiniCssExtractPlugin.loader,
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
		path: path.resolve(__dirname, "../dist"),
		// 代码分割，使用chunk的name命名
		filename: "static/js/[name].[contenthash:10].js",
		// 打包后多余的chunk，比如动态导入的,node_modules中的代码
		chunkFilename: "static/js/[name].[contenthash:10].chunk.js",
		// 静态文件，图片资源
		assetModuleFilename: "static/media/[hash:10][ext][query]",
		clean: true
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
					cacheCompression: false // 缓存文件不要压缩
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
		// 提取css为单独文件
		new MiniCssExtractPlugin({
			filename: "static/css/[name].[contenthash:10].css",
			chunkFilename: "static/css/[name].[contenthash:10].chunk.css"
		}),
		// 将public下面的资源复制到dist目录去（除了index.html）
		new CopyPlugin({
			patterns: [
				{
					from: path.resolve(__dirname, "../public"),
					to: path.resolve(__dirname, "../dist"),
					// toType: "dir",
					noErrorOnMissing: true, // 不生成错误
					globOptions: {
						// 忽略文件
						ignore: ["**/index.html"]
					},
					// info: {
					// 	// 跳过terser压缩js
					// 	minimized: true
					// }
				}
			]
		})
	],
	mode: isDevelopment ? "development" : "production",
	// 开启sourcemap
	devtool: "source-map",
	// 代码分割 懒加载的组件会单独打包
	optimization: {
		splitChunks: {
			chunks: "all"
		},
		runtimeChunk: {
			name: (entrypoint) => `runtime~${entrypoint.name}`
		},
		// 压缩css与js
		minimizer: [
			new CssMinimizerWebpackPlugin(),
			new TerserWebpackPlugin(),
			// 压缩图片
			new ImageMinimizerPlugin({
				minimizer: {
					implementation: ImageMinimizerPlugin.imageminGenerate,
					options: {
						plugins: [
							["gifsicle", { interlaced: true }],
							["jpegtran", { progressive: true }],
							["optipng", { optimizationLevel: 5 }],
							[
								"svgo",
								{
									plugins: [
										"preset-default",
										"prefixIds",
										{
											name: "sortAttrs",
											params: {
												xmlnsOrder: "alphabetical"
											}
										}
									]
								}
							]
						]
					}
				}
			})
		]
	},
	resolve: {
		extensions: [".jsx", ".js", ".tsx", ".ts", ".json"] // 自动补全文件扩展名，让jsx可以使用
	}
};
