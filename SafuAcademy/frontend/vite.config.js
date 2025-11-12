import path from "node:path";
import react from "@vitejs/plugin-react";
import { createLogger, defineConfig } from "vite";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
var logger = createLogger();
var loggerError = logger.error;
logger.error = function (msg, options) {
    var _a;
    if ((_a = options === null || options === void 0 ? void 0 : options.error) === null || _a === void 0 ? void 0 : _a.toString().includes("CssSyntaxError: [postcss]")) {
        return;
    }
    loggerError(msg, options);
};
export default defineConfig({
    customLogger: logger,
    plugins: [react()],
    resolve: {
        extensions: [".jsx", ".js", ".tsx", ".ts", ".json"],
        alias: {
            "@": path.resolve(__dirname, "./src"),
            buffer: "buffer",
            process: "process",
        },
    },
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: "globalThis",
            },
            plugins: [
                NodeGlobalsPolyfillPlugin({
                    buffer: true,
                    process: true,
                }),
            ],
        },
    },
    build: {
        target: "esnext",
        rollupOptions: {
            external: [
                "@babel/parser",
                "@babel/traverse",
                "@babel/generator",
                "@babel/types",
            ],
            output: {
                manualChunks: {
                    videojs: [
                        "video.js",
                        "videojs-contrib-quality-levels",
                        "videojs-http-source-selector",
                    ],
                    wagmi: ["wagmi"],
                    rainbowme: ["@rainbow-me/rainbowkit"],
                },
            },
        },
    },
    define: {
        global: "globalThis",
    },
});
