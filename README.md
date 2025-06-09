## Relatório de Correções – Desafio Taskly 

Com base no feedback recebido no último desafio, realizei uma série de melhorias e correções estruturais em todo o projeto Taskly, com o objetivo de desenvolver um maior domínio sobre a aplicação, garantir coesão entre as funcionalidades e entregar uma base de código mais limpa e funcional. No feedback anterior, os instrutores mencionaram que o grupo demonstrou pouco domínio sobre o projeto e que faltava centralização das responsabilidades, especialmente nas chamadas à API. Considerando isso, procurei atuar de forma mais abrangente, realizando alterações na maior parte dos arquivos do projeto — incluindo aqueles criados por colegas — para atender a essas observações e elevar a qualidade técnica da aplicação como um todo. 

## Alterações realizadas 

Padronização das requisições 
 Muitos arquivos criados pelos colegas estavam utilizando fetch diretamente dentro das páginas, o que dificultava a manutenção e contrariava boas práticas de arquitetura. Por isso, centralizei todas as chamadas HTTP no arquivo api.ts, utilizando um serviço global com instância do Axios. Essa abordagem segue o padrão de organização por camadas, separando as responsabilidades e tornando o código mais testável, reutilizável e organizado. 

## Reestruturação geral do projeto 
 Além das correções específicas, reestruturei partes importantes do código para ampliar o domínio sobre toda a aplicação. As alterações abrangeram arquivos de terceiros, como EditProfileScreen, EditTaskScreen, entre outros, com o objetivo de corrigir comportamentos inesperados, garantir consistência e entregar uma experiência de uso mais fluida. Essa revisão incluiu ajustes em chamadas assíncronas, tratamento de erros, controle de estado, atualização de dados e layout. 

## Backend em nova instância EC2 
 Anteriormente, o backend estava hospedado no GitHub do instrutor e era acessado diretamente a partir de lá. Para proporcionar mais estabilidade e independência ao projeto, subi o backend em uma instância EC2 da AWS, garantindo que o projeto agora consuma a API diretamente da nuvem. Com isso, pude realizar testes com mais controle e tornar o fluxo de deploy mais realista.
 
## Imagens e ícones hospedados no S3 
 Removi todos os arquivos de imagem e ícones locais do projeto. Agora, os assets visuais estão armazenados em um bucket S3 da AWS e são carregados dinamicamente via URL. Essa alteração reduziu o tamanho do repositório e tornou a manutenção dos recursos visuais mais prática e escalável. 

## SubtaskScreen: atualização da imagem do perfil 
 Corrigi o carregamento da imagem do usuário na tela de subtarefas. Agora, a imagem é exibida corretamente de acordo com o avatar salvo, utilizando o mapeamento dinâmico de URLs do bucket S3. 
 
## Criação de subtasks 
 Resolvi um erro que impedia a criação de subtasks. A lógica da tela e a integração com a API foram revisadas, e os dados agora são enviados corretamente conforme o esperado pelo backend.

## Ajustes no perfil 
 Corrigi a exibição da imagem de avatar, que anteriormente não aparecia, e também a edição do telefone, que estava com DDD fixo (99). Agora, o campo pode ser alterado livremente e os dados salvos corretamente. 

## Edição de perfil com ScrollView 
Implementei o ScrollView para evitar problemas de visualização em dispositivos menores. Além disso, corrigi a funcionalidade do botão de salvar, que agora atualiza corretamente os dados no backend e no frontend. Também incluí a funcionalidade de troca do avatar diretamente na página. Embora essa implementação não esteja totalmente alinhada com o modelo do Figma, optei por essa solução por ser mais rápida, priorizando a funcionalidade para que o recurso estivesse disponível desde já, em vez de não incluir a funcionalidade. 

## Exclusão de conta 
 Implementei a função deleteProfile no hook useUserProfile.tsx, integrando o endpoint correspondente na API (/profile/delete-account). Agora, a exclusão da conta funciona corretamente e redireciona o usuário conforme esperado. 


## Limpeza de comentários no código 
 Removi comentários e trechos de código desnecessários ou não utilizados nas principais telas e arquivos da aplicação. Essa limpeza contribui para uma base de código mais profissional, coesa e alinhada com boas práticas de desenvolvimento. 

---

# 📱 Taskly

Aplicativo mobile para gestão de tarefas. Com o Taskly, o usuário pode organizar suas atividades, estabelecer prazos, definir prioridades e personalizar seu perfil. Este projeto foi desenvolvido como parte de um desafio proposto pelos instrutores da trilha de React Native e AWS do Programa de Bolsas da Compass.UOL.

---

## 📚 Sumário

- [Arquitetura do Projeto](#-arquitetura-do-projeto)
- [Estrutura de Pastas](#-estrutura-de-pastas)\
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Design e Temas](#-design-e-temas)
- [Como Rodar o Projeto](#-como-rodar-o-projeto)
- [Licença](#-licença)
- [Desenvolvedores](#-desenvolvedores)

---

## 🏗️ Arquitetura do Projeto

A arquitetura foi planejada para garantir **clareza, escalabilidade e manutenibilidade**, com base em três pilares:

- **Clean Code**: código legível e com responsabilidades bem definidas.
- **Component-based e Layer-Based**: seseparação em camadas como components, screens, services, utils, e navigation.
- **Atomic Design**: componentes organizados em `atoms`, `molecules` e, futuramente, `organisms`.
- **SOLID**: princípios aplicados para manter o código modular, reutilizável e de baixo acoplamento.
- **DDD (Domain-Driven Design)**: organização do código baseada nos conceitos do domínio, como Task, User e Profile, separando regra de negócio da interface e infraestrutura.

---

## 📁 Estrutura de Pastas

```text
RN-mar25-Taskly/
src/
├── 📁 assets/ 
├── 📁 components/                  
├── 📁 screens/             
├── 📁 navigation/           
├── 📁 context/  

├── 📁 data/                          
├── 📁 domain/               
│   ├── 📁 auth/
│   ├── 📁 profile/
│   ├── 📁 tasks/
│   ├──  📁 user/
├── 📁 hooks/  
├── 📁 navigation/                
├── 📁 screens/                 
└── 📁 utils/
```

---

## 🧰 Tecnologias Utilizadas

- **[React Native](https://reactnative.dev/)** — framework para desenvolvimento mobile.
- **[TypeScript](https://www.typescriptlang.org/)** — tipagem estática.
- **[React Navigation](https://reactnavigation.org/)** — navegação entre telas.
- **[Axios](https://axios-http.com/)** — requisições HTTP.
- **[AsyncStorage](https://react-native-async-storage.github.io/async-storage/)** — armazenamento local.
- **[React Native Biometrics](https://github.com/SelfLender/react-native-biometrics)** — autenticação biométrica.
- **[React Native Masked Text](https://github.com/benhurott/react-native-masked-text)** — máscaras para entradas do usuário.

---

## 🎨 Design e Temas

O layout segue o [Figma oficial](https://www.figma.com/design/4CRUTjHYX89xCfdUhFl8ft/Taskly-UI?node-id=0-1&t=jDE70ppySE29bZ7f-1), com padronização de cores, fontes e componentes reutilizáveis com base em Atomic Design.

O app suporta **tema claro e escuro**, alternando conforme a preferência do usuário.

---

## ▶️ Como Rodar o Projeto

### Pré-requisitos

- Node.js (versão LTS recomendada)
- React Native CLI (`npm install -g react-native-cli`)
- Android Studio (com um AVD configurado) 
- Java JDK instalado
- Dispositivo físico com depuração USB ativada (opcional)

### Passos para rodar

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/taskly.git
cd taskly

# 2. Instale as dependências
npm install
# ou
yarn

# 3. Inicie o Metro Bundler em um terminal separado
npx react-native start
```

### Para rodar no Android

Certifique-se de que um emulador está rodando no Android Studio ou que um dispositivo com depuração USB está conectado.

```bash
npx react-native run-android
```

## 📝 Licença

Projeto privado, desenvolvido exclusivamente para fins educacionais e internos.

---

## 👨‍💻 Desenvolvedores
 
- [**Jessica Woytuski**](https://github.com/Jessiwoy)  
- [**João Vitor Iuncks**](https://github.com/Iuncks)  
- [**Lorenzo Giuseppe Oliveira Baroni**](https://github.com/lorenzobaroni)  
- [**Natan Oliveira da Silva**](https://github.com/Natan-Oliveira-da-Silva)
