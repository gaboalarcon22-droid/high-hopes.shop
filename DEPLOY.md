# Deploy — High Hopes (Railway + Cloudflare)

Mismo esquema que high-consulting.com: GitHub → Railway (deploy automático) → dominio en Cloudflare.

## 1. GitHub
Crear repo privado `high-hopes-store` y:
```
git remote add origin https://github.com/<usuario>/high-hopes-store.git
git push -u origin master
```

## 2. Railway
1. New Project → Deploy from GitHub repo → `high-hopes-store`.
2. **Volume**: agregar un Volume al servicio montado en `/data` (la base es SQLite; sin volumen se pierde en cada deploy).
3. Variables:
   - `DATABASE_URL=file:/data/prod.db`
   - `JWT_SECRET` = string largo aleatorio (`openssl rand -hex 32`)
   - `APP_ENV=production`
   - `STORE_NAME=High Hopes`
   - `WHATSAPP_NUMBER` (código de país, sin +) — también editable en Admin → Configuración
   - `ANTHROPIC_API_KEY` (generador de productos con IA)
   - `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY` (si se usa MercadoPago)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` (solo para el primer seed)
4. Primer arranque: en el shell de Railway correr `npm run db:seed` una vez (crea categorías y el admin), y después borrar `ADMIN_PASSWORD`.
5. Start command ya definido en `railway.json` (`prisma db push && next start`).

## 3. Dominio (Cloudflare)
1. Comprar/registrar en Cloudflare Registrar (o transferir el dominio a Cloudflare).
2. Railway → Settings → Networking → Custom Domain → agregar `dominio.com` y `www.dominio.com`; Railway muestra el CNAME destino.
3. Cloudflare → DNS: CNAME `@` (y `www`) → el destino de Railway (proxy activado).
4. Cloudflare → SSL/TLS → **Full (strict)**.

## 4. Después de subir
- Entrar a `/admin`, cambiar la contraseña, cargar logo (Configuración → Logo, tamaño Grande), WhatsApp y productos.
- El logo, fondos y productos viven en la base: hacer backup del volumen (`/data/prod.db`) periódicamente.
