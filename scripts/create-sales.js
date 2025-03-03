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
  console.log('🚀 Creando movimientos de inventario tipo SALIDA para cálculo de ROI');

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
      console.log('⚠️ No hay productos en el sistema. No se pueden crear movimientos.');
      process.exit(1);
    }

    // Obtener usuario
    const usuarios = await obtenerUsuarios();
    if (!usuarios || usuarios.length === 0) {
      console.log('⚠️ No hay usuarios disponibles en el sistema.');
      process.exit(1);
    }

    // Crear movimientos de inventario para calcular ROI
    await crearMovimientosInventario(productos, usuarios[0]);

    // Verificar el ROI después de las actualizaciones
    await verificarROI();

    console.log('✅ Proceso completado. Se han creado movimientos de salida para calcular ROI');
  } catch (error) {
    console.error('❌ Error en el proceso:', error.message);
  } finally {
    rl.close();
  }
}

// Solicitar credenciales al usuario
async function solicitarCredenciales() {
  console.log('\n📝 Ingrese sus credenciales:');
  const email = await pregunta('Email: ');
  const password = await pregunta('Contraseña: ');
  return { email, password };
}

// Iniciar sesión y obtener token
async function iniciarSesion(credenciales) {
  try {
    console.log(`Intentando iniciar sesión en ${API_URL}/auth/login con email: ${credenciales.email}`);
    const response = await axios.post(`${API_URL}/auth/login`, credenciales);
    console.log('Respuesta del servidor:', response.status);
    return response.data.access_token;
  } catch (error) {
    console.error('Error al iniciar sesión:', error.message);
    if (error.response) {
      console.error('Detalles de la respuesta:', {
        status: error.response.status,
        data: error.response.data
      });
    }
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

// Obtener usuarios del sistema
async function obtenerUsuarios() {
  try {
    const response = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuarios:', error.message);
    // Si falla, usaremos un enfoque alternativo
    return [{ _id: 'default-user-id', name: 'Usuario Predeterminado' }];
  }
}

// Crear movimientos de inventario tipo "salida" para calcular ROI
async function crearMovimientosInventario(productos, usuario) {
  console.log('\n📊 Creando movimientos de inventario tipo SALIDA para calcular ROI...');

  let movimientosCreados = 0;
  const fecha = new Date();
  const fechaAyer = new Date(fecha);
  fechaAyer.setDate(fecha.getDate() - 1);
  const fechaAnteayer = new Date(fecha);
  fechaAnteayer.setDate(fecha.getDate() - 2);

  for (const producto of productos) {
    // Solo crear salidas para productos con stock > 0
    if (producto.stock > 0) {
      // Calcular una cantidad para la salida (entre 1 y 30% del stock)
      const cantidad = Math.max(1, Math.floor(Math.random() * (producto.stock * 0.3)));

      try {
        // Crear movimiento con fecha de hoy
        await axios.post(`${API_URL}/inventory`,
          {
            productId: producto._id,
            productName: producto.name,
            quantity: cantidad,
            type: 'salida',
            date: fecha,
            userId: usuario._id || 'default-user-id',
            userName: usuario.name || 'Usuario Sistema',
            notes: 'Venta para cálculo de ROI - Hoy'
          },
          { headers: { Authorization: `Bearer ${TOKEN}` } }
        );

        // Crear otro movimiento con fecha de ayer (si tiene suficiente stock)
        if (producto.stock > cantidad * 2) {
          await axios.post(`${API_URL}/inventory`,
            {
              productId: producto._id,
              productName: producto.name,
              quantity: Math.floor(cantidad * 0.8),
              type: 'salida',
              date: fechaAyer,
              userId: usuario._id || 'default-user-id',
              userName: usuario.name || 'Usuario Sistema',
              notes: 'Venta para cálculo de ROI - Ayer'
            },
            { headers: { Authorization: `Bearer ${TOKEN}` } }
          );

          // Y otro de hace dos días
          await axios.post(`${API_URL}/inventory`,
            {
              productId: producto._id,
              productName: producto.name,
              quantity: Math.floor(cantidad * 0.5),
              type: 'salida',
              date: fechaAnteayer,
              userId: usuario._id || 'default-user-id',
              userName: usuario.name || 'Usuario Sistema',
              notes: 'Venta para cálculo de ROI - Anteayer'
            },
            { headers: { Authorization: `Bearer ${TOKEN}` } }
          );

          movimientosCreados += 3;
          console.log(`✅ Movimientos creados para "${producto.name}": 3 salidas en diferentes fechas`);
        } else {
          movimientosCreados += 1;
          console.log(`✅ Movimiento creado para "${producto.name}": 1 salida`);
        }
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
    const response = await axios.get(`${API_URL}/inventory/statistics/roi`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });

    const roiData = response.data.roi || { avgRoi: 0, topRoiProducts: [] };

    console.log(`\nROI Promedio: ${roiData.avgRoi ? roiData.avgRoi.toFixed(2) : 0}%`);

    if (roiData.topRoiProducts && roiData.topRoiProducts.length > 0) {
      console.log('\nProductos con mejor ROI:');
      roiData.topRoiProducts.forEach((producto, index) => {
        console.log(`${index + 1}. ${producto.productName}: ${producto.roi.toFixed(2)}% (Ventas: ${producto.totalSalidas}, Valor: $${producto.totalValorSalidas.toFixed(2)})`);
      });
    } else {
      console.log('\n⚠️ No hay datos de ROI por producto disponibles aún.');
      console.log('Nota: Puede que los movimientos no se estén procesando correctamente. Verifique la estructura de datos.');
    }
  } catch (error) {
    console.error('❌ Error al verificar ROI:', error.message);
  }
}

// Ejecutar la función principal
main();
