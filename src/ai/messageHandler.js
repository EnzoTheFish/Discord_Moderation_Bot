const deepseek = require("./deepseekClient");
const systemPrompt = require("./systemPrompt");
const responseI = require("./geminiImage");

const memoriaCanais = new Map();
const CANAL_PENSAMENTOS_ID = "1510323342677246204";

function criarConteudoUsuario(message, contextoReply, anexo) {
    const partes = [
        `Usuario: ${message.author.username}`,
        contextoReply,
        `Mensagem:\n${message.content || "(sem texto)"}`
    ];

    if (anexo?.contentType?.startsWith("image/")) {
        partes.push(
            "Imagem enviada: SIM",
            `Tipo da imagem: ${anexo.contentType}`,
            `URL da imagem: ${anexo.url}`
        );
    } else if (anexo) {
        partes.push(
            "Anexo enviado: SIM",
            `Tipo do anexo: ${anexo.contentType || "desconhecido"}`,
            `URL do anexo: ${anexo.url}`
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
        const imagemOriginal = mensagemOriginal.attachments.first();

        return {
            respondeuBot: mensagemOriginal.author.id === client.user.id,
            contextoReply: `Mensagem respondida anteriormente:
"${mensagemOriginal.content}"

Autor original:
${mensagemOriginal.author.username}
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

            if (!memoriaCanais.has(canalId)) {
                memoriaCanais.set(canalId, []);
            }

            const historico = memoriaCanais.get(canalId);
            const anexo = message.attachments.first();


            historico.push({
                role: "user",
                content: criarConteudoUsuario(message, contextoReply, anexo)
            });

            console.log(anexo);
            console.log(anexo?.contentType);
            console.log(anexo?.url);

             if(anexo.url){

                anexo = responseI?.choices?.[0]?.message;

            }

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

            console.log(JSON.stringify(resposta, null, 2));

            const mensagemIA = resposta?.choices?.[0]?.message;
            const pensamento = mensagemIA?.reasoning_content || "0 Pensamentos na cabeca.";

            const canalPensamentos = client.channels.cache.get(CANAL_PENSAMENTOS_ID);
            if (canalPensamentos) {
                canalPensamentos.send(`Pensamento do sirB&L:\n\n${pensamento.slice(0, 1800)}
\n\n A resposta: ${mensagemIA?.content?.trim() || "(sem resposta)"}`);
            }

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
}

module.exports = registrarHandlerIA;
module.exports = anexo;
