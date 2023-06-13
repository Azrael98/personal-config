import React, { useEffect, useState } from "react";
import { transform } from "./helpers/utils";
import { setValue, store, init } from "./store/globalStore";

//To set the values inside RXJS Store from Outside
export function setStore(key, path, value) {
  setValue(key, path, value);
}

//To get the currentState of the values stored in RXJS
export function getStore() {
  var currentState = {};
  var storeKeys = Array.from(store.keys());
  storeKeys.forEach((key) => {
    const data = store?.get(key)?.getValue();
    currentState = { ...currentState, [key]: data };
  });

  return currentState;
}

export const ConfigRenderer = ({ tree, obj, handlers }) => {
  const [element, setElement] = useState(React.createElement("div"));
  useEffect(() => {
    import("@idfy/lokey-core-components");
    init(obj);
    const getData = () => {
      const value = transform(tree, handlers, obj);
      setElement(value);
    };
    getData();
  }, [tree, obj, handlers]);
  return element;
};
