// Este DTO define los campos que se pueden actualizar de un producto.
// Todos los campos son opcionales para permitir actualizar solo los necesarios.
export class UpdateProductDto {
  readonly name?: string;
  readonly description?: string;
  readonly price?: number;
  readonly stock?: number;
  readonly entryDate?: Date;
  readonly expirationDate?: Date;
  readonly category?: string;
  readonly subCategory?: string;
}
