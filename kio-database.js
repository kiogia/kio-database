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

// File structure 
const structure = {
  settings: {},
  columns: {},
  statistics: {},
  data: [],
}

const visualizeTable = ({ titles, rows, maxLength = 0 }) => {
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

  const title = ` ${titles.join(' │ ')}\n`
  const border = '─'.repeat(title.length)

  let table = (border + '\n') + title + (border + '\n ') 

  rows = rows.map((row, rowIndex) => {
    return row.map((cell, cellIndex) => {
      return columns[cellIndex][rowIndex]
    }).join(' │ ')
  })
  table += rows.join('\n ') + ('\n' + border)
  return table
}

const coloredVisualizeTable = ({ titles, rows, maxLength = 0 }, 
  colors = { 
    title: 'green', 
    border: 'blue'
   }) => {
  const style = (style, text) => {
    const styles = {
      bold: 1,
      dim: 2,
      italic: 3,
      underline: 4,
      inverse: 7,
      hidden: 8,
      strikethrough: 9,
      black: 30,
      red: 31,
      green: 32,
      yellow: 33,
      blue: 34,
      magenta: 35,
      cyan: 36,
      white: 37,
      gray: 39
    }
    return '\x1b[' + styles[style] + 'm' + text + '\x1b[0m'
  }

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
    return column.map((cell) => {
      const longestWord = column.reduce((previousWord, currentWord) => {
        return previousWord.length > currentWord.length ? previousWord : currentWord
      }, '')
      let aligned = cell + ' '.repeat(longestWord.length - cell.length)
      return maxLength == 0 ? aligned : aligned.slice(0, maxLength)
    })
  })

  titles = columns.map((column, index) => {
    return columns[index].shift()
  })
  
  const titleLength = ` ${titles.join(' │ ')}\n`.length
  titles = titles.map((title) => {
    return style(colors.title, style('bold', title))
  })
  const title = ` ${titles.join(style(colors.border, ' │ '))}\n`
  const border = style(colors.border, '─'.repeat(titleLength))

  let table = (border + '\n') + title + (border + '\n ')
  rows = rows.map((row, rowIndex) => {
    return row.map((cell, cellIndex) => {
      return columns[cellIndex][rowIndex]
    }).join(style(colors.border, ' │ '))
  })
  table += rows.join('\n ') + ('\n' + border)
  return table
}


/**
 * Creating database file.kiod 
 * @param {string} path to file 
 */
const KioDatabase = class KioDatabase {
  constructor(path) {
    if ( ! isInvalidPath(path))
      throw new Error('File path is invalid')
    if ( ! path.endsWith('.kiod'))
      throw new Error('The path must be to a file with a .kiod extention')
    if ( ! fs.existsSync(path)) 
      fs.writeFileSync(path, JSON.stringify(structure))
      
    this.path = path
  }

  get #get() {
    return JSON.parse(fs.readFileSync(this.path))
  }

  #set(json) {
    return fs.writeFileSync(this.path, JSON.stringify(json, null, 2))
  }

  #isStr(data) {
    return typeof data == 'string' ? '"' + data + '"' : data
  }

  get columns() {
    return this.#get.columns
  }

  addColumn(name, type, extra = {}) {
    const base = this.#get
    base.columns[name] = {
      type: type,  
      default: extra.default ?? null,
      unique: extra.unique ?? false
    }
    base.data = base.data.map((row) => {
      row[name] = extra.default ?? null
      return row
    })
    this.#set(base)
    return this
  }

  addColumns(columns) {
    if ( ! Array.isArray(columns))
      throw new Error('columns must be array')

    const base = this.#get
    columns.forEach(({ name, type, extra = {} }) => {
      base.columns[name] = {
        type: type, 
        default: extra.default ?? null,
        unique: extra.unique ?? false
      }
      base.data = base.data.map((row) => {
        row[name] = extra.default ?? null
        return row
      })
    })
    this.#set(base)
    return this
  }

  deleteColumn(name) {
    const base = this.#get 
    delete base.columns[name]
    base.data.forEach((row) => { 
      delete row[name] 
    })
    this.#set(base)
    return this
  }
  
  deleteColumns(names) {
    if ( ! Array.isArray(names))
      throw new Error('names must be array')
    const base = this.#get 
    names.forEach((name) => {
      delete base.columns[name]
      base.data.forEach((row) => { 
        delete row[name] 
      })
    })
    this.#set(base)
    return this
  }

  get getAll() {
    return this.#get.data
  }

  forEach(callback) {
    return this.#get.data.forEach((row, index, array) => callback(row, index, array))
  }

  insert(data) {
    const base = this.#get
    const input = {}
    Object.keys(base.columns).forEach((column) => {
      input[column] = base.columns[column].default 
    })
    Object.keys(data).forEach((columnName) => {
      const column = base.columns[columnName]
      if (column == undefined)
        throw new Error(column + ' undefined')
      if (column.type != typeof data[columnName]) 
        throw new Error(`${columnName} type must be ${column.type}`)
      if (column.unique)
        if (this.getAll.map((row) => row[columnName]).includes(data[columnName]))
          throw new Error(`${data[columnName]} type must be unique value in ${columnName} column`)
      input[columnName] = data[columnName]
    })
    base.data.push(input)
    this.#set(base)
    return this
  }

  delete(conditions) {
    const base = this.#get
    conditions = Array.isArray(conditions) ? conditions : [conditions] 
    base.data = base.data.filter((row) => {
      const connectedConditions = conditions.map(({ column, operand, operator = '==' }) => {
        if ( ! ['>', '<', '>=', '<=', '==', '!=', '===', '!=='].includes(operator))
          throw new Error('opertaor must be >, <, >=, <=, ==, !=, === or !==')
        return this.#isStr(row[column]) + operator + this.#isStr(operand)
      })
      return ! eval(connectedConditions.join('&&'))
    })
    this.#set(base)
    return this
  }

  update(data, conditions) {
    const base = this.#get
    const update = {}
    Object.keys(data).forEach((columnName) => {
      const column = base.columns[columnName]
      if (column == undefined)
        throw new Error(column + ' undefined')
      if (column.type != typeof data[columnName]) 
        throw new Error(`${columnName} type must be ${column.type}`)
      if (column.unique)
        if (this.getAll.map( row => row[columnName]).includes(data[columnName]))
          throw new Error(`${data[columnName]} type must be unique value in ${columnName} column`)
      update[columnName] = data[columnName]
    })
    conditions = Array.isArray(conditions) ? conditions : [conditions] 
    const indexes = base.data.map((row, index) => {
      const connectedConditions = conditions.map(({ column, operand, operator = '==' }) => {
        if ( ! ['>', '<', '>=', '<=', '==', '!=', '===', '!=='].includes(operator))
          throw new Error('opertaor must be >, <, >=, <=, ==, !=, === or !==')
        return this.#isStr(row[column]) + operator + this.#isStr(operand)
      })
      if ( ! eval(connectedConditions.join('&&')))
        return index
    })
    indexes.forEach((index) => {
      base.data.splice(index, 1, update)
    })
    this.#set(base)
    return this
  }

  select(conditions) {
    const base = this.#get
    conditions = Array.isArray(conditions) ? conditions : [conditions] 
    const rows = base.data.filter((row) => {
      const connectedConditions = conditions.map(({ column, operand, operator = '==' }) => {
        if ( ! ['>', '<', '>=', '<=', '==', '!=', '===', '!=='].includes(operator))
          throw new Error('opertaor must be >, <, >=, <=, ==, !=, === or !==')
        return this.#isStr(row[column]) + operator + this.#isStr(operand)
      })
      return eval(connectedConditions.join('&&'))
    })
    return rows
  }
  
  selectByUnique(conditions) {
    const base = this.#get
    conditions = Array.isArray(conditions) ? conditions : [conditions] 
    const rows = base.data.filter((row) => {
      const connectedConditions = conditions.map(({ column, operand, operator = '==' }) => {
        if (base.columns[column] == undefined)
          throw new Error(column + ' undefined')

        if ( ! base.columns[column].unique)
          throw new Error(column + ' must be unique')

        if ( ! ['>', '<', '>=', '<=', '==', '!=', '===', '!=='].includes(operator))
          throw new Error('opertaor must be >, <, >=, <=, ==, !=, === or !==')
        return this.#isStr(row[column]) + operator + this.#isStr(operand)
      })
      return ! eval(connectedConditions.join('&&'))
    })
    return rows[0]
  }
}

/**
 * Vizulize kio-database tables
 * @param  {...any} args 
 */
const Visualizer = class Visualizer extends KioDatabase {
  constructor (...args) {
    super(...args)
  }

  /**
   * Getting information about columns in table format
   * @param {boolean} colored 
   * @returns columns information
   */
  visualizeColumns(colored = false) {
    const columns = super.columns
    return (colored ? coloredVisualizeTable : visualizeTable)({
      titles: ['name', 'type', 'default', 'unique'], 
      rows: Object.keys(columns).map((column) => {
        return [column, ...Object.values(columns[column])]
      })
    })
  }

  /**
   * Getting rows in table format
   * @param {number} count 
   * @param {boolean} colored 
   * @returns rows
   */
  visualizeRows(count = 10, colored = false) {
    if ( typeof count != 'number')
      throw new Error('count must be number')
    return (colored ? coloredVisualizeTable : visualizeTable)({
      titles: Object.keys(super.columns), 
      rows: super.getAll.slice(0, count).map((row) => {
        return Object.values(row)
      })
    })
  }
}


// Export
export default { 
  Visualizer,
  KioDatabase
}
