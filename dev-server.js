// ===================================================
// Servidor de Desenvolvimento Local - Meu Caribe
// Simula exatamente o comportamento de roteamento do vercel.json
// (Redirects 301, Rewrites, Clean URLs e Query Strings)
// ===================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

// Carrega regras do vercel.json
let vercelConfig = {};
try {
    const raw = fs.readFileSync(path.join(ROOT_DIR, 'vercel.json'), 'utf8');
    vercelConfig = JSON.parse(raw);
} catch (e) {
    console.warn('⚠️ Não foi possível carregar vercel.json:', e.message);
}

const redirects = vercelConfig.redirects || [];
const rewrites = vercelConfig.rewrites || [];
const cleanUrls = vercelConfig.cleanUrls !== false;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp4': 'video/mp4'
};

function serveFile(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h1>404 - Não Encontrado</h1><p>Arquivo não encontrado: ${path.basename(filePath)}</p>`);
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = decodeURIComponent(parsedUrl.pathname);
    const search = parsedUrl.search || '';

    // 1. Processar REDIRECTS (ex: /tabua-mares -> /tabua-mares-maragogi, /passeios-lancha -> /passeio-de-lancha-maragogi)
    for (const rule of redirects) {
        if (rule.source === pathname || rule.source === pathname.replace(/\/$/, '')) {
            const dest = rule.destination + search;
            const statusCode = rule.permanent ? 301 : 307;
            console.log(`🔀 [REDIRECT ${statusCode}] ${pathname}${search} ➔ ${dest}`);
            res.writeHead(statusCode, {
                'Location': dest,
                'Cache-Control': 'no-cache'
            });
            res.end();
            return;
        }
    }

    // 2. Processar REWRITES (ex: /passeio-de-lancha-maragogi -> /passeios-lancha.html)
    for (const rule of rewrites) {
        if (rule.source === pathname || rule.source === pathname.replace(/\/$/, '')) {
            console.log(`🔄 [REWRITE] ${pathname} ➔ ${rule.destination}`);
            pathname = rule.destination;
            break;
        }
    }

    // Se raiz, serve index.html
    if (pathname === '/' || pathname === '') {
        pathname = '/index.html';
    }

    let filePath = path.join(ROOT_DIR, pathname);

    // 3. Suporte a Clean URLs (ex: se /sobre for pedido e sobre.html existir)
    if (cleanUrls && !path.extname(filePath)) {
        const htmlPath = filePath + '.html';
        if (fs.existsSync(htmlPath)) {
            filePath = htmlPath;
        }
    }

    // Prevenção básica contra path traversal
    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403);
        res.end('403 - Acesso Negado');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h1>404 - Não Encontrado</h1><p>A rota requisitada não existe: ${pathname}</p>`);
            return;
        }
        serveFile(res, filePath);
    });
});

server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Servidor Meu Caribe rodando com sucesso!`);
    console.log(`📍 URL Local: http://localhost:${PORT}`);
    console.log(`------------------------------------------------------`);
    console.log(`Rotas principais disponíveis para teste:`);
    console.log(` • Home:                       http://localhost:${PORT}/`);
    console.log(` • Nova rota de Lanchas:       http://localhost:${PORT}/passeio-de-lancha-maragogi`);
    console.log(` • Nova rota de Tábua de Maré: http://localhost:${PORT}/tabua-mares-maragogi?mes=outubro&ano=2026`);
    console.log(` • Teste 301 Lancha antiga:    http://localhost:${PORT}/passeios-lancha`);
    console.log(` • Teste 301 Tábua antiga:     http://localhost:${PORT}/tabua-mares?mes=outubro&ano=2026`);
    console.log(`======================================================\n`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        const nextPort = Number(PORT) + 1;
        console.log(`⚠️ Porta ${PORT} em uso. Tentando porta ${nextPort}...`);
        server.listen(nextPort);
    } else {
        console.error('Erro no servidor:', err);
    }
});
