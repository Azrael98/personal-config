import { useEffect, useState, useRef } from "react";
import _ from "lodash";
import { getValue, setValue, subscribe } from "../store/globalData";
import { getElement } from "../helpers/utils";

const Connector = (props) => {
  const [attrs, setter] = useState({});
  const [children, setChildren] = useState(props.node.children);
  const [bindings, setBindings] = useState(props.node.bindings)
  const subscribed = useRef({});

  useEffect(() => {
    console.log("props.node.bindings changed:", bindings);
    // Rest of the code
    const updateAttributes = () => {
      const pathAttrMap = _.invert(bindings); // Get the latest pathAttrMap
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
        subscribed.current[key].unsubscribe();
        delete subscribed.current[key];
      });

      _.forEach(groups, (key) => {
        if (!subscribed.current[key]) {
          const subscription = subscribe(key, {
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
          subscribed.current[key] = subscription;
        }
      });
    };

    updateAttributes();
  }, [bindings]);

  const childRef = useRef();
  useEffect(() => {
    childRef.current.addEventListener("prop-change", (e) => {
      const propName = e.detail.key;
      if (propName) {
        const [store, path] = bindings[propName].split("::");
        setValue(store, path, e.detail.value);
      }
    });
  }, [props]);

  if (attrs?.hidden === false) delete attrs.hidden;

  return getElement({ ...props.node, children: children }, props.handlers, {
    ...attrs,
    ref: childRef,
  });
};

export default Connector;
