// Define la estructura de datos necesaria para crear un nuevo producto.
// Estos campos corresponden a los definidos en el esquema.
export class CreateProductDto {
  // Nombre del producto (requerido)
  readonly name: string;

  // Descripción del producto (opcional)
  readonly description?: string;

  // Precio del producto (requerido, no negativo)
  readonly price: number;

  // Stock disponible (requerido, entero y no negativo)
  readonly stock: number;

  // Fecha de ingreso del producto (requerido)
  readonly entryDate: Date;

  // Fecha de caducidad del producto (opcional)
  readonly expirationDate?: Date;

  // Categoría del producto (opcional)
  readonly category?: string;

  // Subcategoría del producto (opcional)
  readonly subCategory?: string;
}
