const gemini = require("./geminiClient");

async function analisarImagem(urlImagem) {

    const resposta = await gemini.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text:
                        "Descreva detalhadamente esta imagem em português."
                    },
                    {
                        fileData: {
                            fileUri: urlImagem
                        }
                    }
                ]
            }
        ]
    });

    return resposta.text;
}

module.exports = analisarImagem;