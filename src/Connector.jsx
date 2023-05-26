// import { useEffect, useState, useRef } from "react";
// import _ from "lodash";
// import { getValue, setValue, subscribe } from "../store/globalData";
// import { getElement } from "../helpers/utils";

// const Connector = (props) => {
//   const [attrs, setter] = useState({});
//   const [children, setChildren] = useState(props.node.children);
//   const subscribed = useRef({});

//   useEffect(() => {
//     const pathAttrMap = _.invert(props.node.bindings);
//     const childBoundProps = _.keys(props.node.bindings);

//     const groups = _.uniq(
//       _.map(childBoundProps, (curr) => props.node.bindings[curr].split("::")[0])
//     );

//     const toBeUnsubscribed = _.differenceBy(_.keys(subscribed.current), groups);

//     _.forEach(toBeUnsubscribed, (key) => {
//       subscribed.current[key].unsubscribe();
//       delete subscribed.current[key];
//     });

//     _.forEach(groups, (key) => {
//       if (!subscribed.current[key]) {
//         const subscription = subscribe(key, {
//           next: (value) => {
//             setter((prevAttrs) =>
//               _.reduce(
//                 pathAttrMap,
//                 (prev, attribute, path) => {
//                   const [storeKey, storePath] = path.split("::");
//                   const newValue = getValue(storeKey, storePath);
//                   if (storeKey === key && attribute !== "children") {
//                     _.set(prev, attribute, newValue);
//                   }

//                   if (storeKey === key && attribute === "children") {
//                     setChildren(newValue);
//                   }

//                   return prev;
//                 },
//                 { ...prevAttrs }
//               )
//             );
//           },
//         });
//         subscribed.current[key] = subscription;
//       }
//     });
//   }, [props]);

//   const childRef = useRef();
//   useEffect(() => {
//     childRef.current.addEventListener("prop-change", (e) => {
//       const propName = e.detail.key;
//       if (propName) {
//         const [store, path] = props.node.bindings[propName].split("::");
//         setValue(store, path, e.detail.value);
//       }
//     });
//   }, [props]);

//   if (attrs?.hidden === false) delete attrs.hidden;

//   return getElement({ ...props.node, children: children }, props.handlers, {
//     ...attrs,
//     ref: childRef,
//   });
// };

// export default Connector;


import React, { Component } from "react";
import _, { bind } from "lodash";
import { getValue, setValue, subscribe } from "../store/globalData";
import { getElement } from "../helpers/utils";

class Connector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      attrs: {},
      children: props.node.children,
    };
    this.subscribed = {};
    this.childRef = React.createRef();
  }

  componentDidMount() {
    const { node } = this.props;
    const { bindings } = node;
    const pathAttrMap = _.invert(bindings);
    this.updateSubscriptions(pathAttrMap, bindings);
    this.addPropChangeListener();
  }

  componentDidUpdate(prevProps) {
    if (!_.isEqual(prevProps, this.props)) {
      const { node } = this.props;
      const { bindings } = node;
      const pathAttrMap = _.invert(bindings);
      this.updateSubscriptions(pathAttrMap, bindings);

    }
  }

  componentWillUnmount() {
    Object.keys(this.subscribed).forEach((key) => {
      this.subscribed[key].unsubscribe();
      delete this.subscribed[key];
    });
  }

  updateSubscriptions(pathAttrMap, bindings) {
    
    
    const childBoundProps = _.keys(bindings);
    const groups = _.uniq(
      childBoundProps.map((curr) => bindings[curr].split("::")[0])
    );

    const toBeUnsubscribed = _.differenceBy(
      Object.keys(this.subscribed),
      groups
    );

    toBeUnsubscribed.forEach((key) => {
      this.subscribed[key].unsubscribe();
      delete this.subscribed[key];
    });

    groups.forEach((key) => {
      if (!this.subscribed[key]) {
        const subscription = subscribe(key, {
          next: (value) => {
            this.setState((prevState) => {
              const updatedAttrs = _.reduce(
                pathAttrMap,
                (prev, attribute, path) => {
                  const [storeKey, storePath] = path.split("::");
                  const newValue = getValue(storeKey, storePath);
                  if (storeKey === key && attribute !== "children") {
                    _.set(prev, attribute, newValue);
                  }

                  if (storeKey === key && attribute === "children") {
                    this.setState({ children: newValue });
                  }

                  return prev;
                },
                { ...prevState.attrs }
              );

              return { attrs: updatedAttrs };
            });
          },
        });
        this.subscribed[key] = subscription;
      }
    });
  }

  addPropChangeListener() {
    this.childRef.current.addEventListener("prop-change", (e) => {
      const propName = e.detail.key;
      if (propName) {
        const [store, path] = this.props.node.bindings[propName].split("::");
        setValue(store, path, e.detail.value);
      }
    });
  }

  render() {
    const { attrs, children } = this.state;
    const { node, handlers } = this.props;
    if (attrs?.hidden === false) {
      delete attrs.hidden;
    }

    return getElement(
      { ...node, children: children },
      handlers,
      {
        ...attrs,
        ref: this.childRef,
      }
    );
  }
}

export default Connector;

