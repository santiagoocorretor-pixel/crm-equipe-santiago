# Guia de Configuração no Render

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis de ambiente no painel do Render:

### 1. Banco de Dados
```
DATABASE_URL=mysql://usuario:senha@host:3306/database
```
- Para MySQL: `mysql://usuario:senha@localhost:3306/vendas_crm`
- Para TiDB Serverless: `mysql://usuario:senha@host:4000/database`

### 2. Autenticação JWT
```
JWT_SECRET=gere_uma_string_aleatoria_segura_minimo_32_caracteres
```
Gere com: `openssl rand -base64 32`

### 3. OAuth Manus
```
VITE_APP_ID=seu_app_id_do_manus
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://api.manus.im
```

### 4. Forge API (Manus Built-in APIs)
```
BUILT_IN_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua_chave_api_servidor
VITE_FRONTEND_FORGE_API_KEY=sua_chave_api_frontend
```

### 5. Informações do Proprietário (Opcional)
```
OWNER_OPEN_ID=seu_open_id
OWNER_NAME=seu_nome
```

### 6. Analytics (Opcional)
```
VITE_ANALYTICS_ENDPOINT=https://api.manus.im
VITE_ANALYTICS_WEBSITE_ID=seu_website_id
```

### 7. Informações da App
```
VITE_APP_TITLE=Manus CRM
VITE_APP_LOGO=https://url-do-seu-logo.png
```

## Passos para Configurar no Render

1. Acesse https://render.com e faça login
2. Vá para seu serviço **crm-equipe-santiago1**
3. Clique em **Environment** (ou **Settings → Environment Variables**)
4. Adicione cada variável acima
5. Clique em **Save** ou **Deploy** para aplicar as mudanças
6. O Render vai reiniciar o serviço automaticamente

## Verificar se Funcionou

Após configurar as variáveis:
1. Acesse https://crm-equipe-santiago1.onrender.com
2. Você deve ver a página de login
3. Se houver erros, verifique os logs do Render (Logs tab)

## Valores Padrão

Se você não tiver certos valores, use os padrão:
- `OAUTH_SERVER_URL` → `https://api.manus.im`
- `VITE_OAUTH_PORTAL_URL` → `https://api.manus.im`
- `BUILT_IN_FORGE_API_URL` → `https://api.manus.im`
- `VITE_FRONTEND_FORGE_API_URL` → `https://api.manus.im`
- `VITE_ANALYTICS_ENDPOINT` → `https://api.manus.im`

## Gerar JWT_SECRET Seguro

No terminal do seu computador:
```bash
openssl rand -base64 32
```

Copie o resultado e cole em `JWT_SECRET` no Render.

## Problemas Comuns

### "Invalid URL" Error
- Verifique se `VITE_OAUTH_PORTAL_URL` está configurado
- Verifique se `VITE_APP_ID` está configurado

### Erro de Conexão ao Banco de Dados
- Verifique se `DATABASE_URL` está correto
- Certifique-se que o banco de dados está acessível de fora (firewall)
- Para TiDB Serverless, use a porta 4000

### Erro de Autenticação
- Verifique se `JWT_SECRET` está configurado
- Verifique se `VITE_APP_ID` está correto

## Suporte

Se tiver dúvidas sobre as variáveis do Manus:
- Acesse o painel do Manus
- Vá para Settings → Secrets
- Lá você encontrará suas chaves de API
