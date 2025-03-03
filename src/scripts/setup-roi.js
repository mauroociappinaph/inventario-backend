/**
 * Script para configurar ROI en la aplicación
 * Este script:
 * 1. Añade campo de costo a productos existentes
 * 2. Crea movimientos de inventario necesarios para el cálculo de ROI
 */

require('dotenv').config();
const axios = require('axios');

// Configuración
const API_URL = 'http://localhost:3001';
const EMAIL = 'b@b.com';
const PASSWORD = '123456';
const USER_ID = '67c4c73e48339316cc5228d0';

// Función principal
async function setupRoi() {
  try {
    console.log('🚀 Iniciando configuración de ROI');

    // 1. Login para obtener token
    const token = await login(EMAIL, PASSWORD);
    if (!token) {
      console.error('❌ No se pudo obtener el token. Abortando.');
      return;
    }
    console.log('✅ Login exitoso');

    // 2. Obtener productos existentes
    const products = await getProducts(token);
    if (!products || products.length === 0) {
      console.log('⚠️ No se encontraron productos, creando nuevos...');
      await createProducts(token);
    } else {
      console.log(`✅ Productos existentes encontrados: ${products.length}`);
      // Actualizar productos con costos
      await updateProductsWithCosts(token, products);
    }

    // 3. Obtener productos actualizados
    const updatedProducts = await getProducts(token);
    if (!updatedProducts || updatedProducts.length === 0) {
      console.error('❌ No se pudieron obtener los productos actualizados. Abortando.');
      return;
    }

    // 4. Crear movimientos de inventario para calcular ROI
    await createInventoryMovements(token, updatedProducts);

    // 5. Verificar estadísticas y ROI
    await checkRoi(token);

    console.log('✅ Configuración de ROI completada con éxito');
  } catch (error) {
    console.error('❌ Error durante la configuración de ROI:', error.message);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    }
  }
}

// Funciones auxiliares
async function login(email, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    return response.data.data.accessToken;
  } catch (error) {
    console.error('Error en login:', error.message);
    return null;
  }
}

async function getProducts(token) {
  try {
    const response = await axios.get(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener productos:', error.message);
    return null;
  }
}

async function createProducts(token) {
  try {
    const productsToCreate = [
      {
        name: "Smartphone Premium",
        price: 800,
        cost: 400,
        stock: 50,
        minStock: 5,
        category: "Electrónicos",
        entryDate: new Date().toISOString(),
        userId: USER_ID
      },
      {
        name: "Laptop Ultrabook",
        price: 1200,
        cost: 700,
        stock: 20,
        minStock: 3,
        category: "Electrónicos",
        entryDate: new Date().toISOString(),
        userId: USER_ID
      }
    ];

    for (const product of productsToCreate) {
      const response = await axios.post(`${API_URL}/products`, product, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ Producto creado: ${product.name}`);
    }
  } catch (error) {
    console.error('Error al crear productos:', error.message);
  }
}

async function updateProductsWithCosts(token, products) {
  try {
    // Mapa de costos por nombre de producto (60% del precio como ejemplo)
    const costMap = {
      "Smartphone Premium": 400,
      "Laptop Ultrabook": 700
    };

    for (const product of products) {
      // Si ya tiene costo o no está en nuestro mapa, saltamos
      if (product.cost || !costMap[product.name]) continue;

      // Asignar costo basado en el mapa o calcular 50% del precio
      const cost = costMap[product.name] || Math.round(product.price * 0.5);

      const response = await axios.patch(
        `${API_URL}/products/${product._id}`,
        { cost },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`✅ Costo actualizado para: ${product.name} - Costo: ${cost}`);
    }
  } catch (error) {
    console.error('Error al actualizar costos:', error.message);
  }
}

async function createInventoryMovements(token, products) {
  try {
    // Verificar si ya hay movimientos para evitar duplicados
    const movements = await getInventoryMovements(token);
    if (movements && movements.length > 0) {
      console.log(`⚠️ Ya existen ${movements.length} movimientos. No se crearán nuevos.`);
      return;
    }

    // Crear movimientos para cada producto
    for (const product of products) {
      // Venta del 20% del stock para calcular ROI
      const saleQty = Math.ceil(product.stock * 0.2);

      // Crear movimiento de salida (venta)
      const movementData = {
        productId: product._id,
        quantity: saleQty,
        movementType: "out",
        movementDate: new Date().toISOString(),
        userId: USER_ID,
        notes: `Venta de ${product.name} para calcular ROI`
      };

      try {
        const response = await axios.post(
          `${API_URL}/inventory`,
          movementData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`✅ Movimiento creado para: ${product.name} - Cantidad: ${saleQty}`);
      } catch (error) {
        console.error(`Error al crear movimiento para ${product.name}:`, error.message);
        if (error.response) {
          console.error('Detalles:', error.response.data);
        }
      }
    }
  } catch (error) {
    console.error('Error al crear movimientos:', error.message);
  }
}

async function getInventoryMovements(token) {
  try {
    const response = await axios.get(`${API_URL}/inventory`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener movimientos:', error.message);
    return null;
  }
}

async function checkRoi(token) {
  try {
    const response = await axios.get(`${API_URL}/inventory/statistics`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('\n📊 Estadísticas de ROI:');
    console.log(`ROI Promedio: ${response.data.data.roi?.avgRoi || 0}%`);
    console.log('Productos con mejor ROI:');
    const topRoi = response.data.data.roi?.topRoi || [];
    if (topRoi.length === 0) {
      console.log('No hay datos de ROI por producto disponibles.');
    } else {
      topRoi.forEach((item, index) => {
        console.log(`${index + 1}. ${item.productName}: ${item.roi}%`);
      });
    }
  } catch (error) {
    console.error('Error al verificar ROI:', error.message);
  }
}

// Ejecutar la función principal
setupRoi().catch(console.error);
