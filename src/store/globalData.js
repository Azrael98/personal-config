import { BehaviorSubject } from "rxjs";

import * as _ from "lodash";

export var store = new Map();

const functionMap = {
  equals: (storeName, args) => args[0] === getValue(storeName, args[1]),

  not: (storeName, args) => {
    const data = !getValue(storeName, args[1]);

    return data;
  },

  notEquals: (storeName, args) => !functionMap["equals"](storeName, args),
};

export function init(data) {
  _.forEach(data, (value, key) => {
    return create(key, value);
  });
}

export function create(key, paths) {
  if (store.has(key)) {
    const obj = store.get(key).getValue();

    store.get(key).next({ ...obj, ...paths });
  } else {
    store.set(key, new BehaviorSubject({ ...paths }));
  }
}

export function getValue(storeName, path) {
  if (_.startsWith(path, "F|")) {
    const functionName = path.split("|")[1];
    const others = path.split("|")[2];
    const args = others.split(",");
    return functionMap[functionName](storeName, args);
  }

  return _.get(store.get(storeName).getValue(), path);
}

export function setValue(storeName, path, value) {
  const bs = store.get(storeName);

  const v = {
    ...bs.getValue(),
  };

  _.set(v, path, value);

  bs.next(v);
}

export function subscribe(storeName, subscriber) {
  if (store.has(storeName)) {
    return store.get(storeName).subscribe(subscriber);
  }
}

export function unsubscribe(storeName, subscriber) {
  store.get(storeName).unsubscribe();
}
