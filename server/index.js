const { Client } = require('pg')
const crypto = require('crypto')
const verify = crypto.createVerify('SHA1')

//const client = new Client({
//  host: 'localhost',
//  database: 'postgres'
//})

const userData = [{ name: 'Tim', publicKey: '3323b07a05000075', privateKey: '395324a4f18c6a58' }]

const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const port = new SerialPort('/dev/tty.wchusbserial1420', { baudRate: 115200 })

let firstCheck = false
let secondCheck = false

var challenge
var page

const parser = new Readline()
port.pipe(parser)

setInterval(() => {
  port.write('K\n')
  console.log('K!')
}, 2000)

port.write('K\n')

parser.on('open', () => console.log('Comm is open!'))

const fn = async () => {
  //await client.connect();
  parser.on('data', line => {
    const results = /<(.*)>/g.exec(line)

    if(!results || !results.length) {
      return
    }

    const result = results[1]

    //CHECK IF IS IBUTTON  
    if (result.length === 16) {
      //client.query('SELECT * FROM Users WHERE public_key = $1;', [result])
      // .then((response) => {
      const element = userData.find(el => { return el.publicKey.toLowerCase() === result.toLowerCase() })
      if (!element) {
        // no results
      } else {
        if(firstCheck) {
          return
        }
        firstCheck = true
        console.log("found match", element)
        // const hash = crypto.createHash('sha1').update(`C^AADC`).digest('HEX')
        page = String.fromCharCode(Math.round(Math.random() * (4 - 0) + 0))
        challenge = Math.random().toString(36).substr(2, 4)
        
        port.write(`C${page}${challenge}\n`)
        //      verify.update(element.privateKey)
        //      if(!verify.verify(result, signature)) {
        // not a valid key
        //        port.write('N\n')
        //      } else {
        //        port.write('A\n')
        //      }
      }
      //  }).catch(console.log)
    } else if (result.length === 105) {
      if(secondCheck) {
        return
      }
      let object = /([0-9A-Fa-f]{64}) ([0-9A-Fa-f]{40})/i.exec(result)
      if (object === undefined || object[1] === undefined || object[2] === undefined) {
    	// If no object could be parsed, we deny access
      	port.write("N\n")
      	return
      }
      let data = object[1]
      let mac = object[2]
      console.log('going to open')
      secondCheck = true
      if (challenge === undefined) {
      // If no challenge was set, we deny access
      	port.write("N\n")
      	return
      }
      var wanted = "" // Here we need to calculate something!
      
      if (mac.toUpperCase() !== wanted.toUpperCase()) {
        // If they do not match, we deny access
      	port.write("N\n")
      	return
      }
      
      
      
      // Remove the challenge
      delete challenge
      //const challenge = result.split(' ')[1]
      // should do second challenge here!
      port.write("A\n")
      setInterval(() => {
        firstCheck = secondCheck = false
      }, 2500)
    }
  })
}

fn()
