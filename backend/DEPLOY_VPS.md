# VPS Backend Deployment

This project is ready for a simple Ubuntu-style VPS deployment over SSH using:

- Node.js 20+
- `systemd` for process management
- Nginx as the reverse proxy
- MongoDB Atlas or another managed MongoDB instance

## 1. Server prerequisites

Install the core packages on the VPS:

```bash
sudo apt update
sudo apt install -y nginx git build-essential
```

Install Node.js 20.x:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 2. Upload or clone the project

Suggested deploy location:

```bash
sudo mkdir -p /opt/smartdoor
sudo chown $USER:$USER /opt/smartdoor
cd /opt/smartdoor
git clone <your-repo-url> .
```

If you are not using git on the server yet, you can also upload the repo with `scp` or `rsync` over SSH.

## 3. Configure the backend

```bash
cd /opt/smartdoor/backend
cp .env.production.example .env
nano .env
```

Update at least:

- `DATABASE_URL`
- `JWT_SECRET`
- `PUBLIC_BASE_URL`
- `CORS_ORIGIN`

Install and build:

```bash
npm ci
npm run build
```

Seed the database if this is a fresh environment:

```bash
npm run seed
```

## 4. Register the systemd service

Copy the service file:

```bash
sudo cp deploy/smartdoor-backend.service /etc/systemd/system/smartdoor-backend.service
```

If your deploy path or Linux user is different, edit the service first:

```bash
sudo nano /etc/systemd/system/smartdoor-backend.service
```

Then enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable smartdoor-backend
sudo systemctl start smartdoor-backend
sudo systemctl status smartdoor-backend
```

Useful logs:

```bash
sudo journalctl -u smartdoor-backend -f
tail -f /var/log/smartdoor-backend.log
```

## 5. Put Nginx in front of the API

Copy the sample Nginx config:

```bash
sudo cp deploy/nginx-smartdoor-api.conf /etc/nginx/sites-available/smartdoor-api
sudo ln -s /etc/nginx/sites-available/smartdoor-api /etc/nginx/sites-enabled/smartdoor-api
sudo nginx -t
sudo systemctl reload nginx
```

Before reloading Nginx, replace:

- `api.smartdoor.example.com` with your real API domain

## 6. Add HTTPS

Recommended with Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.smartdoor.example.com
```

## 7. Smoke test

From the server:

```bash
curl http://127.0.0.1:3000/health
```

From your laptop:

```bash
curl https://api.smartdoor.example.com/health
```

## 8. Updating later

```bash
cd /opt/smartdoor/backend
git pull
npm ci
npm run build
sudo systemctl restart smartdoor-backend
```

## Notes

- The mobile app should point to `https://api.smartdoor.example.com/api/v1`
- During private beta, keep `CORS_ORIGIN="*"` if needed
- For public rollout, lock CORS down to your real domains
