const {PubSub} = require('@google-cloud/pubsub');

projectId = 'deft-medium-295815'; // Your Google Cloud Platform project ID
topicName = 'my-topic'; // Name for the new topic to create
subscriptionName = 'my-sub'; // Name for the new subscription to create

  
  
async function quickstart(
    projectId = 'deft-medium-295815', // Your Google Cloud Platform project ID
    topicName = 'my-topic', // Name for the new topic to create
    subscriptionName = 'my-sub' // Name for the new subscription to create
  ) {
  

    // Instantiates a client
  const pubsub = new PubSub({projectId});
  console.log(pubsub)

   // Creates a new topic
   const [topic] = await pubsub.createTopic(topicName);
   console.log(`Topic ${topic.name} created.`);
  
   // Creates a subscription on that new topic
   const [subscription] = await topic.createSubscription(subscriptionName);
    // Creates a client; cache this for further use.
    const subClient = new pubsub.SubscriberClient();
   
    // // Receive callbacks for new messages on the subscription
    // subscription.on('message', message => {
    //   console.log('Received message:', message.data.toString());
    //   process.exit(0);
    // });
   
    // // Receive callbacks for errors on the subscription
    // subscription.on('error', error => {
    //   console.error('Received error:', error);
    //   process.exit(1);
    // });
   
    
  }

  // quickstart()

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
        // Send a message to the topic
       topic.publish(Buffer.from(JSON.stringify(msgJSON)));
    },
    Subscribe: async callback => {

       // The subscriber pulls a specified number of messages.
        const [response] = await subClient.pull(request);

        // Process the messages.
        const ackIds = [];
        for (const message of response.receivedMessages) {
          console.log(`Received message: ${message.message.data}`);
          ackIds.push(message.ackId);
        }

        // Acknowledge all of the messages. You could also ackknowledge
        // these individually, but this is more efficient.
        const ackRequest = {
          subscription: formattedSubscription,
          ackIds: ackIds,
        };
        await subClient.acknowledge(ackRequest);

        console.log('Done.');


        // Setup the receiveMessage parameters
        // queue.reserve({timeout:2}, async function(error, body) {
        //     if(!body)
        //         return false
                
        //     console.log('message retrived',body)
        //     const orderData = JSON.parse(body.body);
        //     console.log('Order received', orderData);
        //     await callback(orderData.msg)

        //     queue.del(body.id, {reservation_id: body.reservation_id}, function(error, body) {
        //         console.log('reserveed messages deleted')
        //     });
        // });

    }
}


module.exports.publish({body:"Hi there"})