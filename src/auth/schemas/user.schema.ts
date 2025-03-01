import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document;

// Definición de tipos para las preferencias del usuario
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  dateFormat?: string;
  timeFormat?: string;
}

// Enum para el estado del usuario
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
  PENDING = 'pending',
}

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  toJSON: {
    transform: (_, ret) => {
      delete ret.password;
      return ret;
    },
  },
})
export class User {
  // Nombre completo del usuario
  @Prop({ required: true, trim: true })
  name: string;

  // Iniciales para avatar
  @Prop({ trim: true })
  initials: string;

  // El email es requerido y debe ser único.
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  // La contraseña es requerida.
  @Prop({ required: true })
  password: string;

  // URL del avatar, opcional
  @Prop()
  avatar: string;

  // Nombre de la compañía, requerido.
  @Prop({ required: true, trim: true })
  companyName: string;

  // Número de teléfono, opcional.
  @Prop({ trim: true })
  phone: string;

  // Fecha del último login, opcional.
  @Prop()
  lastLogin: Date;

  // Intentos fallidos de login
  @Prop({ default: 0 })
  failedLoginAttempts: number;

  // Referencia al rol principal
  @Prop({ type: Types.ObjectId, ref: 'Role' })
  roleId: Types.ObjectId;

  // Roles del usuario (nombres para búsqueda rápida)
  @Prop({ type: [String], default: ['usuario'] })
  roles: string[];

  // Permisos específicos asignados directamente al usuario
  @Prop({ type: [String], default: [] })
  permissions: string[];

  // Estado del usuario: active, inactive, blocked, pending
  @Prop({ default: UserStatus.ACTIVE, enum: Object.values(UserStatus) })
  status: UserStatus;

  // Token para recuperación de contraseña
  @Prop()
  resetPasswordToken: string;

  // Fecha de expiración del token de recuperación
  @Prop()
  resetPasswordExpires: Date;

  // Token para verificación de email
  @Prop()
  emailVerificationToken: string;

  // Flag para verificación de email
  @Prop({ default: false })
  isEmailVerified: boolean;

  // Preferencias del usuario (tema, idioma, etc.)
  @Prop({ type: Object, default: { theme: 'system', notifications: { email: true, push: true, sms: false } } })
  preferences: UserPreferences;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Pre-save hook para hashear la contraseña
UserSchema.pre('save', async function(next) {
  const user = this as UserDocument;

  // Sólo hash si la contraseña ha sido modificada o es nueva
  if (!user.isModified('password')) return next();

  try {
    // Generar un salt y hash la contraseña
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};
