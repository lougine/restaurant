const mongoose = require('mongoose');

const collections = new Map();

function recordsFor(name) {
  if (!collections.has(name)) collections.set(name, new Map());
  return collections.get(name);
}

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function sameValue(actual, expected) {
  if (actual instanceof Date || expected instanceof Date) {
    return new Date(actual).getTime() === new Date(expected).getTime();
  }
  if (typeof actual === 'number' || typeof expected === 'number') {
    return Number(actual) === Number(expected);
  }
  return String(actual) === String(expected);
}

function matches(document, filter = {}) {
  return Object.entries(filter).every(([key, expected]) => {
    const actual = document[key];
    if (expected && typeof expected === 'object' && !Array.isArray(expected) && !(expected instanceof Date)) {
      if ('$in' in expected) return expected.$in.some((entry) => sameValue(actual, entry));
      return Object.entries(expected).every(([operator, value]) => operator === '$in' && value.some((entry) => sameValue(actual, entry)));
    }
    return sameValue(actual, expected);
  });
}

function makeDocument(name, input, timestamps = true) {
  const now = new Date();
  const defaults = name === 'User'
    ? { role: 'customer' }
    : name === 'MenuItem'
      ? { imageUrl: '', description: '', tag: '', ingredients: [], allergens: [], isAvailable: true }
      : name === 'Order'
        ? { fulfillment: 'table', status: 'pending' }
        : {};
  const document = {
    ...defaults,
    ...clone(input),
    _id: input._id || new mongoose.Types.ObjectId().toString(),
  };

  if (timestamps) {
    document.createdAt = document.createdAt || now;
    document.updatedAt = document.updatedAt || now;
  }

  Object.defineProperty(document, 'save', {
    enumerable: false,
    value: async function save() {
      this.updatedAt = new Date();
      recordsFor(name).set(String(this._id), this);
      return this;
    },
  });

  Object.defineProperty(document, 'toJSON', {
    enumerable: false,
    value: function toJSON() {
      const result = {};
      Object.entries(this).forEach(([key, value]) => { result[key] = clone(value); });
      return result;
    },
  });

  return document;
}

class MemoryQuery {
  constructor(name, execute) {
    this.name = name;
    this.execute = execute;
    this.sortSpec = null;
    this.projection = null;
    this.includePassword = false;
  }

  sort(spec) {
    this.sortSpec = spec;
    return this;
  }

  select(spec) {
    this.projection = String(spec);
    this.includePassword = this.projection.includes('+password');
    return this;
  }

  lean() {
    return this;
  }

  async resolve() {
    let result = await this.execute();
    if (Array.isArray(result) && this.sortSpec) {
      const sortKeys = Object.entries(this.sortSpec);
      result = [...result].sort((left, right) => {
        for (const [key, direction] of sortKeys) {
          const a = left[key];
          const b = right[key];
          const comparison = a instanceof Date || b instanceof Date
            ? new Date(a).getTime() - new Date(b).getTime()
            : String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true });
          if (comparison) return comparison * direction;
        }
        return 0;
      });
    }

    const project = (document) => {
      if (!document) return document;
      const value = document.toJSON ? document.toJSON() : clone(document);
      if (this.projection && !this.projection.startsWith('+')) {
        const fields = this.projection.split(/\s+/).filter((field) => field && !field.startsWith('-'));
        const omitId = this.projection.includes('-_id');
        const projected = Object.fromEntries(fields.filter((field) => field in value).map((field) => [field, value[field]]));
        if (!omitId && '_id' in value) projected._id = value._id;
        return projected;
      }
      if (this.name === 'User' && !this.includePassword) delete value.password;
      return value;
    };

    return Array.isArray(result) ? result.map(project) : project(result);
  }

  then(resolve, reject) {
    return this.resolve().then(resolve, reject);
  }

  catch(reject) {
    return this.resolve().catch(reject);
  }
}

function model(name) {
  const records = recordsFor(name);

  return {
    find(filter = {}) {
      return new MemoryQuery(name, () => [...records.values()].filter((document) => matches(document, filter)));
    },
    findOne(filter = {}) {
      return new MemoryQuery(name, () => [...records.values()].find((document) => matches(document, filter)) || null);
    },
    findByIdAndUpdate(id, update = {}) {
      return new MemoryQuery(name, () => {
        const document = records.get(String(id));
        if (!document) return null;
        Object.entries(update).forEach(([key, value]) => {
          if (value !== undefined) document[key] = clone(value);
        });
        document.updatedAt = new Date();
        records.set(String(document._id), document);
        return document;
      });
    },
    async create(input) {
      const document = makeDocument(name, input);
      if (name === 'Reservation') {
        const duplicate = [...records.values()].some((existing) =>
          sameValue(existing.date, document.date)
          && sameValue(existing.timeSlot, document.timeSlot)
          && sameValue(existing.tableNumber, document.tableNumber));
        if (duplicate) {
          const error = new Error('Duplicate reservation slot');
          error.code = 11000;
          throw error;
        }
      }
      records.set(String(document._id), document);
      return document;
    },
    async insertMany(inputs, options = {}) {
      return inputs.map((input) => {
        const document = makeDocument(name, input, options.timestamps !== false);
        records.set(String(document._id), document);
        return document;
      });
    },
    async countDocuments(filter = {}) {
      return [...records.values()].filter((document) => matches(document, filter)).length;
    },
    async estimatedDocumentCount() {
      return records.size;
    },
    async aggregate() {
      if (name !== 'Order') return [];
      const popular = new Map();
      [...records.values()].forEach((order) => {
        (order.items || []).forEach((item) => {
          const key = String(item.name || '').toLowerCase();
          if (!popular.has(key)) popular.set(key, { _id: key, name: item.name, quantity: 0 });
          popular.get(key).quantity += Number(item.quantity || 0);
        });
      });
      return [...popular.values()].sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name));
    },
  };
}

module.exports = { model };
