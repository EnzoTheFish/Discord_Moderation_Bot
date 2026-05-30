const gemini = require("./geminiClient");
const anexo = require("./messageHandler");
const prompt = "Voce deve ver e descrever com precisão o que contem na imagem";
const image = anexo;

const responseI = await gemini.chat.create({
    model: "gemini-3.5-flash",
    contents=[image, prompt],
    config: {
      thinkingConfig: {
        thinkingLevel: "MEDIUM",
      },
    },
  });

  console.log(JSON.stringify(responseI, null, 2));


  module.exports = responseI;