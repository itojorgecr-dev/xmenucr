# XMenú CR

**Costeá tu menú, conocé tu utilidad.**

SaaS multiempresa de costeo de recetas y menús para restaurantes. React + Vite
(SPA) sobre Firebase (Auth · Firestore · Storage), desplegado en Vercel.

> Estado: **PR 1 — esqueleto + Auth + onboarding + modelo multiempresa + reglas
> Firestore reales**. Ver el plan de fases al final.

---

## Stack

| Pieza | Tecnología |
|---|---|
| Frontend | React + Vite (SPA) en Vercel |
| Datos | Firebase Firestore + Storage |
| Auth | Firebase Auth (Google + correo/clave, verificación y reset en español) |
| Correos (fase siguiente) | Resend (`noreply@xmenucr.com`) vía `/api/*` |
| IA (fase siguiente) | Anthropic Claude (`claude-sonnet-4-6`) vía `/api/ia.js` |

## Correr en local

```bash
npm install
cp .env.example .env.local   # y completá los valores VITE_FIREBASE_*
npm run dev                  # http://localhost:5173
```

`npm run build` genera `dist/`. `npm run lint` corre ESLint.

## Variables de entorno

Las `VITE_FIREBASE_*` son **config pública** del cliente (se sirven al
navegador) — ver `.env.example`. Las secretas (`FIREBASE_SERVICE_ACCOUNT`,
`RESEND_API_KEY`, `ANTHROPIC_API_KEY`) van **solo en Vercel**, sin el prefijo
`VITE_`, y se usan desde funciones serverless en fases siguientes.

`VITE_SUPERADMIN_UID` habilita el panel de superadmin (Jorge) en el cliente. La
fuente de verdad de las reglas es el custom claim `superadmin` del token.

## Modelo de datos (multiempresa)

Cada documento del negocio lleva `empresaId`. La pertenencia se guarda con un ID
**determinístico** para que las reglas la resuelvan sin queries:

```
miembros/{empresaId}_{uid} = { empresaId, uid, correo, rol, estado }
```

Colecciones: `empresas`, `miembros`, `invitaciones`, `restaurantes`,
`proveedores`, `ingredientes`, `recetas`, `menuItems`, `categorias`,
`unidadesAbs`, `pedidos`, `bitacora`, `catalogos/{id}/productos`.

**Roles:** `dueño` (todo + plan + colaboradores), `editor` (todo el contenido),
`operador` (ingredientes + pedidos), `lector` (solo lectura). Las reglas de
`firestore.rules` y `storage.rules` aplican esto desde el día 1.

## Estructura

```
src/
  firebase.js            init del SDK cliente
  auth/                  AuthContext, Login, traducción de errores
  context/EmpresaContext.jsx  empresa activa + rol + plan
  onboarding/Bienvenida.jsx   crear empresa + primer restaurante + sembrar prueba
  lib/                   constants (planes/límites/unidades), empresa, seed, format, límites
  components/            Layout (tabs), Toast, GuiaVacio, Cargando
  pages/                 Landing, Menu, Ingredientes, Recetas, Pedidos, Config, Planes, Superadmin
firestore.rules · storage.rules · firestore.indexes.json · firebase.json
vercel.json
```

---

## Puesta en producción (checklist guiado — §8)

1. **Dominio:** comprar `xmenucr.com` en Namecheap (solo dominio, sin hosting).
2. **Firebase:** crear proyecto `xmenucr` → habilitar **Auth** (Google +
   Email/Password), **Firestore** y **Storage**.
3. **Repo + Vercel:** conectar este repo a Vercel; apuntar `xmenucr.com` a Vercel
   con los registros A/CNAME que indique Vercel.
4. **Resend:** agregar el dominio `xmenucr.com` (TXT/MX del subdominio `send`) →
   habilitar `noreply@xmenucr.com`. *(se usa en PR 4)*
5. **Variables en Vercel:** cargar las `VITE_FIREBASE_*`, `VITE_SUPERADMIN_UID` y
   —para fases siguientes— `FIREBASE_SERVICE_ACCOUNT`, `RESEND_API_KEY`,
   `ANTHROPIC_API_KEY`.
6. **Plantillas de correo** de Firebase Auth (verificación/reset): personalizarlas
   en español con remitente del dominio.
7. **Reglas:** publicar `firestore.rules` y `storage.rules`
   (`firebase deploy --only firestore:rules,storage`).
8. **Superadmin:** asignar el custom claim `superadmin: true` al UID de Jorge
   (Admin SDK) y setear `VITE_SUPERADMIN_UID` en Vercel.

---

## Plan de fases (PRs)

1. **PR 1 (este):** esqueleto + Auth + onboarding + multiempresa + reglas Firestore.
2. **PR 2:** módulo completo de costeo (Menú/Ingredientes/Recetas/Pedidos, §5).
3. **PR 3:** planes/límites, panel superadmin, invitaciones y roles.
4. **PR 4:** landing pública + correos Resend + exportaciones (Excel/PDF).
5. **PR 5:** catálogos maestros de proveedores (import masivo, diff, notificaciones).
