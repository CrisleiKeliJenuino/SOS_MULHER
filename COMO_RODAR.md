# 📱 SOS Mulher — Guia de Instalação e Execução

Um app de emergência para mulheres em perigo, com botão SOS, cadastro de contatos de confiança e envio automático de localização GPS.

---

## 🚀 Início Rápido

### Opção 1: Testar no Navegador (Web)

A forma mais rápida para testar sem instalar nada no celular.

```bash
# 1. Acesse o link do dev server (fornecido no painel de controle)
https://8081-i3iwmzrgi1b21blbovtyg-aad39cff.us2.manus.computer

# 2. Abra no navegador do seu computador ou celular
# 3. Pronto! O app está rodando
```

**Limitações no navegador:**
- Localização GPS funciona apenas em HTTPS (já está habilitada)
- Chamadas telefônicas não funcionam (será simulado)
- SMS não funciona (será simulado)

---

### Opção 2: Testar no Celular com Expo Go (Recomendado)

A forma mais realista para testar todas as funcionalidades.

#### Pré-requisitos

- **iPhone ou Android** com o app **Expo Go** instalado
  - [iOS: App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Android: Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

#### Passos

1. **Abra o Expo Go** no seu celular

2. **Escaneie o QR Code** que aparece no painel de controle do projeto
   - O QR Code está disponível em: Management UI → Preview panel
   - Ou use o link direto: `exps://8081-i3iwmzrgi1b21blbovtyg-aad39cff.us2.manus.computer`

3. **Aguarde o carregamento** (pode levar 30-60 segundos na primeira vez)

4. **O app abrirá automaticamente** no Expo Go

#### Funcionalidades Disponíveis

✅ Botão SOS com animação de pulsar  
✅ Cadastro de até 3 contatos de confiança  
✅ Envio de SMS com localização GPS  
✅ Chamada rápida para o primeiro contato  
✅ Modal de confirmação antes de acionar SOS  
✅ Persistência de dados (contatos salvos localmente)  

---

## 💻 Desenvolvimento Local (Para Desenvolvedores)

Se você quer modificar o código e testar localmente.

### Pré-requisitos

- **Node.js** 18+ instalado
- **pnpm** instalado (`npm install -g pnpm`)
- **Git** instalado
- Um editor de código (VS Code recomendado)

### Instalação

```bash
# 1. Clone o repositório
git clone <seu-repositorio>
cd sos-mulheres

# 2. Instale as dependências
pnpm install

# 3. (Opcional, mas recomendado) Configure variáveis de ambiente
# Copie o arquivo de exemplo e ajuste conforme necessário
# PowerShell:
Copy-Item .env.example .env
# Windows (cmd):
copy .env.example .env
# macOS/Linux:
cp .env.example .env

# 4. Inicie o servidor de desenvolvimento
pnpm dev
```

### Testar no celular (Expo Go) usando seu PC (LAN)

1. Garanta que **PC e celular estão na mesma rede Wi‑Fi**.
2. (Opcional) Suba o backend local (tRPC/API):

```bash
pnpm dev:server
```

1. Inicie o Expo para **Android/iOS** (vai mostrar o QR Code no terminal):

```bash
pnpm exec expo start
```

1. No celular, abra o **Expo Go** e escaneie o QR Code.

Notas importantes:

- No **celular**, `localhost` aponta para o próprio celular. Se você precisar do backend rodando no PC, configure `EXPO_PUBLIC_API_BASE_URL` no `.env` com o IP do seu PC, por exemplo: `http://192.168.0.10:3000`.
- Se der erro de conexão/QR (firewall/rede), tente: `pnpm exec expo start --tunnel`.

O Expo (web) iniciará em: `http://localhost:8081`

Se a porta `8081` já estiver em uso, o script escolhe automaticamente a próxima porta livre (ex.: `8082`, `8083`, ...), evitando prompts interativos.

Notas sobre OAuth:
- Se você for usar login OAuth, preencha `OAUTH_SERVER_URL`, `VITE_APP_ID` e `VITE_OAUTH_PORTAL_URL` no `.env`.
- Se não configurar, o servidor vai subir normalmente (OAuth fica desabilitado), mas rotas de OAuth não vão funcionar.

### Estrutura do Projeto

```
sos-mulheres/
├── app/
│   ├── _layout.tsx              # Layout raiz com providers
│   └── (tabs)/
│       ├── _layout.tsx          # Configuração das abas
│       ├── index.tsx            # Tela Home (SOS)
│       └── contacts.tsx         # Tela de Contatos
├── components/
│   ├── screen-container.tsx     # Wrapper de SafeArea
│   └── ui/
│       └── icon-symbol.tsx      # Mapeamento de ícones
├── hooks/
│   ├── use-colors.ts            # Hook de cores do tema
│   ├── use-location.ts          # Hook de localização GPS
│   └── use-color-scheme.ts      # Hook de tema claro/escuro
├── lib/
│   ├── contacts-context.tsx     # Context de contatos com AsyncStorage
│   └── utils.ts                 # Funções utilitárias
├── theme.config.js              # Configuração de cores
├── tailwind.config.js           # Configuração do Tailwind CSS
├── app.config.ts                # Configuração do Expo
└── package.json                 # Dependências do projeto
```

### Comandos Disponíveis

```bash
# Iniciar o servidor de desenvolvimento
pnpm dev

# Rodar testes unitários
pnpm test

# Verificar erros de TypeScript
pnpm check

# Formatar código
pnpm format

# Executar linter
pnpm lint

# Gerar QR Code para Expo Go
pnpm qr

# Compilar para produção
pnpm build

# Iniciar servidor de produção
pnpm start
```

---

## 🎯 Como Usar o App

### Tela Home (Emergência)

1. **Cadastre contatos primeiro**
   - Toque na aba "Contatos" na parte inferior
   - Clique em "Adicionar Contato"
   - Preencha nome e telefone (máximo 3 contatos)

2. **Em caso de emergência**
   - Toque no botão **SOS** (grande, rosa, no centro)
   - Confirme a ação no modal que aparece
   - O app obterá sua localização GPS
   - Enviará SMS com localização para todos os contatos
   - Você pode ligar para o primeiro contato usando o botão verde

3. **Botão de Chamada Rápida**
   - O botão verde "Ligar para [Nome]" liga automaticamente para o primeiro contato
   - Disponível mesmo sem acionar o SOS

### Tela de Contatos

1. **Adicionar Contato**
   - Clique em "Adicionar Contato"
   - Preencha nome e telefone
   - Clique em "Salvar"

2. **Editar Contato**
   - Toque no contato da lista
   - Modifique os dados
   - Clique em "Salvar"

3. **Remover Contato**
   - Toque no contato da lista
   - Clique em "Remover"

---

## 📍 Permissões Necessárias

O app solicita as seguintes permissões:

| Permissão | Motivo | Obrigatória |
|-----------|--------|------------|
| **Localização** | Enviar GPS na mensagem de SOS | Sim |
| **Telefone** | Fazer chamadas e enviar SMS | Sim |

Quando o app pedir permissão, clique em **"Permitir"** para que todas as funcionalidades funcionem corretamente.

---

## 🔧 Troubleshooting

### "O app não carrega no Expo Go"

**Solução:**
1. Feche o Expo Go completamente
2. Abra novamente
3. Escaneie o QR Code novamente
4. Se persistir, reinicie o seu celular

### "Localização não funciona"

**Solução:**
1. Verifique se o app tem permissão de localização
   - iOS: Configurações → SOS Mulher → Localização → "Enquanto usa o app"
   - Android: Configurações → Aplicativos → SOS Mulher → Permissões → Localização
2. Ative o GPS do seu celular
3. Aguarde alguns segundos para o GPS se conectar

### "SMS não envia"

**Solução:**
1. Verifique se o telefone tem saldo/plano SMS ativo
2. Certifique-se de que o número foi digitado corretamente
3. Tente novamente em alguns segundos

### "Contatos não salvam"

**Solução:**
1. Verifique se o app tem permissão de armazenamento
2. Limpe o cache do Expo Go: Configurações → Expo Go → Limpar Cache
3. Reinstale o app

---

## 📦 Build para Produção

### Gerar APK (Android)

```bash
# Usar o painel de controle do Manus
# Clique em "Publish" após criar um checkpoint
# Selecione "Android" e aguarde a compilação
```

### Gerar IPA (iOS)

```bash
# Usar o painel de controle do Manus
# Clique em "Publish" após criar um checkpoint
# Selecione "iOS" e aguarde a compilação
```

---

## 🎨 Personalização

### Mudar Cores

Edite `theme.config.js`:

```javascript
const themeColors = {
  primary: { light: '#D72660', dark: '#D72660' },      // Rosa/Vermelho
  background: { light: '#ffffff', dark: '#151718' },   // Fundo
  surface: { light: '#f5f5f5', dark: '#1e2022' },      // Cards
  foreground: { light: '#11181C', dark: '#ECEDEE' },   // Texto principal
  muted: { light: '#687076', dark: '#9BA1A6' },        // Texto secundário
  border: { light: '#E5E7EB', dark: '#334155' },       // Bordas
  success: { light: '#22C55E', dark: '#4ADE80' },      // Verde (botão de chamada)
  warning: { light: '#F59E0B', dark: '#FBBF24' },      // Amarelo (avisos)
  error: { light: '#EF4444', dark: '#F87171' },        // Vermelho (erros)
};
```

### Mudar Nome do App

Edite `app.config.ts`:

```typescript
const env = {
  appName: "SOS Mulher",  // Mude aqui
  appSlug: "sos-mulheres",
  logoUrl: "",
  // ...
};
```

### Mudar Logo

1. Gere uma nova imagem (512x512px)
2. Salve em `assets/images/icon.png`
3. Copie para:
   - `assets/images/splash-icon.png`
   - `assets/images/favicon.png`
   - `assets/images/android-icon-foreground.png`

---

## 📚 Recursos Adicionais

- [Documentação do Expo](https://docs.expo.dev/)
- [Documentação do React Native](https://reactnative.dev/)
- [Documentação do Expo Router](https://expo.github.io/router/)
- [NativeWind (Tailwind CSS para React Native)](https://www.nativewind.dev/)

---

## 🤝 Suporte

Se encontrar problemas:

1. Verifique este guia novamente
2. Consulte a seção "Troubleshooting"
3. Verifique os logs no console do navegador (F12)
4. Reinicie o servidor: `pnpm dev`

---

## 📄 Licença

Este projeto é fornecido como está para fins educacionais e de segurança pessoal.

---

**Última atualização:** Maio 2026  
**Versão do App:** 1.0.0  
**Versão do Expo:** 54
