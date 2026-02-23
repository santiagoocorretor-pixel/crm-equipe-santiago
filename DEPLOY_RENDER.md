# 🚀 Guia Simples: Deploy no Render

## ✅ Seu CRM está 100% pronto para o Render!

Não precisa fazer nada complicado. Siga estes passos simples:

---

## 📋 Passo 1: Copie Estas Variáveis

Vou fornecer um bloco de texto que você vai colar no Render. Copie tudo abaixo:

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

## 🔧 Passo 2: Configure no Render

1. **Acesse:** https://dashboard.render.com
2. **Clique em:** seu serviço `crm-equipe-santiago1`
3. **Vá para:** Settings (engrenagem) → Environment Variables
4. **Cole cada linha** do bloco acima como:
   - **Key:** (a parte antes do `=`)
   - **Value:** (a parte depois do `=`)

Exemplo:
- Key: `DATABASE_URL`
- Value: `file:./data/crm.db`

5. **Clique em:** Save
6. **Aguarde:** 2-3 minutos (Render vai reiniciar)

---

## 🎯 Passo 3: Acesse Seu CRM

Quando terminar, acesse:
```
https://crm-equipe-santiago1.onrender.com
```

**Login padrão:**
- Email: `admin@vendas.com`
- Senha: `Admin@123456`

---

## ✨ Pronto!

Seu CRM está funcionando! Agora você pode:
- ✅ Criar novos usuários (corretores)
- ✅ Adicionar leads
- ✅ Configurar o funil de vendas
- ✅ Criar cadências de acompanhamento
- ✅ Ver análises e relatórios

---

## 🆘 Se Algo Não Funcionar

### Erro: "Invalid URL"
- Verifique se todas as variáveis foram adicionadas
- Clique em "Save" novamente
- Aguarde 3 minutos

### Erro: "Database Error"
- Aguarde a primeira inicialização (cria o banco automaticamente)
- Verifique os logs do Render

### Não consigo fazer login
- Use as credenciais padrão acima
- Verifique se `JWT_SECRET` foi adicionado

---

## 💡 Dicas Importantes

- **Banco de dados:** SQLite (não precisa de servidor externo)
- **Autenticação:** Email/Senha local (não precisa do Manus OAuth)
- **Dados:** Persistem entre reinicializações
- **Backup:** Os dados ficam no Render

---

**Tudo pronto? Comece a configurar agora!** 🎉
