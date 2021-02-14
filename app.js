const csvtojson = require("csvtojson");
const parse = require("node-html-parser").parse;
const fs = require('fs');
const scrape = require('website-scraper');

async function readFile() {
    const path = './csv/websites.csv';
    const sites = await csvtojson().fromFile(path);
    return sites
}

async function getHtmlSite(site) {
    let root;
    if (site.path.includes('http')) {
        root = await getHtmlSiteByHttp(site);
    } else {
        root = site.path;
    }

    return new Promise((resolve, reject) => {
        fs.readFile(root, 'utf8', function(err, data) {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}

async function getHtmlSiteByHttp(site) {
    const options = {
        urls: [site.path],
        directory: __dirname + '/sites/downloads/' + site.name,
        sources: [
            { selector: 'html', attr: 'src' }
        ]
    };
    await scrape(options);
    return (__dirname + '/sites/downloads/' + site.name + '/index.html');
}

async function printDependencies(html, sitename) {
    let htmlParse = await parse(html);
    let htmlElements = htmlParse.querySelectorAll('script');
    console.log('\x1b[36m%s\x1b[0m', `******** ${sitename} -> ${html.length} bytes ********`);
    htmlElements.forEach(element => {
        if (element.attributes.src) {
            let indexSlash = element.attributes.src.lastIndexOf("/");
            let indexJs = element.attributes.src.indexOf(".js");
            if (indexJs !== -1) {
                let name = element.attributes.src.slice(indexSlash + 1, indexJs + 3);
                console.log(name);
                name in frequencies ? frequencies[name]++ : frequencies[name] = 1;
            }
        }
    });
}

async function getDependencies(sites) {
    await Promise.all(
        sites.map(async site => {
            let htmlSite = await getHtmlSite(site);
            await printDependencies(htmlSite, site.name);
        })
    )
}

async function printFrequency() {
    console.log('\x1b[36m%s\x1b[0m', `******** Frequency ********`);
    console.log(frequencies)
}

async function deleteFiles() {
    fs.rmdir(__dirname + "/sites/downloads/", { recursive: true }, (err) => {
        if (err) throw err;
    });
}

async function analyze() {
    const sites = await readFile();
    await getDependencies(sites);
    await printFrequency();
    await deleteFiles();
}

let frequencies = [];
analyze();