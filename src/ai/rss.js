const Parser = require("rss-parser");
const parser = new Parser();

async function buscarNoticiasAnime() {

    try {

    const feeds = [
    "https://www.animenewsnetwork.com/all/rss.xml",
    "https://myanimelist.net/rss/news.xml",
    "https://anitrendz.net/news/feed/",
    "https://cr-news-api-service.prd.crunchyrollsvc.com/v1/en-US/rss"
        ]

    const noticias = [];

    for (const url of feeds) {

    const feed = await parser.parseURL(url);

        noticias.push(
            ...feed.items.slice(0, 5)
            .map((item, i) =>  `${i + 1}. ${item.title}`)
        );
        console.log("funçao buscar:")
        console.log(JSON.stringify(noticias, null, 2));
    }
        return noticias;
    } catch (err) {

        console.error(err);

        return "Erro ao buscar notícias.";
    }
}

module.exports = buscarNoticiasAnime;