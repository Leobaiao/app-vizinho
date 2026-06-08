# 🚀 Ideias Futuras - Vizinho Precifica

Este documento lista as funcionalidades e melhorias planejadas para as próximas versões do aplicativo, divididas por categorias de impacto no negócio.

---

## 🛠️ Prioridade I: Segurança e Portabilidade (Foco Atual)
- [ ] **Backup Manual (JSON)**: Botão para exportar todos os produtos e contagens para um arquivo. Útil para quem usa o Modo Demo.
- [ ] **Importação de Backup**: Possibilidade de restaurar o arquivo JSON em outro dispositivo.
- [ ] **Histórico de Preços**: No cadastro de produtos, exibir um gráfico de como o preço de custo dele variou nas últimas 5 notas fiscais (XMLs) importadas.

## 📦 Prioridade II: Operação e Automação
- [x] **Alerta de Ruptura via WhatsApp**: Enviar uma mensagem automática para o dono quando um item essencial atingir o estoque mínimo.
- [ ] **Impressão de Etiquetas**: Gerar um PDF formatado com o nome do produto e o preço de venda para imprimir e colar na prateleira.
- [ ] **Validade de Produtos**: Campo para data de validade com alerta visual (ex: ícone vermelho se faltar 7 dias para vencer).
- [ ] **Tela de Configuração de Mensagens**: Painel de configurações no app para cadastrar a URL, Token, Sessão da Wuzapi e o telefone de destino para envios automáticos.
- [ ] **Exportação/Importação em Massa (Planilha)**: Exportar o estoque para Excel/CSV, permitir alterações rápidas no PC e importar a mesma planilha para atualizar tudo de uma vez.

## 📈 Prioridade III: Inteligência e Vendas
- [x] **Integração com API de Código de Barras**: Buscar automaticamente o Nome, Marca e Foto do produto na internet (ex: BrasilAPI ou Cosmos) assim que o usuário escanear um código novo no cadastro.
- [ ] **PDV Simples (Frente de Caixa)**: Uma tela rápida para registrar vendas. Isso permitiria calcular o lucro real diário.
- [ ] **Curva ABC**: Identificar automaticamente quais produtos trazem 80% do seu lucro.
- [ ] **Simulador de Promoção**: Ferramenta que diz: "Se eu der 10% de desconto neste item, qual será minha nova margem?".

## ☁️ Prioridade IV: Infraestrutura
- [x] **Conexão Supabase Full**: Sincronização em nuvem, permitindo múltiplos funcionários usarem o app ao mesmo tempo.
- [ ] **Login via Google/Social**: Facilitar o acesso sem precisar decorar senhas.
- [ ] **Modo Offline PWA**: Melhorar o service worker para que o scanner funcione perfeitamente mesmo se o sinal do Wi-Fi cair no fundo da loja.

---
*Documento atualizado em: 04/05/2026*
