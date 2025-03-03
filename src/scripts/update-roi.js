// Script para actualizar la base de datos y simular datos para ROI
const { MongoClient, ObjectId } = require('mongodb');

async function updateRoiData() {
  // Conexión a MongoDB
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Conectado a MongoDB');

    const database = client.db('inventory-app');
    const productsCollection = database.collection('products');
    const inventoriesCollection = database.collection('inventories');

    // ID del usuario b@b.com
    const userId = '67c4c73e48339316cc5228d0';

    // 1. Actualizar productos existentes (ajustar precios para un mejor ROI)
    const smartphones = await productsCollection.findOne({
      name: "Smartphone Premium",
      userId: new ObjectId(userId)
    });

    const laptops = await productsCollection.findOne({
      name: "Laptop Ultrabook",
      userId: new ObjectId(userId)
    });

    if (smartphones) {
      console.log('Actualizando precios de los smartphones');
      await productsCollection.updateOne(
        { _id: smartphones._id },
        { $set: { price: 800, cost: 400 } } // Añadimos coste para el cálculo de ROI
      );
    }

    if (laptops) {
      console.log('Actualizando precios de las laptops');
      await productsCollection.updateOne(
        { _id: laptops._id },
        { $set: { price: 1200, cost: 700 } } // Añadimos coste para el cálculo de ROI
      );
    }

    // 2. Crear movimientos de inventario (ventas)
    if (smartphones) {
      console.log('Creando ventas para smartphones');
      // Crear varios movimientos de venta para generar historial
      await inventoriesCollection.insertMany([
        {
          productId: smartphones._id,
          quantity: 10,
          movementType: "out",
          movementDate: new Date(),
          userId: new ObjectId(userId),
          notes: "Venta de teléfonos - Lote 1",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          productId: smartphones._id,
          quantity: 5,
          movementType: "out",
          movementDate: new Date(Date.now() - 86400000), // Ayer
          userId: new ObjectId(userId),
          notes: "Venta de teléfonos - Lote 2",
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 86400000)
        }
      ]);
    }

    if (laptops) {
      console.log('Creando ventas para laptops');
      await inventoriesCollection.insertMany([
        {
          productId: laptops._id,
          quantity: 5,
          movementType: "out",
          movementDate: new Date(),
          userId: new ObjectId(userId),
          notes: "Venta de laptops - Lote 1",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          productId: laptops._id,
          quantity: 3,
          movementType: "out",
          movementDate: new Date(Date.now() - 43200000), // Hace 12 horas
          userId: new ObjectId(userId),
          notes: "Venta de laptops - Lote 2",
          createdAt: new Date(Date.now() - 43200000),
          updatedAt: new Date(Date.now() - 43200000)
        }
      ]);
    }

    console.log('Datos actualizados con éxito. Ahora puedes verificar el ROI en la API.');

  } catch (error) {
    console.error('Error al actualizar datos:', error);
  } finally {
    await client.close();
    console.log('Conexión a MongoDB cerrada');
  }
}

// Ejecutar la función
updateRoiData().catch(console.error);
