/**
 * Script de migración de Firebase Storage
 * Mueve archivos de las rutas antiguas (usando entity_name) a las nuevas (usando storage_uid)
 *
 * Estructura antigua: accounts/{account_storage_uid}/entities/{entity_name}/...
 * Estructura nueva:   accounts/{account_storage_uid}/entities/{entity_storage_uid}/...
 *
 * Uso:
 * node scripts/migrate-storage-paths.js
 */

const admin = require('firebase-admin');
const poolAdmin = require('../src/db-admin.js');
const path = require('path');

// Inicializar Firebase Admin con bucket
let bucket;
try {
  const serviceAccountPath = path.join(__dirname, '../service-account.json');
  const serviceAccount = require(serviceAccountPath);

  // Tu Firebase Storage Bucket
  const FIREBASE_STORAGE_BUCKET = 'webadmin-4fa05.appspot.com';

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: FIREBASE_STORAGE_BUCKET
    });
  }

  bucket = admin.storage().bucket();
  console.log('✅ Firebase Admin inicializado correctamente');
  console.log(`📦 Storage Bucket: ${FIREBASE_STORAGE_BUCKET}`);
} catch (error) {
  console.error('❌ Error inicializando Firebase Admin:', error.message);
  process.exit(1);
}

/**
 * Obtiene el mapeo de rutas antiguas a nuevas desde la base de datos
 */
async function getEntityMappings() {
  try {
    const [accounts] = await poolAdmin.query(
      'SELECT account_id, storage_uid FROM accounts WHERE storage_uid IS NOT NULL'
    );

    const [entities] = await poolAdmin.query(
      'SELECT entity_id, account_id, entity_name, storage_uid FROM entities WHERE storage_uid IS NOT NULL'
    );

    // Crear mapeo de account_id -> storage_uid
    const accountMap = {};
    accounts.forEach(acc => {
      accountMap[acc.account_id] = acc.storage_uid;
    });

    // Crear array de mappings
    const mappings = entities.map(entity => {
      const accountStorageUid = accountMap[entity.account_id];
      return {
        entity_id: entity.entity_id,
        entity_name: entity.entity_name,
        oldPath: `accounts/${accountStorageUid}/entities/${entity.entity_name}`,
        newPath: `accounts/${accountStorageUid}/entities/${entity.storage_uid}`
      };
    });

    return mappings;
  } catch (error) {
    console.error('Error obteniendo mappings de entidades:', error);
    throw error;
  }
}

/**
 * Lista todos los archivos en una ruta
 */
async function listFiles(prefix) {
  try {
    const [files] = await bucket.getFiles({ prefix });
    return files;
  } catch (error) {
    if (error.code === 404) {
      return []; // No hay archivos en esta ruta
    }
    throw error;
  }
}

/**
 * Copia un archivo de una ruta a otra
 */
async function copyFile(sourceFile, destinationPath) {
  try {
    await sourceFile.copy(destinationPath);
    return true;
  } catch (error) {
    console.error(`  ❌ Error copiando ${sourceFile.name} -> ${destinationPath}:`, error.message);
    return false;
  }
}

/**
 * Elimina un archivo
 */
async function deleteFile(file) {
  try {
    await file.delete();
    return true;
  } catch (error) {
    console.error(`  ❌ Error eliminando ${file.name}:`, error.message);
    return false;
  }
}

/**
 * Migra archivos de una entidad
 */
async function migrateEntity(mapping, dryRun = false) {
  console.log(`\n📁 Entidad: ${mapping.entity_name} (ID: ${mapping.entity_id})`);
  console.log(`   Ruta antigua: ${mapping.oldPath}`);
  console.log(`   Ruta nueva:   ${mapping.newPath}`);

  // Listar archivos en ruta antigua
  const files = await listFiles(mapping.oldPath);

  if (files.length === 0) {
    console.log(`   ℹ️  No hay archivos para migrar`);
    return { copied: 0, deleted: 0, errors: 0 };
  }

  console.log(`   📄 Encontrados ${files.length} archivos`);

  let copied = 0;
  let deleted = 0;
  let errors = 0;

  for (const file of files) {
    const relativePath = file.name.replace(mapping.oldPath + '/', '');
    const newFilePath = `${mapping.newPath}/${relativePath}`;

    if (dryRun) {
      console.log(`   [DRY RUN] ${file.name} -> ${newFilePath}`);
      copied++;
    } else {
      // Copiar archivo
      const copySuccess = await copyFile(file, newFilePath);
      if (copySuccess) {
        copied++;
        console.log(`   ✅ Copiado: ${relativePath}`);

        // Eliminar archivo original
        const deleteSuccess = await deleteFile(file);
        if (deleteSuccess) {
          deleted++;
        } else {
          errors++;
        }
      } else {
        errors++;
      }
    }
  }

  return { copied, deleted, errors };
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando migración de Firebase Storage\n');

  // Verificar si se ejecuta en modo dry-run
  const dryRun = process.argv.includes('--dry-run');
  if (dryRun) {
    console.log('⚠️  MODO DRY RUN - No se realizarán cambios reales\n');
  }

  try {
    // Obtener mappings
    console.log('📊 Obteniendo mapeo de entidades...');
    const mappings = await getEntityMappings();
    console.log(`✅ ${mappings.length} entidades encontradas\n`);

    if (mappings.length === 0) {
      console.log('⚠️  No hay entidades para migrar');
      process.exit(0);
    }

    // Mostrar resumen
    console.log('📋 Resumen de migración:');
    mappings.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.entity_name}: ${m.oldPath} → ${m.newPath}`);
    });

    // Confirmar si no es dry-run
    if (!dryRun) {
      console.log('\n⚠️  ADVERTENCIA: Esta operación moverá archivos en Firebase Storage');
      console.log('   Si quieres hacer una prueba primero, ejecuta: node scripts/migrate-storage-paths.js --dry-run\n');

      // Esperar 5 segundos antes de continuar
      console.log('⏳ Iniciando en 5 segundos... (Ctrl+C para cancelar)');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Migrar cada entidad
    let totalCopied = 0;
    let totalDeleted = 0;
    let totalErrors = 0;

    for (const mapping of mappings) {
      const result = await migrateEntity(mapping, dryRun);
      totalCopied += result.copied;
      totalDeleted += result.deleted;
      totalErrors += result.errors;
    }

    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN FINAL');
    console.log('='.repeat(60));
    console.log(`✅ Archivos copiados:  ${totalCopied}`);
    if (!dryRun) {
      console.log(`🗑️  Archivos eliminados: ${totalDeleted}`);
    }
    console.log(`❌ Errores:            ${totalErrors}`);
    console.log('='.repeat(60));

    if (dryRun) {
      console.log('\n💡 Para ejecutar la migración real, ejecuta sin --dry-run');
    } else {
      console.log('\n🎉 Migración completada!');
    }

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    // Cerrar conexión a DB
    await poolAdmin.end();
    process.exit(0);
  }
}

// Ejecutar script
main();
