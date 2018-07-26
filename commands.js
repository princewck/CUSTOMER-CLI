#!/usr/bin/env node
const program = require('commander');
const { 
  addCustomer, 
  findCustomer, 
  updateCustomer,
  removerCustomer,
  listCustomers,
} = require('./index');
const { prompt } = require('inquirer');

const questions = [
  {
    type: 'input',
    name: 'firstname',
    message: 'customer first name:'
  },
  {
    type: 'input',
    name: 'lastname',
    message: 'customer last name:'
  },
  {
    type: 'input',
    name: 'phone',
    message: 'customer phone number:'
  },
  {
    type: 'input',
    name: 'email',
    message: 'customer email address:'
  },
]



program
  .version('1.0.0')
  .description('Client Management System.')


// program
//   .command('add <firstname> <lastname> <phone> <email>')
//   .alias('a')
//   .description('add a customer')
//   .action((firstname, lastname, phone, email) => {
//     console.log(firstname, lastname, phone, email);
//     addCustomer({ firstname, lastname, phone, email });
//   });

program
  .command('add')
  .alias('a')
  .description('add a customer')
  .action((() => {
    prompt(questions).then(answers => addCustomer(answers));
  }));

program
// .command('update <_id>')
.command('update')
.parseExpectedArgs(['<_id>', '<_name>'])
.alias('u')
.description('update a customer')
.option('-l,--loglevel <level>', '设定日志级别')
.usage(' <id> -l DEBUG')
.action(((_id, _name, {loglevel}) => {
  console.log(_id, _name, loglevel);
  prompt(questions).then(answers => updateCustomer(_id, answers));
}));

program
.command('remove <_id>')
.alias('rm')
.description('remove a customer')
.action(((_id) => {
  removerCustomer(_id);
}));

program
  .command('find <name>')
  .alias('f')
  .description('find a customer')
  .action((name) => {
    findCustomer(name);
  });

program
  .command('list')
  .alias('l')
  .description('list all customers')
  .action(() => {
    listCustomers();
  })

program.parse(process.argv);
