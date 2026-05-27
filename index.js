
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

const equivalencias = {
  a: "[.-a4@α🇦å]+",
  e: "[e3ę𝓮]+",
  i: "[i1!..🇮ïl𝓲]+",
  o: "[o0]+",
  s: "[s5$z]+",
  g: "[--.g6&🇬𝓰]+",
  n: "[-.пиn🇳Ñ𝓷]+",
  r: "[r𝓻]+"
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

  return new RegExp(patterns.join("|"), "iu");
}

const regex = gerarRegex(palavrasProibidas);

console.log(regex);

const gifAviso = "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Y3R1NGNlc2dldnYxYXNibXN3MDIyaGx2OGt6dTFnZm9nMzVyazh3eSZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/MIgBsF1vsfoliVCn1x/giphy.gif";

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const texto = message.content.toLowerCase();

  const contemPalavra = regex.test(texto);

  if (contemPalavra) {

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

client.once("ready", async () => {

  const test = true;

  if(!test) return; 
  const canal = client.channels.cache.get("1509193642642903132");

  const commit = await pegarUltimoCommit();

  if (!commit) return;

  canal.send(`
// NOVA ATUALIZAÇÃO DO B&L //

  Atualizaçao : ${commit.mensagem}

 Atualizado por causa dos doentes.
  `);
});

const memoriaCanais = new Map();

client.on("messageCreate", async (message) => {

    if (message.author.bot) return;

    const botMarcado = message.mentions.has(client.user);

    let respondeuBot = false;
    let contextoReply = "";

    if (message.reference) {

        try {

            const mensagemOriginal =
                await message.fetchReference();

            contextoReply =
                `
                Mensagem respondida anteriormente:
                "${mensagemOriginal.content}"

                Autor original:
                ${mensagemOriginal.author.username}
                `;

            respondeuBot =
                mensagemOriginal.author.id === client.user.id;

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

        historico.push({
            role: "user",
            content:
                `
                Usuário: ${message.author.username}

                ${contextoReply}

                Mensagem:
                ${message.content}
                `
        });

        const resposta = await openai.chat.completions.create({

            model: "deepseek-v4-flash",

            extra_body: {
                thinking: {
                    type: "disabled"
                }
            },

            messages: [

                {
                    role: "system",
                    content:
                    `
                    Você é um bot de Discord engraçado/serio.

                    Sua personalidade:
                    - Você é um bot de moderação
                    - age como um ditador extremamente rígido
                    - faz piadas pesadas
                    - responde de forma autoritária
                    - aja de maneira seria
                    - lembra de conversas anteriores
                    - provoca usuários
                    - não faça roleplay
                    - nao seja tao exagerado em sua interpretaçao
                    `
                },

                ...historico

            ],

            max_tokens: 500,
            temperature: 1
        });

        console.log(JSON.stringify(resposta, null, 2));

        const mensagemIA =
            resposta?.choices?.[0]?.message;

        const conteudo =
            mensagemIA?.content?.trim() ||
            mensagemIA?.reasoning_content?.trim() ||
            "O sistema ditatorial falhou.";

        await message.reply(conteudo);

        historico.push({
            role: "assistant",
            content: conteudo
        });

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

