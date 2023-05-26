import { useEffect, useState, useRef } from "react";
import _ from "lodash";
import { getValue, setValue, subscribe, unsubscribe } from "../store/globalData";
import { getElement } from "../helpers/utils";

const Connector = ({node, handlers, bindings}) => {
  const [attrs, setter] = useState({});
  const [children, setChildren] = useState(node.children);
  const subscribed = useRef({});

  useEffect(() => {
    const updateAttributes = () => {
      const pathAttrMap = _.invert(bindings);
      const childBoundProps = _.keys(bindings);

      const groups = _.uniq(
        _.map(childBoundProps, (curr) =>
          bindings[curr].split("::")[0]
        )
      );

      const toBeUnsubscribed = _.differenceBy(
        _.keys(subscribed.current),
        groups
      );

      _.forEach(toBeUnsubscribed, (key) => {
        unsubscribe(subscribed.current[key]);
        delete subscribed.current[key];
      });

      _.forEach(groups, (key) => {
        if (!subscribed.current[key]) {
          subscribed.current[key] = subscribe(key, {
            next: (value) => {
              setter((prevAttrs) =>
                _.reduce(
                  pathAttrMap,
                  (prev, attribute, path) => {
                    const [storeKey, storePath] = path.split("::");
                    const newValue = getValue(storeKey, storePath);
                    if (storeKey === key && attribute !== "children") {
                      _.set(prev, attribute, newValue);
                    }

                    if (storeKey === key && attribute === "children") {
                      setChildren(newValue);
                    }

                    return prev;
                  },
                  { ...prevAttrs }
                )
              );
            },
          });
        }
      });
    };

    updateAttributes();
  }, [bindings]);

  const childRef = useRef();
  useEffect(() => {
    const handlePropChange = (e) => {
      const propName = e.detail.key;
      if (propName) {
        const [store, path] = bindings[propName].split("::");
        setValue(store, path, e.detail.value);
      }
    };

    childRef.current.addEventListener("prop-change", handlePropChange);

    return () => {
      childRef.current.removeEventListener("prop-change", handlePropChange);
    };
  }, []);

  if (attrs?.hidden === false) delete attrs.hidden;

  return getElement({ ...node, children: children }, handlers, {
    ...attrs,
    ref: childRef,
  });
};

export default Connector;
