# Installing

Just installing module
```bash
$ npm install kio-databаse
```

# Quick start

Creating file with .kiod extention
```js
import { KioDatabase } from 'kio-database'
const kd = new KioDatabase('example.kiod')
```

Adding table columns
```js
kd.addColumn('id', 'number', {
  unique: true
})

// or multi-adding columns

kd.addColumns([
  {
    name: 'id',
    type: 'number',
    unique: true
  }, {
    name: 'name',
    type: 'string',
    default: 'No Name'
  }, {
    name: 'surname'
  }
])
```

Insert, update and delete data from table 
```js
// inserting into table
kd.insert({
  id: 12345,
  name: 'Kio',
  surname: 'gia'
})

// updating columns where "id" == 12345
kd.update({
  surname: 'Gia'
}, {
  column: 'id',
  operand: 12345
}) 

// delete columns where "name" != Kio
kd.delete({
  column: 'name',
  operator: '!=',
  operand: 'Kio'
})
```

Getting data
```js
// selecting rows where "name" == Kio
kd.select({
  column: 'name',
  operand: 'Kio'
})
// returns [] 

// or selecting rows where unique column "id" == 12345
kd.selectByUnique({
  column: 'id',
  operand: 12345
})
// returns {} or undefined

// forEach loop 
kd.forEach((row, rowIndex, rows) => {
  // some operation
})

// or select all rows 
kd.getAll
// returns []
```

## Table visualize with markdown file
```js
kd.toFile('my-database')
```
