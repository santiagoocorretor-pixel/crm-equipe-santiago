# Guia de Deploy Permanente no Render.com

Este guia explica como colocar o seu **CRM Vendas Equipe Santiago** no ar de forma permanente e gratuita.

## Passo 1: Preparar o Código
1. Baixe o arquivo ZIP atualizado que eu te enviei.
2. Crie um repositório no seu **GitHub** (pode ser privado).
3. Suba todos os arquivos do projeto para esse repositório.

## Passo 2: Configurar no Render.com
1. Crie uma conta em [Render.com](https://render.com).
2. No painel principal, clique em **"New +"** e selecione **"Blueprint"**.
3. Conecte sua conta do GitHub e selecione o repositório do CRM.
4. O Render lerá automaticamente o arquivo `render.yaml` que eu configurei.
5. Clique em **"Apply"**.

## Passo 3: O que o Render fará automaticamente
*   Criará um banco de dados **MySQL** gratuito.
*   Instalará todas as dependências.
*   Realizará o build do frontend e backend.
*   Gerará um link permanente (ex: `crm-vendas-santiago.onrender.com`).

## Passo 4: Acesso
Após o deploy terminar (leva cerca de 3-5 minutos), seu site estará online!
*   **URL:** Fornecida pelo Render.
*   **Login:** admin@vendas.com
*   **Senha:** Admin@123456

---
**Nota:** Como estamos usando o plano gratuito do Render, o site pode levar alguns segundos para "acordar" se ficar muito tempo sem uso.
