// Custom server configuration for production
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url || '/', true);
      
      // Set consistent headers for Clerk
      const publicUrl = process.env.NEXT_PUBLIC_URL || 'https://www.shuttlementor.com';
      const publicDomain = new URL(publicUrl).hostname;
      
      // Override headers to be consistent
      req.headers.host = publicDomain;
      
      // If origin is not set or is localhost, set it to the public URL
      if (!req.headers.origin || req.headers.origin.includes('localhost')) {
        req.headers.origin = publicUrl;
      }
      
      // Log headers for debugging
      console.log('Request headers:', {
        url: req.url,
        host: req.headers.host,
        origin: req.headers.origin,
        referer: req.headers.referer
      });
      
      // Let Next.js handle the request
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  })
  .once('error', (err) => {
    console.error(err);
    process.exit(1);
  })
  .listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
