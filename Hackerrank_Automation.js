let fs=require("fs");
const { url } = require("inspector");
let puppeteer= require("puppeteer");
let args=process.argv.slice(2);

let configJSON=fs.readFileSync(args[0],"utf-8");
let configJSO=JSON.parse(configJSON);

// let browserKaPromise=puppeteer.launch({headless: false});
// browserKaPromise.then(function(browser){
//     let pagesKaPromise=browser.pages();
//     pagesKaPromise.then(function(pages){
//         let pagesOpenKaPromise=pages[0].goto(args[1]);
//         pagesOpenKaPromise.then(function(){
//             let browserClosekaPromise=browser.close();
//             browserClosekaPromise.then(function(){
//                 console.log("Browser closed");
//             })
//         })
//     })
// })
async function run(){
let browser=await puppeteer.launch({
    headless: false,
    args:[
        '--start-maximized'
    ],
    defaultViewport:null
});


let pages=await browser.pages();
let page=pages[0];


await page.goto(args[1]);
// first login
await page.waitForSelector("a[data-event-action='Login']");
await page.click("a[data-event-action='Login']");

//second login
await page.waitForSelector("a[href='https://www.hackerrank.com/login']");
await page.click("a[href='https://www.hackerrank.com/login']");

//type Username
await page.waitForSelector("input[name='username']");
await page.type("input[name='username']",configJSO.userid,{delay:50});

//type password
await page.waitForSelector("input[name='password']");
await page.type("input[name='password']",configJSO.password,{delay:50});

//login
await page.waitForSelector("button[data-analytics='LoginPassword']");
await page.click("button[data-analytics='LoginPassword']");

//click on compete
await page.waitForSelector("a[data-analytics='NavBarContests']");
await page.click("a[data-analytics='NavBarContests']");

//click on manage contests
await page.waitForSelector("a[href='/administration/contests/']");
await page.click("a[href='/administration/contests/']");

await page.waitForSelector("a[data-attr1='Last']");
let numPages=await page.$eval("a[data-attr1='Last']",function(aTags){
    let totPages=parseInt(aTags.getAttribute("data-page"));
    return totPages;
});


for(let i=1;i<=numPages;i++)
{
    await handleContests(browser,page);
    if(i!=numPages)
    {
        await page.waitForSelector("a[data-attr1='Right']");
        await page.click("a[data-attr1='Right']");
    }
}
}


async function handleContests(browser,page)
{
    await page.waitForSelector("a.backbone.block-center");
    let curls=await page.$$eval("a.backbone.block-center",function(atags){
        let urls=[];
        for(let i=0;i<atags.length;i++)
        {
            let url=atags[i].getAttribute("href");
            urls.push(url);
        }
        return urls;
    });
    
    for(let i=0; i < curls.length;i++)
    {
        console.log(args[1]+curls[i]);
        let ctab= await browser.newPage();
        await saveModerator(ctab,args[1]+curls[i],configJSO.moderator);
        await ctab.close();
        await page.waitFor(3000);
    } 
}

async function saveModerator(ctab,fullcurl,moderator)
{
    console.log(fullcurl);
    await ctab.bringToFront();
    await ctab.goto(fullcurl);
    await ctab.waitFor(3000);

    await ctab.waitForSelector("li[data-tab='moderators']");
    await ctab.click("li[data-tab='moderators']");

    await ctab.waitForSelector("input#moderator");
    await ctab.type("input#moderator", moderator, { delay: 50 });

    await ctab.keyboard.press("Enter");
}
run();

// Runtime Command: node Hackerrank_Automation.js config.json "https://www.hackerrank.com"