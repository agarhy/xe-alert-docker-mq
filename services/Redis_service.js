var rmq = require("redis-message-queue");

const config={
    queueName:"xe-MQ",
    host:"redis-11841.c13.us-east-1-3.ec2.cloud.redislabs.com",
    port:"11841",
    password:""
}



var normalQueue = new rmq.NormalQueue(config.queueName, config.port, config.host,{password:config.password});


module.exports={
    SelectDB: ()=>{
        normalQueue.select(config.queueName, function() {
            console.log("db select success");
        });
    },

    Publish: async msgJSON =>{
        // Setup the sendMessage parameter object
        const params = JSON.stringify({
                // order_id: 1234,
                date: (new Date()).toISOString(),
                msg:msgJSON
            });        
              
        // queue message with options
        normalQueue.push(params, function(err) {
            console.log(err);
        });
    },
    Subscribe: async callback => {
        // Setup the receiveMessage parameters
        normalQueue.get(async function(err, messages) {
            console.log(err);
            if(messages.length){
                console.log(messages[0]);
                try{
                console.log('message retrived',messages[0])
                const orderData = JSON.parse(messages[0]);
                console.log('Order received', orderData);
                await callback(orderData.msg)
                }catch(err){
                    console.log(err)
                }
                normalQueue.removeAmount(function(err) {
                    console.log(err);
                });
            }
           
        });

    }
}

// module.exports.Publish({body:"hello from node"});
// module.exports.Subscribe();