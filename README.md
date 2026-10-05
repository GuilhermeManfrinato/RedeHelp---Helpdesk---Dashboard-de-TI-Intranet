<p align="center">
  <img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow?style=for-the-badge&logo=github" alt="Status" />
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
</p>

<h1 align="center">🛠️ 2º GAC — HelpDesk & Cautela de Notebooks</h1>

<p align="center">
  <b>Sistema Integrado de Gestão de Chamados de TI e Controle de Cautelas de Equipamentos.</b>
</p>

<p align="center">
  <a href="#-sobre-o-projeto">Sobre</a> •
  <a href="github.com/GuilhermeManfrinato">Autor</a>
</p>

---

## 📌 Sobre o Projeto

O **2º GAC - HelpDesk & Cautela de Notebooks** é uma solução web desenvolvida para otimizar e centralizar os atendimentos da **Seção de Informática**. O sistema une o gerenciamento completo de tickets de suporte técnico com um módulo dedicado para cautelas e empréstimos de notebooks e periféricos.

Totalmente containerizado via **Docker**, a aplicação garante fácil implantação, portabilidade e execução padronizada na rede local do Regimento.

---

## ✨ Funcionalidades Principais

### 🎧 Gestão de Chamados (Helpdesk)
- 📝 **Abertura Simplificada:** Registro ágil de problemas técnicos categorizados por setor e prioridade.
- 📊 **Painel de Acompanhamento:** Status do atendimento atualizado em tempo real (*Aberto*, *Em Andamento*, *Concluído*).
- 🏷️ **Triagem do Atendimento:** Organização por fila de chamados e atribuição aos técnicos de TI.

### 💻 Cautela e Controle de Equipamentos
- 📋 **Controle de Empréstimo:** Registro rápido de saída e devolução de notebooks e materiais.
- ⏱️ **Histórico & Rastreabilidade:** Acompanhamento do termo de responsabilidade e prazos de devolução.
- 🚨 **Gestão de Pendências:** Identificação imediata de materiais sob cautela ativa.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia | Função |
| :--- | :--- | :--- |
| **Frontend** | ![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black) | Interface reativa e componentes modulares |
| **Linguagem** | ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) | Tipagem estática para maior confiabilidade |
| **Build Tool** | ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) | Bundler rápido para ambiente de Dev e Prod |
| **Estilização** | ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) | Design moderno, limpo e responsivo |
| **Backend** | ![NodeJS](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) | Servidor API RESTful (`tsx server.ts`) |
| **Banco de Dados** | ![MySQL](https://img.shields.io/badge/MySQL_8.0-4479A1?style=flat-square&logo=mysql&logoColor=white) | Persistência de dados relacional |
| **Containers** | ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white) | Orquestração da aplicação e banco via Docker Compose |

---
