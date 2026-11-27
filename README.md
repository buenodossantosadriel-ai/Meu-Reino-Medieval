# Meu Reino Medieval

Protótipo inicial 3D para navegador e celular, hospedável na Vercel.

## Stack
- Three.js para renderização 3D.
- Supabase Auth, Postgres e Realtime.
- PWA com manifest e service worker.

## Configuração
O projeto usa o projeto Supabase `vuvjxrxljlhvoldugmpz`. A chave publishable é pública e está no cliente; nunca coloque a chave service_role no navegador.

1. No Supabase, habilite cadastro por e-mail em Authentication.
2. Confirme que as tabelas e políticas da migração inicial estão aplicadas.
3. Publique a branch `main` na Vercel com framework Other e diretório raiz `./`.

## Estado atual
Este é um MVP inicial: terreno 3D, castelo simples, árvores, movimentação, controles touch/teclado, coleta demonstrativa, construção demonstrativa, autenticação e gravação básica de posição/recursos. Ainda não implementa o jogo completo: inventário autoritativo, combate real, ciclo dia/noite, IA de inimigos/animais, plantio com crescimento persistente, chat e sincronização completa de construções precisam ser desenvolvidos e testados nas próximas etapas.
