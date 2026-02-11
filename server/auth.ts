import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production");

export interface AuthPayload {
  userId: number;
  email: string;
  [key: string]: any;
}

/**
 * Hash uma senha usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verifica se uma senha corresponde ao hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Cria um JWT token
 */
export async function createToken(payload: AuthPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
  return token;
}

/**
 * Verifica e decodifica um JWT token
 */
export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as AuthPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Registra um novo usuário
 */
export async function registerUser(
  email: string,
  name: string,
  password: string
): Promise<{ success: boolean; message: string; userId?: number }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database not available" };
  }

  try {
    // Verifica se usuário já existe
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return { success: false, message: "Email já cadastrado" };
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password);

    // Cria novo usuário
    const result = await db.insert(users).values({
      openId: `local-${Date.now()}`,
      email,
      name,
      password: hashedPassword,
      loginMethod: "local",
      role: "user",
      lastSignedIn: new Date(),
    });

    return {
      success: true,
      message: "Usuário registrado com sucesso",
      userId: 1,
    };
  } catch (error) {
    console.error("[Auth] Registration error:", error);
    return { success: false, message: "Erro ao registrar usuário" };
  }
}

/**
 * Faz login de um usuário
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; token?: string; user?: any }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database not available" };
  }

  try {
    // Busca usuário por email
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (result.length === 0) {
      return { success: false, message: "Email ou senha incorretos" };
    }

    const user = result[0];
    if (!user.password) {
      return { success: false, message: "Usuário não tem senha configurada" };
    }

    // Verifica senha
    const passwordMatch = await verifyPassword(password, user.password);
    if (!passwordMatch) {
      return { success: false, message: "Email ou senha incorretos" };
    }

    // Atualiza lastSignedIn
    await db
      .update(users)
      .set({ lastSignedIn: new Date() })
      .where(eq(users.id, user.id));

    // Cria token
    const token = await createToken({
      userId: user.id,
      email: user.email || "",
    });

    return {
      success: true,
      message: "Login realizado com sucesso",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("[Auth] Login error:", error);
    return { success: false, message: "Erro ao fazer login" };
  }
}
