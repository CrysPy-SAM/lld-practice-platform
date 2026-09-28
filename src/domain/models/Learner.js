const { randomUUID } = require('crypto');

class Learner {
  constructor({ id, name, email }) {
    this.id = id || randomUUID();
    this.name = name;
    this.email = email;
    this.createdAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      createdAt: this.createdAt.toISOString(),
    };
  }
}

module.exports = Learner;
