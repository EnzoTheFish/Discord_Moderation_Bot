const deepseek = require("./deepseekClient");
const systemPrompt = require("./systemPrompt");
const analisarImagem = require("./geminiImage");

// Agora a memória salva APENAS a última resposta do bot por canal
// Assim, se o usuário responder ao bot, temos contexto da conversa anterior
const memoriaConversa = new Map();
const CANAL_PENSAMENTOS_ID = "1510323342677246204";

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

        // Se a mensagem é resposta ao bot, busca a última conversa salva
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

        // Se não é resposta ao bot, apenas pega o contexto da mensagem respondida
        return {
<<<<<<< HEAD
            respondeuBot: mensagemOriginal.author.id === client.user.id,
            contextoReply: `Mensagem respondida anteriormente:"${mensagemOriginal.content}"
            Autor original: ${mensagemOriginal.author.username}
            Possui imagem: ${imagemOriginal ? "SIM" : "NAO"}`
=======
            respondeuBot: false,
            contextoReply: `Mensagem respondida:\n"${mensagemOriginal.content}"\nAutor: ${mensagemOriginal.author.username}`
>>>>>>> 65108c20ca149367473e69a809df46fecf30b7e2
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

        // Só responde se:
        // 1. O bot foi mencionado
        // 2. OU o usuário está respondendo a uma mensagem do bot
        if (!botMarcado && !respondeuBot) return;

        try {
            await message.channel.sendTyping();

            const canalId = message.channel.id;
            const historico = [];
            const anexo = message.attachments.first();
            let descricaoImagem = "";

            // Se o usuário está respondendo ao bot, adiciona a resposta anterior ao contexto
            if (respondeuBot) {
                const dadosConversa = memoriaConversa.get(canalId);
                if (dadosConversa) {
                    historico.push({
                        role: "assistant",
                        content: dadosConversa.respostaBot
                    });
                }
            }

            // Analisa imagem se houver
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
                        content: systemPrompt
                    },
                    ...historico
                ],
                max_tokens: 700,
                temperature: 0.7
            });

            const mensagemIA = resposta?.choices?.[0]?.message;
            const pensamento = mensagemIA?.reasoning_content || "Pensamentos vazios.";
            const conteudo = mensagemIA?.content?.trim() || "Erro ao gerar resposta.";

            // Salva a resposta do bot para contexto futuro (only se for reply ao bot)
            memoriaConversa.set(canalId, {
                respostaBot: conteudo
            });

            // Canal de pensamentos
            const canalPensamentos = client.channels.cache.get(CANAL_PENSAMENTOS_ID);
            if (canalPensamentos) {
                canalPensamentos.send(
                    `Pensamento do sirB&L:\n\n${pensamento.slice(0, 1800)}\n\nA resposta: ${conteudo}`
                );
            }

            await message.reply(conteudo);

        } catch (err) {
            console.error(err);
            message.reply("Erro ao processar. Tente novamente.");
        }
    });
}

module.exports = registrarHandlerIA;
