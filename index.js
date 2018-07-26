const mongoose = require('mongoose');
const Customer = require('./models/customer');
const program = require('commander');

mongoose.Promise = global.Promise;

const db = mongoose.connect('mongodb://localhost:27017/customercli', {
  useMongoClient: true,
});

// Add customer
const addCustomer = (customer) => {
  Customer.create(customer).then(customer => {
    console.info('New customer added');
    db.close();
  })
}

// Find customer
const findCustomer = (name) => {
  const search = new RegExp(name, 'i');
  Customer.find({$or: [
    {firstname: search}, 
    {lastname: search},
  ]}).then(customer => {
    console.table(resultParser(customer));
    console.info(`${customer.length} matches!`);
    db.close();
  });
}

const updateCustomer = (_id, customer) => {
  return console.log('_id', _id);
  Customer.update({ _id }, customer)
    .then(customer => {
      console.info('customer updated!');
      db.close();
    });
}

const removerCustomer = (_id) => {
  Customer.remove({ _id })
    .then(customer => {
      console.info('customer removed!');
      db.close();
    });
}

const listCustomers = () => {
  Customer.find()
    .then(customers => {
      console.table(resultParser(customers));
      console.info(`${customers.length} matches!`);
      db.close();
    })
}

function resultParser(customers) {
  return customers && customers.map(c => ({_id: c._id, firstname: c.firstname, lastname: c.lastname, phone: c.phone})) || [];
}

module.exports = {
  addCustomer,
  findCustomer,
  updateCustomer,
  removerCustomer,
  listCustomers,
}