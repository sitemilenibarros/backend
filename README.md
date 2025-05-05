
# **Projeto Backend - Landing Page Dinâmica**

Este é o backend do projeto de uma **Landing Page Dinâmica** para gerenciar cursos, eventos e e-books, e permitir o processamento de pagamentos com **Stripe**. O backend foi desenvolvido utilizando **Node.js**, **Express**, **TypeScript**, **PostgreSQL** e **Stripe**.

## **Tecnologias Utilizadas**

- **Node.js**: Ambiente de execução JavaScript.
- **Express**: Framework web para construção de APIs REST.
- **TypeScript**: Superset do JavaScript que adiciona tipagem estática.
- **PostgreSQL**: Banco de dados relacional.
- **Sequelize**: ORM para interagir com o PostgreSQL.
- **Stripe**: API para processamento de pagamentos.
- **dotenv**: Carrega variáveis de ambiente a partir do arquivo `.env`.

## **Pré-requisitos**

Antes de rodar o projeto, você precisará de algumas dependências instaladas em sua máquina:

- **Node.js** (recomenda-se a versão 14 ou superior):  
  [Download do Node.js](https://nodejs.org/)
  
- **PostgreSQL**:  
  [Download do PostgreSQL](https://www.postgresql.org/download/)

- **Stripe**: Crie uma conta em [Stripe](https://stripe.com) para obter as credenciais de API (Chave secreta).

## **Configuração do Projeto**

### **1. Clonar o Repositório**

Clone o repositório para sua máquina local:

```bash
git clone https://github.com/seu-usuario/landing-page-backend.git
cd landing-page-backend
```

### **2. Instalar as Dependências**

Instale as dependências do projeto utilizando o **npm** (ou **yarn**):

```bash
npm install
```

### **3. Configuração do Banco de Dados**

1. **Criação do Banco de Dados no PostgreSQL**:
   
   Certifique-se de que o PostgreSQL está rodando e crie um banco de dados chamado `site-mileni-db`:

   No **psql** ou no terminal do PostgreSQL:

   ```sql
   CREATE DATABASE site-mileni-db;
   ```

2. **Configuração das Variáveis de Ambiente**:

   Crie um arquivo `.env` na raiz do projeto e adicione as variáveis de ambiente necessárias:

   ```env
   DB_PASSWORD=senha_do_postgres
   DB_URL=postgres://postgres:senha_do_postgres@localhost:5432/site-mileni-db
   STRIPE_SECRET_KEY=sua_chave_secreta_da_stripe
   ```

   - **DB_PASSWORD**: A senha do usuário `postgres` no seu banco de dados PostgreSQL.
   - **DB_URL**: A URL de conexão com o banco de dados PostgreSQL.
   - **STRIPE_SECRET_KEY**: A chave secreta da API do Stripe (gerada no painel do Stripe).

### **4. Configuração do Sequelize**

O Sequelize será utilizado para interagir com o banco de dados PostgreSQL. Caso deseje, você pode rodar as migrações e definir o esquema do banco utilizando o Sequelize CLI.

Para configurar o Sequelize, basta garantir que o arquivo de conexão `src/config/db.ts` esteja apontando para o banco de dados correto, usando a URL de conexão armazenada nas variáveis de ambiente.

## **Rodando o Projeto**

### **1. Iniciar o Servidor com Nodemon (Desenvolvimento)**

Use o **Nodemon** para rodar o projeto em modo de desenvolvimento, que irá reiniciar o servidor automaticamente sempre que houver alterações nos arquivos:

```bash
npm run dev
```

Isso rodará o servidor na porta 3000 (ou na porta especificada no arquivo `.env`).

### **2. Iniciar o Servidor em Produção**

Para rodar o servidor em produção, compile o código TypeScript para JavaScript e execute o servidor:

```bash
npm run build
npm start
```

O servidor estará pronto para ser acessado pela URL `http://localhost:3000`.

### **3. Testando as Rotas**

Após iniciar o servidor, você pode testar as rotas da API, como:

- **GET /courses**: Listar todos os cursos.
- **POST /courses**: Criar um novo curso.
- **POST /payment/create-payment-intent**: Criar uma intenção de pagamento usando Stripe.

Use uma ferramenta como **Postman** ou **Insomnia** para testar as rotas da API.

## **Estrutura de Pastas**

A estrutura do projeto é a seguinte:

```
landing-page-backend/
├── src/
│   ├── config/
│   │   └── db.ts           # Configuração da conexão com o banco de dados
│   ├── controllers/
│   │   ├── courseController.ts
│   │   ├── eventController.ts
│   │   ├── ebookController.ts
│   │   └── paymentController.ts
│   ├── models/
│   │   ├── course.ts
│   │   ├── event.ts
│   │   └── ebook.ts
│   ├── routes/
│   │   ├── courseRoutes.ts
│   │   ├── eventRoutes.ts
│   │   ├── ebookRoutes.ts
│   │   └── paymentRoutes.ts
│   ├── middlewares/
│   │   └── validate.ts    # Validação de dados das requisições
│   ├── .env              # Variáveis de ambiente
│   ├── server.ts         # Arquivo principal para rodar o servidor
├── package.json
├── tsconfig.json         # Configuração do TypeScript
└── README.md
```

## **Considerações Finais**

- Certifique-se de que o **PostgreSQL** está rodando localmente ou em um servidor de sua preferência.
- Configure o **Stripe** corretamente e adicione sua **chave secreta** no arquivo `.env`.
- Verifique as permissões do banco de dados para garantir que o usuário tenha acesso total.

Se você tiver mais alguma dúvida sobre como configurar ou rodar o projeto, não hesite em me perguntar!
