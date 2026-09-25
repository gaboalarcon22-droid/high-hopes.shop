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
4. El seed corre solo en cada arranque (idempotente): crea categorías y el admin si no existen. Después del primer login, borrar `ADMIN_PASSWORD` de las variables.
5. Start command ya definido en `railway.json` (`prisma db push && seed && next start`).

## 3. Dominio (registrado en GoDaddy)
**Opción A (recomendada): dejar el dominio en GoDaddy y usar DNS de Cloudflare**
1. Cloudflare → Add a site → `highhopes.shop` (plan Free). Cloudflare da 2 nameservers.
2. GoDaddy → Mis productos → Dominio → DNS → Nameservers → *Cambiar* → "Introducir mis propios nameservers" → pegar los 2 de Cloudflare. (Propaga en minutos a unas horas.)
3. Railway → Settings → Networking → Custom Domain → agregar `highhopes.shop` y `www.highhopes.shop`; Railway muestra el CNAME destino.
4. Cloudflare → DNS: CNAME `@` y `www` → destino de Railway (Cloudflare permite CNAME en la raíz).
5. Cloudflare → SSL/TLS → **Full (strict)**.

**Opción B: todo en GoDaddy**
- DNS de GoDaddy: CNAME `www` → destino de Railway.
- GoDaddy no permite CNAME en la raíz (`@`): configurar "Reenvío de dominio" de `highhopes.shop` → `https://www.highhopes.shop` (301). Menos limpio y sin protección de Cloudflare.

## 4. Después de subir
- Entrar a `/admin`, cambiar la contraseña, cargar logo (Configuración → Logo, tamaño Grande), WhatsApp y productos.
- El logo, fondos y productos viven en la base: hacer backup del volumen (`/data/prod.db`) periódicamente.
