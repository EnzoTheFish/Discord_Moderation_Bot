const deepseek = require("./deepseekClient");
const systemPrompt = require("./systemPrompt");
const analisarImagem = require("./geminiImage");
const memoriaConversa = new Map();
const CANAL_PENSAMENTOS_ID = "1510323342677246204";
const buscarNoticiasAnime = require("./rss");
const contextoExtra = require("./systemPrompt");
const cron = require('node-cron');

function criarConteudoUsuario(message, contextoReply, anexo, descricaoImagem) {
    const partes = [
        `Usuario: ${message.author.username}`,
        contextoReply,
        `Mensagem:\n${message.content || "(sem texto)"}`
    ];

    if (descricaoImagem) {
        partes.push(`Descrição da imagem: ${descricaoImagem}`);
    }

    if (anexo?.contentType?.startsWith("image/")) {
        partes.push(
            "Imagem enviada: SIM",
            `Tipo: ${anexo.contentType}`,
            `URL: ${anexo.url}`
        );
    } else if (anexo) {
        partes.push(
            "Anexo enviado: SIM",
            `Tipo: ${anexo.contentType || "desconhecido"}`,
            `URL: ${anexo.url}`
        );
    }

    return partes.filter(Boolean).join("\n");
}

async function montarContextoReply(message, client) {
    if (!message.reference) {
        return {
            respondeuBot: false,
            contextoReply: ""
        };
    }

    try {
        const mensagemOriginal = await message.fetchReference();
        const ehRespostaAoBot = mensagemOriginal.author.id === client.user.id;

       
        if (ehRespostaAoBot) {
            const canalId = message.channel.id;
            const dadosConversa = memoriaConversa.get(canalId);

            if (dadosConversa) {
                return {
                    respondeuBot: true,
                    contextoReply: `Conversa anterior do bot:\n"${dadosConversa.respostaBot}"`
                };
            }
        }

        return {
            respondeuBot: mensagemOriginal.author.id === client.user.id,
            contextoReply: `Mensagem respondida anteriormente:"${mensagemOriginal.content}"
            Autor original: ${mensagemOriginal.author.username}
            Possui imagem: ${imagemOriginal ? "SIM" : "NAO"}`
        };
    } catch (err) {
        console.log("Erro ao pegar resposta:", err);
        return {
            respondeuBot: false,
            contextoReply: ""
        };
    }
}

function registrarHandlerIA(client) {
    client.on("messageCreate", async (message) => {
        if (message.author.bot) return;

        const botMarcado = message.mentions.has(client.user);
        const { respondeuBot, contextoReply } = await montarContextoReply(message, client);

        if (!botMarcado && !respondeuBot) return;

        try {
            await message.channel.sendTyping();

            const canalId = message.channel.id;
            const historico = [];
            const anexo = message.attachments.first();
            let descricaoImagem = "";

            if (respondeuBot) {
                const dadosConversa = memoriaConversa.get(canalId);
                if (dadosConversa) {
                    historico.push({
                        role: "assistant",
                        content: dadosConversa.respostaBot
                    });
                }
            }

            if (anexo?.contentType?.startsWith("image/")) {
                descricaoImagem = await analisarImagem(anexo.url);
                console.log("imagem:", descricaoImagem);
            }

            const mensagemUsuario = criarConteudoUsuario(
                message,
                contextoReply,
                anexo,
                descricaoImagem
            );

            historico.push({
                role: "user",
                content: mensagemUsuario
            });

            
            console.log(canalId);
            function checarCanal(canalId){

                if (canalId === "1512427448111726602"){
                    return "Canal de animes";
                }else{
                    return "canal qualquer";
                }

            }

            let cacheAnimes = ""

        async function atualizarNoticias() {
            try {
                cacheAnimes = await buscarNoticiasAnime();
                console.log("Notícias atualizadas."); } catch (err) {
                console.error(err);}
            }
            atualizarNoticias()

            cron.schedule("0 * * * *", async () => {cacheAnimes = await buscarNoticiasAnime();});

            console.log("cache:");
            console.log(cacheAnimes);

            const canalAtual = checarCanal();

            const resposta = await deepseek.chat.completions.create({
                model: "deepseek-v4-flash",
                extra_body: {
                    thinking: {
                        type: "enabled"
                    }
                },
                messages: [
                    {
                        role: "system",
                        content: ` ${systemPrompt}
                        canal: ${canalAtual}
                        Contexto Extra Animes: ${contextoExtra}
                        Noticias Atuais de animes: ${cacheAnimes}`
                    },
                    ...historico
                ],
                max_tokens: 700,
                temperature: 0.7
            });

            const mensagemIA = resposta?.choices?.[0]?.message;
            const pensamento = mensagemIA?.reasoning_content || "Pensamentos vazios.";
            const conteudo = mensagemIA?.content?.trim() || "Erro ao gerar resposta.";
            memoriaConversa.set(canalId, {
                respostaBot: conteudo
            });

            const canalPensamentos = client.channels.cache.get(CANAL_PENSAMENTOS_ID);
            if (canalPensamentos) {
                canalPensamentos.send(
                    `Pensamento do sirB&L:\n\n${pensamento.slice(0, 1800)}\n\nA resposta: ${conteudo}`
                );
            }

            await message.reply(conteudo);

        } catch (err) {
            console.error(err);
            message.reply("Paga mais pobre");
        }
    });
}

module.exports = registrarHandlerIA;
