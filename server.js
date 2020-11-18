'use strict';
require('dotenv').config();

const express = require('express');
const puppeteer = require('puppeteer-core');
const {accountSid,authToken,twilioNumber,sendToNumber,autoRun,currency_from,currency_to,currency_amount,WORKER_TYPE,MQ_SERVICE}= require('./config')


const client = require('twilio')(accountSid, authToken);
const PORT = 3000;
const HOST = '0.0.0.0';

var ServiceFile
// "redis","sqs","ironmq","imbmq","rabbitmq","gcppubsub"
switch(MQ_SERVICE){
  case "redis":
    ServiceFile='./services/Redis_service'
  break;
  case "sqs":
    ServiceFile='./services/SQS_service'
  break;
  case "ironmq":
    ServiceFile='./services/IronMQ_service'
  break;
  case "imbmq":
    ServiceFile='./services/IBMMQ_service'
  break;
  case "rabbitmq":
    ServiceFile='./services/RabbitMQ_service'
  break;
  case "gcppubsub":
    ServiceFile='./services/GCPPubSub_service'
  break;
}
console.log(ServiceFile)
const {Publish,Subscribe} =require(ServiceFile)
//SQS Service 
// const {Publish,Subscribe} =require('./services/SQS_service')
//Redis Service 


// App
const app = express();
let appServer


async function scrap(from='eur',to='usd',amount=1) {
  // Launch the browser
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_BIN || null,
    args: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage'],
    headless: true,
    ignoreHTTPSErrors: true
  });
  
  // Create an instance of the page
  const page = await browser.newPage();
  // Go to the web page that we want to scrap
  console.log('go to page: ',`https://www.xe.com/currencyconverter/convert/?Amount=${amount}&From=${from}&To=${to}`)
  await page.goto(`https://www.xe.com/currencyconverter/convert/?Amount=${amount}&From=${from}&To=${to}`);

  // Here we can select elements from the web page
  const data = await page.evaluate(() => {
    const equal = document.querySelector(
      "#currencyConverter .converterresult-conversionTo .converterresult-toAmount"
    ).innerText;
    const fromCurrency = document.querySelector(
        "#currencyConverter .converterresult-conversionFrom > span:nth-child(2)"
    ).innerText;
    const toCurrency = document.querySelector(
        "#currencyConverter .converterresult-conversionTo .converterresult-toCurrency"
    ).innerText;
    // This object will be stored in the data variable
    console.log(equal,fromCurrency,toCurrency)
    return {
        equal,
        fromCurrency,
        toCurrency,
    };
  });

  
  // Here we can do anything with this data

  // We close the browser
  await browser.close();
  return data
}

//App Route
app.get('/alert/:from/:to/:amount', async(req, res) => {
  console.log(req.params)
  let result=await scrap(req.params.from,req.params.to,req.params.amount);
  let alertMsg=`XE Currency Alert: ${req.params.amount} ${req.params.from}/${req.params.to} = ${result.equal}`
  queueMsg(alertMsg);
  res.send(result);
  appServer.close();
  return 0;
});

//App Route
app.get('/worker', async(req, res) => {
  console.log(req.params)
  proccessQueue()
  // res.send(result);
  appServer.close();
  return 0;
});


async function proccessQueue() {
  console.log('worker proccess message queue')
  Subscribe(async (msg)=>{
    return await client.messages
      .create(msg)
      .then(message =>(message))
      .catch(err =>{
          //console.log(err)
          return err
      })
  })
  // res.send(result);
    
}

async function queueMsg(msg) {
  console.log('queue message')
  //queue message
  await Publish(
    {
          body: msg,
          from: twilioNumber,
          to: `+${sendToNumber}`
    }
  )
   
}


const run = async()=>{
  console.log('run')
  if(WORKER_TYPE=='pub'){
   
    let result=await scrap(currency_from,currency_to,currency_amount);
    let alertMsg=`XE Currency Alert: ${currency_amount} ${currency_from}/${currency_to} = ${result.equal}`
    queueMsg(alertMsg);
    console.log("message queued : ",alertMsg," - to number: ",sendToNumber)  
    return 0;
 
  }

  if(WORKER_TYPE=='sub'){
    proccessQueue()
    return 0;
  }
}
console.log("autoRun:",autoRun)
if(autoRun=='true' || autoRun==true ){
  console.log('atuo run')
  run()
}else{
  appServer= app.listen(PORT, HOST);
  console.log(`Running on http://${HOST}:${PORT}`);
}

// "dependencies": {
//   "@google-cloud/pubsub": "^2.6.0",
//   "aws-sdk": "^2.788.0",
//   "dotenv": "^8.2.0",
//   "express": "^4.17.1",
//   "ibmmq": "^0.9.15",
//   "iron_mq": "^0.9.3",
//   "iron_worker": "^0.1.8",
//   "node-cron": "^2.0.3",
//   "redis-message-queue": "^1.0.2",
//   "rsmq": "^0.12.2",
//   "twilio": "^3.49.4"
// },