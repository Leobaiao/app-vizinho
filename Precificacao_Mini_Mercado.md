# PRECIFICAÇÃO — MINI MERCADO DE CONDOMÍNIO

> Documento gerado automaticamente a partir da planilha de precificação.
> Contém todas as configurações, regras de cálculo e o catálogo completo de 130 produtos.
> **Use este arquivo para alimentar o sistema de gestão do mini mercado.**

---

## 1. CONFIGURAÇÕES GERAIS

### 1.1 Taxas e Impostos

| Parâmetro | Valor | Observação |
|---|---|---|
| Taxa Cartão de Crédito | 2,99% | Conferir com a operadora da maquininha |
| Taxa Cartão de Débito | 1,49% | Geralmente menor que o crédito |
| Mix de Pagamento — Crédito | 50% | % das vendas pagas no crédito |
| Mix de Pagamento — Débito | 30% | % das vendas pagas no débito |
| Mix de Pagamento — Dinheiro/Pix | 20% | Restante das vendas |
| **Taxa Ponderada de Cartão** | **1,942%** | Calculado: (2,99% × 50%) + (1,49% × 30%) |
| Imposto s/ Faturamento (Simples Nacional) | 6,00% | Simples Anexo I: 4–7,3% \| MEI: ~4% |
| Perdas, Quebras e Vencimentos | 2,00% | Perecíveis: 3–5% \| Não-perecíveis: 1–2% |

### 1.2 Custos Fixos Mensais

| Item | Valor (R$) |
|---|---|
| Energia Elétrica (geladeiras, freezers, luz) | R$ 350,00 |
| Internet / Telefone | R$ 120,00 |
| Embalagens, Sacolas e Descartáveis | R$ 80,00 |
| Manutenção de Equipamentos | R$ 50,00 |
| Outros Custos Fixos | R$ 100,00 |
| **TOTAL CUSTOS FIXOS MENSAIS** | **R$ 700,00** |
| Faturamento Bruto Estimado por Mês | R$ 8.000,00 |
| **% Custos Fixos sobre Faturamento** | **8,75%** |

### 1.3 Margem de Lucro Desejada por Categoria

| Categoria | Margem Líquida Desejada | Justificativa |
|---|---|---|
| CERVEJA PADRÃO | 20% | Concorrência alta — margem moderada |
| CERVEJA PREMIUM | 28% | Premium justifica margem maior |
| BEBIDA PRONTA | 30% | Baixo giro — margem maior |
| BEBIDA NÃO-ALCOÓLICA | 25% | Alto giro — equilibre com volume |
| CONGELADOS | 30% | Custo de energia alto — compense na margem |
| MERCEARIA | 30% | Produtos secos — boa margem |
| HIGIENE & EMERGÊNCIA | 40% | Compra por urgência — maior margem |
| GELADEIRA | 28% | Perecíveis — atenção ao prazo de validade |

---

## 2. LÓGICA DE PRECIFICAÇÃO

### 2.1 Fórmula do Preço de Venda Sugerido

```
Preço Sugerido = TETO(Custo / Fator de Markup, 0,10)

Fator de Markup = 1 - Taxa Cartão - (Imposto + Perdas) - % Custos Fixos - Margem da Categoria
```

### 2.2 Composição do Fator de Markup por Categoria

| Categoria | Taxa Cartão | Imposto+Perdas | Custos Fixos | Margem | Fator Markup |
|---|---|---|---|---|---|
| CERVEJA PADRÃO | 1,942% | 8,00% | 8,75% | 20% | 61.308% |
| CERVEJA PREMIUM | 1,942% | 8,00% | 8,75% | 28% | 53.308% |
| BEBIDA PRONTA | 1,942% | 8,00% | 8,75% | 30% | 51.308% |
| BEBIDA NÃO-ALCOÓLICA | 1,942% | 8,00% | 8,75% | 25% | 56.308% |
| CONGELADOS | 1,942% | 8,00% | 8,75% | 30% | 51.308% |
| MERCEARIA | 1,942% | 8,00% | 8,75% | 30% | 51.308% |
| HIGIENE & EMERGÊNCIA | 1,942% | 8,00% | 8,75% | 40% | 41.308% |
| GELADEIRA | 1,942% | 8,00% | 8,75% | 28% | 53.308% |

### 2.3 Regra de Arredondamento

O preço sugerido é sempre arredondado para cima na casa de R$ 0,10.
Recomendação comercial: praticar preço psicológico (R$ X,90 ou R$ X,99).
Exemplo: sugestão R$ 8,40 → preço praticado R$ 8,90.

### 2.4 Cálculo da Margem Real

Quando o preço praticado for informado, a margem real é calculada como:

```
Margem Real % = (Preço Praticado - Custo - Preço Praticado × (Taxa Cartão + Imposto + Perdas + % CF)) / Preço Praticado
```

---

## 3. CATÁLOGO DE PRODUTOS

**Legenda de campos:**
- `custo_rs`: Preço de compra do produto (R$). `null` = ainda não cadastrado.
- `preco_sugerido_rs`: Preço mínimo calculado pela fórmula de markup (R$). `null` = custo não informado.
- `markup_fator_pct`: Percentual do fator de markup aplicado à categoria.
- `estoque_minimo` / `estoque_atual`: Controle de reposição.

### CERVEJA PADRÃO

**Margem desejada:** 20% | **Produtos:** 5

| # | Produto | Custo (R$) | Preço Sugerido (R$) | Fator Markup | Est. Mín | Est. Atual |
|---|---|---|---|---|---|---|
| 1 | CERVEJA PETRA | ⚠ não cadastrado | — | 61.31% | 0 | 0 |
| 2 | CERVEJA HEINEKEN | R$ 4.69 | R$ 7.70 | 61.31% | 0 | 0 |
| 3 | CERVEJA HEINEKEN ZERO | R$ 6.58 | R$ 10.80 | 61.31% | 0 | 0 |
| 4 | CERVEJA STELA | R$ 4.99 | R$ 8.20 | 61.31% | 0 | 0 |
| 5 | CERVEJA SPATEN | ⚠ não cadastrado | — | 61.31% | 0 | 0 |

### CERVEJA PREMIUM

**Margem desejada:** 28% | **Produtos:** 2

| # | Produto | Custo (R$) | Preço Sugerido (R$) | Fator Markup | Est. Mín | Est. Atual |
|---|---|---|---|---|---|---|
| 6 | CERVEJA COLORADO | ⚠ não cadastrado | — | 53.31% | 0 | 0 |
| 7 | CERVEJA MALZBIER | ⚠ não cadastrado | — | 53.31% | 0 | 0 |

### BEBIDA PRONTA

**Margem desejada:** 30% | **Produtos:** 5

| # | Produto | Custo (R$) | Preço Sugerido (R$) | Fator Markup | Est. Mín | Est. Atual |
|---|---|---|---|---|---|---|
| 8 | SKOL BEATS | ⚠ não cadastrado | — | 51.31% | 0 | 0 |
| 9 | SMINORFF ICE | ⚠ não cadastrado | — | 51.31% | 0 | 0 |
| 10 | XEQUE-MATE | ⚠ não cadastrado | — | 51.31% | 0 | 0 |
| 11 | VELHO BARREIRO | R$ 13.90 | R$ 27.10 | 51.31% | 0 | 0 |
| 12 | SMINORFF VODKA | R$ 29.90 | R$ 58.30 | 51.31% | 0 | 0 |

### BEBIDA NÃO-ALCOÓLICA

**Margem desejada:** 25% | **Produtos:** 15

| # | Produto | Custo (R$) | Preço Sugerido (R$) | Fator Markup | Est. Mín | Est. Atual |
|---|---|---|---|---|---|---|
| 13 | ÁGUA COM GÁS | R$ 1.89 | R$ 3.40 | 56.31% | 0 | 0 |
| 14 | ÁGUA SEM GÁS | ⚠ não cadastrado | — | 56.31% | 0 | 0 |
| 15 | ENERGÉTICO | R$ 9.29 | R$ 16.50 | 56.31% | 0 | 0 |
| 16 | ENERGÉTICO | ⚠ não cadastrado | — | 56.31% | 0 | 0 |
| 17 | COCA COLA | R$ 2.05 | R$ 3.70 | 56.31% | 0 | 0 |
| 18 | COCA COLA  ZERO | R$ 2.89 | R$ 5.20 | 56.31% | 0 | 0 |
| 19 | GUARANÁ ANTÁRTICA | R$ 6.89 | R$ 12.30 | 56.31% | 0 | 0 |
| 20 | FANTA LARANJA | R$ 6.19 | R$ 11.00 | 56.31% | 0 | 0 |
| 21 | FANTA UVA | R$ 6.19 | R$ 11.00 | 56.31% | 0 | 0 |
| 22 | H2OH | R$ 6.89 | R$ 12.30 | 56.31% | 0 | 0 |
| 23 | ÁGUA TÔNICA | ⚠ não cadastrado | — | 56.31% | 0 | 0 |
| 24 | SUCO INTEGRAL LARANJA | R$ 13.90 | R$ 24.70 | 56.31% | 0 | 0 |
| 25 | SUCO INTEGRAL UVA | R$ 14.90 | R$ 26.50 | 56.31% | 0 | 0 |
| 26 | SUCO PEQUENO | R$ 4.79 | R$ 8.60 | 56.31% | 0 | 0 |
| 27 | TODDYNHO | R$ 2.75 | R$ 4.90 | 56.31% | 0 | 0 |

### CONGELADOS

**Margem desejada:** 30% | **Produtos:** 14

| # | Produto | Custo (R$) | Preço Sugerido (R$) | Fator Markup | Est. Mín | Est. Atual |
|---|---|---|---|---|---|---|
| 28 | GELO | ⚠ não cadastrado | — | 51.31% | 0 | 0 |
| 29 | FRANGO À PASSARINHO | R$ 11.49 | R$ 22.40 | 51.31% | 0 | 0 |
| 30 | NUGGETS | R$ 7.99 | R$ 15.60 | 51.31% | 0 | 0 |
| 31 | PIZZA CONGELADA | R$ 17.90 | R$ 34.90 | 51.31% | 0 | 0 |
| 32 | PÃO FRANCÊS CONGELADO | ⚠ não cadastrado | — | 51.31% | 0 | 0 |
| 33 | CARNE | ⚠ não cadastrado | — | 51.31% | 0 | 0 |
| 34 | GELADINHO | ⚠ não cadastrado | — | 51.31% | 0 | 0 |
| 35 | SORVETE EM MASSA | ⚠ não cadastrado | — | 51.31% | 0 | 0 |
| 36 | PICOLÉ | ⚠ não cadastrado | — | 51.31% | 0 | 0 |
| 37 | AÇAÍ | R$ 13.90 | R$ 27.10 | 51.31% | 0 | 0 |
| 38 | PÃO DE QUEIJO CONGELADO | R$ 10.90 | R$ 21.30 | 51.31% | 0 | 0 |
| 39 | LASANHA | R$ 12.90 | R$ 25.20 | 51.31% | 0 | 0 |
| 40 | STEAK DE FRANGO | R$ 1.49 | R$ 3.00 | 51.31% | 0 | 0 |
| 41 | HAMBURGER | R$ 10.90 | R$ 21.30 | 51.31% | 0 | 0 |

### MERCEARIA

**Margem desejada:** 30% | **Produtos:** 62

| # | Produto | Custo (R$) | Preço Sugerido (R$) | Fator Markup | Est. Mín | Est. Atual |
|---|---|---|---|---|---|---|
| 42 | PÃO DE FORMA | R$ 6.99 | R$ 13.70 | 51.31% | 0 | 0 |
| 43 | OVO | R$ 11.00 | R$ 21.50 | 51.31% | 0 | 0 |
| 44 | ANA MARIA | R$ 2.99 | R$ 5.90 | 51.31% | 0 | 0 |
| 45 | LEITE | R$ 4.79 | R$ 9.40 | 51.31% | 0 | 0 |
| 46 | CAFÉ EM PÓ | R$ 23.89 | R$ 46.60 | 51.31% | 0 | 0 |
| 47 | NESCAU | R$ 5.39 | R$ 10.60 | 51.31% | 0 | 0 |
| 48 | AÇUCAR | R$ 2.85 | R$ 5.60 | 51.31% | 0 | 0 |
| 49 | ADOÇANTE | R$ 6.89 | R$ 13.50 | 51.31% | 0 | 0 |
| 50 | CHÁ | R$ 2.99 | R$ 5.90 | 51.31% | 0 | 0 |
| 51 | CLUBE SOCIAL | R$ 10.69 | R$ 20.90 | 51.31% | 0 | 0 |
| 52 | BISCOITO ÁGUA E SAL | R$ 2.90 | R$ 5.70 | 51.31% | 0 | 0 |
| 53 | BOLACHA MAISENA | R$ 4.49 | R$ 8.80 | 51.31% | 0 | 0 |
| 54 | BICOITO RECHEADO | R$ 1.79 | R$ 3.50 | 51.31% | 0 | 0 |
| 55 | TORRADA | R$ 3.99 | R$ 7.80 | 51.31% | 0 | 0 |
| 56 | BATATA CHIPS | R$ 3.95 | R$ 7.70 | 51.31% | 0 | 0 |
| 57 | DORITOS | R$ 4.59 | R$ 9.00 | 51.31% | 0 | 0 |
| 58 | FANDANGOS | R$ 3.39 | R$ 6.70 | 51.31% | 0 | 0 |
| 59 | CHEETOS | R$ 3.59 | R$ 7.00 | 51.31% | 0 | 0 |
| 60 | AMENDOIN "OVINHO" | R$ 3.29 | R$ 6.50 | 51.31% | 0 | 0 |
| 61 | AMENDOIM SEM PELE | R$ 6.69 | R$ 13.10 | 51.31% | 0 | 0 |
| 62 | AMENDOIM JAPONÊS | R$ 5.49 | R$ 10.80 | 51.31% | 0 | 0 |
| 63 | FINI | R$ 4.99 | R$ 9.80 | 51.31% | 0 | 0 |
| 64 | SNEAKERS | R$ 3.89 | R$ 7.60 | 51.31% | 0 | 0 |
| 65 | TRENTO | R$ 2.45 | R$ 4.80 | 51.31% | 0 | 0 |
| 66 | CHICLETS | R$ 41.99 | R$ 81.90 | 51.31% | 0 | 0 |
| 67 | HALLS | R$ 12.90 | R$ 25.20 | 51.31% | 0 | 0 |
| 68 | MENTOS | ⚠ não cadastrado | — | 51.31% | 0 | 0 |
| 69 | CUP NOODLES | R$ 5.29 | R$ 10.40 | 51.31% | 0 | 0 |
| 70 | PRINGLES | R$ 10.90 | R$ 21.30 | 51.31% | 0 | 0 |
| 71 | BARRA DE CHOCOLATE | R$ 8.19 | R$ 16.00 | 51.31% | 0 | 0 |
| 72 | MILHO | R$ 2.19 | R$ 4.30 | 51.31% | 0 | 0 |
| 73 | MOLHO DE TOMATE | R$ 1.79 | R$ 3.50 | 51.31% | 0 | 0 |
| 74 | CREME DE LEITE | R$ 2.15 | R$ 4.20 | 51.31% | 0 | 0 |
| 75 | LEITE CONDENSADO | R$ 5.79 | R$ 11.30 | 51.31% | 0 | 0 |
| 76 | ÓLEO | R$ 6.55 | R$ 12.80 | 51.31% | 0 | 0 |
| 77 | KETCHUP | R$ 4.19 | R$ 8.20 | 51.31% | 0 | 0 |
| 78 | MAIONESE | R$ 7.45 | R$ 14.60 | 51.31% | 0 | 0 |
| 79 | MOSTARDA | R$ 5.45 | R$ 10.70 | 51.31% | 0 | 0 |
| 80 | PIPOCA DE MICROONDAS | R$ 2.09 | R$ 4.10 | 51.31% | 0 | 0 |
| 81 | FILTRO DE CAFÉ | R$ 3.29 | R$ 6.50 | 51.31% | 0 | 0 |
| 82 | SAL | R$ 2.79 | R$ 5.50 | 51.31% | 0 | 0 |
| 83 | BARBEADOR | R$ 6.20 | R$ 12.10 | 51.31% | 0 | 0 |
| 84 | SABÃO EM PÓ | R$ 7.89 | R$ 15.40 | 51.31% | 0 | 0 |
| 85 | AMACIANTE | R$ 11.29 | R$ 22.10 | 51.31% | 0 | 0 |
| 86 | DETERGENTE | R$ 2.29 | R$ 4.50 | 51.31% | 0 | 0 |
| 87 | VEJA | R$ 3.69 | R$ 7.20 | 51.31% | 0 | 0 |
| 88 | FARINHA DE TRIGO | R$ 2.69 | R$ 5.30 | 51.31% | 0 | 0 |
| 89 | MACARRÃO | R$ 2.79 | R$ 5.50 | 51.31% | 0 | 0 |
| 90 | BISCOITO DE POLVILHO | ⚠ não cadastrado | — | 51.31% | 0 | 0 |
| 91 | KITKAT | R$ 4.65 | R$ 9.10 | 51.31% | 0 | 0 |
| 92 | SUFLAIR | ⚠ não cadastrado | — | 51.31% | 0 | 0 |
| 93 | TAPIOCA | R$ 6.70 | R$ 13.10 | 51.31% | 0 | 0 |
| 94 | ARROZ | R$ 3.49 | R$ 6.90 | 51.31% | 0 | 0 |
| 95 | FEIJÃO | R$ 8.39 | R$ 16.40 | 51.31% | 0 | 0 |
| 96 | ATUM EM LATA | ⚠ não cadastrado | — | 51.31% | 0 | 0 |
| 97 | VINAGRE | R$ 1.90 | R$ 3.80 | 51.31% | 0 | 0 |
| 98 | LEITE S/ LACTOSE | R$ 5.39 | R$ 10.60 | 51.31% | 0 | 0 |
| 99 | CARVÃO | ⚠ não cadastrado | — | 51.31% | 0 | 0 |
| 100 | ACENDEDOR | ⚠ não cadastrado | — | 51.31% | 0 | 0 |
| 101 | PALITO P/ ESPETO | R$ 3.69 | R$ 7.20 | 51.31% | 0 | 0 |
| 102 | PALITO DE DENTE | R$ 0.99 | R$ 2.00 | 51.31% | 0 | 0 |
| 103 | VELA DE ANIVERSÁRIO | R$ 8.35 | R$ 16.30 | 51.31% | 0 | 0 |

### HIGIENE & EMERGÊNCIA

**Margem desejada:** 40% | **Produtos:** 17

| # | Produto | Custo (R$) | Preço Sugerido (R$) | Fator Markup | Est. Mín | Est. Atual |
|---|---|---|---|---|---|---|
| 104 | SABONETE | R$ 2.10 | R$ 5.10 | 41.31% | 0 | 0 |
| 105 | PAPEL HIGIÊNICO | R$ 3.79 | R$ 9.20 | 41.31% | 0 | 0 |
| 106 | ABSORVENTE | R$ 4.55 | R$ 11.10 | 41.31% | 0 | 0 |
| 107 | DESODORANTE EM SPRAY | R$ 13.90 | R$ 33.70 | 41.31% | 0 | 0 |
| 108 | DESODORANTE EM ROLON | R$ 8.99 | R$ 21.80 | 41.31% | 0 | 0 |
| 109 | PROTETOR SOLAR | R$ 52.90 | R$ 128.10 | 41.31% | 0 | 0 |
| 110 | BANDAID | ⚠ não cadastrado | — | 41.31% | 0 | 0 |
| 111 | PASTA DE DENTE | R$ 2.99 | R$ 7.30 | 41.31% | 0 | 0 |
| 112 | PRESERVATIVO | ⚠ não cadastrado | — | 41.31% | 0 | 0 |
| 113 | PAPEL TOALHA | R$ 3.29 | R$ 8.00 | 41.31% | 0 | 0 |
| 114 | ENGOV | ⚠ não cadastrado | — | 41.31% | 0 | 0 |
| 115 | EPOCLER | ⚠ não cadastrado | — | 41.31% | 0 | 0 |
| 116 | ANALGÉSICO | ⚠ não cadastrado | — | 41.31% | 0 | 0 |
| 117 | ANTITÉRMICO | ⚠ não cadastrado | — | 41.31% | 0 | 0 |
| 118 | DRAMIN | ⚠ não cadastrado | — | 41.31% | 0 | 0 |
| 119 | PARA MACHUCADOS | ⚠ não cadastrado | — | 41.31% | 0 | 0 |
| 120 | LENÇO UMEDECIDO | R$ 8.90 | R$ 21.60 | 41.31% | 0 | 0 |

### GELADEIRA

**Margem desejada:** 28% | **Produtos:** 10

| # | Produto | Custo (R$) | Preço Sugerido (R$) | Fator Markup | Est. Mín | Est. Atual |
|---|---|---|---|---|---|---|
| 121 | ESCOVA DE DENTE | R$ 4.15 | R$ 7.80 | 53.31% | 0 | 0 |
| 122 | REPELENTE | ⚠ não cadastrado | — | 53.31% | 0 | 0 |
| 123 | MANTEIGA | R$ 3.20 | R$ 6.10 | 53.31% | 0 | 0 |
| 124 | REQUEIJÃO | R$ 6.99 | R$ 13.20 | 53.31% | 0 | 0 |
| 125 | QUEIJO | R$ 8.65 | R$ 16.30 | 53.31% | 0 | 0 |
| 126 | PRESUNTO | R$ 7.49 | R$ 14.10 | 53.31% | 0 | 0 |
| 127 | MORTADELA | R$ 4.89 | R$ 9.20 | 53.31% | 0 | 0 |
| 128 | ÁGUA DE COCO | R$ 1.99 | R$ 3.80 | 53.31% | 0 | 0 |
| 129 | YOPRO | R$ 7.65 | R$ 14.40 | 53.31% | 0 | 0 |
| 130 | POWERAGE | R$ 4.29 | R$ 8.10 | 53.31% | 0 | 0 |

---

## 4. RESUMO OPERACIONAL

### 4.1 Produtos sem custo cadastrado

Total de produtos sem custo: **31 de 130**

| # | Produto | Categoria |
|---|---|---|
| 1 | CERVEJA PETRA | CERVEJA PADRÃO |
| 5 | CERVEJA SPATEN | CERVEJA PADRÃO |
| 6 | CERVEJA COLORADO | CERVEJA PREMIUM |
| 7 | CERVEJA MALZBIER | CERVEJA PREMIUM |
| 8 | SKOL BEATS | BEBIDA PRONTA |
| 9 | SMINORFF ICE | BEBIDA PRONTA |
| 10 | XEQUE-MATE | BEBIDA PRONTA |
| 14 | ÁGUA SEM GÁS | BEBIDA NÃO-ALCOÓLICA |
| 16 | ENERGÉTICO | BEBIDA NÃO-ALCOÓLICA |
| 23 | ÁGUA TÔNICA | BEBIDA NÃO-ALCOÓLICA |
| 28 | GELO | CONGELADOS |
| 32 | PÃO FRANCÊS CONGELADO | CONGELADOS |
| 33 | CARNE | CONGELADOS |
| 34 | GELADINHO | CONGELADOS |
| 35 | SORVETE EM MASSA | CONGELADOS |
| 36 | PICOLÉ | CONGELADOS |
| 68 | MENTOS | MERCEARIA |
| 90 | BISCOITO DE POLVILHO | MERCEARIA |
| 92 | SUFLAIR | MERCEARIA |
| 96 | ATUM EM LATA | MERCEARIA |
| 99 | CARVÃO | MERCEARIA |
| 100 | ACENDEDOR | MERCEARIA |
| 110 | BANDAID | HIGIENE & EMERGÊNCIA |
| 112 | PRESERVATIVO | HIGIENE & EMERGÊNCIA |
| 114 | ENGOV | HIGIENE & EMERGÊNCIA |
| 115 | EPOCLER | HIGIENE & EMERGÊNCIA |
| 116 | ANALGÉSICO | HIGIENE & EMERGÊNCIA |
| 117 | ANTITÉRMICO | HIGIENE & EMERGÊNCIA |
| 118 | DRAMIN | HIGIENE & EMERGÊNCIA |
| 119 | PARA MACHUCADOS | HIGIENE & EMERGÊNCIA |
| 122 | REPELENTE | GELADEIRA |

### 4.2 Produtos com preço sugerido calculado

Total de produtos com preço calculado: **99 de 130**

### 4.3 Distribuição por categoria

| Categoria | Qtd Produtos | Com Custo | Sem Custo |
|---|---|---|---|
| CERVEJA PADRÃO | 5 | 3 | 2 |
| CERVEJA PREMIUM | 2 | 0 | 2 |
| BEBIDA PRONTA | 5 | 2 | 3 |
| BEBIDA NÃO-ALCOÓLICA | 15 | 12 | 3 |
| CONGELADOS | 14 | 8 | 6 |
| MERCEARIA | 62 | 56 | 6 |
| HIGIENE & EMERGÊNCIA | 17 | 9 | 8 |
| GELADEIRA | 10 | 9 | 1 |

---

## 5. INSTRUÇÕES PARA INTEGRAÇÃO NO APP

### Campos esperados por produto

```json
{
  "id": "numero_sequencial",
  "nome": "NOME DO PRODUTO",
  "categoria": "CATEGORIA",
  "custo_rs": 0.00,
  "preco_sugerido_rs": 0.00,
  "preco_praticado_rs": null,
  "margem_real_pct": null,
  "estoque_minimo": 0,
  "estoque_atual": 0,
  "a_comprar": 0
}
```

### Parâmetros globais de precificação

```json
{
  "taxa_cartao_credito_pct": 2.99,
  "taxa_cartao_debito_pct": 1.49,
  "mix_credito_pct": 50,
  "mix_debito_pct": 30,
  "mix_dinheiro_pix_pct": 20,
  "taxa_ponderada_cartao_pct": 1.942,
  "imposto_pct": 6.0,
  "perdas_pct": 2.0,
  "total_custos_fixos_rs": 700.00,
  "faturamento_estimado_rs": 8000.00,
  "pct_cf_sobre_faturamento": 8.75
}
```

### Margens configuradas por categoria

```json
{
  "CERVEJA PADRÃO": 20,
  "CERVEJA PREMIUM": 28,
  "BEBIDA PRONTA": 30,
  "BEBIDA NÃO-ALCOÓLICA": 25,
  "CONGELADOS": 30,
  "MERCEARIA": 30,
  "HIGIENE & EMERGÊNCIA": 40,
  "GELADEIRA": 28
}
```

---

*Documento gerado pela planilha Precificacao_Mini_Mercado.xlsx*