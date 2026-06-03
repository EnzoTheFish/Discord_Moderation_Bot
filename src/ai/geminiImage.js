const gemini = require("./geminiClient");
const axios = require("axios");

async function baixarImagem(urlImagem) {
    const resposta = await axios.get(urlImagem, {
        responseType: "arraybuffer"
    });

    return Buffer.from(resposta.data).toString("base64");
}

async function analisarImagem(urlImagem, contentType = "image/png") {
    const imagemBase64 = await baixarImagem(urlImagem);

    const resposta = await gemini.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text:
                        "Descreva com detalhes esta imagem em portugues para outro agente de IA seja preciso e direto em sua descrição."
                    },
                    {
                        inlineData: {
                            mimeType: contentType,
                            data: imagemBase64
                        }
                    }
                ]
            }
        ]
    });

    return resposta.text;
}

module.exports = analisarImagem;
