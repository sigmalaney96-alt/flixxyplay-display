import express from 'express';
import http from 'node:http';
import { createBareServer } from '@tomphttp/bare-server-node';
import cors from 'cors';
import path from "path";
import { hostname } from "node:os";

const server = http.createServer();
const app = express(server);
const __dirname = process.cwd();
const bareServer = createBareServer('/b/');

const shouldBypassProxy = (value) => {
    if (!value) return false;
    const lower = value.toLowerCase();
    return (
        // YouTube
        lower.includes('youtube.com') ||
        lower.includes('youtubei.googleapis.com') ||
        lower.includes('googlevideo.com') ||
        lower.includes('ytimg.com') ||
        lower.includes('ggpht.com') ||
        // Netflix
        lower.includes('netflix.com') ||
        lower.includes('nflxext.com') ||
        lower.includes('nflximg.net') ||
        lower.includes('nflxso.net') ||
        lower.includes('nflxvideo.net') ||
        lower.includes('ichnaea.netflix.com') ||
        lower.includes('dscovrdl.netflix.com') ||
        // Disney+
        lower.includes('disneyplus.com') ||
        lower.includes('disney-plus.net') ||
        lower.includes('disneycdn.net') ||
        lower.includes('dssott.com') ||
        lower.includes('mxsnowflake.execute-api.us-east-1.amazonaws.com') ||
        lower.includes('api.disneyplus.com')
    );
};

const sanitizeHeaders = (headers) => {
    const safeHeaders = { ...headers };

    delete safeHeaders.host;
    delete safeHeaders.connection;
    delete safeHeaders['content-length'];
    delete safeHeaders['transfer-encoding'];
    delete safeHeaders['x-bare-url'];
    delete safeHeaders['x-bare-host'];
    delete safeHeaders['x-bare-protocol'];

    return safeHeaders;
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(cors());

app.use((req, res, next) => {
    res.header('X-Frame-Options', 'ALLOWALL');
    res.header('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: *");
    res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.header('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
});

server.on('request', async (req, res) => {
    const bareUrl = req.headers['x-bare-url'];

    if (shouldBypassProxy(typeof bareUrl === 'string' ? bareUrl : '')) {
        try {
            const target = new URL(bareUrl);
            const requestHeaders = sanitizeHeaders(req.headers);

            if (!['GET', 'HEAD'].includes(req.method)) {
                const bodyChunks = [];
                for await (const chunk of req) {
                    bodyChunks.push(chunk);
                }
                requestHeaders['content-length'] = Buffer.byteLength(Buffer.concat(bodyChunks)).toString();
                requestHeaders.origin = target.origin;

                const response = await fetch(target.toString(), {
                    method: req.method,
                    headers: requestHeaders,
                    body: Buffer.concat(bodyChunks),
                });

                const headers = Object.fromEntries(response.headers.entries());
                res.writeHead(response.status, headers);
                const buffer = Buffer.from(await response.arrayBuffer());
                res.end(buffer);
                return;
            }

            const response = await fetch(target.toString(), {
                method: req.method,
                headers: requestHeaders,
            });

            const headers = Object.fromEntries(response.headers.entries());
            res.writeHead(response.status, headers);
            const buffer = Buffer.from(await response.arrayBuffer());
            res.end(buffer);
            return;
        } catch (error) {
            console.error('Streaming service bypass failed:', error);
        }
    }

    if (bareServer.shouldRoute(req)) {
        bareServer.routeRequest(req, res);
    } else {
        app(req, res);
    }
});

server.on('upgrade', (req, socket, head) => {
    if (bareServer.shouldRoute(req)) {
        bareServer.routeUpgrade(req, socket, head);
    } else {
        socket.end();
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), '/public/index.html'));
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(process.cwd(), '/public/index.html'));
});

const PORT = 3000;
server.on('listening', () => {
    const address = server.address();

    console.log("Listening on:");
    console.log(`\thttp://localhost:${address.port}`);
    console.log(`\thttp://${hostname()}:${address.port}`);
    console.log(
        `\thttp://${address.family === "IPv6" ? `[${address.address}]` : address.address
        }:${address.port}`
    );
});

server.listen({ port: PORT });

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
    console.log("SIGTERM signal received: closing HTTP server");
    server.close();
    bareServer.close();
    process.exit(0);
}
