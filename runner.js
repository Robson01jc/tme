const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const render = require('./render')

const forbiddenDirs = ['node_modules']

class Runner {
  constructor() {
    this.testFiles = []
  }

  async runTests() {
    for (let file of this.testFiles) {
      console.log(chalk.gray(`---- ${file.shortName}`))
      const beforeEaches = []
      const its = []

      global.render = render
      global.beforeEach = fn => {
        beforeEaches.push(fn)
      }
      global.it = (desc, fn) => {
        its.push({ desc, fn })
      }

      try {
        require(file.name)
        for (let _it of its) {
          const { desc, fn } = _it
          for (let _before of beforeEaches) {
            _before()
          }
          try {
            await fn()
            console.log(chalk.green(`\tOK - ${desc}`))
          } catch (err) {
            const message = err.message.replace(/\n/g, '\n\t\t')
            console.log(chalk.red(`\tX - ${desc}`))
            console.log(chalk.red('\t', message))
          }
        }
      } catch (err) {
        console.log(chalk.red(err))
      }
    }
  }

  async collectFiles(targetPath) {
    const files = await fs.promises.readdir(targetPath)

    for (let file of files) {
      const filepath = path.join(targetPath, file)
      const stats = await fs.promises.lstat(filepath)

      if (stats.isFile() && file.includes('.test.js')) {
        this.testFiles.push({ name: filepath, shortName: file })
      } else if (stats.isDirectory() && !forbiddenDirs.includes(file)) {
        const childFiles = await fs.promises.readdir(filepath)

        files.push(...childFiles.map(f => path.join(file, f)))
      }
    }
  }
}

module.exports = Runner