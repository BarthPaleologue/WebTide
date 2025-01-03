// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const isProduction = process.env.NODE_ENV === "production";
const htmlPath = path.join(__dirname, "/src/html/");

const config = {
    entry: {
        index: "./src/ts/index.ts",
        minimal: "./src/ts/minimal.ts",
        planet: "./src/ts/planet.ts"
    },
    output: {
        path: path.resolve(__dirname, "dist")
    },
    devServer: {
        open: false,
        host: "localhost",
        historyApiFallback: false
    },

    plugins: [
        new HtmlWebpackPlugin({
            title: "WebGPU FFT Ocean",
            filename: "index.html",
            template: path.join(htmlPath, "index.html"),
            chunks: ["index"]
        }),
        new HtmlWebpackPlugin({
            title: "Minimal WebGPU Example",
            filename: "minimal.html",
            template: path.join(htmlPath, "index.html"),
            chunks: ["minimal"]
        }),
        new HtmlWebpackPlugin({
            title: "WebGPU Planet",
            filename: "planet.html",
            template: path.join(htmlPath, "index.html"),
            chunks: ["planet"]
        }),
        new MiniCssExtractPlugin()
    ],

    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/i,
                loader: "ts-loader",
                exclude: ["/node_modules/"]
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader"]
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif|glb|obj)$/i,
                type: "asset"
            },
            {
                test: /\.html$/i,
                exclude: /node_modules/,
                loader: "html-loader"
            },
            {
                test: /\.(glsl|vs|fs|vert|frag|fx|wgsl)$/,
                exclude: /node_modules/,
                use: ["ts-shader-loader"]
            }

            // Add your rules for custom modules here
            // Learn more about loaders from https://webpack.js.org/loaders/
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    }
};

module.exports = () => {
    if (isProduction) {
        config.mode = "production";
    } else {
        config.mode = "development";
        config.devtool = "source-map";
    }
    config.experiments = {
        asyncWebAssembly: true,
        topLevelAwait: true
    };
    return config;
};
