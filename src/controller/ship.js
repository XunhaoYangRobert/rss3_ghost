const Base = require('./base.js');
const RSS3 = require('rss3').default;
const fs = require('fs');
const createHTML = require('create-html');
const axios = require('axios');
const FormData = require('form-data');

module.exports = class extends Base {
    async indexAction() {
        let pk = this.query("pk");
        let blog = this.post("post");
        let filename = blog.current.uuid;
        let _rss3;
        try {
            _rss3 = new RSS3({
                endpoint: 'https://hub.rss3.io',
                privateKey: pk,
            });
        } catch (err) {
            return this.fail(err);
        }
        let style = "body,html{margin:0;padding:0}body{font-size:18px}main{max-width:673px;margin:40px auto;padding:0 20px}hr{height:1px}h1,h2,h3,h4,h5,h6{font-weight:600;line-height:1.4}h1{font-size:28px}h2{font-size:24px}h3{font-size:22px}h4{font-size:18px}h5{font-size:16px}h6{font-size:14px}li ol,li ul{margin:0 20px}li{margin:20px 0}ul{list-style-type:disc}ol{list-style-type:decimal}ol ol{list-style:upper-alpha}ol ol ol{list-style:lower-roman}ol ol ol ol{list-style:lower-alpha}audio,img,video{display:block;max-width:100%;margin:0 auto}audio{width:100%}blockquote{margin-left:20px;margin-right:20px;color:#5f5f5f}header{margin-bottom:40px}header h1{font-size:32px}header figure.byline{font-size:16px;margin:0}header figure.byline *+*{padding-left:10px}header figure.byline time{color:#b3b3b3}header figure.byline [ref=source]::before{content:'';border-left:1px solid currentColor;padding-left:10px}article>*{margin-top:20px;margin-bottom:24px}article a{border-bottom:1px solid currentcolor;text-decoration:none;padding-bottom:2px}article p{line-height:1.8}"
        let headHtml = `
        <meta name="description" content="${blog.current.custom_excerpt}">
        <meta property="og:title" content="${blog.current.title}">
        <meta property="og:description" content="${blog.current.custom_excerpt}">
        <meta name="twitter:title" content="${blog.current.title}">
        <meta name="twitter:description" content="${blog.current.custom_excerpt}">
        <style>
        </style>
        `
        let bodyHtml = `
        <main>
            <header>
                <h1 itemprop="headline">${blog.current.title}</h1>
                <figure class="byline">
                    <author>${blog.current.authors[0].name}</author>
                    <time>${blog.current.published_at}</time>
                </figure>
            </header>
            <article>
                ${blog.current.html}
            </article>
        </main>
        `
        var html = createHTML({
            title: blog.current.title,
            head: headHtml,
            body: bodyHtml,
        })
        fs.writeFile('temp/' + filename + '.html', html, function (err) {
            if (err) console.log(err)
        });
        var data = new FormData();
        let htmlfile = fs.createReadStream('temp/' + filename + '.html')
        data.append('file', htmlfile)
        let postIpfs = await axios.post("https://ipfs.infura.io:5001/api/v0/add", data, {
            headers: data.getHeaders(),
            auth: {
                username: "1uvdaOinj827yXYp9fIGqaXV759",
                password: "51d876449baaeffb8fcc0d36e1b225e8"
            },
        });
        let postRSS3 = await _rss3.item.post({
            title: blog.current.title,
            tags: [
                'ghost'
            ],
            summary: blog.current.plaintext.substring(0, 280),
            contents: [{
                address: ['https://ipfs.infura.io/ipfs/' + postIpfs.data.Hash],
                mime_type: "text/html"
            }]
        });
        if (!postRSS3) {
            this.fail('Gen RSS3 Failed')
        }
        let res = await _rss3.persona.sync();
        if (res) {
            this.success(res);
        }
    }
};
