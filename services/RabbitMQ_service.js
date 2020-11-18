const amqp = require('amqplib/callback_api');

const CONN_URL = 'amqps://XXXXXXXXXX:XXXXXXXXXXXX--7x0N@fox.rmq.cloudamqp.com/atfrwruq';
const queueName='xe-queue'

module.exports={
    Publish: async msgJSON =>{
        amqp.connect(CONN_URL, function (err, conn) {
            conn.createChannel(function (err, ch) {
               

                // Setup the sendMessage parameter object
                const params = JSON.stringify({
                    // order_id: 1234,
                    date: (new Date()).toISOString(),
                    msg:msgJSON
                });        
                
                // queue message with options
                ch.sendToQueue(queueName,  Buffer.from(params));
                console.log(" [x] Sent %s", params);
            });        
        });
         
    },
    Subscribe: async callback => {

        amqp.connect(CONN_URL, function (err, conn) {
            conn.createChannel(function (err, ch) {               
                ch.consume(queueName,  async (msg)=> {
                    // console.log(msg.length)
                    if(!msg.content)
                        return 0;
                    // console.log('.....');
                    // setTimeout(function(){
                    //   console.log("Message:", msg.content.toString());
                    // },4000);            
                    const orderData = JSON.parse(msg.content.toString());
                    console.log('Order received', orderData);
                    await callback(orderData.msg)
                    },{ noAck: true }
                  );
            });        
        });
        
    
    }
}

// module.exports.Publish({body:"hello from node"});
// module.exports.Subscribe();