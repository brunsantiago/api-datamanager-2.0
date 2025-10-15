# API de Provisioning - Documentación

## Resumen
Endpoints para gestión de tokens de configuración de empresas en AppControl.

**Empresas soportadas:**
- SAB-5 (ID: 1)
- CONSISA (ID: 2)
- BROUCLEAN (ID: 3)

---

## Setup Inicial

### 1. Instalar Dependencias
```bash
cd C:\Proyectos\Web-Server\Server\api-datamanager-2.0
npm install
```

Las dependencias `qrcode` y `uuid` ya fueron instaladas.

### 2. Crear Tabla en Base de Datos
Ejecutar el archivo SQL:
```bash
mysql -u usuario -p nombre_db < provisioning_tokens.sql
```

O ejecutarlo manualmente desde MySQL Workbench/phpMyAdmin.

### 3. Reiniciar Servidor
```bash
npm run dev
# o
npm start
```

---

## Endpoints

### 1. Generar Token (Admin)
**POST** `/api/v2/provisioning/generate-token`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "companyId": 1
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "token": "a1b2c3d4e5f6g7h8...",
    "activationCode": "SAB5-A7F2-9B3D-C8E1",
    "qrCodeDataUrl": "data:image/png;base64,iVBORw0KG...",
    "deepLink": "appcontrol://configure?token=a1b2c3d4...",
    "universalLink": "https://app.appcontrol.com.ar/configure?token=a1b2c3d4...",
    "companyId": 1,
    "companyName": "SAB-5",
    "expiresAt": "2025-10-10T10:00:00.000Z",
    "createdAt": "2025-10-08T10:00:00.000Z"
  }
}
```

**Códigos de activación por empresa:**
- SAB-5: `SAB5-XXXX-XXXX-XXXX`
- CONSISA: `CONS-XXXX-XXXX-XXXX`
- BROUCLEAN: `BROU-XXXX-XXXX-XXXX`

---

### 2. Validar Token (Público)
**POST** `/api/v2/provisioning/validate-token`

**Headers:**
```
Content-Type: application/json
```

**Body (opción 1 - con token):**
```json
{
  "token": "a1b2c3d4e5f6g7h8..."
}
```

**Body (opción 2 - con código de activación):**
```json
{
  "activationCode": "SAB5-A7F2-9B3D-C8E1"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "companyId": 1,
    "companyName": "SAB-5",
    "displayName": "SAB 5"
  }
}
```

**Errores posibles:**
- `404 TOKEN_NOT_FOUND` - Token/código inválido
- `403 TOKEN_ALREADY_USED` - Ya fue utilizado
- `403 TOKEN_EXPIRED` - Expiró (>48 horas)

---

### 3. Listar Tokens (Admin)
**GET** `/api/v2/provisioning/tokens?status=active`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Query Parameters:**
- `status`: `active` | `used` | `expired` | `all` (opcional)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "token": "a1b2c3d4...",
      "activation_code": "SAB5-A7F2-9B3D-C8E1",
      "company_id": 1,
      "company_name": "SAB-5",
      "created_at": "2025-10-08T10:00:00.000Z",
      "expires_at": "2025-10-10T10:00:00.000Z",
      "used": false,
      "used_at": null
    }
  ],
  "count": 1
}
```

---

### 4. Revocar Token (Admin)
**DELETE** `/api/v2/provisioning/tokens/:tokenId`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Token revocado exitosamente"
}
```

---

## Ejemplos de Uso

### Generar Token con curl
```bash
curl -X POST http://localhost:3000/api/v2/provisioning/generate-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"companyId": 1}'
```

### Validar Token con curl
```bash
curl -X POST http://localhost:3000/api/v2/provisioning/validate-token \
  -H "Content-Type: application/json" \
  -d '{"activationCode": "SAB5-A7F2-9B3D-C8E1"}'
```

### Listar Tokens Activos
```bash
curl -X GET "http://localhost:3000/api/v2/provisioning/tokens?status=active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Testing con Postman

### Colección de Endpoints

**1. Generate Token (SAB-5)**
```
POST http://localhost:3000/api/v2/provisioning/generate-token
Headers:
  Authorization: Bearer {tu_jwt_token}
  Content-Type: application/json
Body:
{
  "companyId": 1
}
```

**2. Generate Token (CONSISA)**
```
POST http://localhost:3000/api/v2/provisioning/generate-token
Headers:
  Authorization: Bearer {tu_jwt_token}
  Content-Type: application/json
Body:
{
  "companyId": 2
}
```

**3. Validate Token**
```
POST http://localhost:3000/api/v2/provisioning/validate-token
Headers:
  Content-Type: application/json
Body:
{
  "token": "copiado del response anterior"
}
```

**4. Validate Activation Code**
```
POST http://localhost:3000/api/v2/provisioning/validate-token
Headers:
  Content-Type: application/json
Body:
{
  "activationCode": "SAB5-A7F2-9B3D-C8E1"
}
```

---

## Flujo Completo de Provisioning

### Desde Panel Admin (Web):

1. Admin selecciona empresa (SAB-5, CONSISA, BROUCLEAN)
2. Click en "Generar Código"
3. Backend genera token y QR
4. Panel muestra:
   - QR Code (descargable/imprimible)
   - Código de activación (copiable)
   - Link HTTPS (para enviar por email/WhatsApp)
   - Fecha de expiración

### Desde App Android:

**Opción 1: QR Code**
1. Usuario abre app (primera vez)
2. Pantalla de provisioning
3. Click "Escanear QR"
4. Escanea QR → extrae token
5. POST `/provisioning/validate-token` con token
6. Guarda empresa en SharedPreferences
7. Redirige a Login

**Opción 2: Código Manual**
1. Usuario abre app (primera vez)
2. Click "Ingresar Código Manual"
3. Ingresa: `SAB5-A7F2-9B3D-C8E1`
4. POST `/provisioning/validate-token` con activationCode
5. Guarda empresa
6. Redirige a Login

**Opción 3: Universal Link (automático)**
1. Usuario recibe link por email/WhatsApp
2. Click en `https://app.appcontrol.com.ar/configure?token=XXX`
3. Android abre app automáticamente
4. POST `/provisioning/validate-token` con token
5. Guarda empresa
6. Redirige a Login

---

## Estructura de Base de Datos

### Tabla: `provisioning_tokens`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | PK, Auto-increment |
| token | VARCHAR(255) | Token único (hex 64 chars) |
| activation_code | VARCHAR(20) | Código formato `XXXX-XXXX-XXXX-XXXX` |
| company_id | INT | 1=SAB-5, 2=CONSISA, 3=BROUCLEAN |
| company_name | VARCHAR(50) | Nombre de empresa |
| created_at | DATETIME | Fecha de creación |
| expires_at | DATETIME | Fecha de expiración (48h) |
| used | BOOLEAN | Si fue usado |
| used_at | DATETIME | Cuando fue usado |
| created_by_admin_id | INT | ID del admin que lo creó (opcional) |

**Índices:**
- `token` (UNIQUE)
- `activation_code` (UNIQUE)
- `expires_at`
- `company_id`

---

## Seguridad

### Tokens
- ✅ Generados con `crypto.randomBytes(32)` (64 chars hex)
- ✅ Únicos (constraint UNIQUE en DB)
- ✅ Expiran en 48 horas
- ✅ Un solo uso (marcado como `used=true`)

### Endpoints Protegidos
- `POST /provisioning/generate-token` → Requiere JWT
- `GET /provisioning/tokens` → Requiere JWT
- `DELETE /provisioning/tokens/:id` → Requiere JWT

### Endpoints Públicos
- `POST /provisioning/validate-token` → Sin autenticación (usado por app)

---

## Mantenimiento

### Limpiar Tokens Expirados
Ejecutar periódicamente:
```sql
DELETE FROM provisioning_tokens
WHERE used = FALSE
AND expires_at < NOW();
```

O crear un cron job en el backend.

### Ver Estadísticas
```sql
-- Tokens activos
SELECT COUNT(*) FROM provisioning_tokens
WHERE used = FALSE AND expires_at > NOW();

-- Tokens usados hoy
SELECT COUNT(*) FROM provisioning_tokens
WHERE used = TRUE AND DATE(used_at) = CURDATE();

-- Por empresa
SELECT company_name, COUNT(*) as total
FROM provisioning_tokens
WHERE used = TRUE
GROUP BY company_name;
```

---

## Troubleshooting

### Error: `ER_NO_SUCH_TABLE: provisioning_tokens`
**Solución**: Ejecutar `provisioning_tokens.sql`

### Error: `ER_DUP_ENTRY`
**Causa**: Token o activation_code duplicado (muy raro)
**Solución**: Regenerar token (automático en el código)

### QR no se genera
**Verificar**: Dependencia `qrcode` instalada
```bash
npm list qrcode
```

### Token siempre expira
**Verificar**: Zona horaria del servidor MySQL
```sql
SELECT NOW();
```

---

## Próximos Pasos

1. ✅ Crear tabla en DB
2. ✅ Reiniciar servidor
3. ⏳ Probar endpoints con Postman
4. ⏳ Desarrollar panel admin web
5. ⏳ Integrar con app Android

---

**Fecha**: 08/10/2025
**Versión API**: 2.0
**Empresas**: SAB-5, CONSISA, BROUCLEAN
