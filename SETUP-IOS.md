# FoodView no iOS (Capacitor)

O site continua sendo um site estático servido pela Vercel. O Capacitor empacota
esse mesmo front-end dentro de um app nativo (WebView). O código já está
preparado: em `js/data.js`, `IS_NATIVE` detecta o app e ativa `API_BASE`
(chamadas `/api/*` apontam pro site publicado) e `OAUTH_REDIRECT` (deep link).
Na web nada muda.

> Estes passos exigem um **Mac com Xcode** e **CocoaPods** — não dá pra fazer
> sem eles. Hoje esta máquina não tem nenhum dos dois.

## 1. Pré-requisitos (uma vez)

```bash
# Xcode: instale pela App Store, depois aceite a licença e as ferramentas
sudo xcodebuild -license accept
xcode-select --install            # se ainda não tiver as command line tools

# CocoaPods
brew install cocoapods            # ou: sudo gem install cocoapods
```

Conta no **Apple Developer Program** (US$ 99/ano) para publicar.

## 2. Instalar dependências e criar o projeto iOS

```bash
npm install            # baixa o Capacitor (não afeta o deploy da Vercel)
npm run ios:add        # monta www/ e roda `cap add ios` (gera a pasta ios/)
```

## 3. Registrar o deep link do login (OAuth)

O login social volta pro app pela URL `foodview://login-callback`. Registre o
esquema no `ios/App/App/Info.plist` (dentro de `<dict>`):

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array><string>foodview</string></array>
  </dict>
</array>
```

E no **Supabase → Authentication → URL Configuration → Redirect URLs**, adicione:

```
foodview://login-callback
```

## 4. Ícone e splash

Coloque um PNG quadrado 1024×1024 em `resources/icon.png` (e, opcional,
`resources/splash.png` 2732×2732), depois:

```bash
npm run assets        # gera o AppIcon e a launch screen do iOS
```

## 5. Abrir, configurar e rodar

```bash
npm run ios:open      # abre o projeto no Xcode
```

No Xcode: selecione o **Team** (sua conta Apple Developer) e confirme o
**Bundle Identifier** (hoje `com.foodview.app` em `capacitor.config.json` —
mude se quiser). Rode no simulador ou num iPhone conectado.

## 6. Sign in with Apple (quando for ativar)

1. No Apple Developer: ative a capability **Sign in with Apple** no App ID e
   crie um **Service ID** + chave.
2. No Supabase → Authentication → Providers → **Apple**: ative e cole as
   credenciais.
3. No código, em `js/auth.js`, troque `APPLE_SIGNIN_ENABLED = false` para `true`.

## 7. Depois de qualquer mudança no site

```bash
npm run ios:sync      # remonta www/ e sincroniza com o projeto iOS
```

## Notas

- **App Store guideline 4.2:** um app que é só um "wrapper" do site pode ser
  rejeitado. Por isso empacotamos os assets (modo offline) em vez de só carregar
  a URL remota — e os próximos diferenciais nativos (push, compartilhar) ajudam.
- O `www/` é gerado (está no `.gitignore`); a fonte continua sendo a raiz do repo.
- O fluxo de OAuth nativo (`signInOAuth` / `initNativeAuth` em `js/auth.js`)
  ainda **não foi testado em dispositivo** — valide no primeiro build.
