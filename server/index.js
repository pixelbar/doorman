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
const port = new SerialPort('/dev/cu.wchusbserial1440', { baudRate: 115200 })

let firstCheck = false
let secondCheck = false

let challenge, page, element

const parser = new Readline({ delimiter: '\r\n' })
port.pipe(parser)

setInterval(() => {
  port.write('K\n')
  console.log('K!')
}, 2000)

port.write('K\n')

parser.on('open', () => console.log('Comm is open!'))

const reset = () => {
  // setTimeout(() => {
    firstCheck = false
    secondCheck = false
    element = null
    challenge = null
  // }, 1000)
}

const fn = async () => {
  //await client.connect();
  parser.on('data', line => {
    const results = /<(.*)>/g.exec(line)
    if(!results) return
    const result = results[1]

    //CHECK IF IS IBUTTON  
    if (result.length === 16) {
      //client.query('SELECT * FROM Users WHERE public_key = $1;', [result])
      // .then((response) => {
      element = userData.find(el => { return el.publicKey.toLowerCase() === result.toLowerCase() })
      if (!element) {
        // no results
        reset()
      } else {
        if(firstCheck) {
          reset()
          return
        }
        firstCheck = true
        // const hash = crypto.createHash('sha1').update(`C^AADC`).digest('H/EX')

        page = String.fromCharCode(Math.round(Math.random() * (4 - 0) + 0))
        challenge = Math.random().toString(36).substr(2, 3)
        
        port.write(`C${page}${challenge}\n`)
      }
    } else if (result.length === 105) {
      if(secondCheck) {
        reset()
        return
      }
      let object = /([0-9A-Fa-f]{64}) ([0-9A-Fa-f]{40})/i.exec(result)
      if (object === undefined || object[1] === undefined || object[2] === undefined) {
    	  // If no object could be parsed, we deny access
      	port.write("N\n")
      	return
      }
      
      const data = object[1]
      const mac = object[2]
      
      secondCheck = true
      if (!challenge) {
        // If no challenge was set, we deny access
        port.write("N\n")
        reset()
      	return
      }

      console.log(data, mac)
      
      // my $wanted = read_mac($id, $secret, $page, $data, $challenge);

      var wanted = "" // Here we need to calculate something!

      // const verify = crypto.createVerify('sha1')
      // verify.update(element.privateKey)
      // verify.end()
      // console.log('YYAAAAAY', verify.verify(element.publicKey, result))
      
      if (mac.toUpperCase() !== wanted.toUpperCase()) {
        // If they do not match, we deny access
        console.log('no match')
        port.write("N\n")
        reset()
      	return
      }

      // second extended challenge?
      port.write("A\n")
      reset()
    }
  })
}

fn()
