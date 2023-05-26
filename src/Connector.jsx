import { useEffect, useState, useRef } from "react";
import _ from "lodash";
import { getValue, setValue, subscribe, unsubscribe } from "../store/globalData";
import { getElement } from "../helpers/utils";

const Connector = (props) => {
  const [attrs, setter] = useState({});
  const [children, setChildren] = useState(props.node.children);
  const subscribed = useRef({});
  const bindingsChanged = useRef(false);

  const updateAttributes = () => {
    const pathAttrMap = _.invert(props.node.bindings);
    const childBoundProps = _.keys(props.node.bindings);

    const groups = _.uniq(
      _.map(childBoundProps, (curr) => props.node.bindings[curr].split("::")[0])
    );

    const toBeUnsubscribed = _.differenceBy(_.keys(subscribed.current), groups);

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

  useEffect(() => {
    if (bindingsChanged.current) {
      updateAttributes();
      bindingsChanged.current = false;
    }
  }, [props.node.bindings]);

  useEffect(() => {
    bindingsChanged.current = true;
  }, [props.node.bindings]);

  const childRef = useRef();
  useEffect(() => {
    const handlePropChange = (e) => {
      const propName = e.detail.key;
      if (propName) {
        const [store, path] = props.node.bindings[propName].split("::");
        setValue(store, path, e.detail.value);
      }
    };

    childRef.current.addEventListener("prop-change", handlePropChange);

    return () => {
      childRef.current.removeEventListener("prop-change", handlePropChange);
    };
  }, []);

  if (attrs?.hidden === false) delete attrs.hidden;

  return getElement({ ...props.node, children: children }, props.handlers, {
    ...attrs,
    ref: childRef,
  });
};

export default Connector;
