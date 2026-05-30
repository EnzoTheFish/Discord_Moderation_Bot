const palavrasProibidas = (process.env.BLACKLIST || "")
    .split(",")
    .map((palavra) => palavra.trim().toLowerCase())
    .filter(Boolean);

const whitelist = (process.env.WHITELIST || "")
    .split(",")
    .map((palavra) => palavra.trim().toLowerCase())
    .filter(Boolean);

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

const gifAviso = "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Y3R1NGNlc2dldnYxYXNibXN3MDIyaGx2OGt6dTFnZm9nMzVyazh3eSZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/MIgBsF1vsfoliVCn1x/giphy.gif";

function gerarRegex(palavras) {
    if (!palavras.length) return null;

    const patterns = palavras.map((palavra) => {
        return palavra
            .toLowerCase()
            .split("")
            .map((letra) => equivalencias[letra] || `[${letra}]+`)
            .join("[^\\p{L}\\p{N}]*");
    });

    return new RegExp(`\\b(?:${patterns.join("|")})\\b`, "iu");
}

function registrarModeracao(client) {
    const regex = gerarRegex(palavrasProibidas);

    if (regex) {
        console.log(regex);
    }

    client.on("messageCreate", async (message) => {
        if (message.author.bot || !regex) return;

        const texto = message.content.toLowerCase();
        const palavrasMensagem = texto.split(/\s+/);

        const detectou = palavrasMensagem.some((palavra) => {
            if (whitelist.includes(palavra)) return false;
            return regex.test(palavra);
        });

        console.log(texto);

        if (!detectou) return;

        console.log("Mensagem original:", message.content, "autor: ", message.author);

        const aviso = await message.reply({
            content: `Perai ai po ${message.author} KKKKKKK\nLinguagem impropria detectada Pelo Senhor B&L.`,
            files: [gifAviso]
        });

        setTimeout(async () => {
            try {
                await message.delete();
            } catch (err) {
                console.log("Nao consegui deletar a mensagem.");
            }
        }, 4000);

        setTimeout(async () => {
            try {
                await aviso.delete();
            } catch (err) {}
        }, 7000);
    });
}

module.exports = registrarModeracao;
