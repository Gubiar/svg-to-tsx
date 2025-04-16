import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';

// Promisify fs functions
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);

// CLI args processing
const args = process.argv.slice(2);
const threadArg = args.find(arg => arg.startsWith('--threads='));
let maxThreads = Math.max(1, os.cpus().length - 1); // Valor default

if (threadArg) {
  const parsed = parseInt(threadArg.split('=')[1], 10);
  if (!isNaN(parsed) && parsed > 0) {
    maxThreads = parsed;
  } else {
    console.warn(`⚠️ Invalid thread count "${threadArg}". Falling back to ${maxThreads} threads.`);
  }
}

// Paths
const INPUT_FOLDER = './svg';
const OUTPUT_FOLDER = './react';

// Utility: Ensure output directory exists
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await stat(dirPath);
  } catch {
    await mkdir(dirPath, { recursive: true });
  }
}

// Utility: Converte nome de arquivo para PascalCase para o nome do componente
function toPascalCase(name: string): string {
  return name
    .split(/[^a-zA-Z0-9]/)
    .filter(Boolean)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join('') + 'Icon';
}

// Utility: Limpa o conteúdo SVG e gera um componente React TSX válido
function convertSvgToReact(svgContent: string, componentName: string): string {
  // Remove declarações XML, DOCTYPE e comentários
  let cleanedSvg = svgContent
    .replace(/<\?xml[^>]*\?>/g, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();

  // Localiza a tag <svg> e extrai seus atributos
  const svgOpenTagMatch = cleanedSvg.match(/<svg([^>]*)>/i);
  const svgCloseTagMatch = cleanedSvg.match(/<\/svg>/i);

  if (!svgOpenTagMatch || !svgCloseTagMatch) {
    throw new Error(`Invalid SVG: missing <svg> tags in component "${componentName}"`);
  }

  const svgAttributes = svgOpenTagMatch[1].trim();
  const innerSvgContent = cleanedSvg
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>/i, '')
    .trim();

  // Substitui "class" por "className" para compatibilidade com React
  const jsxContent = innerSvgContent.replace(/\bclass=/g, 'className=');

  return `import { type SVGProps } from "react";

const ${componentName} = (props: SVGProps<SVGSVGElement>) => (
  <svg ${svgAttributes} {...props}>
    ${jsxContent}
  </svg>
);

export default ${componentName};
`;
}

// Processa um único arquivo SVG
async function processSvgFile(filePath: string): Promise<void> {
  const fileName = path.basename(filePath, '.svg');
  const componentName = toPascalCase(fileName);
  const outputPath = path.join(OUTPUT_FOLDER, `${fileName}.tsx`);

  try {
    const svgContent = await readFile(filePath, 'utf-8');
    const reactComponent = convertSvgToReact(svgContent, componentName);
    await writeFile(outputPath, reactComponent, 'utf-8');
    console.log(`✅ Converted: ${fileName}.svg → ${fileName}.tsx`);
  } catch (err) {
    console.error(`❌ Failed to convert ${fileName}.svg: ${(err as Error).message}`);
  }
}

// Processa arquivos em lotes paralelos
async function processFilesInBatches(files: string[]): Promise<void> {
  const totalFiles = files.length;
  let processed = 0;

  for (let i = 0; i < totalFiles; i += maxThreads) {
    const batch = files.slice(i, i + maxThreads);
    const batchPromises = batch.map(file =>
      processSvgFile(path.join(INPUT_FOLDER, file))
    );

    await Promise.all(batchPromises);
    processed += batch.length;
    console.log(`Progress: ${processed}/${totalFiles}`);
  }
}

// Gera o arquivo HTML de visualização usando React via CDN
async function generateHtmlPreview(): Promise<void> {
  // Lista os componentes gerados (.tsx) na pasta de saída
  const files = (await readdir(OUTPUT_FOLDER)).filter(file => file.toLowerCase().endsWith('.tsx'));
  let componentScripts = '';

  for (const file of files) {
    const filePath = path.join(OUTPUT_FOLDER, file);
    let content = await readFile(filePath, 'utf-8');
    // Remove a linha de import do React
    content = content.replace(/import\s+{[^}]+}\s+from\s+["']react["'];?\s*/g, '');
    // Extraí o nome do componente (assumindo padrão: export default NomeIcon;)
    const componentMatch = content.match(/export\s+default\s+(\w+);?/);
    if (!componentMatch) {
      console.warn(`⚠️ Could not determine component name in ${file}`);
      continue;
    }
    const componentName = componentMatch[1];
    // Adiciona a atribuição global para o componente
    const assignment = `\nwindow.__components__ = window.__components__ || {};\nwindow.__components__["${componentName}"] = ${componentName};\n`;
    // Remove a linha "export default" para evitar erro no browser
    content = content.replace(/export\s+default\s+\w+;?/, '');
    // Cria um bloco script para esse componente
    componentScripts += `<script type="text/babel">\n${content}\n${assignment}\n</script>\n`;
  }

  // Template do arquivo HTML
  const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>SVG React Component Preview</title>
    <!-- CDN links para React, ReactDOM e Babel -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      .component-preview { margin: 20px 0; padding: 10px; border: 1px solid #ccc; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    
    <!-- Blocos de componente gerados -->
    ${componentScripts}
    
    <!-- Script principal que renderiza os componentes -->
    <script type="text/babel">
      function App() {
        return (
          <div>
            <h1>Preview dos Componentes React Gerados</h1>
            {
              Object.keys(window.__components__ || {}).map(key => {
                const Component = window.__components__[key];
                return (
                  <div key={key} className="component-preview">
                    <h2>{key}</h2>
                    <Component />
                  </div>
                );
              })
            }
          </div>
        );
      }
      ReactDOM.createRoot(document.getElementById('root')).render(<App />);
    </script>
  </body>
</html>
`;

  const htmlFilePath = path.join(OUTPUT_FOLDER, 'index.html');
  await writeFile(htmlFilePath, htmlContent, 'utf-8');
  console.log(`✨ HTML preview generated at: ${htmlFilePath}`);
}

// Função principal
async function main(): Promise<void> {
  try {
    console.log(`🔧 Starting SVG to React conversion using ${maxThreads} thread(s)...`);
    
    await ensureDirectoryExists(OUTPUT_FOLDER);
    
    const allFiles = await readdir(INPUT_FOLDER);
    const svgFiles = allFiles.filter(file => file.toLowerCase().endsWith('.svg'));

    if (svgFiles.length === 0) {
      console.log('📂 No SVG files found to convert.');
      return;
    }

    console.log(`📄 Found ${svgFiles.length} SVG file(s) to convert.\n`);
    await processFilesInBatches(svgFiles);
    console.log('\n✅ All files converted successfully!');
    
    // Gera o arquivo HTML com os componentes para visualização
    await generateHtmlPreview();
    
  } catch (err) {
    console.error('🚨 An error occurred:', (err as Error).message);
    process.exit(1);
  }
}

main();
