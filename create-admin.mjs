import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vendas_crm'
});

const email = 'admin@vendas.com';
const password = 'Admin@123456';
const name = 'Administrador';

const hashedPassword = await bcrypt.hash(password, 10);

try {
  await connection.execute(
    'INSERT INTO users (openId, email, password, name, role, loginMethod) VALUES (?, ?, ?, ?, ?, ?)',
    [
      `admin-${Date.now()}`,
      email,
      hashedPassword,
      name,
      'admin',
      'local'
    ]
  );
  
  console.log('✅ Usuário administrador criado com sucesso!');
  console.log(`📧 Email: ${email}`);
  console.log(`🔐 Senha: ${password}`);
  console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
} catch (error) {
  console.error('❌ Erro ao criar usuário:', error.message);
} finally {
  await connection.end();
}
