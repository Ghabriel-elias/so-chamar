# Só Chamar

Agenda online para prestador de serviço autônomo. O profissional publica um
link, o cliente escolhe o horário e agenda sozinho — com entrada no pix, no
crédito ou no débito, se o profissional quiser cobrar.

**Demonstração:** https://ghabriel-elias.github.io/so-chamar/

> A demonstração roda inteira no navegador: os dados ficam no `localStorage` do
> aparelho, não há servidor nem banco. Dá para criar conta, publicar o link,
> agendar como cliente, pagar, concluir e ver o dinheiro cair — tudo simulado.
> Para começar do zero, limpe os dados do site.

## Como rodar

```bash
npm install
npm run dev
```

O app sobe em http://localhost:3000. A conta de exemplo é o telefone
`11 98765-4321` com a senha `sochamar`, e a página pública dela é
`/ghabrielelias`.

## O que tem aqui

```
src/
  app/        rotas (Next.js App Router), em português
  screens/    uma pasta por tela: index.tsx + useTela.ts
  components/ componentes usados por mais de uma tela
  utils/      regras, formatação, camada de dados
  i18n/       configuração e todo o texto (pt-BR)
  types/      os tipos do domínio
  style/      tokens de design
```

A camada de dados é trocável em um arquivo (`src/utils/api/index.ts`): hoje
responde o mock em `src/utils/api/mock/`, amanhã responde um backend de
verdade. O contrato entre as telas e os dados está em
`src/utils/api/contract.ts` — nenhuma tela sabe de onde o dado vem.

## Feito com

Next.js 16, React 19, TypeScript, Tailwind CSS v4, TanStack Query, next-intl.

## Publicar a demonstração

```bash
npm run build:pages
```

Gera o site estático em `out/`, pronto para o GitHub Pages.
