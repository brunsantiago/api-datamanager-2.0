# Script de Migración de Firebase Storage

Este script migra archivos de Firebase Storage de las rutas antiguas (usando `entity_name`) a las nuevas rutas (usando `storage_uid`).

## Requisitos previos

1. **service-account.json**: Asegúrate de tener el archivo de credenciales de Firebase en la raíz del proyecto
2. **Base de datos actualizada**: Las tablas `accounts` y `entities` deben tener los campos `storage_uid` poblados
3. **Node.js**: Versión 14 o superior

## Configuración

Antes de ejecutar el script, actualiza la línea 25 del archivo `migrate-storage-paths.js` con tu Firebase Storage Bucket:

```javascript
const FIREBASE_STORAGE_BUCKET = 'tu-proyecto.firebasestorage.app';
```

Puedes encontrar tu Storage Bucket en:
- Firebase Console → Storage → Pestaña "Files" → URL en la parte superior

## Uso

### 1. Modo DRY RUN (Recomendado primero)

Este modo **NO hace cambios reales**, solo muestra qué archivos se moverían:

```bash
cd C:\Proyectos\Web-Server\Server\api-datamanager-2.0
node scripts/migrate-storage-paths.js --dry-run
```

### 2. Ejecutar migración real

Una vez que hayas verificado con `--dry-run` que todo está correcto:

```bash
node scripts/migrate-storage-paths.js
```

**⚠️ ADVERTENCIA**: El script esperará 5 segundos antes de comenzar. Presiona `Ctrl+C` para cancelar.

## Qué hace el script

1. **Lee la base de datos** para obtener el mapeo de:
   - `account_id` → `storage_uid` (de tabla `accounts`)
   - `entity_name` → `storage_uid` (de tabla `entities`)

2. **Construye rutas**:
   - **Antigua**: `accounts/{account_uid}/entities/{entity_name}/...`
   - **Nueva**: `accounts/{account_uid}/entities/{entity_storage_uid}/...`

3. **Para cada entidad**:
   - Lista todos los archivos en la ruta antigua
   - Copia cada archivo a la nueva ruta
   - Elimina el archivo de la ruta antigua

4. **Muestra un resumen** al finalizar

## Ejemplo de salida

```
🚀 Iniciando migración de Firebase Storage

📊 Obteniendo mapeo de entidades...
✅ 4 entidades encontradas

📋 Resumen de migración:
   1. SAB-5: accounts/SB9m.../entities/SAB-5 → accounts/SB9m.../entities/e7K2...
   2. CONSISA: accounts/SB9m.../entities/CONSISA → accounts/SB9m.../entities/f8L3...
   3. BROUCLEAN: accounts/SB9m.../entities/BROUCLEAN → accounts/SB9m.../entities/g9M4...
   4. HIGHT-SECURITY: accounts/XyZ9.../entities/HIGHT-SECURITY → accounts/XyZ9.../entities/h0N5...

⏳ Iniciando en 5 segundos... (Ctrl+C para cancelar)

📁 Entidad: SAB-5 (ID: 1)
   Ruta antigua: accounts/SB9m.../entities/SAB-5
   Ruta nueva:   accounts/SB9m.../entities/e7K2...
   📄 Encontrados 15 archivos
   ✅ Copiado: users/profile_photos/1234/1234_profile_photo.jpg
   ✅ Copiado: users/profile_photos/5678/5678_profile_photo.jpg
   ...

============================================================
📊 RESUMEN FINAL
============================================================
✅ Archivos copiados:  42
🗑️  Archivos eliminados: 42
❌ Errores:            0
============================================================

🎉 Migración completada!
```

## Solución de problemas

### Error: "Firebase Admin no está inicializado"
- Verifica que existe `service-account.json` en la raíz del proyecto
- Descárgalo desde Firebase Console → Project Settings → Service Accounts

### Error: "storageBucket is not defined"
- Actualiza la variable `FIREBASE_STORAGE_BUCKET` en el script (línea 25)

### Algunos archivos no se copian
- El script registrará los errores específicos
- Puedes ejecutar el script nuevamente; solo procesará archivos que aún no se hayan movido

### Quiero revertir los cambios
- No hay función de rollback automática
- Los archivos antiguos se eliminan después de copiar
- **Recomendación**: Siempre ejecuta con `--dry-run` primero

## Notas importantes

- ✅ El script es **idempotente**: si lo ejecutas varias veces, solo moverá archivos que aún no estén en la nueva ubicación
- ✅ **Seguro**: Copia primero, elimina después (solo si la copia fue exitosa)
- ⚠️ **Tiempo**: Puede tardar varios minutos dependiendo de la cantidad de archivos
- ⚠️ **Costos**: Firebase Storage cobra por operaciones de lectura/escritura

## Después de la migración

1. ✅ Reinicia el servidor backend
2. ✅ Reinicia Angular frontend
3. ✅ Verifica que las fotos de perfil se carguen correctamente
4. ✅ Puedes eliminar manualmente las carpetas antiguas vacías desde Firebase Console (opcional)
