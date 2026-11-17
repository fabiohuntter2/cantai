# Cantaí — músicas personalizadas com IA

App em Next.js: o cliente conta uma história, a IA escreve a letra, o cliente
aprova, paga com Pix (Mercado Pago) e recebe 2 versões da música
(ElevenLabs Music).

Funciona em **modo demonstração** sem nenhuma chave configurada: a letra é
de exemplo, o pagamento é aprovado na hora e o áudio é uma melodia de teste.
Cada chave que você cadastra liga a parte real correspondente
(veja `.env.example`).

## Páginas
- `/` início · `/criar` formulário · `/pedido/<id>` letra, Pix e música pronta
- `/termos` termos de uso (modelo, revise antes de vender)
- `/admin` lista de pedidos (precisa da variável `ADMIN_SENHA`)

## Rodar no computador (opcional)
```
npm install
npm run dev
```
Abra http://localhost:3000

## Colocar no ar
Siga o guia passo a passo que acompanha este código.
