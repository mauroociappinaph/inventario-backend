#!/usr/bin/env node

const axios = require('axios');
const readline = require('readline');

const API_URL = 'http://localhost:3001';
let TOKEN = '';

// Crear una interfaz de readline para interactuar con el usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Función para hacer una pregunta y esperar la respuesta
function pregunta(texto) {
  return new Promise((resolve) => {
    rl.question(texto, (respuesta) => {
      resolve(respuesta);
    });
  });
}

// Función principal
async function main() {
  console.log('🚀 Iniciando configuración de ROI para productos existentes');

  try {
    // Inicio de sesión para obtener token
    const credenciales = await solicitarCredenciales();
    TOKEN = await iniciarSesion(credenciales);

    if (!TOKEN) {
      console.error('❌ No se pudo obtener el token. Verifique sus credenciales.');
      process.exit(1);
    }

    console.log('✅ Sesión iniciada correctamente');

    // Obtener todos los productos
    const productos = await obtenerProductos();

    if (productos.length === 0) {
      console.log('⚠️ No hay productos en el sistema. Primero debe crear algunos productos.');
      const crearNuevos = await pregunta('¿Desea crear algunos productos de ejemplo? (s/n): ');

      if (crearNuevos.toLowerCase() === 's') {
        await crearProductosEjemplo();
        // Volver a obtener los productos después de crearlos
        const nuevosProductos = await obtenerProductos();
        await actualizarCostosProductos(nuevosProductos);
      } else {
        console.log('Saliendo del script sin hacer cambios.');
        process.exit(0);
      }
    } else {
      // Actualizar costos de productos existentes
      await actualizarCostosProductos(productos);
    }

    // Crear movimientos de inventario para probar ROI
    const crearMovimientos = await pregunta('¿Desea crear movimientos de inventario para probar ROI? (s/n): ');

    if (crearMovimientos.toLowerCase() === 's') {
      await crearMovimientosInventario(productos);
    }

    // Verificar el ROI después de las actualizaciones
    await verificarROI();

    console.log('✅ Proceso de configuración de ROI completado');
  } catch (error) {
    console.error('❌ Error en el proceso:', error.message);
  } finally {
    rl.close();
  }
}

// Solicitar credenciales al usuario
async function solicitarCredenciales() {
  const email = await pregunta('Email: ');
  const password = await pregunta('Contraseña: ');
  return { email, password };
}

// Iniciar sesión y obtener token
async function iniciarSesion(credenciales) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, credenciales);
    return response.data.access_token;
  } catch (error) {
    console.error('Error al iniciar sesión:', error.message);
    return null;
  }
}

// Obtener todos los productos
async function obtenerProductos() {
  try {
    const response = await axios.get(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener productos:', error.message);
    return [];
  }
}

// Actualizar costos de productos existentes
async function actualizarCostosProductos(productos) {
  console.log(`\n📦 Actualizando costos para ${productos.length} productos...`);

  let actualizados = 0;

  for (const producto of productos) {
    // Si el producto no tiene costo o el costo es 0, asignarle uno basado en el precio
    if (!producto.cost || producto.cost === 0) {
      const nuevoCosto = producto.price * 0.6; // Por defecto, el costo es 60% del precio

      try {
        await axios.put(`${API_URL}/products/${producto._id}`,
          { cost: nuevoCosto },
          { headers: { Authorization: `Bearer ${TOKEN}` } }
        );

        console.log(`✅ Producto "${producto.name}": Precio: $${producto.price}, Costo actualizado: $${nuevoCosto.toFixed(2)}`);
        actualizados++;
      } catch (error) {
        console.error(`❌ Error al actualizar costo para "${producto.name}":`, error.message);
      }
    } else {
      console.log(`ℹ️ Producto "${producto.name}" ya tiene costo: $${producto.cost}`);
    }
  }

  console.log(`\n✅ ${actualizados} productos actualizados con nuevos costos.`);
}

// Crear productos de ejemplo
async function crearProductosEjemplo() {
  console.log('\n📦 Creando productos de ejemplo...');

  const productosEjemplo = [
    {
      name: 'Smartphone Premium',
      price: 899.99,
      cost: 599.99,
      stock: 50,
      minStock: 10,
      category: 'Electrónica'
    },
    {
      name: 'Laptop Profesional',
      price: 1299.99,
      cost: 899.99,
      stock: 25,
      minStock: 5,
      category: 'Computadoras'
    },
    {
      name: 'Auriculares Bluetooth',
      price: 129.99,
      cost: 69.99,
      stock: 100,
      minStock: 20,
      category: 'Accesorios'
    },
    {
      name: 'Tablet HD',
      price: 399.99,
      cost: 249.99,
      stock: 30,
      minStock: 8,
      category: 'Electrónica'
    },
    {
      name: 'Monitor 4K',
      price: 349.99,
      cost: 219.99,
      stock: 15,
      minStock: 3,
      category: 'Computadoras'
    }
  ];

  let creados = 0;

  for (const producto of productosEjemplo) {
    try {
      const response = await axios.post(`${API_URL}/products`,
        producto,
        { headers: { Authorization: `Bearer ${TOKEN}` } }
      );

      console.log(`✅ Producto creado: "${producto.name}"`);
      creados++;
    } catch (error) {
      console.error(`❌ Error al crear producto "${producto.name}":`, error.message);
    }
  }

  console.log(`\n✅ ${creados} productos de ejemplo creados.`);
}

// Crear movimientos de inventario para probar ROI
async function crearMovimientosInventario(productos) {
  console.log('\n📊 Creando movimientos de inventario para calcular ROI...');

  let movimientosCreados = 0;

  for (const producto of productos) {
    // Solo crear salidas (ventas) para productos con stock > 0
    if (producto.stock > 0) {
      // Calcular una cantidad aleatoria para la salida (entre 1 y 50% del stock)
      const cantidad = Math.max(1, Math.floor(Math.random() * (producto.stock * 0.5)));

      try {
        await axios.post(`${API_URL}/inventory`,
          {
            productId: producto._id,
            quantity: cantidad,
            type: 'salida',
            notes: 'Venta para cálculo de ROI'
          },
          { headers: { Authorization: `Bearer ${TOKEN}` } }
        );

        console.log(`✅ Movimiento creado para "${producto.name}": Salida de ${cantidad} unidades`);
        movimientosCreados++;
      } catch (error) {
        console.error(`❌ Error al crear movimiento para "${producto.name}":`, error.message);
      }
    }
  }

  console.log(`\n✅ ${movimientosCreados} movimientos de inventario creados para calcular ROI.`);
}

// Verificar el ROI después de las actualizaciones
async function verificarROI() {
  console.log('\n📊 Verificando estadísticas de ROI...');

  try {
    const response = await axios.get(`${API_URL}/inventory/statistics`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });

    const roiData = response.data.roi || { avgRoi: 0, topRoiProducts: [] };

    console.log(`\nROI Promedio: ${roiData.avgRoi ? roiData.avgRoi.toFixed(2) : 0}%`);

    if (roiData.topRoiProducts && roiData.topRoiProducts.length > 0) {
      console.log('\nProductos con mejor ROI:');
      roiData.topRoiProducts.forEach((producto, index) => {
        console.log(`${index + 1}. ${producto.productName}: ${producto.roi.toFixed(2)}% (Costo: $${producto.costoPromedio.toFixed(2)}, Valor ventas: $${producto.totalValorSalidas.toFixed(2)})`);
      });
    } else {
      console.log('\nNo hay datos de ROI por producto disponibles aún.');
      console.log('Nota: Para ver datos de ROI, asegúrese de que haya movimientos de tipo "salida" en el inventario.');
    }
  } catch (error) {
    console.error('Error al verificar ROI:', error.message);
  }
}

// Ejecutar la función principal
main();
