# Base de Referência Postal — Carangola, MG

> **Finalidade do Arquivo:** Documento de especificação técnica e referência de dados postais (DNE/Correios) do município de Carangola (MG) para orientar a arquitetura, validações, regras de negócio e consumo de APIs no projeto **Consultador de CEPs**.

---

## 1. Metadados do Município
- **Município:** Carangola
- **UF:** MG
- **Código IBGE:** `3113305`
- **DDD:** `32`
- **Faixa Geral de CEP:** `36800-000` a `36809-999`
- **Status Postal Atual (Pós-Codificação DNE):**
  - **Distrito Sede (Área Urbana) e Distrito de Lacerdina:** Codificados **por logradouro** (cada rua, avenida, praça e travessa possui CEP individual).
  - **Demais Distritos e Zona Rural:** Operam com **CEP único por localidade**.

---

## 2. Mapa de Faixas por Bairros e Distritos

### 2.1. Bairros da Sede Urbana (Codificados por Logradouro)
| Faixa de CEP | Principais Bairros Abrangidos | Tipo de Codificação |
| :--- | :--- | :--- |
| `36800-001` a `36800-899` | Centro, Caixa D'Água, Santa Emília | Individual por logradouro |
| `36801-001` a `36801-899` | Santo Onofre, Santa Maria, Aeroporto, Amendoeira | Individual por logradouro |
| `36802-001` a `36802-899` | Coroado, Eldorado, Panorama, Ouro Verde | Individual por logradouro |
| `36803-001` a `36803-899` | Triângulo, Chevrand, Floresta, Novos Tempos | Individual por logradouro |
| `36804-001` a `36804-899` | Expansão urbana / Logradouros complementares da sede | Individual por logradouro |

### 2.2. Distritos, Comunidades e Zona Rural
| Localidade | CEP Atual | Tipo de Codificação | CEP Legado (Pré-2023) |
| :--- | :--- | :--- | :--- |
| **Distrito de Lacerdina** | `36805-001` a `36805-899` | Individual por logradouro | `36802-000` |
| **Área Rural de Carangola** | `36806-899` | CEP Único (Zona Rural) | `36800-000` |
| **Distrito de Alvorada** | `36807-000` | CEP Único por localidade | `36803-000` |
| **Distrito de Ponte Alta de Minas** | `36808-000` | CEP Único por localidade | `36805-000` |
| **Comunidade São Manoel do Boi** | `36809-000` | CEP Único por localidade | `36804-000` |

### 2.3. Unidades Operacionais / Correios (CEPs Especiais)
| Unidade | Endereço | Bairro / Distrito | CEP |
| :--- | :--- | :--- | :--- |
| AC Carangola (Agência Central) | Praça Coronel Maximiano, 36 | Centro | `36800-970` |
| UD Carangola (Unidade de Distribuição) | Praça Coronel Maximiano, 36 | Centro | `36800-973` |
| Clique e Retire AC Carangola | Praça Coronel Maximiano, 36 | Centro | `36800-959` |
| AGC Lacerdina | Rua Josina Fraga Lacerda, 200 | Lacerdina | `36805-970` |

---

## 3. Amostra Validada de Logradouros (Para Testes Automatizados / Seed)

| Logradouro | Bairro / Distrito | CEP |
| :--- | :--- | :--- |
| Avenida Pico da Bandeira | Centro | `36800-001` |
| Rua Dona Arminda Guimarães de Paula | Centro | `36800-002` |
| Rua Tombos | Centro | `36800-004` |
| Rua Presidente Kennedy | Centro | `36800-022` |
| Rua Marechal Deodoro | Centro | `36800-034` |
| Rua Quintino Bocaiúva | Centro | `36800-042` |
| Rua Marechal Floriano Peixoto | Centro | `36800-070` |
| Rua Benjamin Constant | Centro | `36800-074` |
| Praça Coronel Maximiano | Centro | `36800-078` |
| Praça Governador Valadares | Centro | `36800-106` |
| Rua Santos Dumont | Centro | `36800-112` |
| Rua Professor Augusto Amarante | Caixa D'Água | `36800-120` |
| Rua Moreira Carneiro | Caixa D'Água | `36800-134` |
| Rua Espírito Santo | Caixa D'Água | `36800-138` |
| Rua Altivo Bibiano | Santo Onofre | `36801-050` |
| Rua São Francisco | Santo Onofre | `36801-060` |
| Rua Treze de Maio | Santo Onofre | `36801-070` |
| Avenida Capitão Antônio Carlos de Souza | Santa Maria | `36801-140` |
| Avenida Doutor Waldemar Soares | Coroado | `36802-010` |
| Avenida dos Expedicionários | Coroado | `36802-026` |
| Avenida Doutor José Garcia de Freitas | Eldorado | `36802-144` |
| Rua Doutor José Larivoir Esteves | Triângulo | `36803-016` |
| Rua Vinte e Um de Abril | Triângulo | `36803-034` |
| Rua Sete de Setembro | Triângulo | `36803-104` |
| Rua São José | Triângulo | `36803-146` |
| Avenida Juca de Souza | Lacerdina | `36805-040` |
| Avenida Professor Pedro Amaral | Lacerdina | `36805-042` |

> **Nota sobre a Base Completa de Logradouros:** O município possui centenas de logradouros ativos no DNE dos Correios. Para evitar dados estáticos desatualizados, a consulta completa de ruas e bairros deve ser feita dinamicamente via API oficial/espelho DNE (regras abaixo), mantendo esta tabela como referência de faixas e casos de teste.

---

## 4. Regras de Negócio e Arquitetura do Consultador de CEPs

### 4.1. Endpoints de Consulta Dinâmica (Todas as Ruas e Bairros)
1. **Busca por CEP (Primária — ViaCEP):**
   - `GET https://viacep.com.br/ws/{cep}/json/`
2. **Busca por CEP (Fallback — BrasilAPI):**
   - `GET https://brasilapi.com.br/api/cep/v2/{cep}`
3. **Busca Reversa por Nome da Rua / Logradouro (Para listar todas as ruas de Carangola):**
   - `GET https://viacep.com.br/ws/MG/Carangola/{termo_busca}/json/`
   - *Observação:* A API exige no mínimo 3 caracteres no `{termo_busca}` (ex.: `"Rua"`, `"Avenida"`, `"Praça"`, `"Travessa"` ou o nome parcial da via) e retorna um array JSON com todos os logradouros correspondentes, seus respectivos bairros e CEPs individuais.

### 4.2. Tratamento Obrigatório de Casos Especiais
- **Caso A — Logradouro Codificado (Sede e Lacerdina):**
  - A API retorna `cep`, `logradouro`, `bairro`, `localidade: "Carangola"` e `uf: "MG"`. Preencher todos os campos e bloquear edição de cidade/UF.
- **Caso B — CEP Único de Distrito ou Zona Rural (`36806-899`, `36807-000`, `36808-000`, `36809-000`):**
  - A API retorna `logradouro: ""` e `bairro: ""` (ou nome do distrito).
  - A interface deve preencher `Cidade = Carangola`, `UF = MG`, exibir o nome do distrito/área rural correspondente e liberar o campo **Logradouro** para digitação livre do usuário.
- **Caso C — CEPs Legados / Antigos (`36800-000`, `36802-000`, `36803-000`, `36804-000`, `36805-000`):**
  - Se o usuário digitar o CEP geral antigo `36800-000`, exibir um alerta amigável informando: *"Carangola agora possui CEP individual por rua. Digite o nome da sua rua para encontrar o CEP atualizado."* e redirecionar automaticamente para a busca por logradouro.