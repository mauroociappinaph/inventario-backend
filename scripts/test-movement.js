// Script para crear un movimiento de inventario manualmente
const axios = require('axios');
const { Types } = require('mongoose');

const API_URL = 'http://localhost:3001';

async function createInventoryMovement() {
  try {
    // Primero autenticamos para obtener un token
    const authResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'b@b.com',  // Cambia esto por un usuario válido
      password: '123456Ma'  // Cambia esto por la contraseña correcta
    });

    console.log('✅ Autenticación exitosa');
    console.log('📄 Respuesta completa:', JSON.stringify(authResponse.data, null, 2));

    const token = authResponse.data.token || authResponse.data.access_token;

    if (!token) {
      console.error('❌ No se encontró token en la respuesta');
      return;
    }

    console.log('🔑 Token recibido:', token.substring(0, 20) + '...');

    // Luego consultamos los productos disponibles
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    console.log('📋 Headers enviados:', headers);

    const productsResponse = await axios.get(`${API_URL}/products?limit=5`, {
      headers: headers
    });

    if (!productsResponse.data.products || productsResponse.data.products.length === 0) {
      console.log('❌ No hay productos disponibles');
      return;
    }

    // Tomamos el primer producto para el movimiento
    const product = productsResponse.data.products[0];
    console.log(`🔍 Producto seleccionado: ${product.name} (ID: ${product._id})`);

    // Creamos el movimiento de inventario
    const userId = '67c4c73e48339316cc5228d0'; // El ID del usuario actual

    const movementData = {
      productId: product._id,
      quantity: 1,
      movementType: 'out',
      movementDate: new Date(),
      userId: userId
    };

    console.log('📝 Datos del movimiento a crear:', movementData);

    // Enviamos la solicitud para crear el movimiento
    const movementResponse = await axios.post(`${API_URL}/inventory`, movementData, {
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Movimiento creado con éxito:', movementResponse.data);
  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
    if (error.response) {
      console.error('📄 Detalles de la respuesta:', {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers
      });
    }
  }
}

// Ejecutar la función
createInventoryMovement();
