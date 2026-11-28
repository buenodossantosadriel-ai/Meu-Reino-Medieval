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

## Modo 4D (camada imersiva)
- Ciclo solar dia/noite existente, com sol, lua, estrelas e iluminação variável.
- Clima selecionável: céu limpo, nublado, chuva, tempestade com relâmpagos, neve e neblina.
- Partículas climáticas acompanhando o jogador e vento animando elementos verdes do cenário.
- Animação sutil de superfícies aquáticas e efeitos de transparência.
- Som ambiente sintetizado no navegador, ativado pelo próprio jogador no painel 4D.
- Painel móvel `🌍 MUNDO 4D` dentro do jogo; controles de clima e áudio.

Os efeitos são executados localmente no navegador, sem chamadas adicionais ao Supabase. Crescimento persistente de plantações e simulação climática sincronizada entre jogadores continuam como etapas futuras.

## Áudio imersivo
- Painel com ativação explícita do áudio (compatível com a política de autoplay dos navegadores) e controles separados de música, ambiente e efeitos.
- Camadas de vento, chuva e crepitar de fogo; pássaros ocasionais durante o dia.
- Efeitos ligados às ações do jogador: passos, cascos do cavalo, salto, esquiva, espada, impacto de combate e coleta de madeira/pedra.
- Sons posicionais com atenuação espacial, usando a posição da câmera e do evento no mundo 3D.
- Áudio gerado localmente com Web Audio API; não depende de arquivos externos ou chamadas ao Supabase.


## Créditos dos modelos 3D de personagens
- Cavaleiro principal: “Plate Armour Knight”, de vinish.dev, licença CC BY 4.0. https://vinish.dev/free-3d-models/knights
- Princesa guerreira: “Lady Knight”, de vinish.dev, licença CC BY 4.0. https://vinish.dev/free-3d-models/knights
