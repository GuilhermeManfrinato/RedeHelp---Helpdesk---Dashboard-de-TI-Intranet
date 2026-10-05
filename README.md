# 🇧🇷 Sistema de Chamados de TI e Cautela de Notebooks - Exército Brasileiro

Sistema de gestão de chamados de informática e controle de cautela de notebooks desenvolvido para Organizações Militares (OM) do **Exército Brasileiro**. 

O sistema conta com **duas interfaces separadas por URL**:
1. **Central do Solicitante (`/`)**: Aberto para qualquer militar na intranet abrir chamados e consultar o andamento informando exclusivamente o **código do chamado**.
2. **Painel Administrativo da Seção de TI (`/admin`)**: Acesso restrito por URL com tela de login e senha para gerenciar a fila de chamados e o controle patrimonial de cautelas.

---

## 🔑 Credenciais de Acesso da Seção de TI

| Função | Usuário / Login | Senha |
|---|---|---|
| **Painel Administrativo (`/admin`)** | `info` | `R3gD300d0r0!` |
| **Assinatura de Cautela / Descautela** | *Chefe ou Auxiliar de TI* | `admin` |

---

## 💻 Tudo o que você precisa instalar no seu computador para codar

Para editar, desenvolver e rodar o projeto na sua máquina com o **Visual Studio Code**, instale os seguintes programas gratuitos:

### 1. Node.js (Versão LTS recomendada: v20 ou superior)
- **O que é**: O ambiente de execução do JavaScript/TypeScript.
- **Como baixar**: Acesse [https://nodejs.org](https://nodejs.org) e baixe a versão **LTS**.
- **Como verificar**: Abra o terminal ou CMD e digite:
  ```bash
  node -v
  npm -v
  ```

### 2. Git
- **O que é**: Sistema de controle de versão para baixar e enviar o código para o GitHub.
- **Como baixar**: Acesse [https://git-scm.com](https://git-scm.com) e instale com as opções padrão.
- **Como verificar**: Digite no terminal:
  ```bash
  git --version
  ```

### 3. Visual Studio Code (VS Code)
- **O que é**: O editor de código recomendado.
- **Como baixar**: Acesse [https://code.visualstudio.com](https://code.visualstudio.com).

### 4. Extensões Recomendadas no VS Code
Abra o VS Code, aperte `Ctrl + Shift + X` e instale:
- **Tailwind CSS IntelliSense** (auto-completar de classes de estilo)
- **ESLint** (verificação de código e boas práticas)
- **Prettier - Code formatter** (formatação automática)
- **TypeScript and JavaScript Language Features** (já vem nativo no VS Code)

---

## 🚀 Como baixar do GitHub e rodar no seu computador

### Passo 1: Clonar o repositório
Abra o terminal (ou Git Bash) e execute:
```bash
git clone https://github.com/SEU-USUARIO/sistema-ti-exercito.git
cd sistema-ti-exercito
```

### Passo 2: Abrir no VS Code
```bash
code .
```

### Passo 3: Instalar as dependências do projeto
No terminal integrado do VS Code (`Ctrl + '`), execute:
```bash
npm install
```

### Passo 4: Executar o servidor de desenvolvimento
```bash
npm run dev
```

O sistema estará rodando em:
- **Central do Solicitante**: `http://localhost:3000/`
- **Painel Administrativo da TI**: `http://localhost:3000/admin`

---

## 📁 Estrutura de Arquivos para Edição no VS Code

```text
├── index.html                 # Página HTML base com fontes e títulos do Exército Brasileiro
├── package.json               # Dependências do projeto (React, Tailwind CSS, Lucide Icons)
├── tsconfig.json              # Configurações do TypeScript
├── vite.config.ts             # Configuração do Vite e Tailwind v4
└── src/
    ├── main.tsx               # Ponto de entrada da aplicação React
    ├── index.css              # Estilos globais e paleta verde-oliva militar
    ├── App.tsx                # Roteamento por URL (/ vs /admin) e controle de estado
    ├── types/
    │   └── index.ts           # Tipagens (Chamados, Seções da OM, Técnicos, Cautelas)
    ├── data/
    │   └── mockData.ts        # Dados iniciais pré-cadastrados (Seções da OM e materiais)
    ├── utils/
    │   └── storage.ts         # Persistência local (LocalStorage)
    └── components/
        ├── Header.tsx         # Barra superior institucional do Exército Brasileiro
        ├── EmployeePortal.tsx # Portal do Militar (abertura de chamado e busca por código)
        ├── ITDashboard.tsx    # Fila de atendimento da TI (Quadro Kanban e Tabela)
        ├── NotebookLoans.tsx  # Cautela de Notebooks com laudo de avarias na descautela
        └── AdminLogin.tsx     # Tela de login militar restrita (info / R3gD300d0r0!)
```

---

## 📤 Como subir o projeto para o GitHub pela primeira vez

No terminal da pasta do projeto, execute os comandos:

```bash
# 1. Iniciar o repositório Git local
git init

# 2. Adicionar todos os arquivos
git add .

# 3. Fazer o primeiro commit
git commit -m "feat: Sistema de Chamados de TI e Cautela de Notebooks - EB"

# 4. Renomear o branch principal para main
git branch -M main

# 5. Conectar ao seu repositório criado no GitHub
git remote add origin https://github.com/SEU-USUARIO/sistema-ti-exercito.git

# 6. Enviar para o GitHub
git push -u origin main
```

---

## 🛠️ Comandos Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor local de desenvolvimento na porta 3000 |
| `npm run build` | Compila o projeto otimizado para produção na pasta `dist/` |
| `npm run preview` | Testa localmente a versão compilada de produção |
| `npm run lint` | Executa o verificador de tipos TypeScript para validar o código |

---

## 🔒 Segurança e Privacidade das Seções
- **Consulta Sigilosa**: Militares só conseguem visualizar o andamento de um chamado digitando o código exato (ex: `CH-1001`). Não há listagem pública de chamados de outras seções.
- **Acesso Administrativo Restrito**: Usuários comuns na intranet não veem links para o painel de TI. O acesso é feito apenas digitando `/admin` na barra de endereços com login militar.
- **Cautelas Auditadas**: Empréstimos e devoluções exigem assinatura digital com senha do Chefe ou Auxiliar da Seção de Informática.
