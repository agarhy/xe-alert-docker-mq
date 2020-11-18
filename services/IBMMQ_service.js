// Import the MQ package
var mq = require('ibmmq');

const IBM_CONFIG={
  QueueManager:"xeQueueManager",
  QueueName:"DEV.QUEUE.1",
  ChannelName:"CLOUD.ADMIN.SVRCONN",
  ConnectionName:"xequeuemanager-4b00.qm.eu-gb.mq.appdomain.cloud:31195",
  UserID:"",
  UserPassword:"",
}
var MQC = mq.MQC; // Want to refer to this export directly for simplicity

// The queue manager to be used.
// The queue manager and queue to be used. These can be overridden on command line.
var qMgr = IBM_CONFIG.QueueManager;
var qName = IBM_CONFIG.QueueName;
var hConn;




// The program starts here.
// Connect to the queue manager.
// console.log("Sample AMQSCONN.JS start");

// Create default MQCNO structure
var cno = new mq.MQCNO();

// Add authentication via the MQCSP structure
var csp = new mq.MQCSP();
csp.UserId = IBM_CONFIG.UserID;
csp.Password = IBM_CONFIG.UserPassword;
// Make the MQCNO refer to the MQCSP
// This line allows use of the userid/password
cno.SecurityParms = csp;

// And use the MQCD to programatically connect as a client
// First force the client mode
cno.Options |= MQC.MQCNO_CLIENT_BINDING;
// And then fill in relevant fields for the MQCD
var cd = new mq.MQCD();
cd.ConnectionName = IBM_CONFIG.ConnectionName;
cd.ChannelName = IBM_CONFIG.ChannelName;
// Make the MQCNO refer to the MQCD
cno.ClientConn = cd;


function sleep(ms) {
  return new Promise(resolve=>{
    setTimeout(resolve,ms);
  });
}

function formatErr(err) {
  return  "MQ call failed in " + err.message;
}

function toHexString(byteArray) {
  return byteArray.reduce((output, elem) =>
    (output + ('0' + elem.toString(16)).slice(-2)),
    '');
}



// MQ V9.1.2 allows setting of the application name explicitly
if (MQC.MQCNO_CURRENT_VERSION >= 7) {
  cno.ApplName = "Node.js 9.1.2 ApplName";
}

// // Now we can try to connect
// mq.Connx(qMgr, cno, function(err,conn) {
//   if (err) {
//     console.log(formatErr(err));
//   } else {
//     console.log("MQCONN to %s successful ", qMgr);
//     // Sleep for a few seconds - bad in a real program but good for this one
//     sleep(3 *1000).then(() => {
//       mq.Disc(conn, function(err) {
//         if (err) {
//           console.log(formatErr(err));
//         } else {
//           console.log("MQDISC successful");
//         }
//       });
//     });
//   }
// });

// The program really starts here.
// Connect to the queue manager. If that works, the callback function
// opens the queue, and then we can put a message.

console.log("Sample AMQSPUT.JS start");

// // Get command line parameters
// var myArgs = process.argv.slice(2); // Remove redundant parms
// if (myArgs[0]) {
//   qName = myArgs[0];
// }
// if (myArgs[1]) {
//   qMgr  = myArgs[1];
// }

// var cno = new mq.MQCNO();
// cno.Options = MQC.MQCNO_NONE; // use MQCNO_CLIENT_BINDING to connect as client
// Import any other packages needed
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');

function printBody(format,buf,len) {
  if (format=="MQSTR") {
    console.log(JSON.parse(decoder.write(buf.slice(0,len))))
    console.log("message len=%d <%s>", len,decoder.write(buf.slice(0,len)));
  } else {
    console.log("binary message: " + buf);
  }
}


module.exports={
  cleanup: (hConn,hObj) =>{
    mq.Close(hObj, 0, function(err) {
      if (err) {
        console.log(formatErr(err));
      } else {
        console.log("MQCLOSE successful");
      }
      mq.Disc(hConn, function(err) {
        if (err) {
          console.log(formatErr(err));
        } else {
          console.log("MQDISC successful");
        }
      });
    });
  },
  Publish: async (msgJSON) =>{
    mq.Connx(qMgr, cno, function(err,hConn) {
      if (err) {
        console.log(formatErr(err));
      } else {
        console.log("MQCONN to %s successful ", qMgr);
   
        // Define what we want to open, and how we want to open it.
        var od = new mq.MQOD();
        od.ObjectName = qName;
        od.ObjectType = MQC.MQOT_Q;
        var openOptions = MQC.MQOO_OUTPUT;
        mq.Open(hConn,od,openOptions,function(err,hObj) {
          if (err) {
            console.log(formatErr(err));
          } else {
            console.log("MQOPEN of %s successful",qName);
            module.exports.putMessage(hObj,msgJSON);
          }
          module.exports.cleanup(hConn,hObj);
        });
      }
   });
  },
  putMessage: async (hObj,msgJSON) =>{
    var msg = JSON.stringify(msgJSON)

    var mqmd = new mq.MQMD(); // Defaults are fine.
    var pmo = new mq.MQPMO();
  
    // Describe how the Put should behave
    pmo.Options = MQC.MQPMO_NO_SYNCPOINT |
                  MQC.MQPMO_NEW_MSG_ID |
                  MQC.MQPMO_NEW_CORREL_ID;
  
    mq.Put(hObj,mqmd,pmo,msg,function(err) {
      if (err) {
        console.log(formatErr(err));
      } else {
        console.log("MsgId: " + toHexString(mqmd.MsgId));
        console.log("MQPUT successful");
      }
    });
  },
  Subscribe: callback => {
    mq.Connx(qMgr, cno, function(err,hConn) {
      if (err) {
        console.log(formatErr(err));
      } else {
        console.log("MQCONN to %s successful ", qMgr);
   
        // Define what we want to open, and how we want to open it.
        var od = new mq.MQOD();
        od.ObjectName = qName;
        od.ObjectType = MQC.MQOT_Q;
        var openOptions = MQC.MQOO_INPUT_AS_Q_DEF;
        mq.Open(hConn,od,openOptions,function(err,hObj) {
          if (err) {
            console.log(formatErr(err));
          } else {
            console.log("MQOPEN of %s successful",qName);
            module.exports.getMessage(hObj,callback);
          }
          module.exports.cleanup(hConn,hObj);
        });
      }
   });
  },
  getMessage: (hObj,callback) => {
    console.log('ggg')
    var buf = Buffer.alloc(1024);
    var hdr;
    var mqmd = new mq.MQMD();
    var gmo = new mq.MQGMO();

    gmo.Options = MQC.MQGMO_NO_SYNCPOINT |
                  MQC.MQGMO_NO_WAIT |
                  MQC.MQGMO_CONVERT |
                  MQC.MQGMO_FAIL_IF_QUIESCING;


    mq.GetSync(hObj,mqmd,gmo,buf, async function(err,len) {
      if (err) {
        if (err.mqrc == MQC.MQRC_NO_MSG_AVAILABLE) {
          console.log("no more messages");
        } else {
          console.log(formatErr(err));
        }
        ok = false;
      } else {
        var format = mqmd.Format;
        console.log('format ' ,format)
        var orderData=''
        switch (format) {
        case MQC.MQFMT_RF_HEADER_2:
          hdr   = mq.MQRFH2.getHeader(buf);
          var props = mq.MQRFH2.getProperties(hdr,buf);
          console.log("RFH2 HDR is %j",hdr);
          console.log("Properties are '%s'",props);
          // printBody(hdr.Format,buf.slice(hdr.StrucLength),len-hdr.StrucLength);

          
          orderData = JSON.parse(decoder.write(buf.slice(hdr.StrucLength).slice(0,len-hdr.StrucLength)));
          console.log('Order received', orderData);
          await callback(orderData.msg)

          break;
        case MQC.MQFMT_DEAD_LETTER_HEADER:
          hdr = mq.MQDLH.getHeader(buf);
          console.log("DLH HDR is %j",hdr);
          printBody(hdr.Format,buf.slice(hdr.StrucLength),len-hdr.StrucLength);
          
          orderData = JSON.parse(decoder.write(buf.slice(hdr.StrucLength).slice(0,len-hdr.StrucLength)));
          console.log('Order received', orderData);
          await callback(orderData.msg)

          break;
        default:
          printBody(format,buf,len);

          orderData = JSON.parse(decoder.write(buf.slice(0,len)));
          console.log('Order received', orderData);
          await callback(orderData.msg)
          
          break;
        }
      }
    });
  }
}

// module.exports.Publish({body:"Hello from Node at " , date: new Date()})
// module.exports.Subscribe();
