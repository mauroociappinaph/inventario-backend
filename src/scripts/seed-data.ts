import { connect, disconnect, connection } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Cargamos variables de entorno
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

// Modelos
interface Category {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

interface Role {
  name: string;
  description: string;
  permissions: string[];
  accessLevel: number;
  isDefault?: boolean;
}

interface User {
  name: string;
  email: string;
  password: string;
  companyName: string;
  initials: string;
  roles: string[];
}

// Datos semilla
const categories: Category[] = [
  {
    name: 'Cervezas',
    description: 'Todo tipo de cervezas',
    color: '#3b82f6',
    icon: 'beer'
  },
  {
    name: 'Vinos',
    description: 'Vinos tintos, blancos y rosados',
    color: '#ef4444',
    icon: 'wine'
  },
  {
    name: 'Destilados',
    description: 'Whisky, vodka, ron, tequila, etc.',
    color: '#10b981',
    icon: 'glass'
  },
  {
    name: 'Sin alcohol',
    description: 'Bebidas sin alcohol',
    color: '#0ea5e9',
    icon: 'bottle'
  },
];

const roles: Role[] = [
  {
    name: 'admin',
    description: 'Administrador con acceso completo',
    permissions: ['create:any', 'read:any', 'update:any', 'delete:any'],
    accessLevel: 100,
    isDefault: false
  },
  {
    name: 'manager',
    description: 'Gerente con acceso a la mayoría de funciones',
    permissions: ['create:any', 'read:any', 'update:any'],
    accessLevel: 70,
    isDefault: false
  },
  {
    name: 'user',
    description: 'Usuario estándar',
    permissions: ['read:own', 'update:own'],
    accessLevel: 10,
    isDefault: true
  },
];

const users: User[] = [
  {
    name: 'Admin',
    email: 'admin@example.com',
    password: 'admin123',
    companyName: 'Mi Empresa',
    initials: 'AD',
    roles: ['admin']
  },
  {
    name: 'Usuario Demo',
    email: 'demo@example.com',
    password: 'demo123',
    companyName: 'Mi Empresa',
    initials: 'UD',
    roles: ['user']
  }
];

// Función principal
async function seedData() {
  try {
    // Conectar a MongoDB
    await connect(MONGODB_URI!);
    console.log('Conectado a MongoDB');

    // Colecciones
    const db = connection.db;
    if (!db) {
      throw new Error('No se pudo conectar a la base de datos');
    }

    const categoriesCollection = db.collection('categories');
    const rolesCollection = db.collection('roles');
    const usersCollection = db.collection('users');

    // Sembrar categorías
    console.log('Sembrando categorías...');
    await categoriesCollection.deleteMany({});
    const categoriesResult = await categoriesCollection.insertMany(
      categories.map(cat => ({ ...cat, createdAt: new Date(), updatedAt: new Date() }))
    );
    console.log(`${categoriesResult.insertedCount} categorías insertadas`);

    // Sembrar roles

    await rolesCollection.deleteMany({});
    const rolesResult = await rolesCollection.insertMany(
      roles.map(role => ({ ...role, createdAt: new Date(), updatedAt: new Date() }))
    );
    console.log(`${rolesResult.insertedCount} roles insertados`);

    // Sembrar usuarios
    console.log('Sembrando usuarios...');
    await usersCollection.deleteMany({});

    // Encriptar contraseñas
    const saltRounds = 10;
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);
      await usersCollection.insertOne({
        ...user,
        password: hashedPassword,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null
      });
    }
    console.log(`${users.length} usuarios insertados`);

    console.log('¡Datos sembrados con éxito!');
  } catch (error) {
    console.error('Error sembrando datos:', error);
  } finally {
    await disconnect();
    console.log('Desconectado de MongoDB');
  }
}

// Ejecutar script
seedData();
