/* 
 * kio-database module
 * GitHub: https://github.com/kiogia/kio-database
 * Developer: https://t.me/KioGia
 * Copyright (c) 2023, Kio Development.
 * Released under the MIT License.
 */

// Importing modules
import fs from 'fs'
import isInvalidPath from './modules/is-invalid-path.js'


/**
 * Creating database file.kiod 
 * @param {string} path to file 
 * @param {number} time in ms for autosaving
 */
const KioDatabase = class KioDatabase {
  constructor(path, autosaving = 0) {
    // if ( ! isInvalidPath(path))
    //   throw new Error('File path is invalid')
    if ( ! path.endsWith('.kiod'))
      throw new Error('File path must have .kiod extension')
    if ( ! fs.existsSync(path)) 
      fs.writeFileSync(path, JSON.stringify({
        settings: {},
        statistics: {
          createdAt: Date.now(),
          lastEditAt: Date.now(),
          lastSavedAt: Date.now()
        },
        columns: [],
        data: [],
      }))
      
    this.path = path
    this.base = JSON.parse(fs.readFileSync(this.path))
    if (autosaving > 0) 
      setInterval(() => {
        this.base.statistics.lastSavedAt = Date.now()  
        this.#writeToFile()
      }, autosaving)
  }

  #writeToFile() {
    return fs.writeFileSync(this.path, JSON.stringify(this.base))
  }
  
  #conditionChecker(condition) {
    const operators = ['&&', '||', '>', '<', '>=', '<=', '==', '!=']
    const checker = (operator, leftOperand, rightOperand) => {
      switch (operator) {
        case '&&': 
          return leftOperand === rightOperand
        case '||': 
          return leftOperand !== rightOperand
        case '>': 
          return leftOperand > rightOperand
        case '<': 
          return leftOperand < rightOperand
        case '>=': 
          return leftOperand >= rightOperand
        case '>=': 
          return leftOperand >= rightOperand
        case '==': 
          return leftOperand == rightOperand
        case '!=': 
          return leftOperand != rightOperand
        default: 
          throw new Error('[opertaor] must be &&, ||, >, <, >=, <=, == or !=')
      }
    }
    return condition.split(' ').reduce((previousElement, currentElement, index, array) => {
      if (operators.includes(currentElement))
        return previousElement && checker(currentElement, array[index - 1], array[index + 1])
      else 
        return previousElement
    })
  }

  get columns() {
    return this.base.columns
  }

  get columnNames() {
    return this.columns.map((column) => column.name)
  }
  
  get getAll() {
    return this.base.data
  }

  save() {
    this.base.statistics.lastEditAt = Date.now()
    this.base.statistics.lastSavedAt = Date.now()
    return this.#writeToFile()
  }

  column(name) {
    return this.columns[this.columnNames.indexOf(name)] 
  }

  addColumn(name, type = 'string', extra = {}) {
    const base = this.base
    
    if (this.columnNames.includes(name))
      throw new Error('[name] must be unique')
      
    base.columns.push({
      name: name,
      type: type,  
      default: extra.default ?? null,
      unique: extra.unique ?? false
    })

    base.data = base.data.map((row) => {
      row[name] = extra.default ?? null
      return row
    })
    return this
  }

  addColumns(columns) {
    if ( ! Array.isArray(columns))
      throw new Error('[columns] must be array')

    const base = this.base
    columns.forEach(({ name, type = 'string', extra = {} }) => {
      if (this.columnNames.includes(name))
        throw new Error('[name] must be unique')
        
      base.columns.push({
        name: name,
        type: type,  
        default: extra.default ?? null,
        unique: extra.unique ?? false
      })
  
      base.data = base.data.map((row) => {
        row[name] = extra.default ?? null
        return row
      })
    })
    return this
  }

  editColumn(name, data) {
    const base = this.base 
    if ( ! this.column(name))
      throw new Error('Column undefined')
    if (data.name && this.columnNames.includes(data.name))
      throw new Error('Column name must be unique')

    base.data = base.data.map((row) => {
      if (data.default != undefined) {
        if (row[name] == this.column(name).default)
          row[name] = data.default
      }
      if (data.name != undefined) {
        row[data.name] = row[name]
        delete row[name]
      }
      return row
    })
    base.columns.splice(this.columnNames.indexOf(name), 1, Object.assign(this.column(name), data))
    return this
  }

  deleteColumn(name) {
    const base = this.base 
    if ( ! this.column(name))
      throw new Error('Column undefined')
    base.columns.splice(this.columnNames.indexOf(name), 1)
    base.data = base.data.map((row) => { 
      delete row[name]
      return row
    })
    return this
  }
  
  deleteColumns(names) {
    if ( ! Array.isArray(names))
      throw new Error('[names] must be array')
    const base = this.base 
    names.forEach((name) => {
      if ( ! this.column(name))
        throw new Error('Column undefined')
      base.columns.splice(this.columnNames.indexOf(name), 1)
      base.data = base.data.map((row) => { 
        delete row[name]
        return row
      })
    })
    return this
  }

  forEach(callback) {
    return this.base.data.forEach((row, index, array) => callback(row, index, array))
  }

  insert(data) {
    const input = {}
    this.columns.forEach((column) => {
      input[column.name] = column.default 
    })
    Object.keys(data).forEach((columnName) => {
      const column = this.column(columnName)
      if ( ! column)
        throw new Error(column + ' undefined')
      if (column.type != typeof data[columnName]) 
        throw new Error(`${columnName} type must be ${column.type}`)
      if (column.unique)
        if (this.getAll.map((row) => row[columnName]).includes(data[columnName]))
          throw new Error(`${data[columnName]} type must be unique value in ${columnName} column`)
      input[columnName] = data[columnName]
    })
    this.base.data.push(input)
    return this
  }

  delete(conditions) {
    const base = this.base
    conditions = Array.isArray(conditions) ? conditions : [conditions] 
    base.data = base.data.filter((row) => {
      const condition = conditions.map(({ column, operand, operator = '==' }) => {
        return `${row[column]} ${operator} ${operand}`
      }).join(' && ')
      return ! this.#conditionChecker(condition)
    })
    return this
  }

  update(data, conditions) {
    const base = this.base
    const update = {}
    Object.keys(data).forEach((columnName) => {
      const column = this.column(columnName)
      if ( ! column)
        throw new Error(column + ' undefined')
      if (column.type != typeof data[columnName]) 
        throw new Error(`${columnName} type must be ${column.type}`)
      if (column.unique)
        if (this.getAll.map((row) => row[columnName]).includes(data[columnName]))
          throw new Error(`${data[columnName]} type must be unique value in ${columnName} column`)
    })
    
    conditions = Array.isArray(conditions) ? conditions : [conditions] 
    base.data.forEach((row, index) => {
      const condition = conditions.map(({ column, operand, operator = '==' }) => {
        return `${row[column]} ${operator} ${operand}`
      }).join(' && ')
      if (this.#conditionChecker(condition))
        base.data.splice(index, 1, Object.assign(update, data))
    })
    return this
  }

  select(conditions) {
    const base = this.base
    conditions = Array.isArray(conditions) ? conditions : [conditions] 
    const rows = base.data.filter((row) => {
      const condition = conditions.map(({ column, operand, operator = '==' }) => {
        return `${row[column]} ${operator} ${operand}`
      }).join(' && ')
      return this.#conditionChecker(condition)
    })
    return rows
  }
  
  selectByUnique(conditions) {
    const base = this.base
    conditions = Array.isArray(conditions) ? conditions : [conditions] 
    const rows = base.data.filter((row) => {
      const condition = conditions.map(({ column, operand, operator = '==' }) => {
        if ( ! this.column(column))
          throw new Error(column + ' undefined')

        if ( ! this.column(column).unique)
          throw new Error(column + ' must be unique')

        return `${row[column]} ${operator} ${operand}`
      }).join(' && ')
      return this.#conditionChecker(condition)
    })
    return rows[0]
  }

  clear() {
    return this.base.data = []
  }

  /**
   * Creating markdown file with table
   * @param {string} fileName 
   * @param {number} count 
   * @returns this
   */
  toFile(fileName, count = 10) {
    if ( typeof count != 'number')
      throw new Error('[count] must be number')
    
    const markdownTable = ({ titles, rows, maxLength = 0 }) => {
      if ( ! Array.isArray(titles) && ! Array.isArray(rows)) 
        throw new Error('titles and rows must be arrays')
    
      rows = rows.filter((row) => {
        return Array.isArray(row) && row.length == titles.length
      })
    
      let columns = titles.map((title, index) => {
        return rows.map((row) => String(row[index]))
      })
      columns.forEach((column, index) => {
        return columns[index].unshift(titles[index])
      })
    
      columns = columns.map((column) => {
        return column.map((row) => {
          const longestWord = column.reduce((previousWord, currentWord) => {
            return previousWord.length > currentWord.length ? previousWord : currentWord
          }, '')
          const aligned = row + ' '.repeat(longestWord.length - row.length)
          return maxLength == 0 ? aligned : aligned.slice(0, maxLength)
        })
      })
    
      titles = columns.map((column, index) => {
        return columns[index].shift()
      })
    
      const title = ` ${titles.join(' | ')}\n `
      let border = [...titles].map((title) => '-'.repeat(title.length))
    
      let table = title + (border.join(' | ') + '\n ') 
    
      rows = rows.map((row, rowIndex) => {
        return row.map((cell, cellIndex) => {
          return columns[cellIndex][rowIndex]
        }).join(' | ')
      })
      table += rows.join('\n ') + '\n'
      return table
    }

    const context = markdownTable({
      titles: ['Name', 'Type', 'Default', 'Unique'], 
      rows: this.columns.map((column) => {
        return Object.values(column)
      })
    }) + '\n' + markdownTable({
      titles: this.columnNames, 
      rows: this.getAll.slice(0, count).map((row) => {
        return Object.values(row)
      })
    })

    fs.writeFileSync(fileName + '.md', context)
    return this
  }
}



// Export
export { 
  KioDatabase
}
