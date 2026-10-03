import express from 'express';
import http from 'node:http';
import { createBareServer } from '@tomphttp/bare-server-node';
import cors from 'cors';
import path from "path";
import { hostname } from "node:os";

const server = http.createServer();
const app = express(server);
const __dirname = process.cwd();

// Create bare server with proper error handling
let bareServer;
try {
    bareServer = createBareServer('/b/');
} catch (err) {
    console.error('Failed to create bare server:', err);
    process.exit(1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(cors());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('X-Frame-Options', 'ALLOWALL');
    next();
});

server.on('request', async (req, res) => {
    // Check if this should be routed to bare server
    if (req.url.startsWith('/b/')) {
        try {
            await bareServer.routeRequest(req, res);
        } catch (err) {
            console.error('Bare server error:', err);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
            }
        }
    } else {
        // Route to express app
        app(req, res);
    }
});

server.on('upgrade', async (req, socket, head) => {
    // Check if this should be routed to bare server
    if (req.url.startsWith('/b/')) {
        try {
            await bareServer.routeUpgrade(req, socket, head);
        } catch (err) {
            console.error('Bare upgrade error:', err);
            socket.end();
        }
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

// Catch-all for unmatched routes
app.use((req, res) => {
    res.status(404).send('Not Found');
});

const PORT = process.env.PORT || 3000;
server.on('listening', () => {
    const address = server.address();
    console.log('Listening on:');
    console.log(`\thttp://localhost:${address.port}`);
    console.log(`\thttp://${hostname()}:${address.port}`);
    console.log(
        `\thttp://${address.family === 'IPv6' ? `[${address.address}]` : address.address}:${address.port}`
    );
});

server.listen({ port: PORT });

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown() {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close();
    if (bareServer) bareServer.close();
    process.exit(0);
}
