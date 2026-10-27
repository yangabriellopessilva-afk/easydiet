# EasyDiet — app Android

Aplicativo inicial de dieta e ganho de massa com React Native + Expo.

## Funções incluídas
- Painel diário de calorias e macros.
- Diário alimentar com alimentos comuns e alimentos personalizados.
- Remover alimentos do dia.
- Metas editáveis de calorias e proteína.
- Perfil e histórico de peso.
- Persistência local no aparelho com AsyncStorage.

## Importante: usando apenas o celular
Este projeto é o código-fonte; ele não é o APK pronto. Para gerar o APK sem computador, use um serviço de build na nuvem. Você precisará de uma conta Expo e de enviar os arquivos do projeto para um repositório online. O fluxo pode ser um pouco trabalhoso no celular.

### Fluxo sugerido
1. Baixe e extraia o ZIP no Android.
2. Crie uma conta em https://expo.dev/ e outra em https://github.com/ se ainda não tiver.
3. Crie um repositório no GitHub e envie os arquivos extraídos do projeto (incluindo `App.js`, `package.json`, `app.json`, `babel.config.js` e `eas.json`).
4. Abra https://expo.dev/ e entre na sua conta.
5. Para executar um build, o projeto precisa estar configurado no ambiente Expo EAS. Se o fluxo web não permitir conectar o repositório pelo celular, pode ser necessário usar um ambiente de terminal na nuvem, como GitHub Codespaces.
6. O perfil `preview` do arquivo `eas.json` está configurado para gerar APK quando o build for executado com `eas build --platform android --profile preview`.
7. Ao finalizar, o serviço apresenta um link para baixar o APK. Abra esse link no Android e instale o arquivo; talvez seja necessário autorizar a instalação dessa origem nas configurações do aparelho.

## Testar antes de compilar
É possível testar com Expo Go, mas a inicialização do projeto normalmente exige um terminal para executar `npx expo start`. Outra alternativa é adaptar o projeto para uma versão web hospedada.

## Limitações desta versão
- Sem login, nuvem ou sincronização entre dispositivos.
- Os dados nutricionais dos alimentos comuns são estimativas; confira rótulos e porções.
- Metas iniciais são exemplos editáveis e não substituem orientação individual de nutricionista.
