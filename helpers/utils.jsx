import * as _ from "lodash";
import { createElement } from "react";
import Connector from "../src/Connector";
import { store } from "../store/globalData";


//Creates Element according to the given tree
export const getElement = (node, handlers, connectedAttrs) => {
  return createElement(
    node.name,
    {
      ...node.attrs,
      ...connectedAttrs,
      ..._.fromPairs(
        _.map(node.handlers, (handlerValue, handlerKey) => [
          handlerKey,
          _.get(handlers, handlerValue),
        ])
      ),
    },
    Array.isArray(node.children) 
      ? _.map(node.children, (i) => {
        if (i.repeating?.status) {
          let repeatingElements = [];
          if (_.isString(i.repeating?.data)) {
            repeatingElements = repeatingStore(i, handlers);
            return repeatingElements;
          } else {
            repeatingElements = repeatingLocal(i, handlers);
            return repeatingElements;
          }
        } else return transform(i, handlers);
      })
      : `${node.children}`
  );
};


// Interpolates the bindings 
const interpolate = (str, obj) =>
  str.replace(/\${([^}]+)}/g, (_, prop) => obj[prop]);


// Handles the repeating nodes
function repeatNodes(node, data, context, cb) {
  const bindings = node.bindings;
  _.map(bindings, (bindingValue, bindingKey) => {
    const path = interpolate(bindingValue.split('::')[1], context);
    cb(node, bindingKey, data, path);
  })

  node.children = _.isArray(node.children)
    ? _.map(node.children, (childNode) => repeatNodes(childNode, data, context, cb)
    ) : node.children
  return node
}

function repeatingLocal(i, handlers) {
  let repeatingElements = [];
  const dataStore = i.repeating.data
  dataStore.forEach((_data, index) => {
    let tempNode = _.cloneDeep(i);
    tempNode = repeatNodes(tempNode, dataStore, { index }, (node, bindingKey, data, path) =>
      _.set(
        node,
        bindingKey === "children" ? bindingKey : `attrs.${bindingKey}`,
        _.get(data, path)
      )
    )
    repeatingElements.push(transform(tempNode, handlers));
  })
  return repeatingElements;
}

function repeatingStore(i, handlers) {
  let repeatingElements = [];
  const [storeName, path] = i.repeating.data.split("::");
  const dataArray = store.get(storeName).getValue()[path];
  dataArray.forEach((_data, index) => {
    let tempNode = _.cloneDeep(i);
    tempNode = repeatNodes(tempNode, storeName, { index }, (node, bindingKey, data, path) =>
      _.set(node, `bindings.${bindingKey}`, `${data}::${path}`)
    )
    repeatingElements.push(transform(tempNode, handlers));
  })
  return repeatingElements;
}

//Checks whether given node has binding or not, if it does then the given nodes gets wrapped inside a wrapper named Component
export function transform(node, handlers) {
  if (node.bindings && Object.keys(node.bindings).length > 0) {
    return createElement(Connector, { node, handlers });
  } else return getElement(node, handlers);
}
