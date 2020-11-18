const iron_mq = require('iron_mq');
// const imq = new iron_mq.Client();

const imq = new iron_mq.Client({token: "", project_id: "", queue_name: "xe-mq"});


const QueueName="xe-mq"
const queue = imq.queue(QueueName);
module.exports={
    getQueuesList: ()=>{
        return imq.queues(null, function(error, body) {
            console.log('queues:', body)
            return body
        });
    },
    getQueueInfo: ()=>{
        queue.info(function(error, body) {
            console.log('q info:',body)
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
        queue.post({body: params, delay: 0}, function(error, body) {
            console.log('message logged', body)
        });
    },
    Subscribe: async callback => {
        // Setup the receiveMessage parameters
        queue.reserve({timeout:2}, async function(error, body) {
            if(!body)
                return false
                
            console.log('message retrived',body)
            const orderData = JSON.parse(body.body);
            console.log('Order received', orderData);
            await callback(orderData.msg)

            queue.del(body.id, {reservation_id: body.reservation_id}, function(error, body) {
                console.log('reserveed messages deleted')
            });
        });

    }
}

// module.exports.Subscribe({body:"hello from node"});