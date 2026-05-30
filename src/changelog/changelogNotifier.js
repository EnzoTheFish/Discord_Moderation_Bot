const axios = require("axios");

const CANAL_CHANGELOG_ID = "1509193642642903132";

async function pegarUltimoCommit() {
    try {
        const response = await axios.get(
            "https://api.github.com/repos/EnzoTheFish/Discord_Moderation_Bot/commits"
        );

        const commit = response.data[0];

        return {
            mensagem: commit.commit.message,
            autor: commit.commit.author.name
        };
    } catch (err) {
        console.log("Erro em pegar commit:", err);
        return null;
    }
}

function registrarChangelog(client) {
    client.once("ready", async () => {
        const canal = client.channels.cache.get(CANAL_CHANGELOG_ID);

        const enviarChangelog = true;
        if (!enviarChangelog || !canal) return;

        const commit = await pegarUltimoCommit();
        if (!commit) return;

        canal.send(`
// NOVA ATUALIZACAO DO B&L //

Atualizacao: ${commit.mensagem}

Atualizado Pelo Bem Maior.
`);
    });
}

module.exports = registrarChangelog;
