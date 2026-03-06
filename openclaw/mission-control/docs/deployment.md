# Mission Control Deployment Guide

## Prerequisites
- Cloudflare account with a domain
- Vercel account
- `cloudflared` CLI installed (already done)
- `vercel` CLI installed (already done)
- OpenCLAW gateway running locally on port 18790

## 1. Cloudflare Tunnel (expose local gateway)

The tunnel lets Vercel's server-side code reach your local OpenCLAW gateway.

### Authenticate
```bash
cloudflared tunnel login
```
This opens a browser — select your domain (e.g., injectseo.com).

### Create tunnel
```bash
cloudflared tunnel create openclaw-gateway
```
Note the tunnel ID from the output.

### Configure tunnel
Create `~/.cloudflared/config.yml`:
```yaml
tunnel: <TUNNEL_ID>
credentials-file: C:\Users\aaron\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: gateway.injectseo.com
    service: http://localhost:18790
  - service: http_status:404
```

### Route DNS
```bash
cloudflared tunnel route dns openclaw-gateway gateway.injectseo.com
```

### Run tunnel
```bash
cloudflared tunnel run openclaw-gateway
```

For always-on:
```bash
cloudflared service install
```

## 2. Vercel Deployment

### Deploy
```bash
cd C:\projects\openclaw\mission-control
vercel --prod
```

### Set environment variables
```bash
vercel env add OPENCLAW_GATEWAY_URL production
# Enter: https://gateway.injectseo.com

vercel env add OPENCLAW_TOKEN production
# Enter: your gateway token
```

### Redeploy after env vars
```bash
vercel --prod
```

## 3. Cloudflare Access (optional auth layer)

In Cloudflare Zero Trust dashboard:
1. Go to Access > Applications
2. Create Application > Self-hosted
3. Name: "Mission Control"
4. Domain: your Vercel deployment URL
5. Policy: Allow email = aaronmcbride57@gmail.com
6. Identity: One-Time PIN (email-based, no passwords)

## 4. Gateway Chat API

Already enabled. The `/v1/chat/completions` endpoint is active on the gateway.
Verify: `curl -X POST http://127.0.0.1:18790/v1/chat/completions ...`

## Local Development

```bash
cd C:\projects\openclaw\mission-control
npm run dev
# Opens on http://localhost:3002
```

The dev server uses webpack mode (not Turbopack) to avoid workspace root detection issues.
