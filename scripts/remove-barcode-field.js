/**
 * Script para eliminar el campo barcode de todos los productos existentes
 *
 * Ejecución:
 * - Para desarrollo: NODE_ENV=development node scripts/remove-barcode-field.js
 * - Para producción: NODE_ENV=production node scripts/remove-barcode-field.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Determinar la URL de conexión basada en el entorno
const dbUrl =
  process.env.NODE_ENV === 'production'
    ? process.env.MONGODB_URI
    : process.env.MONGODB_URI_DEV ||
      'mongodb://localhost:27017/inventory-management';

console.log(`Conectando a la base de datos: ${dbUrl}`);

// Conectar a MongoDB
mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('Conexión a MongoDB establecida con éxito.');

    try {
      // Obtener la colección de productos directamente
      const productsCollection = mongoose.connection.collection('products');

      // Eliminar el campo barcode de todos los documentos
      const result = await productsCollection.updateMany(
        {}, // seleccionar todos los documentos
        { $unset: { barcode: '' } }, // eliminar el campo barcode
      );

      console.log(
        `Operación completada. ${result.modifiedCount} documentos modificados.`,
      );

      // Verificar cuántos documentos aún tienen el campo barcode
      const remainingWithBarcode = await productsCollection.countDocuments({
        barcode: { $exists: true },
      });
      console.log(
        `Documentos que aún tienen el campo barcode: ${remainingWithBarcode}`,
      );
    } catch (error) {
      console.error('Error al eliminar el campo barcode:', error);
    } finally {
      // Cerrar conexión
      await mongoose.connection.close();
      console.log('Conexión a MongoDB cerrada.');
      process.exit(0);
    }
  })
  .catch((err) => {
    console.error('Error al conectar con MongoDB:', err);
    process.exit(1);
  });
