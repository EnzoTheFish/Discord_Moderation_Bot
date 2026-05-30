
const { Client, GatewayIntentBits, GuildEmojiManager } = require("discord.js");
const cron = require("node-cron");
const axios = require("axios");
const OpenAI = require("openai");
require("dotenv").config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});


client.login(process.env.TOKEN);

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY});


const palavrasProibidas =
  process.env.BLACKLIST.split(",");

const whitelist =
  process.env.WHITELIST.split(",");

const equivalencias = {
  a: "[.-a4@α🇦å]+",
  e: "[e3ę𝓮ⓔₑ🅔]+",
  i: "[i1!..🇮ïl𝓲ⓘᵢ🅘]+",
  o: "[o0]+",
  s: "[s5$z]+",
  g: "[--.g6&🇬𝓰ⓖ🅖]+",
  n: "[-.пиn🇳Ñ𝓷ⓝₙ🅝]+",
  r: "[r𝓻ⓡᵣ🅡]+",
  t: "[t7]+",
  m: "[mм]+"
};

async function pegarUltimoCommit() {

  try {

    const response = await axios.get(
      "https://api.github.com/repos/EnzoTheFish/Discord_Moderation_Bot/commits"
    );

    const commit = response.data[0];

    return {
      mensagem: commit.commit.message,
      autor: commit.commit.author.name
    };}catch (err) {

    console.log("eero em pegar commit:", err);

    return null;
  }
}

function gerarRegex(palavrasProibidas) {

  const patterns = palavrasProibidas.map(palavrasProibidas => {

    return palavrasProibidas
      .toLowerCase()
      .split("")
      .map(letra => {

        return equivalencias[letra] || `[${letra}]+`;

      })
      .join("[^\\p{L}\\p{N}]*");
  });

  return new RegExp(
  `\\b(?:${patterns.join("|")})\\b`,
  "iu"
);
}

const regex = gerarRegex(palavrasProibidas);

console.log(regex);

const gifAviso = "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Y3R1NGNlc2dldnYxYXNibXN3MDIyaGx2OGt6dTFnZm9nMzVyazh3eSZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/MIgBsF1vsfoliVCn1x/giphy.gif";

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const texto = message.content.toLowerCase();

  const palavrasMensagem = texto.split(/\s+/);

  let detectou = false;

  for (const palavra of palavrasMensagem) {

  if (whitelist.includes(palavra)) {
    continue;
  }

  if (regex.test(palavra)) {
    detectou = true;
    break;
  }
}
 console.log(texto);

  if (detectou) {

    console.log("Mensagem original:", message.content, "autor: ", message.author);

    const aviso = await message.reply({
      content: `Perai ai po ${message.author} KKKKKKK 🚨\nLinguagem impropria detectada Pelo Senhor B&L.`,
      files: [gifAviso]
      
    });

    setTimeout(async () => {
      try {
        await message.delete();
      } catch (err) {
        console.log("Não consegui deletar a mensagem.");
      }
    }, 4000);
    
    setTimeout(async () => {
      try {
        await aviso.delete();
      } catch (err) {}
    }, 7000);
  }
});
//             CHANGELOG





client.once("ready", async () => { 
  const canal = client.channels.cache.get("1509193642642903132");

  let test = false;
  if(test) return;

  const commit = await pegarUltimoCommit();

  if (!commit) return;

  canal.send(`
// NOVA ATUALIZAÇÃO DO B&L //

  Atualizaçao : ${commit.mensagem}

 Atualizado por causa dos doentes.
  `);
});




//                            AI


const memoriaCanais = new Map();

client.on("messageCreate", async (message) => {

    if (message.author.bot) return;

    const botMarcado = message.mentions.has(client.user);

    let respondeuBot = false;
    let contextoReply = "";

    if (message.reference) {

        try {
            const mensagemOriginal = await message.fetchReference();
            const imagemOriginal = mensagemOriginal.attachments.first();

            contextoReply =
                ` Mensagem respondida anteriormente:
                "${mensagemOriginal.content}"

                 Autor original:
                 ${mensagemOriginal.author.username}
                Possui imagem:${imagemOriginal ? "SIM" : "NÃO"}`;
            respondeuBot = mensagemOriginal.author.id === client.user.id;
        } catch (err) {
            console.log("Erro ao pegar resposta:", err);
        }
    }

    if (!botMarcado && !respondeuBot) return;

    try {

        await message.channel.sendTyping();

        const canalId = message.channel.id;

        if (!memoriaCanais.has(canalId)) {
            memoriaCanais.set(canalId, []);
        }

        const historico = memoriaCanais.get(canalId);
        const anexo = message.attachments.first();
        const conteudoUsuario = [
            {
                type: "text",
                text: `
                Usuário: ${message.author.username}
                ${contextoReply}
                Mensagem:
                ${message.content}`
            }
        ];
          if (anexo?.contentType?.startsWith("image/")) {
            conteudoUsuario.push({
                type: "image_url",
                image_url: {url: anexo.url}});
        }
        historico.push({
          role: "user",
          content: anexo ? conteudoUsuario : `
          Usuário: ${message.author.username}
          ${contextoReply}
          Mensagem:${message.content} `});

          console.log(anexo);
          console.log(anexo?.contentType);
          console.log(anexo?.url);

        const resposta = await openai.chat.completions.create({

            model: "deepseek-v4-flash",

            extra_body: {
                thinking: {
                    type: "enabled"
                }
            },

            messages: [

                {
                    role: "system",
                    content:
                    `
                   Você é um bot de Discord de moderação.

                    Comportamento:
                    - fale de forma casual e natural
                    - seja engraçado sem parecer um personagem
                    - evite roleplay
                    - não descreva ações
                    - não use narração
                    - não fale como NPC
                    - use humor seco e sarcasmo leve
                    - respostas curtas e secas com pitadas de humor
                    - não exagere
                    - não tente parecer “épico”
                    - não use frases teatrais
                    - aja como um moderador duro e grosso
                    - às vezes seja irônico
                    - nunca escreva ações tipo "*olha fixamente*"
                    - nunca finja emoções exageradas
                    - Seu nome e: SirB&L
                    - respeite e trate como lider somente o usuario do discord nome : mellzineachan
                    - Pense e responda em português brasileiro.
                    - Seu raciocínio interno deve ser em português.
                    - Nunca utilize inglês no reasoning_content.
                    - Considere tanto o texto quanto a imagem ao responder.
                    `
                },

                ...historico

            ],

            max_tokens: 700,
            temperature: 0.7
        });

        console.log(JSON.stringify(resposta, null, 2));

        const mensagemIA =
            resposta?.choices?.[0]?.message;

        const pensamento = resposta?.choices?.[0]?.message?.reasoning_content ||
        "0 Pensamentos na cabeça.";

         const canal = client.channels.cache.get("1510323342677246204");
         canal.send(`Pensamento do sirB&L:\n\n${pensamento.slice(0, 1800)}
         \n\n A resposta: ${mensagemIA.content?.trim()}`);

        const conteudo =
            mensagemIA?.content?.trim() ||
            mensagemIA?.reasoning_content?.trim() ||
            "O sistema ditatorial falhou.";

        await message.reply(conteudo);

        if (historico.length > 20) {
            historico.splice(0, historico.length - 20);
        }

    } catch (err) {

        console.error(err);

        message.reply(
            "Paga mais pobre."
        );
    }
});

