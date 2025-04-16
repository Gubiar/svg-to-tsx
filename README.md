# SVG to React TSX Converter

Este projeto converte arquivos `.svg` em componentes React (`.tsx`) escritos em TypeScript, sem utilizar bibliotecas externas. Além disso, gera uma página HTML para visualizar os ícones convertidos e disponibiliza um servidor local para acessá-la.

## 🚀 Funcionalidades

- Conversão de arquivos `.svg` para componentes React `.tsx` com TypeScript.
- Geração de uma página HTML para visualização dos componentes convertidos.
- Servidor Node.js para servir a página HTML no `localhost:3000`.
- Processamento paralelo de arquivos com controle de threads via linha de comando.
- Sem dependências externas: utiliza apenas recursos nativos do Node.js.

## 📁 Estrutura de Pastas

```
├── svg/             # Pasta com os arquivos SVG de entrada
├── react/           # Pasta onde os componentes TSX convertidos são salvos
├── converter.ts     # Script principal de conversão
├── server.js        # Servidor Node.js para servir a página HTML
├── react/index.html       # Página HTML gerada para visualização dos componentes
├── package.json     # Configurações e scripts do projeto
└── tsconfig.json    # Configurações do TypeScript
```

## ⚙️ Pré-requisitos

- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [ts-node](https://typestrong.org/ts-node/)

## 🔧 Instalação

1. Clone o repositório:

   ```bash
   git clone https://github.com/Gubiar/svg-to-tsx.git
   cd svg-to-tsx
   ```

2. Instale as dependências de desenvolvimento:

   ```bash
   npm i
   ```

3. Certifique-se de que as pastas `svg/` e `react/` existam na raiz do projeto. Se não existirem, crie-as:

   ```bash
   mkdir svg react
   ```

4. Adicione os arquivos `.svg` que deseja converter na pasta `svg/`.

## 🚀 Uso

### Conversão dos arquivos SVG

Para converter os arquivos `.svg` em componentes React `.tsx`, execute:

```bash
npm run convert
```

Por padrão, o script utiliza o número de threads igual ao número de CPUs disponíveis menos um. Para especificar o número de threads, utilize a opção `--threads`:

```bash
npm run convert -- --threads=4
```

### Servir a página HTML

Após a conversão, para visualizar os componentes convertidos, execute:

```bash
npm run serve
```

Acesse `http://localhost:3000` no seu navegador para visualizar a página com os ícones.

### Executar conversão e servidor simultaneamente

Para realizar a conversão e iniciar o servidor em sequência:

```bash
npm start
```

## 📄 Scripts disponíveis

- `npm run build`: Compila os arquivos TypeScript para JavaScript.
- `npm run convert`: Executa o script de conversão (`converter.ts`) utilizando `ts-node`.
- `npm run serve`: Inicia o servidor Node.js (`server.js`) para servir a página HTML.
- `npm start`: Executa a conversão e, em seguida, inicia o servidor.

## 🛠 Tecnologias utilizadas

- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [React](https://react.dev/)
- [ts-node](https://typestrong.org/ts-node/)

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).
