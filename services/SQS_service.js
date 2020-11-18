const AWS = require('aws-sdk');
// Set the region we will be using

var config = {    
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
  }
  
AWS.config.update(config);

// Create SQS service client
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});

// Replace with your account id and the queue name you setup
const accountId = '182691168502';
const queueName = 'test1';
const queueRegion = 'us-east-1';
const QueueUrl =  `https://sqs.${queueRegion}.amazonaws.com/${accountId}/${queueName}`

module.exports={
    Publish: async msgJSON =>{
        // Setup the sendMessage parameter object
        const params = {
            MessageBody: JSON.stringify({
                // order_id: 1234,
                date: (new Date()).toISOString(),
                msg:msgJSON
            }),
            QueueUrl: QueueUrl
        };
        sqs.sendMessage(params, (err, data) => {
            if (err) {
            console.log("Error", err);
            } else {
            console.log("Successfully added message", data.MessageId);
            }
        });
    },
    Subscribe: callback => {
        // Setup the receiveMessage parameters
        const params = {
            QueueUrl: QueueUrl,
            MaxNumberOfMessages: 10,
            VisibilityTimeout: 0,
            WaitTimeSeconds: 0
        };
        sqs.receiveMessage(params, async (err, data) => {
            console.log(data)
            if (err) {
            console.log(err, err.stack);
            } else {
            if (!data.Messages) { 
                console.log('Nothing to process'); 
                return;
            }
            const orderData = JSON.parse(data.Messages[0].Body);
            console.log('Order received', orderData);
            await callback(orderData.msg)
            // orderData is now an object that contains order_id and date properties
            // Lookup order data from data storage
            // Execute billing for order
            // Update data storage
            // Now we must delete the message so we don't handle it again
            const deleteParams = {
                QueueUrl: QueueUrl,
                ReceiptHandle: data.Messages[0].ReceiptHandle
            };
            sqs.deleteMessage(deleteParams, (err, data) => {
                if (err) {
                console.log(err, err.stack);
                } else {
                console.log('Successfully deleted message from queue');
                }
            });
            }                                                                                                                                              
        });
    }
}
