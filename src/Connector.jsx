import { useEffect, useState, useRef } from "react";
import _ from "lodash";
import { getValue, setValue, subscribe } from "./store/globalStore";
import { getElement } from "./helpers/utils";

const Connector = (props) => {
  const [attrs, setter] = useState({});
  const [children, setChildren] = useState(props.node.children);
  const subscribed = useRef({});

  useEffect(() => {
    const pathAttrMap = _.invert(props.node.bindings);
    const childBoundProps = _.keys(props.node.bindings);

    const groups = _.uniq(
      _.map(childBoundProps, (curr) => props.node.bindings[curr].split("::")[0])
    );

    const toBeUnsubscribed = _.differenceBy(_.keys(subscribed.current), groups);

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
  }, [props]);

  const childRef = useRef();
  useEffect(() => {
    childRef.current.addEventListener("prop-change", (e) => {
      const propName = e.detail.key;
      if (propName) {
        const [store, path] = props.node.bindings[propName].split("::");
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


