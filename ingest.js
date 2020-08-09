const parse = require('csv-parse')
const fs = require('fs')

const file = `${process.cwd()}/data.csv`
const SKIP_LINES = 6

const output = []
let count = 0

fs.createReadStream(file)
.pipe(parse())
.on('readable', function(){
  while(record = this.read()){
    if(count > SKIP_LINES){
      output.push(translateRecord(record))
    }
    count++
  }
})
.on('end', function(){
  console.log(output)
})

const translateRecord = (record) => {
  let result = new Array(record.length)
  for (let i = 0; i < record.length; i++){
    if(i == 0){
      result[i] = new Date(record[i])
    }
    else{
      result[i] = Number(record[i])
    }
  }
  return result
}