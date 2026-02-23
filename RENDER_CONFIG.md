# Configuração Automática para Render

## ✅ Seu CRM está pronto para o Render!

Este arquivo contém todas as variáveis de ambiente que você precisa configurar.

---

## 📋 Variáveis de Ambiente (Copie e Cole no Render)

Acesse: https://dashboard.render.com → Seu Serviço → Environment

Adicione EXATAMENTE estas variáveis:

```
DATABASE_URL=file:./data/crm.db
JWT_SECRET=2Mo+uHwmRkKFYQKpuFg9HHwTFj8EnICsTqWPp9vvaqw=
VITE_APP_ID=8dd34c0ec20ec71a181cd3bc0b2c1395
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://api.manus.im
BUILT_IN_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=local-dev-key
VITE_FRONTEND_FORGE_API_KEY=local-dev-key
OWNER_OPEN_ID=local-owner
OWNER_NAME=Administrador
VITE_APP_TITLE=Manus CRM
VITE_APP_LOGO=/logo.png
NODE_ENV=production
```

---

## 🚀 Passos para Configurar no Render

### 1️⃣ Acesse o Render
- Vá para https://dashboard.render.com
- Faça login com sua conta

### 2️⃣ Vá para seu Serviço
- Clique em **crm-equipe-santiago1**

### 3️⃣ Abra Environment
- Clique em **Settings** (engrenagem)
- Clique em **Environment Variables**

### 4️⃣ Adicione as Variáveis
- Clique em **Add Environment Variable**
- Para cada linha acima, copie:
  - **Key** (esquerda do `=`)
  - **Value** (direita do `=`)
- Exemplo:
  - Key: `DATABASE_URL`
  - Value: `file:./data/crm.db`

### 5️⃣ Salve e Reinicie
- Clique em **Save**
- O Render vai reiniciar automaticamente
- Aguarde ~2-3 minutos

### 6️⃣ Acesse seu CRM
- Vá para: https://crm-equipe-santiago1.onrender.com
- Login padrão:
  - **Email:** `admin@vendas.com`
  - **Senha:** `Admin@123456`

---

## 🔐 Credenciais de Acesso

**Usuário Padrão:**
- Email: `admin@vendas.com`
- Senha: `Admin@123456`

Você pode criar novos usuários após fazer login.

---

## ⚙️ O que foi Configurado Automaticamente

✅ **Banco de Dados:** SQLite (não precisa de servidor externo)
✅ **Autenticação:** Email/Senha local
✅ **Segurança:** Chaves geradas automaticamente
✅ **API:** Configurada para funcionar offline

---

## 🆘 Se Algo Não Funcionar

### Erro: "Invalid URL"
- Verifique se todas as variáveis foram adicionadas
- Clique em "Save" novamente
- Aguarde 2-3 minutos e recarregue

### Erro: "Database Error"
- Aguarde mais tempo (primeira inicialização cria o banco)
- Verifique se `DATABASE_URL` está correto

### Não consigo fazer login
- Use as credenciais padrão acima
- Verifique se `JWT_SECRET` foi adicionado

---

## 📝 Próximos Passos (Opcional)

Após tudo funcionar, você pode:
1. Criar novos usuários (corretores)
2. Adicionar leads
3. Configurar o funil de vendas
4. Criar cadências

---

## 💡 Dicas

- O banco de dados SQLite é armazenado no Render
- Seus dados persistem entre reinicializações
- Você pode fazer backup acessando os logs do Render

---

**Pronto? Comece a configurar no Render agora!** 🚀
