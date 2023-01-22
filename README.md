# Installing

Just installing module
```bash
$ npm install kio-databse
```

# Quick start

Creating file with 
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

kd.addColumns([{
  name: 'name',
  type: 'string',
  default: 'No Name',
  unique: true
}, {
  name: 'suranme',
  type: 'string',
  unique: true
}])
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

# Classes

## kdatabase

Soon... 

## Visualizer

Soon... 